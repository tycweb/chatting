const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");
const webpush = require("web-push");
const { createClient } = require("redis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 30 * 1024 * 1024, // allow base64 video payloads (~20MB video -> ~27MB encoded) through
});

const PORT = process.env.PORT || 3000;
const MAX_HISTORY = 200; // per conversation
const MAX_FULL_VIDEOS = 8; // per conversation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 24;
const MAX_CONV_NAME_LENGTH = 40;
const MAX_GROUP_MEMBERS = 30;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // ~5MB decoded ceiling for a single photo
const MAX_VIDEO_BYTES = 27 * 1024 * 1024; // ~20MB video, base64-encoded (adds ~33%)
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 64;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
// conversations: id -> { id, type: 'room'|'dm'|'group', name, members: [name],
//                         history: [msg], createdAt }
// 'room' conversations are public (members is [] and means "everyone").
// 'dm'/'group' conversations are private to their members list.
const conversations = new Map();
const knownUsers = new Set(); // every name that has ever joined — the "directory"
const onlineUsers = new Map(); // socket.id -> name
const socketsByName = new Map(); // name -> Set(socket.id)
const passwords = new Map(); // name -> { salt, hash } — set once, the first time a name is claimed

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function setPassword(name, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  passwords.set(name, { salt, hash: hashPassword(password, salt) });
}

function checkPassword(name, password) {
  const record = passwords.get(name);
  if (!record) return false;
  const candidate = Buffer.from(hashPassword(password, record.salt), "hex");
  const actual = Buffer.from(record.hash, "hex");
  if (candidate.length !== actual.length) return false;
  return crypto.timingSafeEqual(candidate, actual);
}

function ensureDefaultRoom() {
  if (!conversations.has("general")) {
    conversations.set("general", {
      id: "general",
      type: "room",
      name: "General",
      members: [],
      history: [],
      createdAt: Date.now(),
    });
  }
}

// --- Redis (persists chat state across restarts / cold starts) ---
// State used to live in ONE key holding the entire app (every conversation,
// every image/video, as one JSON blob). That single write kept growing until
// it blew past Upstash's max request size. Now each conversation is its own
// key, so a write is only ever as big as that one conversation's history —
// and small metadata (users/passwords/which conversations exist) is separate.
const REDIS_URL = process.env.REDIS_URL;
const LEGACY_STATE_KEY = "tycept:state:v2"; // old single-blob format, read once for migration
const META_KEY = "tycept:meta:v3";
const CONV_KEY_PREFIX = "tycept:conv:v3:";
let redisClient = null;

if (REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis error:", err.message));
} else {
  console.warn("REDIS_URL not set — chat state will NOT persist across restarts.");
}

async function saveMetaToRedisNow() {
  if (!redisClient) return;
  const payload = JSON.stringify({
    knownUsers: Array.from(knownUsers),
    passwords: Array.from(passwords.entries()).map(([name, rec]) => ({
      name,
      salt: rec.salt,
      hash: rec.hash,
    })),
    conversationIds: Array.from(conversations.keys()),
  });
  try {
    await redisClient.set(META_KEY, payload);
  } catch (err) {
    console.error("Failed to save meta to Redis:", err.message);
  }
}

async function saveConversationToRedisNow(id) {
  if (!redisClient) return;
  const conv = conversations.get(id);
  if (!conv) return;
  try {
    await redisClient.set(CONV_KEY_PREFIX + id, JSON.stringify(conv));
  } catch (err) {
    console.error(`Failed to save conversation "${id}" to Redis:`, err.message);
  }
}

let metaSaveTimer = null;
function saveMetaToRedis() {
  if (!redisClient) return;
  // Debounce: several changes can land in the same tick.
  clearTimeout(metaSaveTimer);
  metaSaveTimer = setTimeout(saveMetaToRedisNow, 250);
}

