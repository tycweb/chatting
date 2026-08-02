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
// Set ALLOW_IMAGES=false / ALLOW_VIDEOS=false as env vars on the host (e.g. Render)
// to turn either off without touching code — useful if bandwidth is getting tight.
const ALLOW_IMAGES = process.env.ALLOW_IMAGES !== "false";
const ALLOW_VIDEOS = process.env.ALLOW_VIDEOS !== "false";

// --- Optional object storage for photos & videos (Supabase Storage / any S3-compatible host) ---
// Without this, media is stored inline as base64 — it works, but every open of
// a conversation re-sends every video's full data, and Redis writes can hit
// size limits. Setting all env vars below moves media off Redis entirely:
// the file gets uploaded once, and only a small URL is stored/broadcast from then on.
//
// Where to find these in your Supabase project (Project Settings > Storage > S3 Connection):
//   SUPABASE_S3_ENDPOINT     -> the full endpoint URL shown there (ends in /storage/v1/s3)
//   SUPABASE_S3_ACCESS_KEY   -> Access Key ID (from "New access key")
//   SUPABASE_S3_SECRET_KEY   -> Secret Access Key (shown once when created)
//   SUPABASE_S3_REGION       -> Region shown on that same page (e.g. ap-northeast-1)
//   SUPABASE_BUCKET_NAME     -> the bucket you created in Storage (must be set Public)
//   SUPABASE_PROJECT_URL     -> your main project URL, e.g. https://xxxx.supabase.co
//                               (used only to build the public file URL)
const SUPABASE_S3_ENDPOINT = (process.env.SUPABASE_S3_ENDPOINT || "").replace(/\/$/, "");
const SUPABASE_S3_ACCESS_KEY = process.env.SUPABASE_S3_ACCESS_KEY || "";
const SUPABASE_S3_SECRET_KEY = process.env.SUPABASE_S3_SECRET_KEY || "";
const SUPABASE_S3_REGION = process.env.SUPABASE_S3_REGION || "us-east-1";
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "";
const SUPABASE_PROJECT_URL = (process.env.SUPABASE_PROJECT_URL || "").replace(/\/$/, "");

let STORAGE_ENABLED = !!(
  SUPABASE_S3_ENDPOINT &&
  SUPABASE_S3_ACCESS_KEY &&
  SUPABASE_S3_SECRET_KEY &&
  SUPABASE_BUCKET_NAME &&
  SUPABASE_PROJECT_URL
);

// Public URL for an object once uploaded — Supabase serves public bucket files from this path
// off the main project URL (not the S3 endpoint).
const SUPABASE_PUBLIC_BASE_URL = SUPABASE_PROJECT_URL
  ? `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}`
  : "";

let s3Client = null;
let PutObjectCommand = null;

if (STORAGE_ENABLED) {
  try {
    const s3mod = require("@aws-sdk/client-s3");
    PutObjectCommand = s3mod.PutObjectCommand;
    s3Client = new s3mod.S3Client({
      region: SUPABASE_S3_REGION,
      endpoint: SUPABASE_S3_ENDPOINT,
      forcePathStyle: true, // required for Supabase's S3-compatible endpoint
      credentials: { accessKeyId: SUPABASE_S3_ACCESS_KEY, secretAccessKey: SUPABASE_S3_SECRET_KEY },
    });
  } catch (err) {
    console.error(
      "Supabase storage env vars are set but the @aws-sdk/client-s3 package isn't installed. Run: npm install @aws-sdk/client-s3"
    );
    STORAGE_ENABLED = false;
  }
}

