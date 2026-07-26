# Dock — a real-time chat you host yourself

A small self-hosted chat server (Node.js + Socket.io) with a clean black &
white UI, live messages, typing indicators, and Telegram-style emoji
reactions on messages. It's meant to run from Termux on your phone.

## 1. Set up Termux

```bash
pkg update && pkg upgrade
pkg install nodejs
```

Copy this whole `termux-chat` folder onto your phone (e.g. via Termux's
storage access, `git`, or a zip transfer), then:

```bash
cd termux-chat
npm install
npm start
```

You should see:

```
Chat server running: http://localhost:3000
```

## 2. Let friends connect

How they reach it depends on where they are:

**Same Wi-Fi network (easiest)**
Find your phone's local IP:
```bash
ifconfig 2>/dev/null | grep 'inet ' || ip addr show wlan0
```
Share `http://<that-ip>:3000` — anyone on the same Wi-Fi can open it in
their browser.

**Different networks / over the internet**
Your phone doesn't have a public IP by default, so you need a tunnel. The
easiest options:

- **Cloudflare Tunnel** (free, no account strictly required for quick tunnels):
  ```bash
  pkg install cloudflared
  cloudflared tunnel --url http://localhost:3000
  ```
  It prints a public `https://*.trycloudflare.com` URL — share that.

- **ngrok**: install per ngrok's docs, then `ngrok http 3000`.

- **Tailscale**: puts your phone and friends' devices on one private
  network — more setup, but no random public link.

Keep the `npm start` terminal (and the tunnel command, if used) running —
closing Termux or locking the phone aggressively may kill the process.
To keep it alive in the background, look into `termux-wake-lock` and
running the server inside a `tmux` session.

## 3. Notes on how it works

- Everyone who opens the page picks a display name (no accounts/passwords —
  add auth yourself if you need to restrict who can join).
- Messages live in the server's memory: the last 200 messages are replayed
  to anyone who joins, but they're lost if the server restarts. Swap in a
  database (SQLite is easiest) if you want messages to persist.
- It's a single shared room. Multiple rooms would need a small addition to
  `server.js` and `app.js`.
- Double-click / tap a message to react; reactions and counts sync to
  everyone live.

## Project structure

```
termux-chat/
  server.js          Express + Socket.io server, message + reaction logic
  package.json
  public/
    index.html        Markup
    style.css          Monochrome design system
    app.js             Client-side socket logic
```
