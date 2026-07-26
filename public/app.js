(() => {
  const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍", "🔥", "🎉"];

  const joinScreen = document.getElementById("join-screen");
  const chatScreen = document.getElementById("chat-screen");
  const nameInput = document.getElementById("name-input");
  const joinBtn = document.getElementById("join-btn");
  const joinError = document.getElementById("join-error");
  const messageList = document.getElementById("message-list");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const presenceLine = document.getElementById("presence-line");
  const connectionDot = document.getElementById("connection-dot");
  const typingIndicator = document.getElementById("typing-indicator");
  const typingName = document.getElementById("typing-name");

  let myName = "";
  let socket = null;
  let openPickerId = null;
  let typingTimeout = null;
  let othersTyping = new Map(); // name -> timeout id

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
  }

  function renderSystem(text) {
    const el = document.createElement("div");
    el.className = "system-line";
    el.textContent = text;
    messageList.appendChild(el);
    scrollToBottom();
  }

  function reactionsHtml(id, reactions) {
    const entries = Object.entries(reactions || {});
    if (entries.length === 0) return "";
    return `<div class="reaction-row">${entries
      .map(([emoji, users]) => {
        const mine = users.includes(myName);
        return `<button class="reaction-chip ${mine ? "mine" : ""}" data-react-id="${id}" data-emoji="${emoji}">
          <span>${emoji}</span><span>${users.length}</span>
        </button>`;
      })
      .join("")}</div>`;
  }

  function renderMessage(msg) {
    const isMe = msg.name === myName;
    const row = document.createElement("div");
    row.className = `msg-row ${isMe ? "me" : "them"}`;
    row.dataset.id = msg.id;

    row.innerHTML = `
      ${!isMe ? `<p class="msg-name">${escapeHtml(msg.name)}</p>` : ""}
      <div class="msg-bubble-wrap">
        <div class="msg-bubble" data-toggle-picker="${msg.id}">
          ${escapeHtml(msg.text)}
          <div class="msg-meta"><span>${fmtTime(msg.time)}</span></div>
        </div>
        <button class="reaction-trigger" data-toggle-picker="${msg.id}">🙂</button>
      </div>
      <div data-reactions-for="${msg.id}">${reactionsHtml(msg.id, msg.reactions)}</div>
    `;

    messageList.appendChild(row);
    scrollToBottom();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function closePicker() {
    const existing = document.querySelector(".reaction-picker");
    if (existing) existing.remove();
    openPickerId = null;
  }

  function openPicker(id, anchorEl) {
    closePicker();
    openPickerId = id;
    const picker = document.createElement("div");
    picker.className = "reaction-picker";
    picker.innerHTML = QUICK_REACTIONS.map((e) => `<button data-pick="${e}">${e}</button>`).join("");
    anchorEl.closest(".msg-bubble-wrap").appendChild(picker);

    picker.querySelectorAll("button[data-pick]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        socket.emit("react", { id, emoji: btn.dataset.pick });
        closePicker();
      });
    });
  }

  messageList.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-toggle-picker]");
    if (toggle) {
      const id = toggle.dataset.togglePicker;
      if (openPickerId === id) {
        closePicker();
      } else {
        openPicker(id, toggle);
      }
      return;
    }
    const chip = e.target.closest("[data-react-id]");
    if (chip) {
      socket.emit("react", { id: chip.dataset.reactId, emoji: chip.dataset.emoji });
      return;
    }
    closePicker();
  });

  function updateReactionsUI(id, reactions) {
    const target = document.querySelector(`[data-reactions-for="${id}"]`);
    if (target) target.innerHTML = reactionsHtml(id, reactions);
  }

  function updatePresence(names) {
    if (!names || names.length === 0) {
      presenceLine.textContent = "no one else here";
      return;
    }
    const others = names.filter((n) => n !== myName);
    if (others.length === 0) presenceLine.textContent = "just you";
    else if (others.length <= 3) presenceLine.textContent = others.join(", ") + " online";
    else presenceLine.textContent = `${others.length} people online`;
  }

  function updateTypingUI() {
    const names = Array.from(othersTyping.keys());
    if (names.length === 0) {
      typingIndicator.classList.add("hidden");
      return;
    }
    typingName.textContent = names.length === 1 ? `${names[0]} is typing` : `${names.length} people typing`;
    typingIndicator.classList.remove("hidden");
  }

  function autosize() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  }

  function connect(name) {
    socket = io({ reconnectionAttempts: Infinity });

    socket.on("connect", () => {
      connectionDot.classList.add("online");
      connectionDot.classList.remove("offline");
      socket.emit("join", name, (res) => {
        myName = res.name;
        messageList.innerHTML = "";
        res.history.forEach(renderMessage);
        presenceLine.textContent = "connected";
      });
    });

    socket.on("disconnect", () => {
      connectionDot.classList.remove("online");
      connectionDot.classList.add("offline");
      presenceLine.textContent = "reconnecting…";
    });

    socket.on("message", (msg) => {
      renderMessage(msg);
      othersTyping.delete(msg.name);
      updateTypingUI();
    });

    socket.on("reaction", ({ id, reactions }) => updateReactionsUI(id, reactions));

    socket.on("system", (evt) => renderSystem(evt.text));

    socket.on("presence", (names) => updatePresence(names));

    socket.on("typing", ({ name, isTyping }) => {
      if (isTyping) {
        clearTimeout(othersTyping.get(name));
        const t = setTimeout(() => {
          othersTyping.delete(name);
          updateTypingUI();
        }, 2500);
        othersTyping.set(name, t);
      } else {
        clearTimeout(othersTyping.get(name));
        othersTyping.delete(name);
      }
      updateTypingUI();
    });
  }

  function send() {
    const text = messageInput.value.trim();
    if (!text || !socket) return;
    socket.emit("message", text);
    messageInput.value = "";
    autosize();
    socket.emit("typing", false);
  }

  messageInput.addEventListener("input", () => {
    autosize();
    if (!socket) return;
    socket.emit("typing", true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit("typing", false), 1500);
  });

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  sendBtn.addEventListener("click", send);

  function doJoin() {
    const name = nameInput.value.trim();
    if (!name) {
      joinError.textContent = "Enter a name to continue.";
      return;
    }
    joinScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    connect(name);
  }

  joinBtn.addEventListener("click", doJoin);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doJoin();
  });
  nameInput.focus();
})();