const convSaveTimers = new Map(); // conversationId -> timer
function saveConversationToRedis(id) {
  if (!redisClient) return;
  clearTimeout(convSaveTimers.get(id));
  convSaveTimers.set(
    id,
    setTimeout(() => saveConversationToRedisNow(id), 250)
  );
}

async function migrateLegacyBlob() {
  const legacyRaw = await redisClient.get(LEGACY_STATE_KEY);
  if (!legacyRaw) return false;

  const saved = JSON.parse(legacyRaw);
  if (Array.isArray(saved.conversations)) {
    for (const conv of saved.conversations) {
      if (conv && conv.id) conversations.set(conv.id, conv);
    }
  }
  if (Array.isArray(saved.knownUsers)) {
    for (const n of saved.knownUsers) knownUsers.add(n);
  }
  if (Array.isArray(saved.passwords)) {
    for (const p of saved.passwords) {
      if (p && p.name && p.salt && p.hash) passwords.set(p.name, { salt: p.salt, hash: p.hash });
    }
  }

  console.log(`Migrating ${conversations.size} conversation(s) from the old single-key format...`);
  ensureDefaultRoom();
  await saveMetaToRedisNow();
  for (const id of conversations.keys()) await saveConversationToRedisNow(id);
  await redisClient.del(LEGACY_STATE_KEY).catch((err) =>
    console.error("Migrated data but couldn't remove the old key (harmless, just unused now):", err.message)
  );
  console.log("Migration to per-conversation Redis keys complete.");
  return true;
}

async function loadStateFromRedis() {
  ensureDefaultRoom();
  if (!redisClient) return;
  try {
    const metaRaw = await redisClient.get(META_KEY);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      if (Array.isArray(meta.knownUsers)) {
        for (const n of meta.knownUsers) knownUsers.add(n);
      }
      if (Array.isArray(meta.passwords)) {
        for (const p of meta.passwords) {
          if (p && p.name && p.salt && p.hash) passwords.set(p.name, { salt: p.salt, hash: p.hash });
        }
      }
      const convIds = Array.isArray(meta.conversationIds) ? meta.conversationIds : [];
      for (const id of convIds) {
        try {
          const raw = await redisClient.get(CONV_KEY_PREFIX + id);
          if (raw) {
            const conv = JSON.parse(raw);
            if (conv && conv.id) conversations.set(conv.id, conv);
          }
        } catch (err) {
          console.error(`Failed to load conversation "${id}" from Redis:`, err.message);
        }
      }
      console.log(`Loaded ${conversations.size} conversation(s) from Redis (per-conversation keys).`);
    } else {
      // No new-format meta key yet — check for the old blob and bring it forward once.
      const migrated = await migrateLegacyBlob();
      if (!migrated) console.log("No existing Redis state found — starting fresh.");
    }
  } catch (err) {
    console.error("Failed to load state from Redis:", err.message);
  }
  ensureDefaultRoom();
}

// --- Push notifications setup ---
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "YOUR_VAPID_PRIVATE_KEY";

webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// name -> array of push subscriptions (in-memory; resets on restart, same as before)
const pushSubscriptions = new Map();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/vapid-public-key", (req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY });
});

app.post("/api/subscribe", (req, res) => {
  const { name, subscription } = req.body || {};
  if (!name || !subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Missing name or subscription" });
  }
  const list = pushSubscriptions.get(name) || [];
  const exists = list.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) list.push(subscription);
  pushSubscriptions.set(name, list);
  res.status(201).json({});
});

// Notify a specific set of names (minus the sender) that a new message arrived.
async function notifyNewMessage(msg, conv) {
  const body = msg.video ? "🎥 Sent a video" : msg.image ? "📷 Sent a photo" : msg.text;
  const title = conv.type === "room" ? `${msg.name} in #${conv.name}` : `${msg.name}`;
  const payload = JSON.stringify({ title, body, url: "/" });

  const recipients =
    conv.type === "room" ? Array.from(pushSubscriptions.keys()) : conv.members;

  for (const name of recipients) {
    if (name === msg.name) continue; // don't notify the sender
    const subs = pushSubscriptions.get(name) || [];
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          const remaining = (pushSubscriptions.get(name) || []).filter(
            (s) => s.endpoint !== sub.endpoint
          );
          pushSubscriptions.set(name, remaining);
        } else {
          console.error("Push failed:", err.message);
        }
      }
    }
  }
}

