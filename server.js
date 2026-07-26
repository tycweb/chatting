const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;
const MAX_HISTORY = 200;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 24;

// In-memory state (resets when the server restarts)
const history = [];
const onlineUsers = new Map(); // socket.id -> name

app.use(express.static(path.join(__dirname, "public")));

function sanitize(str) {
  return String(str || "")
    .replace(/[<>]/g, "")
    .trim();
}

function broadcastPresence() {
  io.emit("presence", Array.from(onlineUsers.values()));
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

  socket.on("message", (text) => {
    const name = socket.data.name;
    if (!name) return; // must join first
    const clean = sanitize(text).slice(0, MAX_MESSAGE_LENGTH);
    if (!clean) return;

    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      text: clean,
      time: Date.now(),
      reactions: {}, // emoji -> [names]
    };

    history.push(msg);
    if (history.length > MAX_HISTORY) history.shift();

    io.emit("message", msg);
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
    if (!msg) return;

    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(name);
    if (idx === -1) {
      msg.reactions[emoji].push(name);
    } else {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }

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

server.listen(PORT, () => {
  console.log(`Chat server running: http://localhost:${PORT}`);
  console.log(`On your phone's Wi-Fi network, friends can use: http://<your-local-ip>:${PORT}`);
});
