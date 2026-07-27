const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const webpush = require("web-push");
const { createClient } = require("redis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 6 * 1024 * 1024, // allow compressed photo payloads through
});

const PORT = process.env.PORT || 3000;
const MAX_HISTORY = 200;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 24;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // ~5MB decoded ceiling for a single photo

// In-memory state — this stays the "live" working copy so edit/delete/react
// lookups are instant. It's mirrored to Redis so it survives restarts.
const history = [];
const onlineUsers = new Map(); // socket.id -> name

// --- Redis (persists chat history across restarts / cold starts) ---
const REDIS_URL = process.env.REDIS_URL;
const HISTORY_KEY = "tycept:history";
let redisClient = null;

if (REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis error:", err.message));
} else {
  console.warn("REDIS_URL not set — chat history will NOT persist across restarts.");
}

async function loadHistoryFromRedis() {
  if (!redisClient) return;
  try {
    const raw = await redisClient.get(HISTORY_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) history.push(...saved);
      console.log(`Loaded ${history.length} messages from Redis.`);
    }
  } catch (err) {
    console.error("Failed to load history from Redis:", err.message);
  }
}

function saveHistoryToRedis() {
  if (!redisClient) return;
  redisClient
    .set(HISTORY_KEY, JSON.stringify(history))
    .catch((err) => console.error("Failed to save history to Redis:", err.message));
}

// --- Push notifications setup ---
// Generate once with: npx web-push generate-vapid-keys
// Set these as environment variables in production (Render dashboard -> Environment)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "YOUR_VAPID_PRIVATE_KEY";

webpush.setVapidDetails(
  "mailto:you@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// name -> array of push subscriptions (in-memory; resets on restart, same as history)
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

// Notify everyone except the sender that a new message arrived.
async function notifyNewMessage(msg) {
  const body = msg.image ? "📷 Sent a photo" : msg.text;
  const payload = JSON.stringify({
    title: `${msg.name} in Tycept`,
    body,
    url: "/",
  });

  for (const [name, subs] of pushSubscriptions.entries()) {
    if (name === msg.name) continue; // don't notify the sender
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // subscription expired/gone — drop it
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

function buildReplySnapshot(rawReplyTo) {
  if (!rawReplyTo || typeof rawReplyTo !== "object") return null;
  const original = history.find((m) => m.id === rawReplyTo.id);
  if (!original) return null; // ignore replies pointing at messages we don't have
  return {
    id: original.id,
    name: original.name,
    text: original.image ? "" : original.text.slice(0, 120),
    image: !!original.image,
  };
}

io.on("connection", (socket) => {
  socket.on("join", (rawName, ack) => {
    const name = sanitize(rawName).slice(0, MAX_NAME_LENGTH) || `Guest${Math.floor(Math.random() * 1000)}`;
    socket.data.name = name;
    onlineUsers.set(socket.id, name);

    if (typeof ack === "function") ack({ name, history });

    socket.broadcast.emit("system", { text: `${name} joined the chat`, time: Date.now() });
    broadcastPresence();
  });

  socket.on("message", (payload) => {
    const name = socket.data.name;
    if (!name) return; // must join first

    const rawText = typeof payload === "string" ? payload : payload && payload.text;
    const rawImage = payload && typeof payload === "object" ? payload.image : null;
    const rawReplyTo = payload && typeof payload === "object" ? payload.replyTo : null;

    const clean = sanitize(rawText).slice(0, MAX_MESSAGE_LENGTH);

    let image = null;
    if (typeof rawImage === "string" && rawImage.startsWith("data:image/")) {
      if (rawImage.length > MAX_IMAGE_BYTES) return; // reject oversized payloads
      image = rawImage;
    }

    if (!clean && !image) return; // nothing to send

    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      text: clean,
      image,
      time: Date.now(),
      reactions: {}, // emoji -> [names]
      replyTo: buildReplySnapshot(rawReplyTo),
      edited: false,
      deleted: false,
    };

    history.push(msg);
    if (history.length > MAX_HISTORY) history.shift();
    saveHistoryToRedis();

    io.emit("message", msg);
    notifyNewMessage(msg).catch((err) => console.error("notifyNewMessage error:", err));
  });

  socket.on("edit", ({ id, text } = {}) => {
    const name = socket.data.name;
    if (!name || !id) return;

    const msg = history.find((m) => m.id === id);
    if (!msg) return;
    if (msg.name !== name) return; // can only edit your own messages
    if (msg.image) return; // keep it simple: no editing photo messages
    if (msg.deleted) return;

    const clean = sanitize(text).slice(0, MAX_MESSAGE_LENGTH);
    if (!clean) return;

    msg.text = clean;
    msg.edited = true;
    saveHistoryToRedis();

    io.emit("edited", { id, text: msg.text, edited: true });
  });

  socket.on("delete", ({ id } = {}) => {
    const name = socket.data.name;
    if (!name || !id) return;

    const msg = history.find((m) => m.id === id);
    if (!msg) return;
    if (msg.name !== name) return; // can only delete your own messages

    msg.deleted = true;
    msg.text = "";
    msg.image = null;
    msg.reactions = {};
    saveHistoryToRedis();

    io.emit("deleted", { id });
  });

  socket.on("typing", (isTyping) => {
    const name = socket.data.name;
    if (!name) return;
    socket.broadcast.emit("typing", { name, isTyping: !!isTyping });
  });

  socket.on("react", ({ id, emoji }) => {
    const name = socket.data.name;
    if (!name || !id || !emoji) return;
    const msg = history.find((m) => m.id === id);
    if (!msg || msg.deleted) return;

    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(name);
    if (idx === -1) {
      msg.reactions[emoji].push(name);
    } else {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }

    saveHistoryToRedis();
    io.emit("reaction", { id, reactions: msg.reactions });
  });

  socket.on("disconnect", () => {
    const name = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    if (name) {
      socket.broadcast.emit("system", { text: `${name} left the chat`, time: Date.now() });
      broadcastPresence();
    }
  });
});

async function start() {
  if (redisClient) {
    try {
      await redisClient.connect();
      await loadHistoryFromRedis();
    } catch (err) {
      console.error("Could not connect to Redis, starting with empty history:", err.message);
    }
  }

  server.listen(PORT, () => {
    console.log(`Chat server running: http://localhost:${PORT}`);
    console.log(`On your phone's Wi-Fi network, friends can use: http://<your-local-ip>:${PORT}`);
  });
}

start();