function sanitize(str) {
  return String(str || "")
    .replace(/[<>]/g, "")
    .trim();
}

function broadcastPresence() {
  io.emit("presence", Array.from(onlineUsers.values()));
}

function broadcastDirectory() {
  io.emit("directory", Array.from(knownUsers));
}

function isMember(conv, name) {
  if (!conv) return false;
  return conv.type === "room" || conv.members.includes(name);
}

function buildReplySnapshot(conv, rawReplyTo) {
  if (!rawReplyTo || typeof rawReplyTo !== "object") return null;
  const original = conv.history.find((m) => m.id === rawReplyTo.id);
  if (!original) return null;
  return {
    id: original.id,
    name: original.name,
    text: original.image || original.video ? "" : original.text.slice(0, 120),
    image: !!original.image,
    video: !!original.video,
  };
}

// Keeps at most MAX_FULL_VIDEOS videos with actual data in memory per conversation.
function trimOldVideos(conv) {
  const videoMsgs = conv.history.filter((m) => m.video);
  const excess = videoMsgs.length - MAX_FULL_VIDEOS;
  for (let i = 0; i < excess; i++) {
    videoMsgs[i].video = null;
    videoMsgs[i].videoOmitted = true;
  }
}

function conversationTitle(conv) {
  if (conv.type === "room") return conv.name || "Room";
  if (conv.name) return conv.name; // explicit group name
  return ""; // dm / unnamed group — client fills in from members + myName
}

function summarize(conv) {
  const last = conv.history[conv.history.length - 1];
  return {
    id: conv.id,
    type: conv.type,
    name: conversationTitle(conv),
    members: conv.members,
    createdAt: conv.createdAt,
    lastMessage: last
      ? {
          name: last.name,
          text: last.deleted ? "" : last.text,
          image: !last.deleted && !!last.image,
          video: !last.deleted && !!last.video,
          deleted: !!last.deleted,
          time: last.time,
        }
      : null,
  };
}

function conversationsForUser(name) {
  const list = [];
  for (const conv of conversations.values()) {
    if (isMember(conv, name)) list.push(summarize(conv));
  }
  return list;
}

function joinAllRoomsFor(socket, name) {
  for (const conv of conversations.values()) {
    if (isMember(conv, name)) socket.join(conv.id);
  }
}

function findExistingDm(members) {
  const key = [...members].sort().join("|");
  for (const conv of conversations.values()) {
    if (conv.type === "dm" && [...conv.members].sort().join("|") === key) {
      return conv;
    }
  }
  return null;
}

