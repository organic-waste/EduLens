
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

/* 测试接口 */
app.get('/api/test',(req, res)=>{
    res.json({
        message: '后端服务运行成功',
        timestamp: new Date().toISOString()
    });
})

app.get('/api/health',(req, res)=>{
    res.json({
        status: 'ok'
    });
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log(`后端服务运行：http://localhost:${PORT}`);
})