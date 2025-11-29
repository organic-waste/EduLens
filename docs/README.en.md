<div align="right">
  <a href="../README.md">中文</a> | <a href="README.en.md">English</a>
</div>
<p align="center" style="display: flex; align-items: center; justify-content: center; gap: 12px;margin-right:40px;">
  <img src="../assets/icon.png" alt="EduLens Logo" width="128" height="128">
  <img src="../assets/title.png" alt="EduLens Title" height="128">
</p>

## 📖 Overview

EduLens is an open-source Chrome extension focused on efficient web learning and real-time collaboration.

You can take notes, capture screenshots, stay focused, and present right inside the page—no app switching.

- **Website (intro)**: <https://edu-lens.netlify.app/>          <-- 👋 Check the latest highlights and videos here
- **Chrome Web Store**: <https://chromewebstore.google.com/detail/jnncboomobahpjpkkhjoekacjogmphhc>

---

## ✨ Key Features

- 👥 **Real-time collaboration** – Multi-user rooms keep annotations in sync
- 💾 **Local + cloud sync** – Data is saved both locally and in the cloud
- 🎨 **Rich annotation tools** – Freehand, box notes, bookmarks, images, and more
- 📸 **Powerful screenshots** – DOM capture, area capture, scrolling full-page capture
- 🎯 **Focus helpers** – Spotlight (`Alt+S`), reading focus (`Alt+R`), cursor highlight (`Alt+H`), countdown timer
- 🌍 **Internationalization** – Simplified/Traditional Chinese, English, Japanese, German, Spanish

## 🎯 Use Cases

- **Self-study** – Note-taking, highlighting, and focus while reading online
- **Online teaching** – In-page, real-time annotation and interaction without screen sharing
- **Video production** – Add visual callouts while recording tutorials

---

## 🛠️ Developer Guide

### Requirements

- Node.js ≥16, npm ≥8

### Extension (`extension/`)

- Install: `npm install`
- Develop: `npm run dev` (watches and builds); load `extension/dist` via `chrome://extensions`
- Build: `npm run build`
- Structure: source in `extension/src`, output in `extension/dist`

### Server (`server/`)

- Install: `npm install`
- Dev: `NODE_ENV=development npm run dev`
- Prod: `NODE_ENV=production npm start`
- Needs MongoDB + WebSocket; env vars (read `.env.<env>` by `NODE_ENV`):
  - `MONGODB_URI`: MongoDB connection string
  - `JWT_SECRET`: JWT secret
  - `JWT_EXPIRES_IN`: token TTL (e.g., `7d`)
  - `PORT` (optional, default 3000)

### Website (`website/`)

- Vite + Vue 3: `npm install && npm run dev`; production build `npm run build`
- Deploy as static assets from `website/dist`

---

## 🤝 Feedback & Contributions

- Issues: <https://github.com/organic-waste/edulens/issues>
- Email: o.organic.waste.o@gmail.com / 1473980832@qq.com
