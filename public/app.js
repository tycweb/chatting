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

  // Reply UI
  const replyPreview = document.getElementById("reply-preview");
  const replyPreviewName = document.getElementById("reply-preview-name");
  const replyPreviewText = document.getElementById("reply-preview-text");
  const replyPreviewClose = document.getElementById("reply-preview-close");

  // Edit UI
  const editPreview = document.getElementById("edit-preview");
  const editPreviewClose = document.getElementById("edit-preview-close");

  // Exit modal UI
  const exitModal = document.getElementById("exit-modal");
  const exitCancelBtn = document.getElementById("exit-cancel-btn");
  const exitConfirmBtn = document.getElementById("exit-confirm-btn");

  const MAX_IMAGE_DIMENSION = 1280;
  const IMAGE_QUALITY = 0.72;
  const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
  const SWIPE_REPLY_THRESHOLD = 56;
  const LONG_PRESS_MS = 420;
  const LONG_PRESS_MOVE_CANCEL = 12;

  let unreadCount = 0;
  let soundEnabled = true;
  let audioCtx = null;
  let lastTap = { id: null, time: 0 };

  let myName = "";
  let socket = null;
  let openPickerId = null;
  let typingTimeout = null;
  let othersTyping = new Map();

  const messagesById = new Map();
  let replyTarget = null; // { id, name, text, image }
  let editingId = null;

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function scrollToBottom() {
    // Run after the browser has actually laid out the new content —
    // a single synchronous scroll can land short if images/fonts are
    // still resolving their final height.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messageList.scrollTop = messageList.scrollHeight;
      });
    });
  }

  function renderSystem(text) {
    const el = document.createElement("div");
    el.className = "system-line";
    el.textContent = text;
    messageList.appendChild(el);
    scrollToBottom();
  }

  // Same as renderSystem, but returns the element so the caller can remove
  // or update it later — used for transient "Sending…" style status lines.
  function renderStatus(text) {
    const el = document.createElement("div");
    el.className = "system-line";
    el.textContent = text;
    messageList.appendChild(el);
    scrollToBottom();
    return el;
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

  function replyQuoteHtml(replyTo) {
    if (!replyTo) return "";
    const label = replyTo.video ? "🎥 Video" : replyTo.image ? "📷 Photo" : escapeHtml(replyTo.text || "");
    return `<div class="reply-quote">
      <p class="reply-quote-name">${escapeHtml(replyTo.name || "")}</p>
      <p class="reply-quote-text">${label}</p>
    </div>`;
  }

  function buildRowInnerHtml(msg) {
    const isMe = msg.name === myName;

    if (msg.deleted) {
      return `
        ${!isMe ? `<p class="msg-name">${escapeHtml(msg.name)}</p>` : ""}
        <div class="msg-bubble-wrap">
          <div class="msg-bubble msg-bubble-deleted">
            <span>🚫 This message was deleted</span>
          </div>
        </div>
      `;
    }

    const jumbo = !msg.image && !msg.video && isJumboEmoji(msg.text);
    let bubbleInner;
    if (msg.video) {
      bubbleInner = `<video class="msg-video" src="${msg.video}" controls playsinline preload="metadata"></video>`;
    } else if (msg.videoOmitted) {
      bubbleInner = `<span>🎥 Video (no longer available after restart)</span>`;
    } else if (msg.image) {
      bubbleInner = `<img class="msg-image" src="${msg.image}" alt="Shared photo" data-lightbox="${msg.id}" />`;
    } else if (jumbo) {
      bubbleInner = escapeHtml(msg.text);
    } else {
      bubbleInner = linkifyText(msg.text);
    }

    const bubbleClasses = ["msg-bubble"];
    if (msg.image) bubbleClasses.push("msg-bubble-image");
    if (msg.video) bubbleClasses.push("msg-bubble-image"); // reuse the same no-padding media styling
    if (jumbo) bubbleClasses.push("msg-bubble-jumbo");

    const editedTag = msg.edited ? `<span class="edited-tag">edited</span>` : "";

    return `
      ${!isMe ? `<p class="msg-name">${escapeHtml(msg.name)}</p>` : ""}
      <div class="msg-bubble-wrap">
        <div class="${bubbleClasses.join(" ")}" data-toggle-picker="${msg.id}">
          ${replyQuoteHtml(msg.replyTo)}
          ${bubbleInner}
          <div class="msg-meta">${editedTag}<span>${fmtTime(msg.time)}</span></div>
        </div>
        <button class="reaction-trigger" data-toggle-picker="${msg.id}">🙂</button>
        <span class="swipe-reply-icon">↩</span>
      </div>
      <div data-reactions-for="${msg.id}">${reactionsHtml(msg.id, msg.reactions)}</div>
    `;
  }

  function renderMessage(msg) {
    messagesById.set(msg.id, msg);
    const row = document.createElement("div");
    row.className = `msg-row ${msg.name === myName ? "me" : "them"}`;
    row.dataset.id = msg.id;
    row.innerHTML = buildRowInnerHtml(msg);
    messageList.appendChild(row);
  }

  function updateRowInPlace(msg) {
    messagesById.set(msg.id, msg);
    const row = messageList.querySelector(`.msg-row[data-id="${msg.id}"]`);
    if (!row) return;
    row.innerHTML = buildRowInnerHtml(msg);
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
      return false;
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
    } catch (e) {}
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

  // ---------- Reply-to ----------

  function setReplyTarget(id) {
    const msg = messagesById.get(id);
    if (!msg || msg.deleted) return;
    cancelEdit();
    replyTarget = {
      id: msg.id,
      name: msg.name === myName ? "You" : msg.name,
      text: msg.text || "",
      image: !!msg.image,
    };
    replyPreviewName.textContent = replyTarget.name;
    replyPreviewText.textContent = replyTarget.image ? "📷 Photo" : replyTarget.text;
    replyPreview.classList.remove("hidden");
    messageInput.focus();
    if (navigator.vibrate) navigator.vibrate(15);
  }

  function clearReplyTarget() {
    replyTarget = null;
    replyPreview.classList.add("hidden");
  }

  replyPreviewClose.addEventListener("click", clearReplyTarget);

  // ---------- Edit ----------

  function startEdit(id) {
    const msg = messagesById.get(id);
    if (!msg || msg.deleted || msg.image || msg.name !== myName) return;
    clearReplyTarget();
    editingId = id;
    messageInput.value = msg.text;
    autosize();
    messageInput.focus();
    editPreview.classList.remove("hidden");
  }

  function cancelEdit() {
    if (!editingId) return;
    editingId = null;
    messageInput.value = "";
    autosize();
    editPreview.classList.add("hidden");
  }

  editPreviewClose.addEventListener("click", cancelEdit);

  // ---------- Copy ----------

  function copyMessage(id) {
    const msg = messagesById.get(id);
    if (!msg || msg.deleted) return;
    const text = msg.image ? "" : msg.text;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.vibrate) navigator.vibrate(12);
    renderSystem("Copied to clipboard");
  }

  // ---------- Delete ----------

  function deleteMessage(id) {
    const msg = messagesById.get(id);
    if (!msg || msg.name !== myName || !socket) return;
    socket.emit("delete", { id });
  }

  // ---------- Long-press action menu ----------

  function closeActionMenu() {
    const existing = document.querySelector(".action-menu");
    const backdrop = document.querySelector(".action-menu-backdrop");
    if (existing) existing.remove();
    if (backdrop) backdrop.remove();
  }

  function openActionMenu(id) {
    const msg = messagesById.get(id);
    if (!msg || msg.deleted) return;
    closePicker();
    closeActionMenu();

    const isMe = msg.name === myName;
    const items = [];
    items.push({ label: "↩ Reply", action: () => setReplyTarget(id) });
    if (!msg.image && msg.text) items.push({ label: "📋 Copy", action: () => copyMessage(id) });
    if (isMe && !msg.image) items.push({ label: "✏️ Edit", action: () => startEdit(id) });
    if (isMe) items.push({ label: "🗑 Delete", action: () => deleteMessage(id), danger: true });

    const backdrop = document.createElement("div");
    backdrop.className = "action-menu-backdrop";
    backdrop.addEventListener("click", closeActionMenu);
    document.body.appendChild(backdrop);

    const menu = document.createElement("div");
    menu.className = "action-menu";
    menu.innerHTML = items
      .map(
        (item, i) =>
          `<button class="action-menu-item ${item.danger ? "danger" : ""}" data-idx="${i}">${item.label}</button>`
      )
      .join("");
    document.body.appendChild(menu);

    menu.querySelectorAll("button[data-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items[Number(btn.dataset.idx)];
        closeActionMenu();
        if (item) item.action();
      });
    });

    if (navigator.vibrate) navigator.vibrate(18);
  }

  // ---------- Touch handling: swipe-to-reply + long-press menu ----------

  let swipeState = null; // { row, wrap, startX, startY, dragging, triggered, id }
  let longPressTimer = null;
  let longPressId = null;

  messageList.addEventListener(
    "touchstart",
    (e) => {
      const wrap = e.target.closest(".msg-bubble-wrap");
      if (!wrap) return;
      const row = wrap.closest(".msg-row");
      if (!row) return;
      const touch = e.touches[0];
      swipeState = {
        row,
        wrap,
        startX: touch.clientX,
        startY: touch.clientY,
        dragging: false,
        triggered: false,
        id: row.dataset.id,
      };

      longPressId = row.dataset.id;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        if (swipeState && !swipeState.dragging && longPressId) {
          openActionMenu(longPressId);
        }
      }, LONG_PRESS_MS);
    },
    { passive: true }
  );

  messageList.addEventListener(
    "touchmove",
    (e) => {
      if (!swipeState) return;
      const touch = e.touches[0];
      const dx = touch.clientX - swipeState.startX;
      const dy = touch.clientY - swipeState.startY;

      if (Math.abs(dx) > LONG_PRESS_MOVE_CANCEL || Math.abs(dy) > LONG_PRESS_MOVE_CANCEL) {
        clearTimeout(longPressTimer);
      }

      if (!swipeState.dragging) {
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
        swipeState.dragging = true;
        clearTimeout(longPressTimer);
      }

      const clamped = Math.max(-90, Math.min(90, dx));
      swipeState.wrap.style.transform = `translateX(${clamped}px)`;
      swipeState.wrap.style.transition = "none";

      if (Math.abs(clamped) > SWIPE_REPLY_THRESHOLD && !swipeState.triggered) {
        swipeState.triggered = true;
        if (navigator.vibrate) navigator.vibrate(10);
        swipeState.wrap.classList.add("swipe-armed");
      } else if (Math.abs(clamped) <= SWIPE_REPLY_THRESHOLD && swipeState.triggered) {
        swipeState.triggered = false;
        swipeState.wrap.classList.remove("swipe-armed");
      }
    },
    { passive: true }
  );

  function endSwipe() {
    clearTimeout(longPressTimer);
    if (!swipeState) return;
    const { wrap, triggered, id, dragging } = swipeState;
    wrap.style.transition = "transform 0.18s ease";
    wrap.style.transform = "translateX(0)";
    wrap.classList.remove("swipe-armed");

    if (dragging && triggered && id) {
      setReplyTarget(id);
    }
    swipeState = null;
  }

  messageList.addEventListener("touchend", endSwipe);
  messageList.addEventListener("touchcancel", endSwipe);

  messageList.addEventListener("click", (e) => {
    const img = e.target.closest("[data-lightbox]");
    if (img) {
      openLightbox(img.src);
      return;
    }

    const bubbleEl = e.target.closest(".msg-bubble");
    if (bubbleEl && !bubbleEl.classList.contains("msg-bubble-deleted") && !e.target.closest("a")) {
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

  // Desktop/right-click fallback for the action menu (long-press is touch-only)
  messageList.addEventListener("contextmenu", (e) => {
    const wrap = e.target.closest(".msg-bubble-wrap");
    if (!wrap) return;
    e.preventDefault();
    const row = wrap.closest(".msg-row");
    if (row) openActionMenu(row.dataset.id);
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

  function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) loadingScreen.classList.add("hidden");
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  async function setupPush(name) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Ask permission on a user gesture (join button click covers this)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const keyRes = await fetch("/api/vapid-public-key");
      const { key } = await keyRes.json();

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }

      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subscription }),
      });
    } catch (err) {
      console.error("Push setup failed:", err);
    }
  }

  function connect(name) {
    socket = io({ reconnectionAttempts: Infinity });

    // Render's free tier can take 30-50s to wake up from sleep, so cycle
    // the loading message through a few lines instead of sitting frozen.
    const loadingText = document.getElementById("loading-text");
    const loadingMessages = [
      "Connecting to GroupChat...",
      "Waking up the server…",
      "Poking the hamsters to run faster…",
      "Almost there, hang tight…",
      "Still working on it, promise…",
    ];
    let loadingIdx = 0;
    const cycleTimer = setInterval(() => {
      if (!loadingText) return;
      loadingIdx = (loadingIdx + 1) % loadingMessages.length;
      loadingText.style.opacity = 0;
      setTimeout(() => {
        loadingText.textContent = loadingMessages[loadingIdx];
        loadingText.style.opacity = 1;
      }, 200);
    }, 4000);

    // Safety net: never let the loading screen hang forever, even on a bad connection.
    const giveUpTimer = setTimeout(hideLoadingScreen, 60000);

    socket.on("connect", () => {
      clearInterval(cycleTimer);
      clearTimeout(giveUpTimer);
      hideLoadingScreen();
      connectionDot.classList.add("online");
      connectionDot.classList.remove("offline");
      socket.emit("join", name, (res) => {
        myName = res.name;
        messageList.innerHTML = "";
        res.history.forEach(renderMessage);
        scrollToBottom();

        // Photos load asynchronously and grow the page after the fact —
        // re-anchor to the bottom each time one finishes so we don't get
        // stranded above the latest message.
        messageList.querySelectorAll("img.msg-image").forEach((img) => {
          if (!img.complete) {
            img.addEventListener("load", scrollToBottom, { once: true });
          }
        });

        presenceLine.textContent = "connected";
        setupPush(myName);
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

    socket.on("edited", ({ id, text, edited }) => {
      const msg = messagesById.get(id);
      if (!msg) return;
      msg.text = text;
      msg.edited = edited;
      updateRowInPlace(msg);
    });

    socket.on("deleted", ({ id }) => {
      const msg = messagesById.get(id);
      if (!msg) return;
      msg.deleted = true;
      msg.text = "";
      msg.image = null;
      msg.reactions = {};
      updateRowInPlace(msg);
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

    if (editingId) {
      socket.emit("edit", { id: editingId, text });
      cancelEdit();
      if (navigator.vibrate) navigator.vibrate(10);
      return;
    }

    const payload = { text };
    if (replyTarget) {
      payload.replyTo = { id: replyTarget.id };
    }
    socket.emit("message", payload);
    messageInput.value = "";
    autosize();
    socket.emit("typing", false);
    sendBtn.classList.add("pulsing");
    setTimeout(() => sendBtn.classList.remove("pulsing"), 360);
    if (navigator.vibrate) navigator.vibrate(10);
    clearReplyTarget();
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

  function nextPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function sendImage(file) {
    if (!socket || !file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      renderSystem("That photo is too large to send.");
      return;
    }
    attachBtn.disabled = true;
    const statusEl = renderStatus("Sending photo…");
    await nextPaint(); // make sure the status line actually shows before we start work
    const minVisible = wait(500);
    try {
      const dataUrl = await compressImage(file);
      const payload = { image: dataUrl };
      if (replyTarget) {
        payload.replyTo = { id: replyTarget.id };
      }
      await minVisible;
      socket.emit("message", payload);
      clearReplyTarget();
    } catch (err) {
      renderSystem("Couldn't send that photo — try a different one.");
    } finally {
      attachBtn.disabled = false;
      statusEl.remove();
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  async function sendVideo(file) {
    if (!socket || !file) return;
    if (!file.type.startsWith("video/")) return;
    if (file.size > MAX_VIDEO_BYTES) {
      renderSystem("That video is too large to send (20MB max).");
      return;
    }
    attachBtn.disabled = true;
    const statusEl = renderStatus("Sending video…");
    await nextPaint(); // make sure the status line actually shows before we start work
    const minVisible = wait(500);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const payload = { video: dataUrl };
      if (replyTarget) {
        payload.replyTo = { id: replyTarget.id };
      }
      await minVisible;
      socket.emit("message", payload);
      clearReplyTarget();
    } catch (err) {
      renderSystem("Couldn't send that video — try a different one.");
    } finally {
      attachBtn.disabled = false;
      statusEl.remove();
    }
  }

  attachBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", () => {
    const file = imageInput.files && imageInput.files[0];
    if (file) {
      attachBtn.classList.add("pulsing");
      setTimeout(() => attachBtn.classList.remove("pulsing"), 320);
      if (file.type.startsWith("video/")) {
        sendVideo(file);
      } else {
        sendImage(file);
      }
    }
    imageInput.value = "";
  });

  messageInput.addEventListener("input", () => {
    autosize();
    if (!socket || editingId) return;
    socket.emit("typing", true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit("typing", false), 1500);
  });

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === "Escape" && editingId) {
      cancelEdit();
    }
  });

  sendBtn.addEventListener("click", send);

  // ---------- Exit confirmation ----------

  let guardActive = false;

  function armExitGuard() {
    if (guardActive) return;
    guardActive = true;
    history.pushState({ exitGuard: true }, "", location.href);
  }

  function showExitModal() {
    exitModal.classList.remove("hidden");
  }

  function hideExitModal() {
    exitModal.classList.add("hidden");
  }

  window.addEventListener("popstate", () => {
    guardActive = false;
    showExitModal();
  });

  exitCancelBtn.addEventListener("click", () => {
    hideExitModal();
    armExitGuard();
  });

  exitConfirmBtn.addEventListener("click", () => {
    hideExitModal();
    window.close();
  });

  armExitGuard();

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
    hideLoadingScreen(); // nothing to auto-connect to — don't block the join screen
  }
})();
