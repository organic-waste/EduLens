<div align="right">
  <a href="../README.md">中文</a> | <a href="README.en.md">English</a>
</div>
<p align="center" style="display: flex; align-items: center; justify-content: center; gap: 12px;margin-right:40px;">
  <img src="../assets/icon.png" alt="EduLens Logo" width="128" height="128">
  <img src="../assets/title.png" alt="EduLens Title" height="128">
</p>


## 📖 Overview

EduLens is an open-source Chrome extension focused on web annotation and AI-assisted learning.

Without switching apps, you can annotate web pages, collaborate in real time, and use a personal AI assistant to understand, retain, and review what you learn.

- **Website (intro)**: <https://edu-lens.netlify.app/>          <-- 👋 Check the latest highlights and videos here
- **Chrome Web Store**: <https://chromewebstore.google.com/detail/jnncboomobahpjpkkhjoekacjogmphhc>

![demo](../assets/example.png)

---

## ✨ Key Features

- 🎨 **Web annotation tools** – Freehand drawing, box notes, bookmarks, images, and more
- 👥 **Team collaboration** – Multi-user rooms keep annotations synchronized in real time
- 🤖 **AI learning assistant** – Multi-turn Q&A grounded in web content and personal knowledge
- 🔗 **Traceable summaries** – Verifiable citations with precise jumps back to the source page
- 🧠 **Personal knowledge base** – RAG retrieval with learning-state-aware ranking
- 🔁 **Spaced review** – Active-recall cards evaluate answers and update review intervals
- 📸 **Screenshots and focus** – DOM, region, and scrolling captures plus reading aids
- 💾 **Local + cloud sync** – Data is saved locally and synced to the cloud when signed in
- 🌍 **Internationalization** – Simplified/Traditional Chinese, English, Japanese, German, Spanish

## 🎯 Use Cases

- **Self-study** – Generate AI summaries, ask questions, and review knowledge while reading online
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
  - `CHAT_API_KEY` / `CHAT_BASE_URL` / `CHAT_MODEL`: chat and summary model settings (OpenAI-compatible API)
  - `EMBEDDING_API_KEY` / `EMBEDDING_BASE_URL` / `EMBEDDING_MODEL`: embedding model settings
  - `ATLAS_VECTOR_COLLECTION` / `ATLAS_VECTOR_INDEX` / `ATLAS_VECTOR_DIMENSIONS`: MongoDB Atlas vector search settings

### Website (`website/`)

- Vite + Vue 3: `npm install && npm run dev`; production build `npm run build`
- Deploy as static assets from `website/dist`

---

## 🤝 Feedback & Contributions

- Issues: <https://github.com/organic-waste/edulens/issues>
- Email: o.organic.waste.o@gmail.com / 1473980832@qq.com
