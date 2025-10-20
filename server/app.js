const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
// const RoomSyncServer = require("./websocket-server");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
//解析客户端发送的 URL 编码格式的请求体数据，将其转换为 Javascript 对象，并将其赋值给 req.body
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// const server = http.createServer(app);
// const wsServer = new RoomSyncServer(server);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB连接成功"))
  .catch((error) => console.log("MongoDB连接失败:", error));

app.use("/api/test", require("./routes/tests"));
app.use("/api/auth", require("./routes/users"));
app.use("/api/annotations", require("./routes/annotations"));
app.use("/api/rooms", require("./routes/rooms"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务运行：http://localhost:${PORT}`);
});
