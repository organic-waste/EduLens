const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB连接成功"))
  .catch((error) => console.log("MongoDB连接失败:", error));

app.use("/api/auth", require("./routes/user"));
app.use("/api/annotations", require("./routes/annotations"));
app.use("/api/test", (req, res) => {
  res.json({ message: "API服务正常运行" });
});

/* 测试接口 */
// app.get('/api/test',(req, res)=>{
//     res.json({
//         message: '后端服务运行成功',
//         timestamp: new Date().toISOString()
//     });
// })

// app.get('/api/health',(req, res)=>{
//     res.json({
//         status: 'ok'
//     });
// })

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务运行：http://localhost:${PORT}`);
});
