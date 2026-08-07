(() => {
  const QUICK_REACTIONS = ["😎", "😂", "😮", "😢", "🙏", "👍", "🔥", "🗿"];

  // Full palette for the expanded emoji picker (tapped from the "+" button
  // on the quick-reaction bar). Grouped loosely by category.
  const EMOJI_PALETTE = [
    "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😜", "🤪", "🤔",
    "😎", "🥳", "🥺", "😭", "😢", "😡", "🤬", "😱", "😴", "🤯",
    "🙃", "😇", "🤗", "🤫", "🙄", "😏", "🤩", "🥰", "😳", "🤤",
    "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👌", "✌️", "🤞",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💯",
    "🔥", "✨", "🎉", "🎊", "🥳", "😈", "👻", "💀", "🤡", "🗿",
    "🐶", "🐱", "🦁", "🐸", "🐵", "🦄", "🐷", "🐧", "🦋", "🐢",
    "🍕", "🍔", "🍟", "🌮", "🍩", "🍦", "☕", "🍺", "🎂", "🍎",
    "⚽", "🏀", "🎮", "🎵", "📸", "🚀", "💰", "⭐", "☀️", "🌈",
  ];

  const joinScreen = document.getElementById("join-screen");
  const conversationsScreen = document.getElementById("conversations-screen");
  const chatScreen = document.getElementById("chat-screen");
  const nameInput = document.getElementById("name-input");
  const passwordInput = document.getElementById("password-input");
  const joinBtn = document.getElementById("join-btn");
  const joinError = document.getElementById("join-error");
  const messageList = document.getElementById("message-list");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const presenceLine = document.getElementById("presence-line");
  const convPresenceLine = document.getElementById("conv-presence-line");
  const connectionDot = document.getElementById("connection-dot");
  const typingIndicator = document.getElementById("typing-indicator");
  const typingName = document.getElementById("typing-name");
  const attachBtn = document.getElementById("attach-btn");
  const imageInput = document.getElementById("image-input");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const jumpPill = document.getElementById("jump-pill");
  const jumpCount = document.getElementById("jump-count");
  const jumpLabel = document.getElementById("jump-label");
  const soundToggle = document.getElementById("sound-toggle");
  const wallpaperBtn = document.getElementById("wallpaper-btn");
  const callBtn = document.getElementById("call-btn");

  // Video call UI
  const incomingCallModal = document.getElementById("incoming-call-modal");
  const incomingCallAvatar = document.getElementById("incoming-call-avatar");
  const incomingCallName = document.getElementById("incoming-call-name");
  const callAcceptBtn = document.getElementById("call-accept-btn");
  const callDeclineBtn = document.getElementById("call-decline-btn");
  const callScreen = document.getElementById("call-screen");
  const callRemoteVideo = document.getElementById("call-remote-video");
  const callLocalVideo = document.getElementById("call-local-video");
  const callStatusLayer = document.getElementById("call-status-layer");
  const callStatusAvatar = document.getElementById("call-status-avatar");
  const callStatusName = document.getElementById("call-status-name");
  const callStatusLine = document.getElementById("call-status-line");
  const callMicBtn = document.getElementById("call-mic-btn");
  const callCameraBtn = document.getElementById("call-camera-btn");
  const callHangupBtn = document.getElementById("call-hangup-btn");
  const callDuration = document.getElementById("call-duration");
  const callToast = document.getElementById("call-toast");
  const chatHeader = document.querySelector("#chat-screen .chat-header");

  // Conversations list UI
  const conversationList = document.getElementById("conversation-list");
  const convEmptyState = document.getElementById("conv-empty-state");
  const newChatBtn = document.getElementById("new-chat-btn");
  const backBtn = document.getElementById("back-btn");
  const chatTitle = document.getElementById("chat-title");
  const chatTitleAvatar = document.getElementById("chat-title-avatar");
  const chatTitleBtn = document.getElementById("chat-title-btn");

  // My profile picture UI
  const myAvatarBtn = document.getElementById("my-avatar-btn");
  const myAvatarInner = document.getElementById("my-avatar-inner");
  const myAvatarInput = document.getElementById("my-avatar-input");

  // Bottom nav (Chats / Features / Menu)
  const bottomNav = document.getElementById("bottom-nav");
  const navTabButtons = bottomNav ? Array.from(bottomNav.querySelectorAll(".nav-tab")) : [];

  // Features screen UI
  const featuresScreen = document.getElementById("features-screen");
  const enhancerFileInput = document.getElementById("enhancer-file-input");
  const enhancerChooseBtn = document.getElementById("enhancer-choose-btn");
  const enhancerChooseAgainBtn = document.getElementById("enhancer-choose-again-btn");
  const enhancerStatus = document.getElementById("enhancer-status");
  const enhancerModeNote = document.getElementById("enhancer-mode-note");
  const enhancerPreviewWrap = document.getElementById("enhancer-preview-wrap");
  const enhancerCanvas = document.getElementById("enhancer-canvas");
  const enhancerCompareBtn = document.getElementById("enhancer-compare-btn");
  const enhancerActions = document.getElementById("enhancer-actions");
  const enhancerDownloadBtn = document.getElementById("enhancer-download-btn");
  const enhancerSendBtn = document.getElementById("enhancer-send-btn");

  const removebgFileInput = document.getElementById("removebg-file-input");
  const removebgChooseBtn = document.getElementById("removebg-choose-btn");
  const removebgChooseAgainBtn = document.getElementById("removebg-choose-again-btn");
  const removebgStatus = document.getElementById("removebg-status");
  const removebgPreviewWrap = document.getElementById("removebg-preview-wrap");
  const removebgCanvas = document.getElementById("removebg-canvas");
  const removebgActions = document.getElementById("removebg-actions");
  const removebgDownloadBtn = document.getElementById("removebg-download-btn");
  const removebgSendBtn = document.getElementById("removebg-send-btn");
  const pollQuestionInput = document.getElementById("poll-question");
  const pollOptionInputs = [1, 2, 3, 4].map((i) => document.getElementById(`poll-option-${i}`));
  const pollSendBtn = document.getElementById("poll-send-btn");
  // Generic "send to a chat" picker, shared by Quick Poll and Photo Enhancer
  const chatPickerModal = document.getElementById("chat-picker-modal");
  const chatPickerTitle = document.getElementById("chat-picker-title");
  const chatPickerList = document.getElementById("chat-picker-list");
  const chatPickerClose = document.getElementById("chat-picker-close");
  const todoInput = document.getElementById("todo-input");
  const todoAddBtn = document.getElementById("todo-add-btn");
  const todoListEl = document.getElementById("todo-list");
  const todoEmpty = document.getElementById("todo-empty");
  const quietHoursToggle = document.getElementById("quiet-hours-toggle");
  const quietStartInput = document.getElementById("quiet-start");
  const quietEndInput = document.getElementById("quiet-end");

  // Menu screen UI
  const menuScreen = document.getElementById("menu-screen");
  const menuAvatarBtn = document.getElementById("menu-avatar-btn");
  const menuAvatarInner = document.getElementById("menu-avatar-inner");
  const menuAvatarInput = document.getElementById("menu-avatar-input");
  const menuProfileName = document.getElementById("menu-profile-name");
  const menuSoundToggle = document.getElementById("menu-sound-toggle");
  const menuLogoutBtn = document.getElementById("menu-logout-btn");
  const logoutModal = document.getElementById("logout-modal");
  const logoutCancelBtn = document.getElementById("logout-cancel-btn");
  const logoutConfirmBtn = document.getElementById("logout-confirm-btn");

  // View members (read-only) modal UI
  const viewMembersModal = document.getElementById("view-members-modal");
  const viewMembersClose = document.getElementById("view-members-close");
  const viewMembersTitle = document.getElementById("view-members-title");
  const viewMembersList = document.getElementById("view-members-list");

  // New chat modal UI
  const newChatModal = document.getElementById("new-chat-modal");
  const newChatClose = document.getElementById("new-chat-close");
  const tabMessage = document.getElementById("tab-message");
  const tabRoom = document.getElementById("tab-room");
  const messageMode = document.getElementById("message-mode");
  const roomMode = document.getElementById("room-mode");
  const memberSearch = document.getElementById("member-search");
  const memberListEl = document.getElementById("member-list");
  const groupNameInput = document.getElementById("group-name-input");
  const startChatBtn = document.getElementById("start-chat-btn");
  const roomNameInput = document.getElementById("room-name-input");
  const createRoomBtn = document.getElementById("create-room-btn");
  const roomVisibilityEveryone = document.getElementById("room-visibility-everyone");
  const roomVisibilitySelected = document.getElementById("room-visibility-selected");
  const roomVisibilityHint = document.getElementById("room-visibility-hint");
  const roomMemberListEl = document.getElementById("room-member-list");

  // Add people (to an existing dm/group) UI
  const addPeopleBtn = document.getElementById("add-people-btn");
  const addMembersModal = document.getElementById("add-members-modal");
  const addMembersClose = document.getElementById("add-members-close");
  const addMembersSearch = document.getElementById("add-members-search");
  const addMembersList = document.getElementById("add-members-list");
  const addMembersError = document.getElementById("add-members-error");
  const addMembersConfirmBtn = document.getElementById("add-members-confirm-btn");

  // Search UI
  const searchBtn = document.getElementById("search-btn");
  const searchBar = document.getElementById("search-bar");
  const searchInput = document.getElementById("search-input");
  const searchCount = document.getElementById("search-count");
  const searchPrev = document.getElementById("search-prev");
  const searchNext = document.getElementById("search-next");
  const searchClose = document.getElementById("search-close");

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
  const VIDEO_COMPRESS_THRESHOLD_BYTES = 20 * 1024 * 1024; // at/under this: send as-is, untouched
  const VIDEO_TARGET_COMPRESSED_BYTES = 5 * 1024 * 1024;   // above threshold: compress down toward this
  const VIDEO_HARD_MAX_SOURCE_BYTES = 150 * 1024 * 1024;   // above this: don't even attempt it in-browser
  const SWIPE_REPLY_THRESHOLD = 56;
  const LONG_PRESS_MS = 420;
  const LONG_PRESS_MOVE_CANCEL = 12;

  let unreadCount = 0;
  const baseTitle = document.title;
  let unreadTitleCount = 0;
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      unreadTitleCount = 0;
      document.title = baseTitle;
    }
  });

  // Fallback for browsers that don't yet support interactive-widget=resizes-content
  // (set on the viewport meta tag). Without it, opening the keyboard on some
  // mobile browsers shrinks only the *visual* viewport, not the layout one —
  // so the page tries to scroll the focused input into view and the header
  // (top of a 100dvh-tall screen) gets pushed off-screen. This keeps a real
  // pixel height in sync via --app-height and keeps the page pinned to the top.
  function syncAppHeight() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    // If the user was already looking at the bottom of the chat, keep them
    // pinned there once the new height applies. Without this, opening the
    // keyboard shrinks the message list but leaves scrollTop untouched, so
    // the most recent message ends up hidden below the fold behind the
    // keyboard/composer instead of sliding up into view.
    const wasNearBottom = isNearBottom();
    document.documentElement.style.setProperty("--app-height", `${h}px`);
    window.scrollTo(0, 0);
    if (wasNearBottom) scrollToBottom();
  }
  syncAppHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncAppHeight);
    window.visualViewport.addEventListener("scroll", syncAppHeight);
  }
  window.addEventListener("resize", syncAppHeight);
  // Only one video should ever play (and make sound) at a time. "play" doesn't
  // bubble, so this listener is attached with capture=true on the document —
  // whenever any <video> starts playing, pause every other one.
  document.addEventListener(
    "play",
    (e) => {
      const target = e.target;
      if (!(target instanceof HTMLVideoElement)) return;
      document.querySelectorAll("video.msg-video").forEach((v) => {
        if (v !== target && !v.paused) v.pause();
      });
    },
    true
  );
  let soundEnabled = true;
  let audioCtx = null;
  let lastTap = { id: null, time: 0 };

  // ---------- Emoji re-skin (Telegram/Discord-style flat art via Twemoji) ----------
  // The rest of the app just writes normal unicode emoji into innerHTML like
  // before — this watches the whole page and swaps them for consistent image
  // emoji the instant they land in the DOM, on every screen and every phone.
  function parseEmoji(node) {
    if (!window.twemoji || !node) return;
    try {
      window.twemoji.parse(node, { folder: "svg", ext: ".svg" });
    } catch (err) {
      // Twemoji not loaded yet or a stray node — safe to ignore, native emoji still shows.
    }
  }

  if (window.MutationObserver) {
    const emojiObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) parseEmoji(node);
          else if (node.nodeType === 3 && node.parentElement) parseEmoji(node.parentElement);
        });
      }
    });
    emojiObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  parseEmoji(document.body); // catch whatever's already on the page (join screen, header icons, etc.)

  let myName = "";
  let socket = null;
  let openPickerId = null;
  let typingTimeout = null;
  let othersTyping = new Map();

  const messagesById = new Map();
  let replyTarget = null; // { id, name, text, image }
  let editingId = null;

  // ---------- Multi-conversation state ----------
  let currentConversationId = null;
  const conversationsMeta = new Map(); // id -> { id, type, name, members, lastMessage, unread }
  let directory = []; // known usernames, excluding myName
  const selectedMembers = new Set();
  const selectedRoomMembers = new Set();
  const selectedAddMembers = new Set();
  let roomVisibility = "everyone"; // "everyone" | "selected"
  let onlineNames = [];
  let currentReads = new Map(); // name -> { messageId, time } — read receipts for the open conversation

  // Consecutive messages from the same sender within this window are
  // visually grouped (Messenger-style): tightened spacing, flattened
  // seam corners, and the name/avatar shown only once per group.
  const GROUP_WINDOW_MS = 5 * 60 * 1000;
  let lastRenderedId = null;

  // Messenger-style per-thread "chat theme". Keys must match the server's
  // WALLPAPER_KEYS allow-list — the server rejects anything else.
  const WALLPAPERS = {
    default: { swatch: "linear-gradient(135deg, #191919, #0a0a0a)", css: "none" },
    ocean: { swatch: "linear-gradient(135deg, #0084ff, #00c6ff)", css: "linear-gradient(160deg, rgba(0,132,255,0.18), rgba(0,198,255,0.05) 60%, transparent)" },
    sunset: { swatch: "linear-gradient(135deg, #fb923c, #f472b6)", css: "linear-gradient(160deg, rgba(251,146,60,0.16), rgba(244,114,182,0.06) 60%, transparent)" },
    forest: { swatch: "linear-gradient(135deg, #34d399, #059669)", css: "linear-gradient(160deg, rgba(52,211,153,0.15), rgba(5,150,105,0.05) 60%, transparent)" },
    grape: { swatch: "linear-gradient(135deg, #a78bfa, #7c3aed)", css: "linear-gradient(160deg, rgba(167,139,250,0.18), rgba(124,58,237,0.06) 60%, transparent)" },
    candy: { swatch: "linear-gradient(135deg, #f472b6, #fb7185)", css: "linear-gradient(160deg, rgba(244,114,182,0.16), rgba(251,113,133,0.06) 60%, transparent)" },
    mono: { swatch: "linear-gradient(135deg, #8a8a8a, #3a3a3a)", css: "linear-gradient(160deg, rgba(255,255,255,0.06), transparent 60%)" },
    fire: { swatch: "linear-gradient(135deg, #f87171, #facc15)", css: "linear-gradient(160deg, rgba(248,113,113,0.16), rgba(250,204,21,0.06) 60%, transparent)" },
  };

  function applyWallpaper(key) {
    const preset = WALLPAPERS[key] || WALLPAPERS.default;
    messageList.style.backgroundImage = preset.css === "none" ? "" : preset.css;
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Popups are opened by just removing "hidden" (the CSS entrance animation
  // fires automatically on that display-none -> flex transition). Closing
  // needs an extra beat: add "closing" to play an exit animation, then swap
  // to "hidden" once it finishes so the box doesn't just vanish instantly.
  function closeOverlay(el, afterHide) {
    if (!el || el.classList.contains("hidden")) return;
    if (prefersReducedMotion) {
      el.classList.remove("closing");
      el.classList.add("hidden");
      if (afterHide) afterHide();
      return;
    }
    if (el.classList.contains("closing")) return;
    el.classList.add("closing");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add("hidden");
      el.classList.remove("closing");
      el.removeEventListener("animationend", onAnimEnd);
      if (afterHide) afterHide();
    };
    const onAnimEnd = (e) => {
      if (e.target !== el) return; // ignore bubbled animationend from inner elements
      finish();
    };
    el.addEventListener("animationend", onAnimEnd);
    setTimeout(finish, 260); // fallback in case the animation doesn't fire
  }

  const NAME_COLORS = ["#7dd3fc", "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#facc15", "#60a5fa", "#f87171"];
  // Paired gradients (same order/hue family as NAME_COLORS above) used for
  // avatar circle backgrounds — gives every avatar the same soft diagonal
  // sheen as the brand mark instead of a flat block of color, so initials,
  // group chats, and the logo all read as one consistent icon style.
  const AVATAR_GRADIENTS = [
    "linear-gradient(135deg, #7dd3fc, #0369a1)",
    "linear-gradient(135deg, #a78bfa, #5b21b6)",
    "linear-gradient(135deg, #93c5fd, #6d28d9)",
    "linear-gradient(135deg, #c4b5fd, #7e22ce)",
    "linear-gradient(135deg, #67e8f9, #0e7490)",
    "linear-gradient(135deg, #bae6fd, #1e40af)",
    "linear-gradient(135deg, #ddd6fe, #4338ca)",
    "linear-gradient(135deg, #7dd3fc, #4c1d95)",
  ];
  function nameHash(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return hash;
  }
  function colorForName(name) {
    return NAME_COLORS[nameHash(name) % NAME_COLORS.length];
  }
  function avatarBgForName(name) {
    return AVATAR_GRADIENTS[nameHash(name) % AVATAR_GRADIENTS.length];
  }

  // Custom profile pictures. name -> avatar URL. Populated from the join
  // reply and kept in sync via the "avatar-updated" broadcast.
  const avatars = new Map();

  // Inner HTML for any avatar circle/square: a custom photo if the person
  // has set one, otherwise the usual colored initial.
  function avatarInnerHtml(name) {
    const url = avatars.get(name);
    if (url) return `<img src="${escapeHtml(url)}" alt="" loading="lazy" />`;
    const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
    return escapeHtml(initial);
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function fmtListTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  // ---------- Conversation display helpers ----------

  function otherMembers(conv) {
    return (conv.members || []).filter((m) => m !== myName);
  }

  function conversationTitle(conv) {
    if (conv.type === "room") return conv.name || "Room";
    if (conv.type === "group") return conv.name || otherMembers(conv).join(", ") || "Group";
    // dm
    const other = otherMembers(conv)[0];
    return other || conv.name || "Chat";
  }

  function conversationAvatarHtml(conv) {
    if (conv.type === "room") {
      return `<div class="conv-avatar-wrap"><div class="conv-avatar room-avatar">#</div></div>`;
    }
    if (conv.type === "group") {
      const anyOnline = otherMembers(conv).some((m) => onlineNames.includes(m));
      const dot = anyOnline ? `<span class="conv-online-dot"></span>` : "";
      return `<div class="conv-avatar-wrap"><div class="conv-avatar group-avatar"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>${dot}</div>`;
    }
    const other = otherMembers(conv)[0] || "?";
    const dot = onlineNames.includes(other) ? `<span class="conv-online-dot"></span>` : "";
    return `<div class="conv-avatar-wrap"><div class="conv-avatar" style="background:${avatarBgForName(other)}">${avatarInnerHtml(other)}</div>${dot}</div>`;
  }

  function conversationPreviewText(conv) {
    const last = conv.lastMessage;
    if (!last) return conv.type === "room" ? "Say hello 👋" : "No messages yet";
    if (last.deleted) return "Message deleted";
    const who = last.name === myName ? "You" : last.name;
    let body;
    if (last.video) body = "🎥 Video";
    else if (last.image) body = "📷 Photo";
    else body = last.text || "";
    return conv.type === "room" || conv.type === "group" ? `${who}: ${body}` : body;
  }

  function sortedConversations() {
    return Array.from(conversationsMeta.values()).sort((a, b) => {
      const at = (a.lastMessage && a.lastMessage.time) || a.createdAt || 0;
      const bt = (b.lastMessage && b.lastMessage.time) || b.createdAt || 0;
      return bt - at;
    });
  }

  // Shimmer placeholder rows shown in the chat list before the real
  // conversations arrive (e.g. on first load, or while the server is
  // waking up from sleep).
  function renderConversationSkeleton(count = 6) {
    conversationList.innerHTML = "";
    convEmptyState.classList.add("hidden");
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const item = document.createElement("div");
      item.className = "conv-item skeleton-conv-item";
      item.innerHTML = `
        <div class="skeleton-block skeleton-avatar"></div>
        <div class="conv-body">
          <div class="conv-top-row">
            <div class="skeleton-block skeleton-line" style="width:${40 + (i % 3) * 10}%"></div>
            <div class="skeleton-block skeleton-line" style="width:28px"></div>
          </div>
          <div class="conv-preview-row">
            <div class="skeleton-block skeleton-line" style="width:${55 + (i % 4) * 8}%"></div>
          </div>
        </div>
      `;
      frag.appendChild(item);
    }
    conversationList.appendChild(frag);
  }

  // Shimmer placeholder bubbles shown the instant a chat is opened, so
  // switching conversations feels immediate even while the history is
  // still in flight from the server.
  function renderMessageSkeleton() {
    const pattern = ["them", "them", "me", "them", "me"];
    const widths = [58, 40, 66, 36, 50];
    const frag = document.createDocumentFragment();
    pattern.forEach((who, i) => {
      const row = document.createElement("div");
      row.className = `msg-row skeleton-msg-row ${who}`;
      row.innerHTML = `<div class="skeleton-msg-bubble" style="width:${widths[i]}%"></div>`;
      frag.appendChild(row);
    });
    messageList.appendChild(frag);
  }

  function renderConversationList() {
    const list = sortedConversations();
    conversationList.innerHTML = "";
    convEmptyState.classList.toggle("hidden", list.length > 0);
    list.forEach((conv, i) => {
      const item = document.createElement("div");
      item.className = `conv-item${conv.unread ? " unread" : ""}`;
      item.style.setProperty("--row-i", Math.min(i, 10));
      item.dataset.id = conv.id;
      const time = conv.lastMessage ? fmtListTime(conv.lastMessage.time) : "";
      item.innerHTML = `
        ${conversationAvatarHtml(conv)}
        <div class="conv-body">
          <div class="conv-top-row">
            <p class="conv-name">${escapeHtml(conversationTitle(conv))}</p>
            <span class="conv-time">${time}</span>
          </div>
          <div class="conv-preview-row">
            <p class="conv-preview">${escapeHtml(conversationPreviewText(conv))}</p>
            ${conv.unread ? `<span class="conv-unread-badge">${conv.unread > 99 ? "99+" : conv.unread}</span>` : ""}
          </div>
        </div>
      `;
      item.addEventListener("click", () => openConversationById(conv.id));
      conversationList.appendChild(item);
    });
  }

  function upsertConversation(conv, opts = {}) {
    const existing = conversationsMeta.get(conv.id);
    const merged = Object.assign({ unread: existing ? existing.unread : 0 }, existing, conv);
    if (opts.bumpUnread) merged.unread = (merged.unread || 0) + 1;
    if (opts.clearUnread) merged.unread = 0;
    conversationsMeta.set(conv.id, merged);
    if (!conversationsScreen.classList.contains("hidden")) renderConversationList();
  }

  // Messenger-style bottom nav: Chats / Features / Menu. Only one of the
  // three top-level screens is visible at a time, and the nav itself hides
  // completely once a single conversation is opened (chat-screen), same as
  // Messenger's own bottom bar.
  function showBottomTab(tab) {
    closeLightbox();
    closePicker();
    closeActionMenu();
    currentConversationId = null;
    chatScreen.classList.add("hidden");
    conversationsScreen.classList.add("hidden");
    if (featuresScreen) featuresScreen.classList.add("hidden");
    if (menuScreen) menuScreen.classList.add("hidden");
    if (bottomNav) bottomNav.classList.remove("hidden");
    navTabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));

    if (tab === "features" && featuresScreen) {
      featuresScreen.classList.remove("hidden");
    } else if (tab === "menu" && menuScreen) {
      menuScreen.classList.remove("hidden");
      refreshMenuProfile();
    } else {
      conversationsScreen.classList.remove("hidden");
      renderConversationList();
    }
  }

  function showConversationsScreen() {
    showBottomTab("chats");
  }

  navTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showBottomTab(btn.dataset.tab));
  });

  function updateConvPresenceLine() {
    if (!convPresenceLine) return;
    const others = onlineNames.filter((n) => n !== myName);
    if (others.length === 0) convPresenceLine.textContent = "just you online";
    else if (others.length <= 3) convPresenceLine.textContent = others.join(", ") + " online";
    else convPresenceLine.textContent = `${others.length} people online`;
  }

  function renderChatTitleAvatar(conv) {
    if (conv.type === "room") {
      chatTitleAvatar.textContent = "#";
    } else if (conv.type === "group") {
      chatTitleAvatar.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    } else {
      const other = otherMembers(conv)[0] || conversationTitle(conv);
      chatTitleAvatar.innerHTML = avatarInnerHtml(other);
    }
  }

  let pendingOpenId = null;

  function openConversationById(id) {
    if (!socket) return;
    closeNewChatModal();
    pendingOpenId = id;

    // Switch to the chat screen right away with a skeleton instead of
    // waiting on the round trip — real content swaps in the moment the
    // server responds. Use whatever we already know about this
    // conversation (name/avatar) so the header doesn't flash empty.
    const cachedConv = conversationsMeta.get(id);
    messageList.innerHTML = "";
    renderMessageSkeleton();
    if (cachedConv) {
      // We already know the name/avatar — show the real thing immediately,
      // no need to shimmer what we already have.
      chatTitle.classList.remove("skeleton-block", "skeleton-line");
      chatTitle.textContent = conversationTitle(cachedConv);
      chatTitleAvatar.classList.remove("skeleton-block");
      renderChatTitleAvatar(cachedConv);
    } else {
      // First time seeing this conversation (e.g. cold load) — shimmer the
      // title/avatar too instead of flashing stale/placeholder text.
      chatTitle.textContent = "";
      chatTitle.classList.add("skeleton-block", "skeleton-line");
      chatTitleAvatar.textContent = "";
      chatTitleAvatar.classList.add("skeleton-block");
    }
    updateAddPeopleVisibility(cachedConv);
    updateCallButtonVisibility(cachedConv);
    // Shimmer bar instead of a literal "connecting…" string, so the header
    // reads as "content still loading" rather than a stalled network state.
    presenceLine.textContent = "";
    presenceLine.classList.add("skeleton-block", "skeleton-line");
    conversationsScreen.classList.add("hidden");
    if (featuresScreen) featuresScreen.classList.add("hidden");
    if (menuScreen) menuScreen.classList.add("hidden");
    if (bottomNav) bottomNav.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    socket.emit("open-conversation", { id }, (res) => {
      if (pendingOpenId !== id) return; // user already switched to another chat
      if (!res || res.error) {
        messageList.innerHTML = "";
        chatTitle.classList.remove("skeleton-block", "skeleton-line");
        chatTitleAvatar.classList.remove("skeleton-block");
        presenceLine.classList.remove("skeleton-block", "skeleton-line");
        presenceLine.textContent = "";
        renderSystem("Couldn't open that chat.");
        return;
      }
      currentConversationId = id;
      clearReplyTarget();
      cancelEdit();
      messagesById.clear();
      lastRenderedId = null;
      messageList.innerHTML = "";
      searchClose.click();

      const conv = conversationsMeta.get(id) || { id, type: res.type, name: res.name, members: res.members };
      conv.type = res.type;
      conv.name = res.name;
      conv.members = res.members;
      conv.wallpaper = res.wallpaper || null;
      upsertConversation(conv, { clearUnread: true });
      applyWallpaper(conv.wallpaper);
      currentReads = new Map(Object.entries(res.reads || {}));

      chatTitle.classList.remove("skeleton-block", "skeleton-line");
      chatTitle.textContent = conversationTitle(conv);
      chatTitleAvatar.classList.remove("skeleton-block");
      renderChatTitleAvatar(conv);
      updateAddPeopleVisibility(conv);
      updateCallButtonVisibility(conv);
      presenceLine.classList.remove("skeleton-block", "skeleton-line");
      if (conv.type === "room") {
        presenceLine.textContent = "public room";
      } else if (conv.type === "group") {
        presenceLine.textContent = `${(conv.members || []).length} people`;
      } else {
        updateDmPresence(conv);
      }

      // Appending 100-200 rows one at a time into a visible, in-document
      // container forces a reflow after every single row. Detaching the
      // list from layout for the bulk render (then reattaching once) turns
      // that into a single reflow instead.
      messageList.style.display = "none";
      res.history.forEach(renderMessage);
      messageList.style.display = "";
      renderReadReceipts();
      scrollToBottom();
      messageList.querySelectorAll("img.msg-image").forEach((img) => {
        if (!img.complete) img.addEventListener("load", scrollToBottom, { once: true });
      });

      messageInput.focus();
    });
  }

  function updateDmPresence(conv) {
    const other = otherMembers(conv)[0];
    if (!other) return;
    presenceLine.textContent = onlineNames.includes(other) ? "online" : "offline";
  }

  backBtn && backBtn.addEventListener("click", showConversationsScreen);

  // ---------- In-app pull-to-refresh ----------
  // Mimics native pull-to-refresh but never reloads the page: dragging down
  // from the top of the message list re-fetches this conversation's history
  // over the existing socket connection. Keep the native "Pull to Refresh"
  // toggle OFF in the app builder — that one reloads the whole WebView.

  const pullRefreshIndicator = document.getElementById("pull-refresh-indicator");
  const PULL_THRESHOLD = 64; // px of actual finger travel needed to trigger
  const PULL_MAX = 90; // visual cap on how far the indicator can stretch
  const PULL_RESISTANCE = 0.5; // drag feels slightly "heavy", like native UIs

  let pullStartY = 0;
  let pullTracking = false;
  let pullDistance = 0;
  let pullRefreshing = false;

  function setPullHeight(px) {
    if (pullRefreshIndicator) pullRefreshIndicator.style.height = `${px}px`;
  }

  function finishPullRefresh() {
    pullRefreshing = false;
    if (pullRefreshIndicator) {
      pullRefreshIndicator.classList.remove("dragging");
      setPullHeight(0);
    }
  }

  function performPullRefresh() {
    if (!currentConversationId || !socket || pullRefreshing) {
      finishPullRefresh();
      return;
    }
    pullRefreshing = true;
    const refreshingId = currentConversationId;
    socket.emit("open-conversation", { id: refreshingId }, (res) => {
      // Bail quietly if the user switched conversations while this was in flight.
      if (currentConversationId === refreshingId && res && !res.error) {
        messagesById.clear();
        lastRenderedId = null;
        messageList.innerHTML = "";
        currentReads = new Map(Object.entries(res.reads || {}));
        messageList.style.display = "none";
        res.history.forEach(renderMessage);
        messageList.style.display = "";
        renderReadReceipts();
        scrollToBottom();
      }
      setTimeout(finishPullRefresh, 250);
    });
  }

  if (messageList && pullRefreshIndicator) {
    messageList.addEventListener(
      "touchstart",
      (e) => {
        if (pullRefreshing || e.touches.length !== 1) return;
        if (messageList.scrollTop <= 0) {
          pullTracking = true;
          pullStartY = e.touches[0].clientY;
          pullDistance = 0;
        }
      },
      { passive: true }
    );

    messageList.addEventListener(
      "touchmove",
      (e) => {
        if (!pullTracking || pullRefreshing) return;
        const deltaY = e.touches[0].clientY - pullStartY;
        if (deltaY <= 0 || messageList.scrollTop > 0) {
          pullTracking = false;
          pullRefreshIndicator.classList.remove("dragging");
          setPullHeight(0);
          return;
        }
        pullRefreshIndicator.classList.add("dragging");
        pullDistance = Math.min(PULL_MAX, deltaY * PULL_RESISTANCE);
        setPullHeight(pullDistance);
      },
      { passive: true }
    );

    const endPull = () => {
      if (!pullTracking) return;
      pullTracking = false;
      pullRefreshIndicator.classList.remove("dragging");
      if (pullDistance >= PULL_THRESHOLD * PULL_RESISTANCE) {
        setPullHeight(52);
        performPullRefresh();
      } else {
        setPullHeight(0);
      }
    };

    messageList.addEventListener("touchend", endPull);
    messageList.addEventListener("touchcancel", endPull);
  }

  // ---------- New chat modal ----------

  function closeNewChatModal() {
    closeOverlay(newChatModal);
  }

  function openNewChatModal() {
    selectedMembers.clear();
    memberSearch.value = "";
    groupNameInput.value = "";
    groupNameInput.classList.add("hidden");
    roomNameInput.value = "";
    selectedRoomMembers.clear();
    startChatBtn.disabled = true;
    createRoomBtn.disabled = true;
    setNewChatTab("message");
    setRoomVisibility("everyone");
    renderMemberList();
    newChatModal.classList.remove("hidden");
  }

  function setNewChatTab(mode) {
    tabMessage.classList.toggle("active", mode === "message");
    tabRoom.classList.toggle("active", mode === "room");
    messageMode.classList.toggle("hidden", mode !== "message");
    roomMode.classList.toggle("hidden", mode !== "room");
  }

  function setRoomVisibility(mode) {
    roomVisibility = mode;
    roomVisibilityEveryone.classList.toggle("active", mode === "everyone");
    roomVisibilitySelected.classList.toggle("active", mode === "selected");
    roomMemberListEl.classList.toggle("hidden", mode !== "selected");
    roomVisibilityHint.textContent =
      mode === "everyone"
        ? "Anyone in Tycept can find and join a room."
        : "Only the people you select will be able to see and join this room.";
    if (mode === "selected") renderRoomMemberList();
  }

  // Shared row renderer used by both the message-mode member picker and the
  // room-mode private member picker — same look, different target set/list.
  function renderMemberRows(containerEl, names, selectedSet, onToggle) {
    containerEl.innerHTML = "";
    if (names.length === 0) {
      containerEl.innerHTML = `<p class="member-list-empty">No one else here yet — share the link with a friend.</p>`;
      return;
    }
    names.forEach((n, i) => {
      const row = document.createElement("div");
      row.className = `member-row${selectedSet.has(n) ? " selected" : ""}`;
      row.style.setProperty("--row-i", Math.min(i, 10));
      const isOnline = onlineNames.includes(n);
      row.innerHTML = `
        <div class="member-row-avatar-wrap">
          <div class="conv-avatar" style="background:${avatarBgForName(n)}">${avatarInnerHtml(n)}</div>
          <span class="member-status-dot ${isOnline ? "online" : "offline"}"></span>
        </div>
        <span class="member-row-name">${escapeHtml(n)}</span>
        <span class="member-row-status">${isOnline ? "online" : "offline"}</span>
        <span class="member-checkbox"></span>
      `;
      row.addEventListener("click", () => onToggle(n));
      containerEl.appendChild(row);
    });
  }

  function renderMemberList() {
    const q = memberSearch.value.trim().toLowerCase();
    const names = directory.filter((n) => n.toLowerCase().includes(q));
    renderMemberRows(memberListEl, names, selectedMembers, (n) => {
      if (selectedMembers.has(n)) selectedMembers.delete(n);
      else selectedMembers.add(n);
      renderMemberList();
      groupNameInput.classList.toggle("hidden", selectedMembers.size <= 1);
      startChatBtn.disabled = selectedMembers.size === 0;
    });
  }

  function renderRoomMemberList() {
    renderMemberRows(roomMemberListEl, directory, selectedRoomMembers, (n) => {
      if (selectedRoomMembers.has(n)) selectedRoomMembers.delete(n);
      else selectedRoomMembers.add(n);
      renderRoomMemberList();
    });
  }

  // ---------- Add people (to an existing dm/group) ----------

  function closeAddMembersModal() {
    closeOverlay(addMembersModal);
  }

  function openAddMembersModal() {
    if (!currentConversationId) return;
    selectedAddMembers.clear();
    addMembersSearch.value = "";
    addMembersError.textContent = "";
    addMembersConfirmBtn.disabled = true;
    renderAddMembersList();
    addMembersModal.classList.remove("hidden");
  }

  function renderAddMembersList() {
    const conv = conversationsMeta.get(currentConversationId);
    const existing = new Set(conv ? conv.members || [] : []);
    const q = addMembersSearch.value.trim().toLowerCase();
    const names = directory.filter((n) => !existing.has(n) && n.toLowerCase().includes(q));
    renderMemberRows(addMembersList, names, selectedAddMembers, (n) => {
      if (selectedAddMembers.has(n)) selectedAddMembers.delete(n);
      else selectedAddMembers.add(n);
      renderAddMembersList();
      addMembersConfirmBtn.disabled = selectedAddMembers.size === 0;
    });
  }

  // Shows/hides the header "add people" button — only dm/group chats
  // support adding more people; public/private rooms don't need it since
  // rooms already work by everyone (or the invited list) joining directly.
  function updateAddPeopleVisibility(conv) {
    const show = !!conv && (conv.type === "dm" || conv.type === "group");
    addPeopleBtn && addPeopleBtn.classList.toggle("hidden", !show);
  }

  // Video calling only works 1:1 for now — groups/rooms don't have a single
  // "other person" to ring, so the button stays hidden outside of dms.
  function updateCallButtonVisibility(conv) {
    const show = !!conv && conv.type === "dm";
    callBtn && callBtn.classList.toggle("hidden", !show);
  }

  // ---------- Video calls (WebRTC, 1:1 dm only) ----------
  //
  // The server (server.js) only relays signaling messages — SDP offers/
  // answers and ICE candidates — between the two people on a call. Once
  // that handshake finishes, video/audio flows directly between the two
  // browsers (peer-to-peer), never through the server.
  //
  // Flow: caller taps Call -> "call-invite" -> server pings the other
  // person's socket(s) -> they see the incoming-call modal -> Accept ->
  // "call-accepted" -> caller creates a WebRTC offer -> exchanged via
  // "call-signal" -> callee answers -> ICE candidates trade back and forth
  // -> ontrack fires on both sides once media is actually flowing.

  // STUN alone only works when at least one side has an easy-to-map NAT —
  // it can't relay media itself. Two people behind carrier-grade/symmetric
  // NAT (very common on mobile data, and some corporate/hotel wifi) will
  // finish the signaling handshake fine but never get a working media
  // path, which looks exactly like a call that "connects" into a
  // permanent black screen. A TURN server relays media as a fallback for
  // exactly those cases — fill in real credentials from a TURN provider
  // (e.g. Twilio, Cloudflare Calls, Metered) or a self-hosted coturn
  // instance below.
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // { urls: "turn:YOUR_TURN_HOST:3478", username: "YOUR_USERNAME", credential: "YOUR_CREDENTIAL" },
  ];

  // Everything about whatever call is ringing, dialing, or connected right
  // now. Null whenever there's no call in progress.
  // Shape: { callId, conversationId, peerName, role: "caller"|"callee", pc, localStream, localStreamPromise }
  let currentCall = null;
  let callTimerInterval = null;
  let ringtoneInterval = null;
  let callToastTimeout = null;

  function showCallToast(text) {
    if (!callToast) return;
    callToast.textContent = text;
    callToast.classList.remove("hidden");
    clearTimeout(callToastTimeout);
    callToastTimeout = setTimeout(() => callToast.classList.add("hidden"), 3200);
  }

  // ----- Ringtone: reuses the same Web Audio synth approach as playPop()
  // instead of shipping an audio file. -----

  function startRingtone() {
    stopRingtone();
    if (!soundEnabled || isQuietHoursActive()) return;
    const ring = () => {
      playPop(587);
      setTimeout(() => playPop(740), 160);
    };
    ring();
    ringtoneInterval = setInterval(ring, 2000);
  }

  function stopRingtone() {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }

  // ----- Call duration timer -----

  function startCallTimer() {
    if (callTimerInterval) return;
    let seconds = 0;
    callDuration.textContent = "00:00";
    callDuration.classList.remove("hidden");
    callTimerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      callDuration.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopCallTimer() {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
    callDuration.classList.add("hidden");
  }

  // ----- Peer connection -----

  function createPeerConnection(callId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("call-signal", { callId, signal: { type: "ice-candidate", candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      callRemoteVideo.srcObject = e.streams[0];
      callStatusLayer.classList.add("hidden");
      startCallTimer();
    };

    // Without a TURN relay, a broken media path (see ICE_SERVERS above)
    // frequently gets stuck in "disconnected" rather than ever reaching
    // "failed" — that used to leave the call screen sitting on a black
    // video indefinitely with no error and no way out but a manual hangup.
    // Give it a short grace period to recover (brief blips are normal),
    // then end the call with an actual message if it doesn't.
    let disconnectTimer = null;
    pc.onconnectionstatechange = () => {
      if (!currentCall || currentCall.callId !== callId) return;
      if (pc.connectionState === "connected") {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
      } else if (pc.connectionState === "failed") {
        clearTimeout(disconnectTimer);
        endCall(true);
        showCallToast("Call dropped — connection failed.");
      } else if (pc.connectionState === "disconnected" && !disconnectTimer) {
        disconnectTimer = setTimeout(() => {
          if (currentCall && currentCall.callId === callId && pc.connectionState !== "connected") {
            endCall(true);
            showCallToast("Call dropped — connection lost.");
          }
        }, 8000);
      }
    };

    return pc;
  }

  async function getLocalMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    callLocalVideo.srcObject = stream;
    return stream;
  }

  // The caller can end up requesting local media from two places close
  // together — right after the invite is sent, and again once
  // "call-accepted" arrives — if the callee answers before the first
  // getUserMedia() prompt resolves. Both paths await this same promise
  // instead of firing a second concurrent camera/mic request.
  function ensureLocalStream(call) {
    if (!call.localStreamPromise) call.localStreamPromise = getLocalMedia();
    return call.localStreamPromise;
  }

  // ----- Screens -----

  function showIncomingCallUI(name) {
    incomingCallAvatar.innerHTML = avatarInnerHtml(name);
    incomingCallName.textContent = name;
    incomingCallModal.classList.remove("hidden");
    startRingtone();
    if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 300]);
  }

  function hideIncomingCallUI() {
    stopRingtone();
    closeOverlay(incomingCallModal);
  }

  function showCallScreen(name, statusText) {
    callStatusAvatar.innerHTML = avatarInnerHtml(name);
    callStatusName.textContent = name;
    callStatusLine.textContent = statusText;
    callStatusLayer.classList.remove("hidden");
    callRemoteVideo.srcObject = null;
    callMicBtn.classList.remove("call-btn-off");
    callCameraBtn.classList.remove("call-btn-off");
    callLocalVideo.classList.remove("call-video-off");
    callScreen.classList.remove("hidden");
  }

  function hideCallScreen() {
    callScreen.classList.add("hidden");
    if (callRemoteVideo.srcObject) callRemoteVideo.srcObject = null;
    if (callLocalVideo.srcObject) callLocalVideo.srcObject = null;
  }

  // ----- Call lifecycle -----

  function startCall(conv) {
    if (!socket || currentCall) return;
    const peerName = otherMembers(conv)[0];
    if (!peerName) return;

    socket.emit("call-invite", { conversationId: conv.id, callType: "video" }, async (res) => {
      if (!res || res.error) {
        if (res && res.error === "user-offline") showCallToast(`${peerName} isn't online right now.`);
        return;
      }
      currentCall = { callId: res.callId, conversationId: conv.id, peerName, role: "caller", pc: null, localStream: null, localStreamPromise: null };
      showCallScreen(peerName, "Calling…");
      try {
        const stream = await ensureLocalStream(currentCall);
        if (!currentCall || currentCall.callId !== res.callId) {
          // Call was declined/cancelled/ended while the permission prompt
          // was still up — don't resurrect it, just release the camera.
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        currentCall.localStream = stream;
      } catch (err) {
        console.error("Camera/mic access failed:", err);
        showCallToast("Couldn't access your camera/mic.");
        if (currentCall && currentCall.callId === res.callId) endCall(true);
      }
    });
  }

  async function acceptIncomingCall() {
    if (!currentCall) return;
    const callId = currentCall.callId;
    hideIncomingCallUI();
    showCallScreen(currentCall.peerName, "Connecting…");
    try {
      const stream = await getLocalMedia();
      if (!currentCall || currentCall.callId !== callId) {
        // Caller cancelled while the permission prompt was still up.
        stream.getTracks().forEach((t) => t.stop());
        hideCallScreen();
        return;
      }
      currentCall.localStream = stream;
      const pc = createPeerConnection(callId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      currentCall.pc = pc;
      socket.emit("call-accept", { callId });
    } catch (err) {
      console.error("Camera/mic access failed:", err);
      if (currentCall && currentCall.callId === callId) {
        socket.emit("call-decline", { callId });
        currentCall = null;
      }
      hideCallScreen();
      showCallToast("Couldn't access your camera/mic.");
    }
  }

  function declineIncomingCall() {
    if (!currentCall) return;
    socket.emit("call-decline", { callId: currentCall.callId });
    hideIncomingCallUI();
    currentCall = null;
  }

  // notifyServer=false when the server already told us the call is over
  // (declined/cancelled/ended by the other side) — no need to echo it back.
  function endCall(notifyServer) {
    if (!currentCall) return;
    if (notifyServer && socket) {
      socket.emit(currentCall.pc ? "call-end" : "call-cancel", { callId: currentCall.callId });
    }
    if (currentCall.pc) currentCall.pc.close();
    if (currentCall.localStream) currentCall.localStream.getTracks().forEach((t) => t.stop());
    stopCallTimer();
    stopRingtone();
    hideIncomingCallUI();
    hideCallScreen();
    currentCall = null;
  }

  function toggleMic() {
    if (!currentCall || !currentCall.localStream) return;
    const track = currentCall.localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    callMicBtn.classList.toggle("call-btn-off", !track.enabled);
  }

  function toggleCamera() {
    if (!currentCall || !currentCall.localStream) return;
    const track = currentCall.localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    callCameraBtn.classList.toggle("call-btn-off", !track.enabled);
    callLocalVideo.classList.toggle("call-video-off", !track.enabled);
  }

  callBtn &&
    callBtn.addEventListener("click", () => {
      if (!currentConversationId) return;
      const conv = conversationsMeta.get(currentConversationId);
      if (conv) startCall(conv);
    });

  callAcceptBtn && callAcceptBtn.addEventListener("click", acceptIncomingCall);
  callDeclineBtn && callDeclineBtn.addEventListener("click", declineIncomingCall);
  callHangupBtn && callHangupBtn.addEventListener("click", () => endCall(true));
  callMicBtn && callMicBtn.addEventListener("click", toggleMic);
  callCameraBtn && callCameraBtn.addEventListener("click", toggleCamera);

  addPeopleBtn && addPeopleBtn.addEventListener("click", openAddMembersModal);
  addMembersClose && addMembersClose.addEventListener("click", closeAddMembersModal);
  addMembersModal &&
    addMembersModal.addEventListener("click", (e) => {
      if (e.target === addMembersModal) closeAddMembersModal();
    });
  addMembersSearch && addMembersSearch.addEventListener("input", renderAddMembersList);
  addMembersConfirmBtn &&
    addMembersConfirmBtn.addEventListener("click", () => {
      if (!socket || !currentConversationId || selectedAddMembers.size === 0) return;
      addMembersConfirmBtn.disabled = true;
      addMembersError.textContent = "";
      socket.emit(
        "add-members",
        { conversationId: currentConversationId, members: Array.from(selectedAddMembers) },
        (res) => {
          if (!res || res.error) {
            addMembersConfirmBtn.disabled = false;
            addMembersError.textContent =
              res && res.error === "too-many-members"
                ? "That chat is already at the member limit."
                : "Couldn't add them. Try again.";
            return;
          }
          closeAddMembersModal();
        }
      );
    });

  // ---------- View members (read-only list of who's in this chat) ----------

  function closeViewMembersModal() {
    closeOverlay(viewMembersModal);
  }

  function openViewMembersModal() {
    if (!currentConversationId) return;
    const conv = conversationsMeta.get(currentConversationId);
    if (!conv) return;
    const isPublicRoom = conv.type === "room" && (conv.members || []).length === 0;
    viewMembersTitle.textContent = isPublicRoom
      ? "Online now"
      : conv.type === "group"
      ? "Group members"
      : "Members";
    renderViewMembersList();
    viewMembersModal.classList.remove("hidden");
  }

  function renderViewMembersList() {
    if (!currentConversationId) return;
    const conv = conversationsMeta.get(currentConversationId);
    if (!conv) return;
    const isPublicRoom = conv.type === "room" && (conv.members || []).length === 0;
    // A public room's member list is implicit ("everyone can join") rather
    // than a fixed roster, so show who's actually online right now instead.
    const pool = isPublicRoom ? Array.from(new Set([myName, ...onlineNames])) : conv.members || [];
    const names = pool.slice().sort((a, b) => {
      if (a === myName) return -1;
      if (b === myName) return 1;
      return a.localeCompare(b);
    });
    viewMembersList.innerHTML = "";
    if (isPublicRoom) {
      const hint = document.createElement("p");
      hint.className = "new-chat-hint";
      hint.textContent = "This is a public room — anyone in Tycept can join, so this shows who's online now.";
      viewMembersList.appendChild(hint);
    }
    if (names.length === 0) {
      viewMembersList.innerHTML += `<p class="member-list-empty">No one here yet.</p>`;
      return;
    }
    names.forEach((n, i) => {
      const row = document.createElement("div");
      row.className = "member-row view-member-row";
      row.style.setProperty("--row-i", Math.min(i, 10));
      const isOnline = onlineNames.includes(n);
      const isMe = n === myName;
      row.innerHTML = `
        <div class="member-row-avatar-wrap">
          <div class="conv-avatar" style="background:${avatarBgForName(n)}">${avatarInnerHtml(n)}</div>
          <span class="member-status-dot ${isOnline ? "online" : "offline"}"></span>
        </div>
        <span class="member-row-name">${escapeHtml(n)}${isMe ? " (you)" : ""}</span>
        <span class="member-row-status">${isOnline ? "online" : "offline"}</span>
      `;
      viewMembersList.appendChild(row);
    });
  }

  chatTitleBtn &&
    chatTitleBtn.addEventListener("click", () => {
      const conv = currentConversationId ? conversationsMeta.get(currentConversationId) : null;
      if (conv) openViewMembersModal();
    });
  chatTitleBtn &&
    chatTitleBtn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      chatTitleBtn.click();
    });
  viewMembersClose && viewMembersClose.addEventListener("click", closeViewMembersModal);
  viewMembersModal &&
    viewMembersModal.addEventListener("click", (e) => {
      if (e.target === viewMembersModal) closeViewMembersModal();
    });

  // ---------- My profile picture ----------

  function refreshMyAvatarButton() {
    if (!myName) return;
    if (myAvatarInner) {
      myAvatarInner.style.background = avatarBgForName(myName);
      myAvatarInner.innerHTML = avatarInnerHtml(myName);
    }
    if (menuAvatarInner) {
      menuAvatarInner.style.background = avatarBgForName(myName);
      menuAvatarInner.innerHTML = avatarInnerHtml(myName);
    }
    if (menuProfileName) menuProfileName.textContent = myName;
  }

  function refreshMenuProfile() {
    refreshMyAvatarButton();
  }

  // Shared by both the header avatar button and the Menu screen's avatar
  // button — same upload flow, just triggered from two different buttons.
  async function handleAvatarFileChosen(file, triggerBtn) {
    if (!file || !socket) return;
    if (!file.type.startsWith("image/")) {
      renderSystem("That doesn't look like an image.");
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      renderSystem("That photo is too large — try a smaller one.");
      return;
    }
    if (triggerBtn) triggerBtn.classList.add("uploading");
    try {
      const dataUrl = await compressAvatarImage(file);
      socket.emit("set-avatar", { avatar: dataUrl }, (res) => {
        if (triggerBtn) triggerBtn.classList.remove("uploading");
        if (!res || res.error) {
          renderSystem("Couldn't update your profile picture — try again.");
          return;
        }
        avatars.set(myName, res.avatar);
        refreshMyAvatarButton();
        renderConversationList();
        if (currentConversationId) {
          const conv = conversationsMeta.get(currentConversationId);
          if (conv) renderChatTitleAvatar(conv);
          renderReadReceipts();
        }
      });
    } catch (err) {
      if (triggerBtn) triggerBtn.classList.remove("uploading");
      renderSystem("Couldn't read that photo — try a different one.");
    }
  }

  myAvatarBtn && myAvatarBtn.addEventListener("click", () => myAvatarInput && myAvatarInput.click());
  myAvatarInput &&
    myAvatarInput.addEventListener("change", () => {
      const file = myAvatarInput.files && myAvatarInput.files[0];
      myAvatarInput.value = "";
      handleAvatarFileChosen(file, myAvatarBtn);
    });

  menuAvatarBtn && menuAvatarBtn.addEventListener("click", () => menuAvatarInput && menuAvatarInput.click());
  menuAvatarInput &&
    menuAvatarInput.addEventListener("change", () => {
      const file = menuAvatarInput.files && menuAvatarInput.files[0];
      menuAvatarInput.value = "";
      handleAvatarFileChosen(file, menuAvatarBtn);
    });

  newChatBtn && newChatBtn.addEventListener("click", openNewChatModal);
  newChatClose && newChatClose.addEventListener("click", closeNewChatModal);
  newChatModal &&
    newChatModal.addEventListener("click", (e) => {
      if (e.target === newChatModal) closeNewChatModal();
    });
  tabMessage && tabMessage.addEventListener("click", () => setNewChatTab("message"));
  tabRoom && tabRoom.addEventListener("click", () => setNewChatTab("room"));
  memberSearch && memberSearch.addEventListener("input", renderMemberList);
  roomVisibilityEveryone &&
    roomVisibilityEveryone.addEventListener("click", () => setRoomVisibility("everyone"));
  roomVisibilitySelected &&
    roomVisibilitySelected.addEventListener("click", () => setRoomVisibility("selected"));
  roomNameInput &&
    roomNameInput.addEventListener("input", () => {
      createRoomBtn.disabled = !roomNameInput.value.trim();
    });

  startChatBtn &&
    startChatBtn.addEventListener("click", () => {
      if (!socket || selectedMembers.size === 0) return;
      startChatBtn.disabled = true;
      socket.emit(
        "create-conversation",
        { type: "dm", members: Array.from(selectedMembers), name: groupNameInput.value.trim() },
        (res) => {
          startChatBtn.disabled = false;
          if (!res || res.error) {
            renderSystem("Couldn't start that chat.");
            return;
          }
          upsertConversation(res);
          closeNewChatModal();
          openConversationById(res.id);
        }
      );
    });

  createRoomBtn &&
    createRoomBtn.addEventListener("click", () => {
      const name = roomNameInput.value.trim();
      if (!socket || !name) return;
      if (roomVisibility === "selected" && selectedRoomMembers.size === 0) {
        renderSystem("Select at least one person, or switch to Everyone.");
        return;
      }
      createRoomBtn.disabled = true;
      const payload = { type: "room", name };
      if (roomVisibility === "selected") payload.members = Array.from(selectedRoomMembers);
      socket.emit("create-conversation", payload, (res) => {
        createRoomBtn.disabled = false;
        if (!res || res.error) {
          renderSystem("Couldn't create that room.");
          return;
        }
        upsertConversation(res);
        closeNewChatModal();
        openConversationById(res.id);
      });
    });

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
    lastRenderedId = null;
    const el = document.createElement("div");
    el.className = "system-line";
    el.textContent = text;
    messageList.appendChild(el);
    scrollToBottom();
  }

  // Same as renderSystem, but returns the element so the caller can remove
  // or update it later — used for transient "Sending…" style status lines.
  function renderStatus(text) {
    lastRenderedId = null;
    const el = document.createElement("div");
    el.className = "system-line";
    el.textContent = text;
    messageList.appendChild(el);
    scrollToBottom();
    return el;
  }

  // Like renderStatus, but includes a slim animated progress bar under the
  // label — used for video compression, where a bare percentage in text
  // was easy to miss.
  function renderProgressStatus(text) {
    lastRenderedId = null;
    const el = document.createElement("div");
    el.className = "system-line system-line-progress";
    const label = document.createElement("span");
    label.textContent = text;
    const track = document.createElement("div");
    track.className = "progress-track";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    track.appendChild(bar);
    el.appendChild(label);
    el.appendChild(track);
    messageList.appendChild(el);
    scrollToBottom();
    return {
      el,
      setText: (t) => { label.textContent = t; },
      setProgress: (p) => {
        bar.style.width = `${Math.round(Math.min(Math.max(p, 0), 1) * 100)}%`;
      },
      remove: () => el.remove(),
    };
  }

  function reactionsHtml(id, reactions) {
    const entries = Object.entries(reactions || {});
    if (entries.length === 0) return "";
    return entries
      .map(([emoji, users]) => {
        const mine = users.includes(myName);
        return `<button class="reaction-chip ${mine ? "mine" : ""}" data-react-id="${id}" data-emoji="${emoji}">
          <span>${emoji}</span><span>${users.length}</span>
        </button>`;
      })
      .join("");
  }

  function avatarHtml(name) {
    return `<div class="msg-avatar" style="background:${avatarBgForName(name)}">${avatarInnerHtml(name)}</div>`;
  }

  function replyQuoteHtml(replyTo) {
    if (!replyTo) return "";
    const label = replyTo.video
      ? "🎥 Video"
      : replyTo.image
      ? "📷 Photo"
      : escapeHtml(replyTo.text || "");
    const jumpAttr = replyTo.id ? ` data-jump-to="${replyTo.id}"` : "";
    return `<div class="reply-quote"${jumpAttr}>
      <p class="reply-quote-name">${escapeHtml(replyTo.name || "")}</p>
      <p class="reply-quote-text">${label}</p>
    </div>`;
  }

  // Scrolls to and briefly highlights the original message a reply points
  // to. If it isn't loaded (e.g. older than the history the client has),
  // shows a small system note instead of doing nothing silently.
  function jumpToMessage(id) {
    const row = messageList.querySelector(`.msg-row[data-id="${id}"]`);
    if (!row) {
      renderSystem("Original message isn't loaded.");
      return;
    }
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.remove("jump-flash");
    // Force reflow so re-adding the class restarts the animation even if
    // the same message is jumped to twice in a row.
    void row.offsetWidth;
    row.classList.add("jump-flash");
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => row.classList.remove("jump-flash"), 1000);
  }

  // groupedPrev: this message immediately follows one from the same
  // sender (hide name/avatar, flatten the top seam).
  // groupedNext: another message from the same sender immediately
  // follows this one (hide the timestamp, flatten the bottom seam).
  function buildRowInnerHtml(msg, groupedPrev, groupedNext) {
    const isMe = msg.name === myName;
    const avatar = !isMe && !groupedNext ? avatarHtml(msg.name) : !isMe ? `<div class="msg-avatar"></div>` : "";
    const nameLabel = !isMe && !groupedPrev
      ? `<p class="msg-name" style="color:${colorForName(msg.name)}">${escapeHtml(msg.name)}</p>`
      : "";

    if (msg.deleted) {
      return `
        ${avatar}
        <div class="msg-col">
          ${nameLabel}
          <div class="msg-bubble-wrap">
            <div class="msg-bubble msg-bubble-deleted">
              <span>🚫 This message was deleted</span>
            </div>
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
      bubbleInner = `<div class="msg-text">${escapeHtml(msg.text)}</div>`;
    } else {
      bubbleInner = `<div class="msg-text">${linkifyText(msg.text)}</div>`;
    }

    const bubbleClasses = ["msg-bubble"];
    if (msg.image) bubbleClasses.push("msg-bubble-image");
    if (msg.video) bubbleClasses.push("msg-bubble-image"); // reuse the same no-padding media styling
    if (jumbo) bubbleClasses.push("msg-bubble-jumbo");

    const editedTag = msg.edited ? `<span class="edited-tag">edited</span>` : "";
    // Messenger only shows the timestamp on the last bubble of a group.
    const metaHtml = groupedNext ? "" : `<div class="msg-meta">${editedTag}<span>${fmtTime(msg.time)}</span></div>`;

    return `
      ${avatar}
      <div class="msg-col">
        ${nameLabel}
        <div class="msg-bubble-wrap">
          <div class="${bubbleClasses.join(" ")}" data-toggle-picker="${msg.id}">
            ${replyQuoteHtml(msg.replyTo)}
            ${bubbleInner}
            ${metaHtml}
          </div>
          <button class="reaction-trigger" data-toggle-picker="${msg.id}">🙂</button>
          <span class="swipe-reply-icon">↩</span>
          <div class="reaction-row" data-reactions-for="${msg.id}">${reactionsHtml(msg.id, msg.reactions)}</div>
        </div>
      </div>
    `;
  }

  function renderMessage(msg) {
    messagesById.set(msg.id, msg);

    const prev = lastRenderedId ? messagesById.get(lastRenderedId) : null;
    const groupedPrev = !!(
      prev && prev.name === msg.name && !prev.deleted && !msg.deleted && msg.time - prev.time < GROUP_WINDOW_MS
    );

    const row = document.createElement("div");
    row.className = `msg-row ${msg.name === myName ? "me" : "them"}${groupedPrev ? " grouped-prev" : ""}`;
    row.dataset.id = msg.id;
    row.dataset.sender = msg.name;
    row.innerHTML = buildRowInnerHtml(msg, groupedPrev, false);
    messageList.appendChild(row);

    // Tell the previous row it's no longer the last in its group.
    if (groupedPrev) {
      const prevRow = messageList.querySelector(`.msg-row[data-id="${lastRenderedId}"]`);
      if (prevRow && !prevRow.classList.contains("grouped-next")) {
        prevRow.classList.add("grouped-next");
        prevRow.innerHTML = buildRowInnerHtml(prev, prevRow.classList.contains("grouped-prev"), true);
      }
    }

    lastRenderedId = msg.id;
  }

  function updateRowInPlace(msg) {
    messagesById.set(msg.id, msg);
    const row = messageList.querySelector(`.msg-row[data-id="${msg.id}"]`);
    if (!row) return;
    const groupedPrev = row.classList.contains("grouped-prev");
    const groupedNext = row.classList.contains("grouped-next");
    row.innerHTML = buildRowInnerHtml(msg, groupedPrev, groupedNext);
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
    jumpCount.textContent = unreadCount > 0 ? unreadCount : "";
    jumpLabel.textContent = unreadCount > 0 ? "New messages" : "Back to bottom";
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

  // Surface the pill any time the user has scrolled away from the bottom,
  // even with no new messages — it's easy to get stranded mid-history
  // after jumping to a reply or a search result.
  let scrollRaf = null;
  messageList.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        chatHeader.classList.toggle("scrolled", messageList.scrollTop > 4);
        if (isNearBottom()) {
          if (unreadCount === 0) hideJumpPill();
        } else if (unreadCount === 0) {
          jumpCount.textContent = "";
          jumpLabel.textContent = "Back to bottom";
          jumpPill.classList.remove("hidden");
        }
      });
    },
    { passive: true }
  );

  // ---------- Quiet hours (mutes message sounds during a set window) ----------

  function loadQuietHours() {
    try {
      const raw = localStorage.getItem("quietHours");
      if (!raw) return { enabled: false, start: "22:00", end: "08:00" };
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        start: parsed.start || "22:00",
        end: parsed.end || "08:00",
      };
    } catch (e) {
      return { enabled: false, start: "22:00", end: "08:00" };
    }
  }

  let quietHours = loadQuietHours();

  function saveQuietHours() {
    localStorage.setItem("quietHours", JSON.stringify(quietHours));
  }

  function isQuietHoursActive() {
    if (!quietHours.enabled) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = quietHours.start.split(":").map(Number);
    const [eh, em] = quietHours.end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    if (startMinutes === endMinutes) return false;
    if (startMinutes < endMinutes) {
      // Same-day window, e.g. 13:00 -> 18:00
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    // Overnight window, e.g. 22:00 -> 08:00
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }

  function refreshQuietHoursUI() {
    if (quietHoursToggle) quietHoursToggle.setAttribute("aria-pressed", String(quietHours.enabled));
    if (quietStartInput) quietStartInput.value = quietHours.start;
    if (quietEndInput) quietEndInput.value = quietHours.end;
  }
  refreshQuietHoursUI();

  quietHoursToggle &&
    quietHoursToggle.addEventListener("click", () => {
      quietHours.enabled = !quietHours.enabled;
      saveQuietHours();
      refreshQuietHoursUI();
    });
  quietStartInput &&
    quietStartInput.addEventListener("change", () => {
      quietHours.start = quietStartInput.value || quietHours.start;
      saveQuietHours();
    });
  quietEndInput &&
    quietEndInput.addEventListener("change", () => {
      quietHours.end = quietEndInput.value || quietHours.end;
      saveQuietHours();
    });

  function playPop(freq) {
    if (!soundEnabled || isQuietHoursActive()) return;
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

  const BELL_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const BELL_OFF_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.7 3A6 6 0 0 1 18 8c0 4.2.8 6.1 1.5 7.5"/><path d="M17.4 17.4A2.1 2.1 0 0 1 17 17H3s3-2 3-9c0-.5.05-1 .15-1.45"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="m2 2 20 20"/></svg>';

  function setSoundEnabled(next) {
    soundEnabled = next;
    soundToggle.innerHTML = soundEnabled ? BELL_ICON : BELL_OFF_ICON;
    if (menuSoundToggle) menuSoundToggle.setAttribute("aria-pressed", String(soundEnabled));
    localStorage.setItem("soundEnabled", soundEnabled ? "1" : "0");
  }

  const savedSoundEnabled = localStorage.getItem("soundEnabled");
  if (savedSoundEnabled !== null) setSoundEnabled(savedSoundEnabled === "1");
  else setSoundEnabled(true);

  soundToggle.addEventListener("click", () => {
    setSoundEnabled(!soundEnabled);
    soundToggle.classList.add("pulsing");
    setTimeout(() => soundToggle.classList.remove("pulsing"), 320);
  });

  menuSoundToggle &&
    menuSoundToggle.addEventListener("click", () => setSoundEnabled(!soundEnabled));

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
    socket.emit("react", { conversationId: currentConversationId, id, emoji: "❤️" });
  }

  function closePicker() {
    const existing = document.querySelector(".reaction-picker");
    const backdrop = document.querySelector(".reaction-picker-backdrop");
    if (existing) existing.remove();
    if (backdrop) backdrop.remove();
    openPickerId = null;
    closeEmojiGrid();
  }

  function openPicker(id, anchorEl) {
    closePicker();
    openPickerId = id;

    const backdrop = document.createElement("div");
    backdrop.className = "reaction-picker-backdrop";
    backdrop.addEventListener("click", closePicker);
    document.body.appendChild(backdrop);

    const picker = document.createElement("div");
    picker.className = "reaction-picker";
    picker.innerHTML =
      QUICK_REACTIONS.map((e, i) => `<button data-pick="${e}" style="--i:${i}">${e}</button>`).join("") +
      `<button class="reaction-picker-more" data-more="1" style="--i:${QUICK_REACTIONS.length}" aria-label="More emoji">+</button>`;
    document.body.appendChild(picker);

    // Anchor to the bubble, then clamp inside the viewport so the picker
    // (now wider with the "+" button) never renders off-screen — it used to
    // be positioned absolute inside the bubble itself, which pushed it past
    // the edge of the phone screen on "me" messages.
    //
    // Important: use offsetWidth/offsetHeight here, not getBoundingClientRect.
    // The picker's entrance animation starts from transform: scale(0.7) with
    // "backwards" fill-mode, so measuring it with getBoundingClientRect right
    // after insertion (before the animation actually starts) reports that
    // shrunk, transformed box — about 30% too narrow. Positioning off that
    // undersized number then let the real (scale 1) picker overhang past the
    // right edge of the screen, hiding the "+" button. offsetWidth/Height
    // reflect the true layout size and ignore the transform entirely.
    const wrap = anchorEl.closest(".msg-bubble-wrap") || anchorEl;
    const wrapRect = wrap.getBoundingClientRect();
    const pickerWidth = picker.offsetWidth;
    const pickerHeight = picker.offsetHeight;
    const margin = 8;
    const isMe = !!anchorEl.closest(".msg-row.me");

    let left = isMe ? wrapRect.right - pickerWidth : wrapRect.left;
    left = Math.min(Math.max(left, margin), window.innerWidth - pickerWidth - margin);

    let top = wrapRect.top - pickerHeight - 10;
    if (top < margin) top = Math.min(wrapRect.bottom + 10, window.innerHeight - pickerHeight - margin);

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;

    picker.querySelectorAll("button[data-pick]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        socket.emit("react", { conversationId: currentConversationId, id, emoji: btn.dataset.pick });
        closePicker();
      });
    });

    const moreBtn = picker.querySelector("[data-more]");
    if (moreBtn) {
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEmojiGrid(id);
      });
    }
  }

  // Full emoji grid, opened from the "+" on the quick-reaction bar — lets
  // you react with any emoji in EMOJI_PALETTE, not just the pinned 8.
  function closeEmojiGrid() {
    const existing = document.querySelector(".emoji-grid-sheet");
    const backdrop = document.querySelector(".emoji-grid-backdrop");
    if (existing) existing.remove();
    if (backdrop) backdrop.remove();
  }

  function openEmojiGrid(id) {
    closePicker();
    closeEmojiGrid();

    const backdrop = document.createElement("div");
    backdrop.className = "emoji-grid-backdrop";
    backdrop.addEventListener("click", closeEmojiGrid);
    document.body.appendChild(backdrop);

    const sheet = document.createElement("div");
    sheet.className = "emoji-grid-sheet";
    sheet.innerHTML = `
      <p class="emoji-grid-title">React with</p>
      <div class="emoji-grid">
        ${EMOJI_PALETTE.map((e) => `<button class="emoji-grid-item" data-pick="${e}">${e}</button>`).join("")}
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        socket.emit("react", { conversationId: currentConversationId, id, emoji: btn.dataset.pick });
        closeEmojiGrid();
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
      video: !!msg.video,
    };
    replyPreviewName.textContent = replyTarget.name;
    replyPreviewText.textContent = replyTarget.video
      ? "🎥 Video"
      : replyTarget.image
      ? "📷 Photo"
      : replyTarget.text;
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
    socket.emit("delete", { conversationId: currentConversationId, id });
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

  // ---------- Chat theme (wallpaper) picker ----------

  function closeWallpaperPicker() {
    const existing = document.querySelector(".wallpaper-picker");
    const backdrop = document.querySelector(".wallpaper-picker-backdrop");
    if (existing) existing.remove();
    if (backdrop) backdrop.remove();
  }

  function openWallpaperPicker() {
    if (!currentConversationId) return;
    closePicker();
    closeActionMenu();
    closeWallpaperPicker();

    const conv = conversationsMeta.get(currentConversationId);
    const activeKey = (conv && conv.wallpaper) || "default";

    const backdrop = document.createElement("div");
    backdrop.className = "wallpaper-picker-backdrop";
    backdrop.addEventListener("click", closeWallpaperPicker);
    document.body.appendChild(backdrop);

    const picker = document.createElement("div");
    picker.className = "wallpaper-picker";
    picker.innerHTML = `
      <p class="wallpaper-picker-title">Chat theme</p>
      <div class="wallpaper-swatch-grid">
        ${Object.keys(WALLPAPERS)
          .map(
            (key) => `<button class="wallpaper-swatch ${key === activeKey ? "active" : ""}" data-wallpaper="${key}"
              style="background:${WALLPAPERS[key].swatch}" aria-label="${key} theme"></button>`
          )
          .join("")}
      </div>
    `;
    document.body.appendChild(picker);

    picker.querySelectorAll("[data-wallpaper]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.wallpaper;
        applyWallpaper(key);
        if (conv) conv.wallpaper = key;
        socket.emit("set-wallpaper", { conversationId: currentConversationId, wallpaper: key });
        closeWallpaperPicker();
      });
    });
  }

  wallpaperBtn.addEventListener("click", openWallpaperPicker);

  // ---------- Search ----------

  let searchMatches = [];
  let searchIndex = -1;

  function runSearch(query) {
    const q = query.trim().toLowerCase();
    searchMatches = [];
    searchIndex = -1;
    if (!q) {
      searchCount.textContent = "";
      return;
    }
    // messagesById preserves insertion order, which matches the DOM order
    // messages were rendered in, so results come back oldest to newest.
    for (const msg of messagesById.values()) {
      if (msg.deleted || msg.image || msg.video) continue;
      if ((msg.text || "").toLowerCase().includes(q)) {
        searchMatches.push(msg.id);
      }
    }
    if (searchMatches.length === 0) {
      searchCount.textContent = "0/0";
      return;
    }
    // Jump to the most recent match first — that's almost always what
    // someone searching a live chat actually wants.
    searchIndex = searchMatches.length - 1;
    showSearchMatch();
  }

  function showSearchMatch() {
    if (searchIndex < 0 || searchMatches.length === 0) return;
    searchCount.textContent = `${searchIndex + 1}/${searchMatches.length}`;
    jumpToMessage(searchMatches[searchIndex]);
  }

  searchBtn.addEventListener("click", () => {
    searchBar.classList.remove("hidden");
    searchBtn.classList.add("active");
    searchInput.focus();
  });

  searchClose.addEventListener("click", () => {
    searchBar.classList.add("hidden");
    searchBtn.classList.remove("active");
    searchInput.value = "";
    searchMatches = [];
    searchIndex = -1;
    searchCount.textContent = "";
  });

  searchInput.addEventListener("input", () => runSearch(searchInput.value));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) searchPrev.click();
      else searchNext.click();
    }
    if (e.key === "Escape") searchClose.click();
  });

  searchPrev.addEventListener("click", () => {
    if (searchMatches.length === 0) return;
    searchIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    showSearchMatch();
  });

  searchNext.addEventListener("click", () => {
    if (searchMatches.length === 0) return;
    searchIndex = (searchIndex + 1) % searchMatches.length;
    showSearchMatch();
  });

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
    const quote = e.target.closest("[data-jump-to]");
    if (quote) {
      jumpToMessage(quote.dataset.jumpTo);
      return;
    }

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
      socket.emit("react", { conversationId: currentConversationId, id: chip.dataset.reactId, emoji: chip.dataset.emoji });
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

  // Messenger-style read receipts: for each other member, find the newest
  // message I sent that they've read, and drop a small marker under it.
  // Only the single newest read message per member gets a marker — as new
  // messages get read the marker moves forward, it isn't stamped on every
  // bubble along the way.
  function renderReadReceipts() {
    messageList.querySelectorAll(".read-receipt").forEach((el) => el.remove());
    if (!currentConversationId || currentReads.size === 0) return;

    const conv = conversationsMeta.get(currentConversationId);
    if (!conv) return;
    const others = otherMembers(conv);
    if (others.length === 0) return;

    // Own messages, oldest -> newest, so we can find the newest one at/under
    // each reader's read time.
    const ownMessages = Array.from(messagesById.values())
      .filter((m) => m.name === myName && !m.deleted)
      .sort((a, b) => a.time - b.time);
    if (ownMessages.length === 0) return;

    const readersByMessageId = new Map(); // messageId -> [names]
    others.forEach((otherName) => {
      const read = currentReads.get(otherName);
      if (!read) return;
      let latest = null;
      for (const m of ownMessages) {
        if (m.time <= read.time) latest = m;
        else break;
      }
      if (!latest) return;
      const list = readersByMessageId.get(latest.id) || [];
      list.push(otherName);
      readersByMessageId.set(latest.id, list);
    });

    readersByMessageId.forEach((names, msgId) => {
      const row = messageList.querySelector(`.msg-row[data-id="${msgId}"]`);
      const wrap = row && row.querySelector(".msg-bubble-wrap");
      const col = wrap && wrap.closest(".msg-col");
      if (!wrap || !col) return;
      const marker = document.createElement("div");
      marker.className = "read-receipt";
      if (conv.type === "group" || conv.type === "room") {
        marker.innerHTML = names
          .slice(0, 3)
          .map((n) => `<span class="read-receipt-avatar" style="background:${avatarBgForName(n)}">${avatarInnerHtml(n)}</span>`)
          .join("");
        if (names.length > 3) marker.innerHTML += `<span class="read-receipt-more">+${names.length - 3}</span>`;
      } else {
        marker.innerHTML = `<span class="read-receipt-avatar" style="background:${avatarBgForName(names[0])}">${avatarInnerHtml(names[0])}</span>`;
      }
      // Placed right after the wrap, in normal flow — never overlaps
      // the reaction row (which is absolutely positioned) or the next
      // message bubble below it.
      wrap.insertAdjacentElement("afterend", marker);
    });
  }

  const lightboxDownload = document.getElementById("lightbox-download");

  function openLightbox(src) {
    lightboxImg.src = src;
    if (lightboxDownload) lightboxDownload.href = src;
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    closeOverlay(lightbox, () => {
      lightboxImg.src = "";
    });
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target.closest("#lightbox-download")) return; // let the download link work
    closeLightbox();
  });

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
    function report(step, ok, error) {
      fetch("/api/push-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, ok, error: error ? String(error && error.message || error) : undefined, name }),
      }).catch(() => {});
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      report("browser-support", false, "serviceWorker or PushManager not available");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      report("service-worker-ready", true);

      // Ask permission on a user gesture (join button click covers this)
      const permission = await Notification.requestPermission();
      report("notification-permission", permission === "granted", permission);
      if (permission !== "granted") return;

      const keyRes = await fetch("/api/vapid-public-key");
      const { key } = await keyRes.json();
      report("fetched-vapid-key", !!key, key ? undefined : "empty key response");

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }
      report("push-subscription-created", !!subscription);

      const subRes = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subscription }),
      });
      report("posted-subscription-to-server", subRes.ok, subRes.ok ? undefined : `HTTP ${subRes.status}`);
    } catch (err) {
      console.error("Push setup failed:", err);
      report("push-setup-exception", false, err);
    }
  }

  function showJoinError(message) {
    localStorage.removeItem("chatName");
    localStorage.removeItem("chatPassword");
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    hideLoadingScreen();
    joinScreen.classList.remove("hidden");
    joinError.textContent = message;
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.focus();
    }
  }

  function connect(name, password) {
    socket = io({ reconnectionAttempts: Infinity });
    connectionDot.classList.add("connecting");

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

      // Give a clear "connected" beat instead of just vanishing the
      // loading screen the instant the socket connects — the pulse stops,
      // the icon flashes brighter, and the text confirms it before we hide.
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) loadingScreen.classList.add("connected");
      if (loadingText) loadingText.textContent = "Connected!";
      setTimeout(hideLoadingScreen, 300);

      connectionDot.classList.remove("connecting", "offline");
      connectionDot.classList.add("online");
      socket.emit("join", { name, password }, (res) => {
        if (!res || res.error) {
          const message =
            res && res.error === "wrong-password"
              ? "Wrong password for that name."
              : res && res.error === "password-required"
              ? `Password needs to be at least ${res.minLength || 4} characters.`
              : "Couldn't join. Try again.";
          showJoinError(message);
          return;
        }
        myName = res.name;
        directory = res.directory || [];
        avatars.clear();
        Object.entries(res.avatars || {}).forEach(([n, url]) => avatars.set(n, url));
        refreshMyAvatarButton();
        conversationsMeta.clear();
        (res.conversations || []).forEach((c) => conversationsMeta.set(c.id, Object.assign({ unread: 0 }, c)));

        joinScreen.classList.add("hidden");

        if (currentConversationId && conversationsMeta.has(currentConversationId)) {
          const reopenId = currentConversationId;
          conversationsScreen.classList.add("hidden");
          openConversationById(reopenId);
        } else {
          showConversationsScreen();
        }

        setupPush(myName);
      });
    });

    socket.on("disconnect", () => {
      connectionDot.classList.remove("online");
      connectionDot.classList.add("offline");
      presenceLine.textContent = "reconnecting…";
    });

    socket.io.on("reconnect_attempt", () => {
      connectionDot.classList.remove("offline");
      connectionDot.classList.add("connecting");
    });

    socket.on("message", (msg) => {
      const isMe = msg.name === myName;
      const isOpen = msg.conversationId === currentConversationId && chatScreen.classList.contains("hidden") === false;

      // Keep the conversation list preview/ordering in sync no matter what's open.
      const meta = conversationsMeta.get(msg.conversationId) || { id: msg.conversationId, type: "dm", members: [] };
      meta.lastMessage = {
        name: msg.name,
        text: msg.deleted ? "" : msg.text,
        image: !msg.deleted && !!msg.image,
        video: !msg.deleted && !!msg.video,
        deleted: !!msg.deleted,
        time: msg.time,
      };
      upsertConversation(meta, { bumpUnread: !isMe && !isOpen });

      if (isOpen) {
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

        if (!isMe) playPop(wasNearBottom ? 720 : 520);
        if (!isMe && !document.hidden) {
          socket.emit("mark-read", { conversationId: msg.conversationId, messageId: msg.id });
        }
      } else if (!isMe) {
        playPop(420);
      }

      if (!isMe && document.hidden) {
        if (navigator.vibrate) navigator.vibrate(20);
        unreadTitleCount += 1;
        document.title = `(${unreadTitleCount}) ${baseTitle}`;
      }
    });

    socket.on("edited", ({ conversationId, id, text, edited }) => {
      const meta = conversationsMeta.get(conversationId);
      if (meta && meta.lastMessage) {
        // best-effort preview sync; harmless if it wasn't the last message
      }
      if (conversationId !== currentConversationId) return;
      const msg = messagesById.get(id);
      if (!msg) return;
      msg.text = text;
      msg.edited = edited;
      updateRowInPlace(msg);
    });

    socket.on("deleted", ({ conversationId, id }) => {
      if (conversationId !== currentConversationId) return;
      const msg = messagesById.get(id);
      if (!msg) return;
      msg.deleted = true;
      msg.text = "";
      msg.image = null;
      msg.reactions = {};
      updateRowInPlace(msg);
    });

    socket.on("reaction", ({ conversationId, id, reactions }) => {
      if (conversationId !== currentConversationId) return;
      updateReactionsUI(id, reactions);
      if (navigator.vibrate) navigator.vibrate(8);
    });

    socket.on("conversation-created", (conv) => {
      upsertConversation(conv);
    });

    // Fired when someone adds people to a dm/group (a dm may have just
    // become a group). Refresh the list entry, and if it's the chat
    // currently open, refresh the header too since the title/type/member
    // count may have changed.
    socket.on("conversation-updated", (conv) => {
      upsertConversation(conv);
      if (conv.id !== currentConversationId) return;
      chatTitle.textContent = conversationTitle(conv);
      renderChatTitleAvatar(conv);
      updateAddPeopleVisibility(conv);
      updateCallButtonVisibility(conv);
      applyWallpaper(conv.wallpaper);
      if (conv.type === "room") {
        presenceLine.textContent = "public room";
      } else if (conv.type === "group") {
        presenceLine.textContent = `${(conv.members || []).length} people`;
      } else {
        updateDmPresence(conv);
      }
    });

    // Someone read up to a point in the open conversation — advance their
    // marker and redraw the "seen" indicator.
    socket.on("read-receipt", ({ conversationId, name, messageId, time }) => {
      if (conversationId !== currentConversationId) return;
      const existing = currentReads.get(name);
      if (existing && existing.time >= time) return;
      currentReads.set(name, { messageId, time });
      renderReadReceipts();
    });

    socket.on("avatar-updated", ({ name, avatar } = {}) => {
      if (!name || !avatar) return;
      avatars.set(name, avatar);
      if (name === myName) refreshMyAvatarButton();
      renderConversationList();
      if (currentConversationId) {
        const conv = conversationsMeta.get(currentConversationId);
        if (conv) renderChatTitleAvatar(conv);
        messageList.querySelectorAll(".msg-row").forEach((row) => {
          if (row.dataset.sender !== name) return;
          const el = row.querySelector(".msg-avatar");
          if (el) el.innerHTML = avatarInnerHtml(name);
        });
        renderReadReceipts();
      }
      if (!newChatModal.classList.contains("hidden")) renderMemberList();
      if (!addMembersModal.classList.contains("hidden")) renderAddMembersList();
      if (!viewMembersModal.classList.contains("hidden")) renderViewMembersList();
    });

    socket.on("directory", (names) => {
      directory = (names || []).filter((n) => n !== myName);
      if (!newChatModal.classList.contains("hidden")) renderMemberList();
    });

    socket.on("presence", (names) => {
      onlineNames = names || [];
      updatePresence(names);
      updateConvPresenceLine();
      if (currentConversationId) {
        const conv = conversationsMeta.get(currentConversationId);
        if (conv && conv.type === "dm") updateDmPresence(conv);
      }
      if (!conversationsScreen.classList.contains("hidden")) renderConversationList();
    });

    socket.on("typing", ({ conversationId, name, isTyping }) => {
      if (conversationId !== currentConversationId) return;
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

    // ----- Video call signaling -----

    socket.on("call-incoming", ({ callId, conversationId, from, callType } = {}) => {
      if (currentCall) {
        // Already ringing/dialing/on a call — auto-decline instead of
        // showing a second incoming-call screen on top of this one.
        socket.emit("call-decline", { callId });
        return;
      }
      currentCall = { callId, conversationId, peerName: from, role: "callee", pc: null, localStream: null };
      showIncomingCallUI(from);
    });

    socket.on("call-accepted", async ({ callId } = {}) => {
      if (!currentCall || currentCall.callId !== callId || currentCall.role !== "caller") return;
      callStatusLine.textContent = "Connecting…";
      try {
        const stream = await ensureLocalStream(currentCall);
        if (!currentCall || currentCall.callId !== callId) return; // call ended meanwhile
        currentCall.localStream = stream;
        const pc = createPeerConnection(callId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        currentCall.pc = pc;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call-signal", { callId, signal: { type: "offer", sdp: offer } });
      } catch (err) {
        console.error("Failed to start call after accept:", err);
        showCallToast("Couldn't start the call.");
        endCall(true);
      }
    });

    socket.on("call-declined", ({ callId } = {}) => {
      if (!currentCall || currentCall.callId !== callId) return;
      showCallToast(`${currentCall.peerName} declined the call.`);
      endCall(false);
    });

    socket.on("call-cancelled", ({ callId } = {}) => {
      if (!currentCall || currentCall.callId !== callId) return;
      hideIncomingCallUI();
      currentCall = null;
    });

    socket.on("call-signal", async ({ callId, signal } = {}) => {
      if (!currentCall || currentCall.callId !== callId || !currentCall.pc || !signal) return;
      const pc = currentCall.pc;
      try {
        if (signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("call-signal", { callId, signal: { type: "answer", sdp: answer } });
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === "ice-candidate" && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error("call-signal handling failed:", err);
      }
    });

    socket.on("call-ended", ({ callId } = {}) => {
      if (!currentCall || currentCall.callId !== callId) return;
      showCallToast("Call ended.");
      endCall(false);
    });
  }

  function send() {
    const text = messageInput.value.trim();
    if (!text || !socket || !currentConversationId) return;

    if (editingId) {
      socket.emit("edit", { conversationId: currentConversationId, id: editingId, text });
      cancelEdit();
      if (navigator.vibrate) navigator.vibrate(10);
      return;
    }

    const payload = { conversationId: currentConversationId, text };
    if (replyTarget) {
      payload.replyTo = { id: replyTarget.id };
    }
    socket.emit("message", payload);
    messageInput.value = "";
    autosize();
    socket.emit("typing", { conversationId: currentConversationId, isTyping: false });
    sendBtn.classList.add("pulsing");
    setTimeout(() => sendBtn.classList.remove("pulsing"), 360);
    if (navigator.vibrate) navigator.vibrate(10);
    clearReplyTarget();
  }

  const AVATAR_DIMENSION = 320;
  const AVATAR_QUALITY = 0.85;

  // Profile pictures get a center-cropped square (not just a resize) so
  // they always fill the circular avatar cleanly instead of looking squished.
  function compressAvatarImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not decode image"));
        img.onload = () => {
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = AVATAR_DIMENSION;
          canvas.height = AVATAR_DIMENSION;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_DIMENSION, AVATAR_DIMENSION);
          resolve(canvas.toDataURL("image/jpeg", AVATAR_QUALITY));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
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
    if (!socket || !file || !currentConversationId) return;
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
      const payload = { conversationId: currentConversationId, image: dataUrl };
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

  // --- Video compression (only kicks in above VIDEO_COMPRESS_THRESHOLD_BYTES) ---

  let ffmpegInstance = null;

  function getVideoDuration(file) {
    return new Promise((resolve) => {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      const url = URL.createObjectURL(file);
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(videoEl.duration && isFinite(videoEl.duration) ? videoEl.duration : 0);
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0); // fall back to a safe guess in compressVideo if this fails
      };
      videoEl.src = url;
    });
  }

  async function getFFmpeg() {
    if (ffmpegInstance) return ffmpegInstance;
    const { FFmpeg } = await import("https://esm.sh/@ffmpeg/ffmpeg@0.12.10");
    const { toBlobURL } = await import("https://esm.sh/@ffmpeg/util@0.12.1");
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  }

  // Primary compressor: ffmpeg.wasm. Loads external CDN scripts, so it can be
  // blocked by some in-app WebViews — compressVideo() falls back if this throws.
  async function compressVideoFfmpeg(file, targetBytes, onProgress) {
    const { fetchFile } = await import("https://esm.sh/@ffmpeg/util@0.12.1");
    const ffmpeg = await getFFmpeg();

    const duration = (await getVideoDuration(file)) || 30; // safe guess if metadata read fails
    const AUDIO_KBPS = 96;
    const MIN_VIDEO_KBPS = 150; // floor so long clips don't turn to mush
    let videoKbps = Math.floor((targetBytes * 8) / duration / 1000) - AUDIO_KBPS;
    videoKbps = Math.max(videoKbps, MIN_VIDEO_KBPS);

    const inputName = "input" + (file.name.match(/\.\w+$/)?.[0] || ".mp4");
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    let progressHandler;
    if (onProgress) {
      progressHandler = ({ progress }) => onProgress(Math.min(Math.max(progress, 0), 1));
      ffmpeg.on("progress", progressHandler);
    }

    try {
      await ffmpeg.exec([
        "-i", inputName,
        "-vf", "scale='min(1280,iw)':-2",
        "-b:v", `${videoKbps}k`,
        "-b:a", `${AUDIO_KBPS}k`,
        "-preset", "veryfast",
        "-movflags", "+faststart",
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      return new Blob([data.buffer], { type: "video/mp4" });
    } finally {
      if (progressHandler) ffmpeg.off("progress", progressHandler);
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }

  // Fallback compressor: uses only built-in browser APIs (no CDN/wasm), for
  // environments (some in-app WebViews) that block loading external scripts.
  function compressVideoNative(file, targetBytes, onProgress) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.playsInline = true;
      // Muted (not just volume=0) so Chrome's autoplay policy allows play()
      // without a fresh user gesture — captureStream() still records the
      // audio track even though it's silent on the speaker.
      video.muted = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      const cleanup = () => URL.revokeObjectURL(url);

      video.onloadedmetadata = async () => {
        const duration = video.duration && isFinite(video.duration) ? video.duration : 30;

        const captureFn = video.captureStream || video.mozCaptureStream;
        if (!captureFn) {
          cleanup();
          reject(new Error("captureStream not supported on this device"));
          return;
        }
        let stream;
        try {
          stream = captureFn.call(video);
        } catch (e) {
          cleanup();
          reject(e);
          return;
        }

        let mimeType = "video/webm;codecs=vp9,opus";
        if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm;codecs=vp8,opus";
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
        if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
          cleanup();
          reject(new Error("MediaRecorder not supported on this device"));
          return;
        }

        const targetBitrate = Math.max(Math.floor((targetBytes * 8) / duration), 200000);
        let recorder;
        try {
          recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: targetBitrate });
        } catch (e) {
          cleanup();
          reject(e);
          return;
        }

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onerror = (e) => {
          cleanup();
          reject(e.error || new Error("Recorder error"));
        };
        recorder.onstop = () => {
          cleanup();
          // Use the base mime type (no codecs param) for the Blob/data URL.
          // mimeType (e.g. "video/webm;codecs=vp9,opus") is fine for
          // MediaRecorder, but its embedded comma corrupts a data: URL —
          // readAsDataURL splits on the first comma, so "vp9,opus" breaks
          // the encoding right in the middle of the header.
          const blobType = mimeType.split(";")[0];
          resolve(new Blob(chunks, { type: blobType }));
        };

        video.ontimeupdate = () => {
          if (onProgress) onProgress(Math.min(video.currentTime / duration, 1));
        };
        video.onended = () => recorder.stop();

        try {
          recorder.start(250);
          await video.play();
        } catch (e) {
          cleanup();
          reject(e);
        }
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Could not load video for compression"));
      };
    });
  }

  // Tries ffmpeg.wasm first; if that fails to load/run (e.g. blocked CDN in
  // some app WebViews), falls back to the native MediaRecorder method.
  async function compressVideo(file, targetBytes, onProgress) {
    try {
      return await compressVideoFfmpeg(file, targetBytes, onProgress);
    } catch (ffmpegErr) {
      console.error("ffmpeg.wasm compression failed, falling back to native:", ffmpegErr);
      return await compressVideoNative(file, targetBytes, onProgress);
    }
  }

  async function sendVideo(file) {
    if (!socket || !file || !currentConversationId) return;
    if (!file.type.startsWith("video/")) return;
    if (file.size > VIDEO_HARD_MAX_SOURCE_BYTES) {
      renderSystem("That video is too large to send, even with compression.");
      return;
    }

    const needsCompression = file.size > VIDEO_COMPRESS_THRESHOLD_BYTES;
    attachBtn.disabled = true;
    const status = renderProgressStatus(needsCompression ? "Compressing video… 0%" : "Sending video…");
    if (!needsCompression) status.setProgress(1);
    await nextPaint(); // make sure the status line actually shows before we start work
    const minVisible = wait(500);
    try {
      let outFile = file;
      if (needsCompression) {
        outFile = await compressVideo(file, VIDEO_TARGET_COMPRESSED_BYTES, (progress) => {
          status.setText(`Compressing video… ${Math.round(progress * 100)}%`);
          status.setProgress(progress);
        });
        status.setText("Sending video…");
      }
      const dataUrl = await readFileAsDataUrl(outFile);
      const payload = { conversationId: currentConversationId, video: dataUrl };
      if (replyTarget) {
        payload.replyTo = { id: replyTarget.id };
      }
      await minVisible;
      socket.emit("message", payload);
      clearReplyTarget();
    } catch (err) {
      console.error("Video compression/send failed:", err);
      renderSystem(
        needsCompression
          ? "Couldn't compress that video — try a shorter clip."
          : "Couldn't send that video — try a different one."
      );
    } finally {
      attachBtn.disabled = false;
      status.remove();
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
    if (!socket || editingId || !currentConversationId) return;
    socket.emit("typing", { conversationId: currentConversationId, isTyping: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(
      () => socket.emit("typing", { conversationId: currentConversationId, isTyping: false }),
      1500
    );
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

  // ---------- Features tab: accordion cards ----------

  if (featuresScreen) {
    featuresScreen.querySelectorAll(".feature-card-head").forEach((head) => {
      head.addEventListener("click", () => {
        const card = head.closest(".feature-card");
        const body = document.getElementById(`feature-body-${head.dataset.feature}`);
        if (!card || !body) return;
        const isOpen = !body.classList.contains("hidden");
        // Accordion: close any other open card first.
        featuresScreen.querySelectorAll(".feature-card-body").forEach((b) => {
          if (b !== body) b.classList.add("hidden");
        });
        featuresScreen.querySelectorAll(".feature-card").forEach((c) => {
          if (c !== card) c.classList.remove("expanded");
        });
        body.classList.toggle("hidden", isOpen);
        card.classList.toggle("expanded", !isOpen);
      });
    });
  }

  // ---------- Shared "send to a chat" picker (Quick Poll + Photo Enhancer) ----------

  function closeChatPicker() {
    closeOverlay(chatPickerModal);
  }
  chatPickerClose && chatPickerClose.addEventListener("click", closeChatPicker);
  chatPickerModal &&
    chatPickerModal.addEventListener("click", (e) => {
      if (e.target === chatPickerModal) closeChatPicker();
    });

  // Opens the chat list with a given title; onPick(conv) fires when the
  // person taps a conversation, then the picker closes itself.
  function openChatPicker(title, onPick) {
    if (!chatPickerModal || !chatPickerList) return;
    chatPickerTitle.textContent = title;
    const list = sortedConversations();
    chatPickerList.innerHTML = "";
    if (list.length === 0) {
      chatPickerList.innerHTML = `<p class="new-chat-hint">Start a chat first from the Chats tab.</p>`;
    } else {
      list.forEach((conv) => {
        const row = document.createElement("div");
        row.className = "member-row";
        row.innerHTML = `
          ${conversationAvatarHtml(conv)}
          <p class="member-row-name">${escapeHtml(conversationTitle(conv))}</p>
        `;
        row.addEventListener("click", () => {
          closeChatPicker();
          onPick(conv);
        });
        chatPickerList.appendChild(row);
      });
    }
    chatPickerModal.classList.remove("hidden");
  }

  // ---------- Features tab: Quick Poll (sends a formatted message to a chosen chat) ----------

  function updatePollSendState() {
    if (!pollSendBtn) return;
    const question = pollQuestionInput.value.trim();
    const filled = pollOptionInputs.map((i) => i.value.trim()).filter(Boolean);
    pollSendBtn.disabled = !(question && filled.length >= 2);
  }

  pollQuestionInput && pollQuestionInput.addEventListener("input", updatePollSendState);
  pollOptionInputs.forEach((input) => input && input.addEventListener("input", updatePollSendState));

  function buildPollText() {
    const numberEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
    const question = pollQuestionInput.value.trim();
    const lines = [`🗳️ POLL: ${question}`];
    pollOptionInputs.forEach((input, i) => {
      const val = input.value.trim();
      if (val) lines.push(`${numberEmoji[i]} ${val}`);
    });
    lines.push("Reply with a number to vote!");
    return lines.join("\n");
  }

  pollSendBtn &&
    pollSendBtn.addEventListener("click", () => {
      if (pollSendBtn.disabled || !socket) return;
      openChatPicker("Send poll to…", (conv) => {
        socket.emit("message", { conversationId: conv.id, text: buildPollText() });
        pollQuestionInput.value = "";
        pollOptionInputs.forEach((input) => (input.value = ""));
        updatePollSendState();
        openConversationById(conv.id);
      });
    });

  // ---------- Features tab: Photo Enhancer ----------
  // Fully on-device: auto-levels (contrast/brightness stretch), a gentle
  // saturation lift, and an unsharp-mask sharpen. No photo ever leaves the
  // browser unless the person explicitly taps "Send to chat".

  const ENHANCER_MAX_DIMENSION = 1280;
  const AI_OUTPUT_MAX_DIMENSION = 2200; // let AI output actually be bigger/sharper than input; only capped for file size sanity
  const ENHANCER_JPEG_QUALITY = 0.9;

  let enhancerOriginalImageData = null;
  let enhancerEnhancedImageData = null;
  let enhancerShowingOriginal = false;

  function clamp255(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v;
  }

  // Stretches the tonal range so the darkest pixels go toward black and the
  // brightest go toward white — the single biggest fix for a flat/hazy photo.
  function autoLevels(data) {
    let min = 255,
      max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < min) min = lum;
      if (lum > max) max = lum;
    }
    if (max - min < 20) {
      min = 0;
      max = 255; // already high-contrast — don't over-stretch it
    }
    const range = Math.max(max - min, 1);
    const satFactor = 1.15;
    const brightnessLift = 5;
    for (let i = 0; i < data.length; i += 4) {
      let r = ((data[i] - min) * 255) / range;
      let g = ((data[i + 1] - min) * 255) / range;
      let b = ((data[i + 2] - min) * 255) / range;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor + brightnessLift;
      g = gray + (g - gray) * satFactor + brightnessLift;
      b = gray + (b - gray) * satFactor + brightnessLift;
      data[i] = clamp255(r);
      data[i + 1] = clamp255(g);
      data[i + 2] = clamp255(b);
    }
  }

  // Cheap 3x3 box blur, used as the "unsharp" reference for sharpening.
  function boxBlur(data, w, h) {
    const out = new Uint8ClampedArray(data.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rs = 0,
          gs = 0,
          bs = 0,
          count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const idx = (ny * w + nx) * 4;
            rs += data[idx];
            gs += data[idx + 1];
            bs += data[idx + 2];
            count++;
          }
        }
        const idx = (y * w + x) * 4;
        out[idx] = rs / count;
        out[idx + 1] = gs / count;
        out[idx + 2] = bs / count;
        out[idx + 3] = data[idx + 3];
      }
    }
    return out;
  }

  function unsharpMask(data, w, h, amount = 0.55) {
    const blurred = boxBlur(data, w, h);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp255(data[i] + (data[i] - blurred[i]) * amount);
      data[i + 1] = clamp255(data[i + 1] + (data[i + 1] - blurred[i + 1]) * amount);
      data[i + 2] = clamp255(data[i + 2] + (data[i + 2] - blurred[i + 2]) * amount);
    }
  }

  function resetEnhancerUI() {
    if (enhancerPreviewWrap) enhancerPreviewWrap.classList.add("hidden");
    if (enhancerActions) enhancerActions.classList.add("hidden");
    if (enhancerStatus) enhancerStatus.classList.add("hidden");
    if (enhancerModeNote) enhancerModeNote.classList.add("hidden");
    enhancerOriginalImageData = null;
    enhancerEnhancedImageData = null;
    enhancerShowingOriginal = false;
    if (enhancerCompareBtn) enhancerCompareBtn.textContent = "Hold to compare";
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not decode image"));
        img.onload = () => resolve(img);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode upscaled image"));
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  // ---- AI upscaling (UpscalerJS, free + fully on-device, no API key) ----
  // Loaded via CDN <script> tags in index.html. If those failed (offline,
  // blocked CDN, ad blocker, whatever) window.Upscaler just won't exist and
  // we quietly fall back to the plain auto-levels/sharpen enhancer below —
  // the feature should never hard-fail just because the AI model didn't load.
  let aiUpscaler = null;
  let aiUpscalerFailed = false;

  function getAiUpscaler() {
    if (aiUpscaler || aiUpscalerFailed) return aiUpscaler;
    if (typeof window.Upscaler === "undefined" || typeof window.ESRGANMedium2x === "undefined") {
      aiUpscalerFailed = true;
      return null;
    }
    try {
      aiUpscaler = new window.Upscaler({ model: window.ESRGANMedium2x });
    } catch (e) {
      aiUpscalerFailed = true;
      aiUpscaler = null;
    }
    return aiUpscaler;
  }

  // Runs the actual AI super-resolution model on the image and returns a
  // freshly-loaded <img> of the (typically 2x) result, or null if the model
  // isn't available / errors out, so the caller can fall back gracefully.
  async function aiUpscaleImage(img) {
    if (window.__loadEnhancerLibs) await window.__loadEnhancerLibs();
    const upscaler = getAiUpscaler();
    if (!upscaler) return null;
    try {
      const src = await upscaler.upscale(img, { patchSize: 128, padding: 8 });
      return await loadImageFromSrc(src);
    } catch (e) {
      return null;
    }
  }

  async function runEnhancer(file) {
    if (!file || !file.type.startsWith("image/")) {
      renderSystem("That doesn't look like an image.");
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      renderSystem("That photo is too large — try a smaller one.");
      return;
    }
    resetEnhancerUI();
    enhancerStatus.classList.remove("hidden");
    enhancerStatus.textContent = "Enhancing…";
    await nextPaint();
    try {
      let img = await loadImageFromFile(file);

      // Original (pre-enhance) preview, capped at the normal max dimension.
      let { width: origW, height: origH } = img;
      if (origW > ENHANCER_MAX_DIMENSION || origH > ENHANCER_MAX_DIMENSION) {
        const scale = ENHANCER_MAX_DIMENSION / Math.max(origW, origH);
        origW = Math.round(origW * scale);
        origH = Math.round(origH * scale);
      }
      const originalCanvas = document.createElement("canvas");
      originalCanvas.width = origW;
      originalCanvas.height = origH;
      originalCanvas.getContext("2d").drawImage(img, 0, 0, origW, origH);

      // Feed the AI model the same resolution used for the original preview
      // (already capped at ENHANCER_MAX_DIMENSION). We used to shrink this
      // further to keep inference fast, but that threw away real detail
      // before the model ever saw it — no amount of AI upscaling can recover
      // detail that's already gone, so the result came out blurrier than the
      // source photo. patchSize/padding below already let the model process
      // a full-size image in tiles without blocking the UI, so there's no
      // need for an extra pre-shrink.
      const aiInput = await loadImageFromSrc(originalCanvas.toDataURL());

      await nextPaint();
      const aiResult = await aiUpscaleImage(aiInput);
      const usedAi = !!aiResult;

      let width, height, ctx;
      if (usedAi) {
        // Keep the actual resolution gain from the AI model instead of
        // immediately resizing it back down to match the (smaller) input —
        // that was the real bug: aiResult is ~2x the input, and capping it
        // at ENHANCER_MAX_DIMENSION (the same cap used on the input) scaled
        // it right back down to the original size, so the "enhanced" photo
        // was just the original run through two lossy resampling passes
        // for zero size benefit. This cap is only to keep the file size
        // sane, not to erase the upscale.
        const scale = Math.min(1, AI_OUTPUT_MAX_DIMENSION / Math.max(aiResult.width, aiResult.height));
        width = Math.round(aiResult.width * scale);
        height = Math.round(aiResult.height * scale);
        enhancerCanvas.width = width;
        enhancerCanvas.height = height;
        ctx = enhancerCanvas.getContext("2d");
        ctx.drawImage(aiResult, 0, 0, width, height);
        // A light auto-levels pass on top still helps flat/hazy photos —
        // the AI model sharpens/denoises but doesn't correct exposure.
        const enhanced = ctx.getImageData(0, 0, width, height);
        autoLevels(enhanced.data);
        ctx.putImageData(enhanced, 0, 0);
        enhancerEnhancedImageData = enhanced;
      } else {
        // Fallback: original on-device auto-levels + unsharp mask.
        width = origW;
        height = origH;
        enhancerCanvas.width = width;
        enhancerCanvas.height = height;
        ctx = enhancerCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const enhanced = ctx.getImageData(0, 0, width, height);
        autoLevels(enhanced.data);
        unsharpMask(enhanced.data, width, height);
        enhancerEnhancedImageData = enhanced;
        ctx.putImageData(enhanced, 0, 0);
      }

      // "Original" for the compare view always matches the enhanced canvas
      // size so the before/after swap doesn't jump/resize.
      const cmp = document.createElement("canvas");
      cmp.width = width;
      cmp.height = height;
      cmp.getContext("2d").drawImage(originalCanvas, 0, 0, width, height);
      enhancerOriginalImageData = cmp.getContext("2d").getImageData(0, 0, width, height);

      enhancerShowingOriginal = false;
      enhancerStatus.classList.add("hidden");
      if (enhancerModeNote) {
        enhancerModeNote.textContent = usedAi ? "✨ Enhanced with on-device AI" : "Enhanced (basic mode)";
        enhancerModeNote.classList.remove("hidden");
      }
      enhancerPreviewWrap.classList.remove("hidden");
      enhancerActions.classList.remove("hidden");
    } catch (err) {
      enhancerStatus.classList.add("hidden");
      renderSystem("Couldn't enhance that photo — try a different one.");
    }
  }

  enhancerChooseBtn && enhancerChooseBtn.addEventListener("click", () => enhancerFileInput.click());
  enhancerChooseAgainBtn && enhancerChooseAgainBtn.addEventListener("click", () => enhancerFileInput.click());
  enhancerFileInput &&
    enhancerFileInput.addEventListener("change", () => {
      const file = enhancerFileInput.files && enhancerFileInput.files[0];
      enhancerFileInput.value = "";
      if (file) runEnhancer(file);
    });

  function setEnhancerCompareView(showOriginal) {
    if (!enhancerOriginalImageData || !enhancerEnhancedImageData) return;
    enhancerShowingOriginal = showOriginal;
    const ctx = enhancerCanvas.getContext("2d");
    ctx.putImageData(showOriginal ? enhancerOriginalImageData : enhancerEnhancedImageData, 0, 0);
    enhancerCompareBtn.textContent = showOriginal ? "Before" : "Hold to compare";
  }

  if (enhancerCompareBtn) {
    // Press-and-hold shows the original; releasing snaps back to enhanced.
    const showOrig = () => setEnhancerCompareView(true);
    const showEnhanced = () => setEnhancerCompareView(false);
    enhancerCompareBtn.addEventListener("mousedown", showOrig);
    enhancerCompareBtn.addEventListener("touchstart", showOrig, { passive: true });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) =>
      enhancerCompareBtn.addEventListener(evt, showEnhanced)
    );
  }

  function enhancedCanvasToDataUrl() {
    return enhancerCanvas.toDataURL("image/jpeg", ENHANCER_JPEG_QUALITY);
  }

  enhancerDownloadBtn &&
    enhancerDownloadBtn.addEventListener("click", () => {
      if (!enhancerEnhancedImageData) return;
      const a = document.createElement("a");
      a.href = enhancedCanvasToDataUrl();
      a.download = "enhanced-photo.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

  enhancerSendBtn &&
    enhancerSendBtn.addEventListener("click", () => {
      if (!enhancerEnhancedImageData || !socket) return;
      const dataUrl = enhancedCanvasToDataUrl();
      openChatPicker("Send enhanced photo to…", (conv) => {
        socket.emit("message", { conversationId: conv.id, image: dataUrl });
        openConversationById(conv.id);
      });
    });

  // ---------- Features tab: Remove Background ----------
  // Fully on-device: BodyPix (TensorFlow.js) segments the main subject in
  // the browser and the background is made transparent. No photo ever
  // leaves the device unless "Send to chat" is tapped.

  const REMOVEBG_MAX_DIMENSION = 1024;

  let removebgResultDataUrl = null;
  let bodyPixNet = null;
  let bodyPixFailed = false;

  async function getBodyPixNet() {
    if (bodyPixNet || bodyPixFailed) return bodyPixNet;
    if (window.__loadEnhancerLibs) await window.__loadEnhancerLibs();
    if (typeof window.bodyPix === "undefined") {
      bodyPixFailed = true;
      return null;
    }
    try {
      bodyPixNet = await window.bodyPix.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      });
    } catch (e) {
      bodyPixFailed = true;
      bodyPixNet = null;
    }
    return bodyPixNet;
  }

  function resetRemovebgUI() {
    if (removebgPreviewWrap) removebgPreviewWrap.classList.add("hidden");
    if (removebgActions) removebgActions.classList.add("hidden");
    if (removebgStatus) removebgStatus.classList.add("hidden");
    removebgResultDataUrl = null;
  }

  async function runRemoveBackground(file) {
    if (!file || !file.type.startsWith("image/")) {
      renderSystem("That doesn't look like an image.");
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      renderSystem("That photo is too large — try a smaller one.");
      return;
    }
    resetRemovebgUI();
    removebgStatus.classList.remove("hidden");
    removebgStatus.textContent = "Removing background…";
    await nextPaint();
    try {
      const net = await getBodyPixNet();
      if (!net) {
        removebgStatus.classList.add("hidden");
        renderSystem("Remove Background isn't available right now — try again in a moment.");
        return;
      }

      const img = await loadImageFromFile(file);
      let { width, height } = img;
      if (width > REMOVEBG_MAX_DIMENSION || height > REMOVEBG_MAX_DIMENSION) {
        const scale = REMOVEBG_MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = width;
      srcCanvas.height = height;
      srcCanvas.getContext("2d").drawImage(img, 0, 0, width, height);

      const segmentation = await net.segmentPerson(srcCanvas, {
        internalResolution: "medium",
        segmentationThreshold: 0.7,
      });

      removebgCanvas.width = width;
      removebgCanvas.height = height;
      const ctx = removebgCanvas.getContext("2d");
      ctx.drawImage(srcCanvas, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;
      const mask = segmentation.data;
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 0) data[i * 4 + 3] = 0; // background pixel -> transparent
      }
      ctx.putImageData(imageData, 0, 0);

      removebgResultDataUrl = removebgCanvas.toDataURL("image/png");
      removebgStatus.classList.add("hidden");
      removebgPreviewWrap.classList.remove("hidden");
      removebgActions.classList.remove("hidden");
    } catch (err) {
      removebgStatus.classList.add("hidden");
      renderSystem("Couldn't remove the background from that photo — try a different one.");
    }
  }

  removebgChooseBtn && removebgChooseBtn.addEventListener("click", () => removebgFileInput.click());
  removebgChooseAgainBtn && removebgChooseAgainBtn.addEventListener("click", () => removebgFileInput.click());
  removebgFileInput &&
    removebgFileInput.addEventListener("change", () => {
      const file = removebgFileInput.files && removebgFileInput.files[0];
      removebgFileInput.value = "";
      if (file) runRemoveBackground(file);
    });

  removebgDownloadBtn &&
    removebgDownloadBtn.addEventListener("click", () => {
      if (!removebgResultDataUrl) return;
      const a = document.createElement("a");
      a.href = removebgResultDataUrl;
      a.download = "no-background.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

  removebgSendBtn &&
    removebgSendBtn.addEventListener("click", () => {
      if (!removebgResultDataUrl || !socket) return;
      openChatPicker("Send photo to…", (conv) => {
        socket.emit("message", { conversationId: conv.id, image: removebgResultDataUrl });
        openConversationById(conv.id);
      });
    });

  // ---------- Features tab: personal to-do list (stored on this device) ----------

  function loadTodos() {
    try {
      const raw = localStorage.getItem("featuresTodo");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  let todos = loadTodos();
  function saveTodos() {
    localStorage.setItem("featuresTodo", JSON.stringify(todos));
  }

  function renderTodos() {
    if (!todoListEl) return;
    todoListEl.innerHTML = "";
    todoEmpty.classList.toggle("hidden", todos.length > 0);
    todos.forEach((item) => {
      const li = document.createElement("li");
      li.className = `todo-item${item.done ? " done" : ""}`;
      li.innerHTML = `
        <button class="todo-check" type="button" aria-label="Toggle done">${item.done ? "✓" : ""}</button>
        <span class="todo-text">${escapeHtml(item.text)}</span>
        <button class="todo-delete" type="button" aria-label="Delete task">✕</button>
      `;
      li.querySelector(".todo-check").addEventListener("click", () => {
        item.done = !item.done;
        saveTodos();
        renderTodos();
      });
      li.querySelector(".todo-delete").addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== item.id);
        saveTodos();
        renderTodos();
      });
      todoListEl.appendChild(li);
    });
  }
  renderTodos();

  function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    todos.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, done: false });
    todoInput.value = "";
    saveTodos();
    renderTodos();
  }
  todoAddBtn && todoAddBtn.addEventListener("click", addTodo);
  todoInput &&
    todoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTodo();
    });

  // ---------- Menu tab: log out ----------

  function showLogoutModal() {
    logoutModal && logoutModal.classList.remove("hidden");
  }
  function hideLogoutModal() {
    closeOverlay(logoutModal);
  }

  menuLogoutBtn && menuLogoutBtn.addEventListener("click", showLogoutModal);
  logoutCancelBtn && logoutCancelBtn.addEventListener("click", hideLogoutModal);
  logoutModal &&
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) hideLogoutModal();
    });
  logoutConfirmBtn &&
    logoutConfirmBtn.addEventListener("click", () => {
      localStorage.removeItem("chatName");
      localStorage.removeItem("chatPassword");
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      location.reload();
    });

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
    closeOverlay(exitModal);
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
    const password = passwordInput ? passwordInput.value : "";
    if (!name) {
      joinError.textContent = "Enter a name to continue.";
      return;
    }
    if (password.length < 4) {
      joinError.textContent = "Password needs to be at least 4 characters.";
      return;
    }

    joinError.textContent = "";
    localStorage.setItem("chatName", name);
    localStorage.setItem("chatPassword", password);

    joinScreen.classList.add("hidden");
    connect(name, password);
  }

  joinBtn.addEventListener("click", doJoin);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") passwordInput && passwordInput.focus();
  });
  passwordInput &&
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doJoin();
    });

  renderConversationSkeleton();

  const savedName = localStorage.getItem("chatName");
  const savedPassword = localStorage.getItem("chatPassword");

  if (savedName && savedPassword) {
    nameInput.value = savedName;
    if (passwordInput) passwordInput.value = savedPassword;
    joinScreen.classList.add("hidden");
    connect(savedName, savedPassword);
  } else {
    if (savedName) nameInput.value = savedName;
    (passwordInput || nameInput).focus();
    // Let the loading screen actually paint and show briefly on fresh visits,
    // instead of hiding it in the same tick (which skipped it entirely).
    setTimeout(hideLoadingScreen, 900);
  }
})();