io.on("connection", (socket) => {
  socket.on("join", (payload, ack) => {
    const reply = (result) => {
      if (typeof ack === "function") ack(result);
    };

    // Accept either the new { name, password } shape or a bare name string
    // (older clients), so a stray legacy call doesn't crash the server.
    const rawName = payload && typeof payload === "object" ? payload.name : payload;
    const rawPassword = payload && typeof payload === "object" ? payload.password : "";

    const name =
      sanitize(rawName).slice(0, MAX_NAME_LENGTH) || `Guest${Math.floor(Math.random() * 1000)}`;
    const password = String(rawPassword || "").slice(0, MAX_PASSWORD_LENGTH);

    if (password.length < MIN_PASSWORD_LENGTH) {
      return reply({ error: "password-required", minLength: MIN_PASSWORD_LENGTH });
    }

    const isNewUser = !knownUsers.has(name);
    let passwordJustSet = false;

    if (passwords.has(name)) {
      // Returning name — the password set the first time it was used must match.
      if (!checkPassword(name, password)) {
        return reply({ error: "wrong-password" });
      }
    } else {
      // First time this name has ever been used — whatever password came in
      // becomes that name's password from now on.
      setPassword(name, password);
      passwordJustSet = true;
    }

    socket.data.name = name;
    onlineUsers.set(socket.id, name);

    const set = socketsByName.get(name) || new Set();
    set.add(socket.id);
    socketsByName.set(name, set);

    knownUsers.add(name);

    joinAllRoomsFor(socket, name);

    reply({
      name,
      conversations: conversationsForUser(name),
      directory: Array.from(knownUsers).filter((n) => n !== name),
    });

    broadcastPresence();
    if (isNewUser) broadcastDirectory();
    if (isNewUser || passwordJustSet) saveMetaToRedis();
  });

  socket.on("get-directory", (ack) => {
    const name = socket.data.name;
    if (typeof ack === "function") {
      ack(Array.from(knownUsers).filter((n) => n !== name));
    }
  });

  socket.on("open-conversation", ({ id } = {}, ack) => {
    const name = socket.data.name;
    const conv = conversations.get(id);
    if (typeof ack !== "function") return;
    if (!name || !conv || !isMember(conv, name)) {
      ack({ error: "not-found" });
      return;
    }
    socket.join(conv.id);
    ack({
      id: conv.id,
      type: conv.type,
      name: conversationTitle(conv),
      members: conv.members,
      history: conv.history,
    });
  });

  socket.on("create-conversation", (payload = {}, ack) => {
    const name = socket.data.name;
    if (!name) return;
    const type = payload.type === "room" ? "room" : payload.type === "group" ? "group" : "dm";
    const reply = (result) => {
      if (typeof ack === "function") ack(result);
    };

    if (type === "room") {
      const cleanName = sanitize(payload.name).slice(0, MAX_CONV_NAME_LENGTH);
      if (!cleanName) return reply({ error: "name-required" });
      const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const conv = { id, type: "room", name: cleanName, members: [], history: [], createdAt: Date.now() };
      conversations.set(id, conv);
      // Every currently-connected socket can see public rooms.
      for (const [, s] of io.sockets.sockets) s.join(id);
      io.emit("conversation-created", summarize(conv));
      saveConversationToRedis(id);
      saveMetaToRedis();
      return reply(summarize(conv));
    }

    // dm / group
    let members = Array.isArray(payload.members) ? payload.members : [];
    members = members.map((m) => sanitize(m).slice(0, MAX_NAME_LENGTH)).filter(Boolean);
    members = Array.from(new Set([...members, name]));
    members = members.filter((m) => knownUsers.has(m));
    if (members.length < 2) return reply({ error: "need-members" });
    if (members.length > MAX_GROUP_MEMBERS) return reply({ error: "too-many-members" });

    const resolvedType = members.length === 2 ? "dm" : "group";

    if (resolvedType === "dm") {
      const existing = findExistingDm(members);
      if (existing) return reply(summarize(existing));
    }

    const cleanName =
      resolvedType === "group" ? sanitize(payload.name).slice(0, MAX_CONV_NAME_LENGTH) : "";

    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const conv = {
      id,
      type: resolvedType,
      name: cleanName,
      members,
      history: [],
      createdAt: Date.now(),
    };
    conversations.set(id, conv);

    for (const m of members) {
      const set = socketsByName.get(m);
      if (!set) continue;
      for (const sid of set) {
        const s = io.sockets.sockets.get(sid);
        if (s) s.join(id);
      }
    }

    io.to(id).emit("conversation-created", summarize(conv));
    saveConversationToRedis(id);
    saveMetaToRedis();
    reply(summarize(conv));
  });

  socket.on("message", (payload) => {
    const name = socket.data.name;
    if (!name) return;

    const conversationId = payload && payload.conversationId;
    const conv = conversations.get(conversationId);
    if (!conv || !isMember(conv, name)) return;

    const rawText = payload && payload.text;
    const rawImage = payload && payload.image;
    const rawVideo = payload && payload.video;
    const rawReplyTo = payload && payload.replyTo;

    const clean = sanitize(rawText).slice(0, MAX_MESSAGE_LENGTH);

    let image = null;
    if (typeof rawImage === "string" && rawImage.startsWith("data:image/")) {
      if (rawImage.length > MAX_IMAGE_BYTES) return;
      image = rawImage;
    }

    let video = null;
    if (typeof rawVideo === "string" && rawVideo.startsWith("data:video/")) {
      if (rawVideo.length > MAX_VIDEO_BYTES) return;
      video = rawVideo;
    }

    if (!clean && !image && !video) return;

    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      name,
      text: clean,
      image,
      video,
      time: Date.now(),
      reactions: {},
      replyTo: buildReplySnapshot(conv, rawReplyTo),
      edited: false,
      deleted: false,
    };

    conv.history.push(msg);
    if (conv.history.length > MAX_HISTORY) conv.history.shift();
    if (msg.video) trimOldVideos(conv);
    saveConversationToRedis(conversationId);

    io.to(conversationId).emit("message", msg);
    notifyNewMessage(msg, conv).catch((err) => console.error("notifyNewMessage error:", err));
  });

  socket.on("edit", ({ conversationId, id, text } = {}) => {
    const name = socket.data.name;
    const conv = conversations.get(conversationId);
    if (!name || !id || !conv || !isMember(conv, name)) return;

    const msg = conv.history.find((m) => m.id === id);
    if (!msg) return;
    if (msg.name !== name) return;
    if (msg.image) return;
    if (msg.deleted) return;

    const clean = sanitize(text).slice(0, MAX_MESSAGE_LENGTH);
    if (!clean) return;

    msg.text = clean;
    msg.edited = true;
    saveConversationToRedis(conversationId);

    io.to(conversationId).emit("edited", { conversationId, id, text: msg.text, edited: true });
  });

  socket.on("delete", ({ conversationId, id } = {}) => {
    const name = socket.data.name;
    const conv = conversations.get(conversationId);
    if (!name || !id || !conv || !isMember(conv, name)) return;

    const msg = conv.history.find((m) => m.id === id);
    if (!msg) return;
    if (msg.name !== name) return;

    msg.deleted = true;
    msg.text = "";
    msg.image = null;
    msg.video = null;
    msg.reactions = {};
    saveConversationToRedis(conversationId);

    io.to(conversationId).emit("deleted", { conversationId, id });
  });

  socket.on("typing", ({ conversationId, isTyping } = {}) => {
    const name = socket.data.name;
    const conv = conversations.get(conversationId);
    if (!name || !conv || !isMember(conv, name)) return;
    socket.to(conversationId).emit("typing", { conversationId, name, isTyping: !!isTyping });
  });

  socket.on("react", ({ conversationId, id, emoji } = {}) => {
    const name = socket.data.name;
    const conv = conversations.get(conversationId);
    if (!name || !id || !emoji || !conv || !isMember(conv, name)) return;
    const msg = conv.history.find((m) => m.id === id);
    if (!msg || msg.deleted) return;

    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(name);
    if (idx === -1) {
      msg.reactions[emoji].push(name);
    } else {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }

    saveConversationToRedis(conversationId);
    io.to(conversationId).emit("reaction", { conversationId, id, reactions: msg.reactions });
  });

  socket.on("disconnect", () => {
    const name = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    if (name) {
      const set = socketsByName.get(name);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) socketsByName.delete(name);
      }
      broadcastPresence();
    }
  });
});

async function start() {
  if (redisClient) {
    try {
      await redisClient.connect();
      await loadStateFromRedis();
    } catch (err) {
      console.error("Could not connect to Redis, starting with empty state:", err.message);
      ensureDefaultRoom();
    }
  } else {
    ensureDefaultRoom();
  }

  server.listen(PORT, () => {
    console.log(`Chat server running: http://localhost:${PORT}`);
    console.log(`On your phone's Wi-Fi network, friends can use: http://<your-local-ip>:${PORT}`);
  });
}

start();