if (!STORAGE_ENABLED) {
  console.warn(
    "Supabase object storage not active — photos/videos will be stored inline in Redis as before. " +
      "Set SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY, SUPABASE_S3_SECRET_KEY, SUPABASE_BUCKET_NAME, and SUPABASE_PROJECT_URL to enable it."
  );
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function extFromMime(mime) {
  return EXT_BY_MIME[mime] || (mime.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "");
}

// Uploads a "data:<mime>;base64,..." string to R2 and returns its public URL.
// Falls back to returning the data URL unchanged if R2 isn't configured, so
// the app keeps working exactly as before until you set it up.
async function uploadMedia(dataUrl, folder) {
  if (!STORAGE_ENABLED) return dataUrl;
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extFromMime(parsed.mime)}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: SUPABASE_BUCKET_NAME,
      Key: key,
      Body: parsed.buffer,
      ContentType: parsed.mime,
    })
  );
  return `${SUPABASE_PUBLIC_BASE_URL}/${key}`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
// conversations: id -> { id, type: 'room'|'dm'|'group', name, members: [name],
//                         history: [msg], createdAt }
// 'room' conversations with an empty members list are public ("everyone").
// A 'room' with a non-empty members list is private — only those people can
// see/join it, same as 'dm'/'group', which are always private to their members.
const conversations = new Map();
const knownUsers = new Set(); // every name that has ever joined — the "directory"
const onlineUsers = new Map(); // socket.id -> name
const socketsByName = new Map(); // name -> Set(socket.id)
const passwords = new Map(); // name -> { salt, hash } — set once, the first time a name is claimed
const avatars = new Map(); // name -> avatar URL (custom profile picture, if they've set one)
const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // ~3MB decoded ceiling for a profile picture

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
      reads: {},
      wallpaper: null,
    });
  }
}

