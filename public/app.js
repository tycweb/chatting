(() => {
  const QUICK_REACTIONS = ["😎", "😂", "😮", "😢", "🙏", "👍", "🔥", "🗿"];

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
  const attachBtn = document.getElementById("attach-btn");
  const imageInput = document.getElementById("image-input");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const jumpPill = document.getElementById("jump-pill");
  const jumpCount = document.getElementById("jump-count");
  const soundToggle = document.getElementById("sound-toggle");

  const MAX_IMAGE_DIMENSION = 1280;
  const IMAGE_QUALITY = 0.72;
  const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024; // reject absurdly large source photos early

  let unreadCount = 0;
  let soundEnabled = true;
  let audioCtx = null;
  let lastTap = { id: null, time: 0 };

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

    const jumbo = !msg.image && isJumboEmoji(msg.text);
    let bubbleInner;
    if (msg.image) {
      bubbleInner = `<img class="msg-image" src="${msg.image}" alt="Shared photo" data-lightbox="${msg.id}" />`;
    } else if (jumbo) {
      bubbleInner = escapeHtml(msg.text);
    } else {
      bubbleInner = linkifyText(msg.text);
    }

    const bubbleClasses = ["msg-bubble"];
    if (msg.image) bubbleClasses.push("msg-bubble-image");
    if (jumbo) bubbleClasses.push("msg-bubble-jumbo");

    row.innerHTML = `
      ${!isMe ? `<p class="msg-name">${escapeHtml(msg.name)}</p>` : ""}
      <div class="msg-bubble-wrap">
        <div class="${bubbleClasses.join(" ")}" data-toggle-picker="${msg.id}">
          ${bubbleInner}
          <div class="msg-meta"><span>${fmtTime(msg.time)}</span></div>
        </div>
        <button class="reaction-trigger" data-toggle-picker="${msg.id}">🙂</button>
      </div>
      <div data-reactions-for="${msg.id}">${reactionsHtml(msg.id, msg.reactions)}</div>
    `;

    messageList.appendChild(row);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function isJumboEmoji(text) {
    if (!text) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    const stripped = trimmed.replace(/\s/g, "");
    const codepoints = Array.from(stripped);
    if (codepoints.length === 0 || codepoints.length > 6) return false;
    try {
      return /^[\p{Extended_Pictographic}\u200D\uFE0F]+$/u.test(stripped);
    } catch (e) {
      return false; // unsupported property escapes on very old browsers
    }
  }

  function linkifyText(text) {
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
    let result = "";
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      result += escapeHtml(text.slice(lastIndex, match.index));
      let url = match[0];
      let trail = "";
      const trailMatch = url.match(/[.,!?)]+$/);
      if (trailMatch) {
        trail = trailMatch[0];
        url = url.slice(0, -trail.length);
      }
      const href = url.startsWith("http") ? url : `https://${url}`;
      result += `<a class="msg-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>${escapeHtml(trail)}`;
      lastIndex = match.index + match[0].length;
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function isNearBottom() {
    return messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 90;
  }

  function showJumpPill() {
    jumpCount.textContent = unreadCount;
    jumpPill.classList.remove("hidden");
  }

  function hideJumpPill() {
    unreadCount = 0;
    jumpPill.classList.add("hidden");
  }

  jumpPill.addEventListener("click", () => {
    scrollToBottom();
    hideJumpPill();
  });

  function playPop(freq) {
    if (!soundEnabled) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      // audio unsupported/blocked — fail silently
    }
  }

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "🔔" : "🔕";
    soundToggle.classList.add("pulsing");
    setTimeout(() => soundToggle.classList.remove("pulsing"), 320);
  });

  function spawnHeartBurst(bubbleEl) {
    const wrap = bubbleEl.closest(".msg-bubble-wrap");
    if (!wrap) return;
    const heart = document.createElement("span");
    heart.className = "heart-burst";
    heart.textContent = "❤️";
    wrap.appendChild(heart);
    setTimeout(() => heart.remove(), 700);
  }

  function quickHeartReact(id, bubbleEl) {
    if (!socket) return;
    closePicker();
    spawnHeartBurst(bubbleEl);
    if (navigator.vibrate) navigator.vibrate(12);
    socket.emit("react", { id, emoji: "❤️" });
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
    const img = e.target.closest("[data-lightbox]");
    if (img) {
      openLightbox(img.src);
      return;
    }

    const bubbleEl = e.target.closest(".msg-bubble");
    if (bubbleEl && !e.target.closest("a")) {
      const id = bubbleEl.closest(".msg-row")?.dataset.id;
      const now = Date.now();
      if (id && lastTap.id === id && now - lastTap.time < 320) {
        lastTap = { id: null, time: 0 };
        quickHeartReact(id, bubbleEl);
        return;
      }
      lastTap = { id, time: now };
    }

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

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImg.src = "";
  }

  lightbox.addEventListener("click", closeLightbox);

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
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.classList.add("hidden");
});
    socket.on("connect", () => {
      connectionDot.classList.add("online");
      connectionDot.classList.remove("offline");
      socket.emit("join", name, (res) => {
        myName = res.name;
        messageList.innerHTML = "";
        res.history.forEach(renderMessage);
        scrollToBottom();
        presenceLine.textContent = "connected";
      });
    });

    socket.on("disconnect", () => {
      connectionDot.classList.remove("online");
      connectionDot.classList.add("offline");
      presenceLine.textContent = "reconnecting…";
    });

    socket.on("message", (msg) => {
      const isMe = msg.name === myName;
      const wasNearBottom = isNearBottom();
      renderMessage(msg);
      othersTyping.delete(msg.name);
      updateTypingUI();

      if (isMe || wasNearBottom) {
        scrollToBottom();
        hideJumpPill();
      } else {
        unreadCount += 1;
        showJumpPill();
      }

      if (!isMe) {
        playPop(wasNearBottom ? 720 : 520);
        if (document.hidden && navigator.vibrate) navigator.vibrate(20);
      }
    });

    socket.on("reaction", ({ id, reactions }) => {
      updateReactionsUI(id, reactions);
      if (navigator.vibrate) navigator.vibrate(8);
    });

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
    socket.emit("message", { text });
    messageInput.value = "";
    autosize();
    socket.emit("typing", false);
    sendBtn.classList.add("pulsing");
    setTimeout(() => sendBtn.classList.remove("pulsing"), 360);
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not decode image"));
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function sendImage(file) {
    if (!socket || !file) return;
    if (!file.type.startsWith("image/")) {
      joinError.textContent = "";
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      renderSystem("That photo is too large to send.");
      return;
    }
    attachBtn.disabled = true;
    try {
      const dataUrl = await compressImage(file);
      socket.emit("message", { image: dataUrl });
    } catch (err) {
      renderSystem("Couldn't send that photo — try a different one.");
    } finally {
      attachBtn.disabled = false;
    }
  }

  attachBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", () => {
    const file = imageInput.files && imageInput.files[0];
    if (file) {
      attachBtn.classList.add("pulsing");
      setTimeout(() => attachBtn.classList.remove("pulsing"), 320);
      sendImage(file);
    }
    imageInput.value = "";
  });

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

  localStorage.setItem("chatName", name);

  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  connect(name);
  }

  joinBtn.addEventListener("click", doJoin);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doJoin();
  });
  const savedName = localStorage.getItem("chatName");

if (savedName) {
  nameInput.value = savedName;
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  connect(savedName);
} else {
  nameInput.focus();
}
})();
