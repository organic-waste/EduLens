<div align="right">
  <a href="README.md">中文</a> | <a href="docs/README.en.md">English</a>
</div>
<p align="center" style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-right:40px;">
  <img src="assets/icon.png" alt="EduLens Logo" width="128" height="128">
  <img src="assets/title.png" alt="EduLens Title" height="128">
</p>

## 📖 项目概览

EduLens 是一款开源的 Chrome 浏览器插件，聚焦网页标注与 AI 助学。

无需切换应用，即可在网页中完成内容标注、团队协同，并借助个人 AI 助手进行理解、知识沉淀与间隔复习。

- **项目介绍 官网**：<https://edu-lens.netlify.app/> $\leftarrow$ 🥰点我查看项目概况
- **Chrome 商店**：<https://chromewebstore.google.com/detail/jnncboomobahpjpkkhjoekacjogmphhc>

![使用示例](./assets/example.png)
![个性对话](./assets/profile.png)

---

## ✨ 核心特点

- 🎨 **网页标注** - 涂鸦绘制、框选批注、书签、图片等多种标注方式
- 👥 **实时协作** - 多人房间系统，支持标注数据实时同步
- 🤖 **AI 助手** - 基于网页内容和个人知识进行多轮问答，并流式展示执行过程
- 🔗 **可追溯摘要** - 将网页选区生成带可验证引用的摘要，支持精确回跳原文
- 🧠 **个人知识库** - 使用 RAG 检索个人沉淀内容，并结合学习状态进行个性化排序
- 🔁 **复习规划** - 生成主动回忆题，评估回答并更新掌握情况与复习间隔
- 📸 **辅助工具** - DOM 截图、区域截图、长屏截图、聚光灯、阅读聚焦与倒计时
- 💾 **双端同步** - 数据自动保存到本地，并支持登录后同步到云端
- 🌍 **多语言支持** - 内置中文简繁体、英文、日语、德语、西班牙语

## 🎯 适用场景

- **个人学习** - 阅读网页内容时生成 AI 摘要、进行知识问答，并通过复习卡片巩固记忆
- **在线教学** - 在线远程授课时进行实时多人标注、网页演示和互动
- **视频制作** - 录制教学视频时 添加可视化标注

---

## 🛠️ 开发者指南

### 环境要求

- Node.js ≥16，npm ≥8

### 插件（extension/）

- 安装：`npm install`
- 开发：`npm run dev`（生成开发构建并监听变更），在 `chrome://extensions` 选择 `extension/dist` 载入
- 打包：`npm run build`
- 结构：入口/源码位于 `extension/src`，输出在 `extension/dist`

### 后端（server/）

- 安装：`npm install`
- 本地开发：`NODE_ENV=development npm run dev`
- 生产：`NODE_ENV=production npm start`
- 依赖 MongoDB 和 WebSocket；需要的环境变量（按 `NODE_ENV` 读取 `.env.<env>`）：
  - `MONGODB_URI`：MongoDB 连接串
  - `JWT_SECRET`：JWT 密钥
  - `JWT_EXPIRES_IN`：令牌有效期（如 `7d`）
  - `PORT`（可选，默认 3000）
  - `CHAT_API_KEY` / `CHAT_BASE_URL` / `CHAT_MODEL`：AI 对话与摘要模型配置（兼容 OpenAI API 格式）
  - `EMBEDDING_API_KEY` / `EMBEDDING_BASE_URL` / `EMBEDDING_MODEL`：向量模型配置
  - `ATLAS_VECTOR_COLLECTION` / `ATLAS_VECTOR_INDEX` / `ATLAS_VECTOR_DIMENSIONS`：MongoDB Atlas 向量检索配置

### 官网（website/）

- 基于 Vite + Vue 3：`npm install && npm run dev`；生产构建 `npm run build`
- 可部署到任意静态托管，产物位于 `website/dist`

---

## 🤝 反馈与贡献

- 问题反馈：<https://github.com/organic-waste/edulens/issues>
- 邮箱：o.organic.waste.o@gmail.com / 1473980832@qq.com