// Allow-listed wallpaper themes (Messenger-style "chat theme"). Keeping this
// as a fixed set of keys — rather than accepting arbitrary CSS/colors from
// the client — means a chat theme can never be used to inject styles.
const WALLPAPER_KEYS = new Set([
  "default",
  "ocean",
  "sunset",
  "forest",
  "grape",
  "candy",
  "mono",
  "fire",
]);

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
    avatars: Array.from(avatars.entries()),
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
      if (Array.isArray(meta.avatars)) {
        for (const [n, url] of meta.avatars) {
          if (n && url) avatars.set(n, url);
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

// name -> array of push subscriptions. Persisted to Redis (see below) so a
// Render restart/cold-start doesn't silently wipe everyone's subscriptions —
// previously this was in-memory only, which meant push notifications quietly
// stopped working for a device until that person happened to reopen the app.
const pushSubscriptions = new Map();
const PUSH_SUBS_KEY = "tycept:push-subs:v1";
let pushSubsSaveTimer = null;
function savePushSubsToRedis() {
  if (!redisClient) return;
  clearTimeout(pushSubsSaveTimer);
  pushSubsSaveTimer = setTimeout(async () => {
    try {
      await redisClient.set(PUSH_SUBS_KEY, JSON.stringify(Array.from(pushSubscriptions.entries())));
    } catch (err) {
      console.error("Failed to save push subscriptions to Redis:", err.message);
    }
  }, 250);
}
async function loadPushSubsFromRedis() {
  if (!redisClient) return;
  try {
    const raw = await redisClient.get(PUSH_SUBS_KEY);
    if (raw) {
      const entries = JSON.parse(raw);
      if (Array.isArray(entries)) {
        for (const [name, subs] of entries) {
          if (name && Array.isArray(subs)) pushSubscriptions.set(name, subs);
        }
      }
      console.log(`Loaded push subscriptions for ${pushSubscriptions.size} user(s) from Redis.`);
    }
  } catch (err) {
    console.error("Failed to load push subscriptions from Redis:", err.message);
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Hit by an external uptime pinger (UptimeRobot, cron-job.org, etc.) every
// ~10 min to keep the free Render instance from spinning down after 15 min
// of inactivity. Deliberately tiny — no DB/Redis calls — so it responds
// fast and doesn't count against anything meaningful.
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

app.get("/api/vapid-public-key", (req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY });
});

app.post("/api/subscribe", (req, res) => {
  const { name, subscription } = req.body || {};
  if (!name || !subscription || !subscription.endpoint) {
    console.log("[push] subscribe rejected — missing name or subscription", { name, hasSub: !!subscription });
    return res.status(400).json({ error: "Missing name or subscription" });
  }
  const list = pushSubscriptions.get(name) || [];
  const exists = list.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) list.push(subscription);
  pushSubscriptions.set(name, list);
  savePushSubsToRedis();
  console.log(`[push] subscribed: ${name} now has ${list.length} device(s) registered`);
  res.status(201).json({});
});

// Notify a specific set of names (minus the sender) that a new message arrived.
async function notifyNewMessage(msg, conv) {
  const body = msg.video ? "🎥 Sent a video" : msg.image ? "📷 Sent a photo" : msg.text;
  const title = conv.type === "room" ? `${msg.name} in #${conv.name}` : `${msg.name}`;
  const payload = JSON.stringify({ title, body, url: "/" });

  const recipients =
    conv.type === "room" ? Array.from(pushSubscriptions.keys()) : conv.members;

  console.log(`[push] new message from ${msg.name} — candidate recipients: ${recipients.join(", ") || "(none)"}`);

  for (const name of recipients) {
    if (name === msg.name) continue; // don't notify the sender
    const subs = pushSubscriptions.get(name) || [];
    if (subs.length === 0) {
      console.log(`[push] skipping ${name} — no registered device/subscription on file`);
      continue;
    }
    for (const sub of subs) {
      try {
        // urgency: "high" + a short TTL tells the browser's push service
        // (FCM/APNs/etc.) this shouldn't be deferred for battery savings —
        // without it, some Android devices in Doze mode can sit on a
        // "normal" priority push for quite a while before delivering it.
        await webpush.sendNotification(sub, payload, { urgency: "high", TTL: 60 });
        console.log(`[push] sent OK to ${name}`);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          const remaining = (pushSubscriptions.get(name) || []).filter(
            (s) => s.endpoint !== sub.endpoint
          );
          pushSubscriptions.set(name, remaining);
          savePushSubsToRedis();
          console.log(`[push] ${name}'s subscription is dead (${err.statusCode}) — removed it`);
        } else {
          console.error(`[push] FAILED sending to ${name}:`, err.statusCode, err.message);
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
  if (conv.type === "room" && conv.members.length === 0) return true; // public room — everyone's a member
  return conv.members.includes(name);
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

// How many messages in this conversation came in after `forName` last read
// it, and weren't sent by them. History is chronological, so we can walk
// backwards and stop as soon as we hit something already read.
function countUnread(conv, forName) {
  const reads = conv.reads || {};
  const lastReadTime = reads[forName] ? reads[forName].time : 0;
  let count = 0;
  for (let i = conv.history.length - 1; i >= 0; i--) {
    const m = conv.history[i];
    if (m.time <= lastReadTime) break;
    if (m.name !== forName && !m.deleted) count++;
  }
  return count;
}

function summarize(conv, forName) {
  const last = conv.history[conv.history.length - 1];
  const result = {
    id: conv.id,
    type: conv.type,
    name: conversationTitle(conv),
    members: conv.members,
    createdAt: conv.createdAt,
    wallpaper: conv.wallpaper || null,
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
  // Only computed (and included) when we know who's asking — broadcasts to
  // a whole room stay as they were so they don't clobber each client's own
  // locally-tracked unread count with a one-size-fits-all value.
  if (forName) result.unread = countUnread(conv, forName);
  return result;
}

function conversationsForUser(name) {
  const list = [];
  for (const conv of conversations.values()) {
    if (isMember(conv, name)) list.push(summarize(conv, name));
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
      media: { images: ALLOW_IMAGES, videos: ALLOW_VIDEOS },
      avatars: Object.fromEntries(avatars),
    });

    broadcastPresence();
    if (isNewUser) broadcastDirectory();
    if (isNewUser || passwordJustSet) saveMetaToRedis();
  });

  socket.on("set-avatar", async ({ avatar } = {}, ack) => {
    const reply = (result) => {
      if (typeof ack === "function") ack(result);
    };
    const name = socket.data.name;
    if (!name) return reply({ error: "not-joined" });
    if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
      return reply({ error: "invalid-image" });
    }
    const parsed = parseDataUrl(avatar);
    if (!parsed) return reply({ error: "invalid-image" });
    if (parsed.buffer.length > MAX_AVATAR_BYTES) return reply({ error: "too-large" });

    try {
      const url = await uploadMedia(avatar, "avatars");
      if (!url) return reply({ error: "upload-failed" });
      avatars.set(name, url);
      reply({ avatar: url });
      io.emit("avatar-updated", { name, avatar: url });
      saveMetaToRedis();
    } catch (err) {
      console.error("Failed to set avatar:", err.message);
      reply({ error: "upload-failed" });
    }
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
    if (!conv.reads) conv.reads = {};
    ack({
      id: conv.id,
      type: conv.type,
      name: conversationTitle(conv),
      members: conv.members,
      history: conv.history,
      wallpaper: conv.wallpaper || null,
      reads: conv.reads,
    });

    // Opening a conversation counts as reading everything currently in it.
    const last = conv.history[conv.history.length - 1];
    if (last) {
      const prevRead = conv.reads[name];
      if (!prevRead || prevRead.time < last.time) {
        conv.reads[name] = { messageId: last.id, time: last.time };
        saveConversationToRedis(conv.id);
        socket.to(conv.id).emit("read-receipt", {
          conversationId: conv.id,
          name,
          messageId: last.id,
          time: last.time,
        });
      }
    }
  });

  // Client tells us it has a specific message on screen (e.g. a new message
  // arrived while the conversation was already open). Only moves the read
  // marker forward, never back.
  socket.on("mark-read", ({ conversationId, messageId } = {}) => {
    const name = socket.data.name;
    const conv = conversations.get(conversationId);
    if (!name || !conv || !isMember(conv, name)) return;
    const msg = conv.history.find((m) => m.id === messageId);
    if (!msg) return;

    if (!conv.reads) conv.reads = {};
    const prevRead = conv.reads[name];
    if (prevRead && prevRead.time >= msg.time) return;

    conv.reads[name] = { messageId: msg.id, time: msg.time };
    saveConversationToRedis(conversationId);
    socket.to(conversationId).emit("read-receipt", {
      conversationId,
      name,
      messageId: msg.id,
      time: msg.time,
    });
  });

  // Sets the shared "chat theme" wallpaper for a conversation — visible to
  // every member, same as Messenger's per-thread theme.
  socket.on("set-wallpaper", ({ conversationId, wallpaper } = {}, ack) => {
    const name = socket.data.name;
    const reply = (result) => {
      if (typeof ack === "function") ack(result);
    };
    const conv = conversations.get(conversationId);
    if (!name || !conv || !isMember(conv, name)) return reply({ error: "not-found" });
    const key = WALLPAPER_KEYS.has(wallpaper) ? wallpaper : null;
    conv.wallpaper = key;
    saveConversationToRedis(conversationId);
    io.to(conversationId).emit("conversation-updated", summarize(conv));
    reply({ wallpaper: key });
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

      // Optional members list makes this a private room (only these people can
      // see/join it). No members (or just yourself) means a public room that
      // everyone in Tycept can find and join, same as before.
      let roomMembers = Array.isArray(payload.members) ? payload.members : [];
      roomMembers = roomMembers.map((m) => sanitize(m).slice(0, MAX_NAME_LENGTH)).filter(Boolean);
      roomMembers = Array.from(new Set([...roomMembers, name]));
      roomMembers = roomMembers.filter((m) => knownUsers.has(m));
      if (roomMembers.length > MAX_GROUP_MEMBERS) return reply({ error: "too-many-members" });

      const isPrivateRoom = roomMembers.length > 1;
      const finalMembers = isPrivateRoom ? roomMembers : [];

      const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const conv = {
        id,
        type: "room",
        name: cleanName,
        members: finalMembers,
        history: [],
        createdAt: Date.now(),
        reads: {},
        wallpaper: null,
      };
      conversations.set(id, conv);

      if (isPrivateRoom) {
        for (const m of finalMembers) {
          const set = socketsByName.get(m);
          if (!set) continue;
          for (const sid of set) {
            const s = io.sockets.sockets.get(sid);
            if (s) s.join(id);
          }
        }
        io.to(id).emit("conversation-created", summarize(conv));
      } else {
        // Every currently-connected socket can see public rooms.
        for (const [, s] of io.sockets.sockets) s.join(id);
        io.emit("conversation-created", summarize(conv));
      }

      saveConversationToRedis(id);
      saveMetaToRedis();
      return reply(summarize(conv, name));
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
      if (existing) return reply(summarize(existing, name));
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
      reads: {},
      wallpaper: null,
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

  // Adds people to an existing dm/group. A dm automatically becomes a group
  // the moment it has more than 2 members — that's the only way one 1:1 chat
  // and a group chat differ once they're created; there's no separate
  // "convert to group" step.
  socket.on("add-members", ({ conversationId, members: newMembersRaw, name: groupName } = {}, ack) => {
    const name = socket.data.name;
    const reply = (result) => {
      if (typeof ack === "function") ack(result);
    };
    if (!name) return reply({ error: "not-joined" });

    const conv = conversations.get(conversationId);
    if (!conv) return reply({ error: "not-found" });
    if (conv.type !== "dm" && conv.type !== "group") return reply({ error: "unsupported" });
    if (!isMember(conv, name)) return reply({ error: "not-member" });

    let toAdd = Array.isArray(newMembersRaw) ? newMembersRaw : [];
    toAdd = toAdd.map((m) => sanitize(m).slice(0, MAX_NAME_LENGTH)).filter(Boolean);
    toAdd = toAdd.filter((m) => knownUsers.has(m) && !conv.members.includes(m));
    if (toAdd.length === 0) return reply({ error: "no-new-members" });

    const merged = Array.from(new Set([...conv.members, ...toAdd]));
    if (merged.length > MAX_GROUP_MEMBERS) return reply({ error: "too-many-members" });

    conv.members = merged;
    if (conv.type === "dm" && merged.length > 2) conv.type = "group";
    if (conv.type === "group" && !conv.name && groupName) {
      conv.name = sanitize(groupName).slice(0, MAX_CONV_NAME_LENGTH);
    }

    // Newly added members need their live sockets to join the room so they
    // start receiving messages immediately, same as at creation time.
    for (const m of toAdd) {
      const set = socketsByName.get(m);
      if (!set) continue;
      for (const sid of set) {
        const s = io.sockets.sockets.get(sid);
        if (s) s.join(conv.id);
      }
    }

    io.to(conv.id).emit("conversation-updated", summarize(conv));
    saveConversationToRedis(conv.id);
    saveMetaToRedis();
    reply(summarize(conv));
  });

  socket.on("message", async (payload) => {
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
      if (!ALLOW_IMAGES) return;
      if (rawImage.length > MAX_IMAGE_BYTES) return;
      try {
        image = await uploadMedia(rawImage, "images");
      } catch (err) {
        console.error("Image upload failed:", err.message);
        return;
      }
      if (!image) return;
    }

    let video = null;
    if (typeof rawVideo === "string" && rawVideo.startsWith("data:video/")) {
      if (!ALLOW_VIDEOS) return;
      if (rawVideo.length > MAX_VIDEO_BYTES) return;
      try {
        video = await uploadMedia(rawVideo, "videos");
      } catch (err) {
        console.error("Video upload failed:", err.message);
        return;
      }
      if (!video) return;
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
    // This cap only still matters when media is stored inline (no R2 configured) —
    // once media lives in R2, the stored value is just a small URL, so there's
    // nothing to trim.
    if (msg.video && !STORAGE_ENABLED) trimOldVideos(conv);
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
      await loadPushSubsFromRedis();
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
