const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
// const RoomSyncServer = require("./websocket-server");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
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
