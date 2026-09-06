const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const WebsocketServer = require("./webSocketServer");
const requestLogger = require("./middleware/requestLogger");
const { logger } = require("./utils/logger");

// 根据 NODE_ENV 加载 server 目录下的环境文件，避免启动目录影响配置读取。
const environment = process.env.NODE_ENV || "development";
const envPath = path.join(__dirname, `.env.${environment}`);
require("dotenv").config({ path: envPath });

const app = express();
app.use(cors());
app.use(requestLogger);
app.use(express.json({ limit: "50mb" }));
//解析客户端发送的 URL 编码格式的请求体数据，将其转换为 Javascript 对象，并将其赋值给 req.body
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const server = http.createServer(app);
//确保 WebSocket 服务器和 HTTP 服务器使用同一个实例
const wsServer = new WebsocketServer(server);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("database.connected"))
  .catch((error) => logger.error("database.connection_failed", { error }));

app.use("/api/test", require("./routes/health"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/annotations", require("./routes/annotations"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/summaries", require("./routes/summaries"));
app.use("/api/learning", require("./agent").router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info("server.started", { port: Number(PORT) });
});
