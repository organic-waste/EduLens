[TOC]

# EduLens API 文档

---

## 概述

EduLens 使用混合通信模式：
- **HTTP API**：用于用户认证、房间管理和数据持久化
- **WebSocket**：用于实时协作和标注数据同步

**基础 URL**：
- HTTP API: `import.meta.env.VITE_API_URL` (默认: `http://localhost:3000/api`)
- WebSocket: `import.meta.env.VITE_WS_URL` (默认: `ws://localhost:3000`)

---

## 认证机制

### JWT Token 认证

所有需要认证的 HTTP 请求都需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <token>
```

Token 在用户登录或注册成功后返回，客户端需要：
1. 存储在 `chrome.storage.local` 中（键名：`cloudToken`）
2. 每次请求时添加到 Authorization 头部
3. WebSocket 连接建立后通过 `authenticate` 消息发送

**Token 失效处理**：
- HTTP 返回 401 状态码
- WebSocket 返回 `error` 消息
- 客户端自动清除本地认证信息

---

## HTTP API

### 认证相关

#### 1. 用户注册

**接口**: `POST /api/auth/register`

**请求体**:
```json
{
  "username": "string",     // 用户名，必填
  "email": "string",        // 邮箱，必填
  "password": "string"      // 密码，必填
}
```

**成功响应** (201):
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "test_user",
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应** (400):
```json
{
  "status": "error",
  "message": "用户名或邮箱已存在"
}
```

---

#### 2. 用户登录

**接口**: `POST /api/auth/login`

**请求体**:
```json
{
  "email": "string",        // 邮箱，必填
  "password": "string"      // 密码，必填
}
```

**成功响应** (200):
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "test_user",
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应** (401):
```json
{
  "status": "error",
  "message": "邮箱或密码不正确"
}
```

---

#### 3. 验证 Token

**接口**: `GET /api/auth/verify`

**请求头**: 
```http
Authorization: Bearer <token>
```

**成功响应** (200):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "test_user",
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应** (401):
```json
{
  "status": "error",
  "message": "Token无效或者已过期"
}
```

---

### 房间管理

#### 1. 获取用户房间列表

**接口**: `GET /api/rooms/my-rooms`

**需要认证**: ✅

**成功响应** (200):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "我的个人空间",
      "description": "默认个人工作区",
      "owner": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "test_user",
        "email": "test@example.com"
      },
      "members": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "username": "test_user",
          "email": "test@example.com"
        }
      ],
      "shareCode": "ABC123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**说明**:
- 返回用户作为所有者或成员的所有房间
- 按更新时间倒序排列

---

#### 2. 创建房间

**接口**: `POST /api/rooms/create`

**需要认证**: ✅

**请求体**:
```json
{
  "name": "string",           // 房间名称，必填
  "description": "string"     // 房间描述，可选
}
```

**成功响应** (201):

```json
{
  "status": "success",
  "data": {
    "room": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "我的学习空间",
      "description": "用于学习笔记",
      "owner": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "test_user",
        "email": "test@example.com"
      },
      "members": ["507f1f77bcf86cd799439012"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### 3. 加入房间

**接口**: `POST /api/rooms/join`

**需要认证**: ✅

**请求体**:
```json
{
  "shareCode": "string"     // 分享码，必填
}
```

**成功响应** (200):
```json
{
  "status": "success",
  "data": {
    "room": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "共享学习空间",
      "description": "团队协作",
      "owner": {
        "_id": "507f1f77bcf86cd799439013",
        "username": "owner_user",
        "email": "owner@example.com"
      },
      "members": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "username": "owner_user",
          "email": "owner@example.com"
        },
        {
          "_id": "507f1f77bcf86cd799439012",
          "username": "test_user",
          "email": "test@example.com"
        }
      ],
      "shareCode": "ABC123"
    }
  }
}
```

**错误响应** (404):
```json
{
  "status": "error",
  "message": "房间不存在或分享码无效"
}
```

---

#### 4. 生成分享码

**接口**: `POST /api/rooms/:roomId/generate-share-code`

**需要认证**: ✅

**路径参数**:
- `roomId`: 房间 ID

**权限要求**: 仅房间所有者可操作

**成功响应** (200):
```json
{
  "status": "success",
  "data": {
    "shareCode": "XYZ789"
  }
}
```

**错误响应** (404):
```json
{
  "status": "error",
  "message": "房间不存在或无权操作"
}
```

---

#### 5. 删除房间

**接口**: `DELETE /api/rooms/:roomId`

**需要认证**: ✅

**路径参数**:
- `roomId`: 房间 ID

**权限要求**: 仅房间所有者可操作

**成功响应** (200):
```json
{
  "status": "success",
  "message": "房间删除成功"
}
```

**说明**:
- 删除房间会同时删除该房间的所有标注数据

---

### 标注数据

#### 1. 同步标注数据

**接口**: `POST /api/annotations/sync`

**需要认证**: ✅

**请求体**:

```json
{
  "roomId": "string",         // 房间 ID，必填
  "pageUrl": "string",        // 页面 URL，必填
  "annotations": {            // 标注数据对象
    "bookmarks": [],          // 书签数组
    "canvas": "",             // 画布数据（Base64）
    "rectangles": [],         // 框选标注数组
    "images": []              // 图片数组
  },
  "version": 0                // 版本号
}
```

**成功响应** (200):
```json
{
  "status": "success",
  "data": {
    "annotation": {
      "_id": "507f1f77bcf86cd799439011",
      "roomId": "507f1f77bcf86cd799439012",
      "pageUrl": "https://example.com/page",
      "annotations": {
        "bookmarks": [],
        "canvas": "",
        "rectangles": [],
        "images": []
      },
      "version": 1,
      "lastModified": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应** (403):
```json
{
  "status": "error",
  "message": "无权访问此房间"
}
```

---

#### 2. 获取指定页面标注

**接口**: `GET /api/annotations/:roomId/:pageUrl`

**需要认证**: ✅

**路径参数**:
- `roomId`: 房间 ID
- `pageUrl`: 页面 URL (需要 URL 编码)

**成功响应** (200):
```json
{
  "status": "success",
  "data": {
    "annotation": {
      "_id": "507f1f77bcf86cd799439011",
      "roomId": "507f1f77bcf86cd799439012",
      "pageUrl": "https://example.com/page",
      "annotations": {
        "bookmarks": [
          {
            "id": "bookmark_001",
            "text": "重要内容",
            "position": { "x": 100, "y": 200 },
            "timestamp": "2024-01-01T00:00:00.000Z"
          }
        ],
        "canvas": "data:image/png;base64,...",
        "rectangles": [
          {
            "id": "rect_001",
            "x": 50,
            "y": 50,
            "width": 200,
            "height": 100,
            "color": "#FF0000"
          }
        ],
        "images": []
      },
      "version": 5
    }
  }
}
```

---

#### 3. 获取房间所有标注

**接口**: `GET /api/annotations/:roomId`

**需要认证**: ✅

**路径参数**:
- `roomId`: 房间 ID

**成功响应** (200):
```json
{
  "status": "success",
  "data": {
    "annotations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "roomId": "507f1f77bcf86cd799439012",
        "pageUrl": "https://example.com/page1",
        "annotations": { /* ... */ },
        "version": 3,
        "updatedAt": "2024-01-02T00:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "roomId": "507f1f77bcf86cd799439012",
        "pageUrl": "https://example.com/page2",
        "annotations": { /* ... */ },
        "version": 1,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**说明**:
- 按更新时间倒序排列

---

### 测试接口

#### 1. 测试连接

**接口**: `GET /api/test/connection`

**需要认证**: ❌

**成功响应** (200):
```json
{
  "message": "后端服务运行成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### 2. 健康检查

**接口**: `GET /api/test/health`

**需要认证**: ❌

**成功响应** (200):
```json
{
  "status": "ok"
}
```

---

## WebSocket API

### 连接与认证

#### 1. 建立连接

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('WebSocket 连接成功');
};
```

**连接特性**:
- 每 30 秒一次心跳检测（ping/pong）
- 自动重连机制（最多 3 次，指数退避）
- 非正常关闭时自动尝试重连

---

#### 2. 认证

**客户端发送**:
```json
{
  "type": "authenticate",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**服务器响应** (成功):
```json
{
  "type": "authentication-success",
  "userId": "507f1f77bcf86cd799439011"
}
```

**服务器响应** (失败):
```json
{
  "type": "error",
  "message": "认证失败"
}
```

**说明**:
- 必须在连接建立后立即进行认证
- 认证成功后，如果客户端已设置房间信息，会自动加入房间

---

### 房间操作

#### 1. 加入房间

**客户端发送**:
```json
{
  "type": "join-room",
  "roomId": "507f1f77bcf86cd799439011",
  "pageUrl": "https://example.com/page"
}
```

**服务器响应** (成功):
```json
{
  "type": "sync",
  "annotations": {
    "bookmarks": [],
    "canvas": "",
    "rectangles": [],
    "images": []
  },
  "operations": [],
  "version": 0
}
```

**服务器响应** (失败):
```json
{
  "type": "error",
  "message": "房间不存在"
}
```

**说明**:
- 必须先完成认证
- 加入新房间前会自动离开之前的房间
- 成功加入后会收到当前房间状态（sync 消息）
- 用户会自动添加到房间成员列表

---

#### 2. 离开房间

**客户端发送**:
```json
{
  "type": "leave-room"
}
```

**说明**:
- 离开房间后不再接收该房间的实时更新
- 连接断开时会自动离开房间

---

### 实时同步

#### 1. 发送操作

**客户端发送**:
```json
{
  "type": "operation",
  "roomId": "507f1f77bcf86cd799439011",
  "pageUrl": "https://example.com/page",
  "operation": {
    "type": "bookmark-add",    // 操作类型
    "data": {                  // 操作数据
      "id": "bookmark_001",
      "text": "重要内容",
      "position": { "x": 100, "y": 200 },
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "clientVersion": 5           // 客户端当前版本号
}
```

**服务器响应** (确认):
```json
{
  "type": "operation-ack",
  "version": 6                 // 新的版本号
}
```

**服务器广播** (给房间其他成员):
```json
{
  "type": "operation",
  "operation": {
    "type": "bookmark-add",
    "data": { /* ... */ },
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "version": 6,
  "fromUser": "507f1f77bcf86cd799439012"
}
```

**操作类型**:

| 操作类型 | 说明 | data 结构 |
|---------|------|-----------|
| `bookmark-add` | 添加书签 | `{ id, text, position, timestamp }` |
| `bookmark-update` | 更新书签 | `{ id, text, position, timestamp }` |
| `bookmark-delete` | 删除书签 | `{ id }` |
| `canvas-update` | 更新画布 | `Base64 字符串` |
| `rectangle-add` | 添加框选 | `{ id, x, y, width, height, color }` |
| `rectangle-update` | 更新框选 | `{ id, ... }` 或 `[框选数组]` |
| `rectangle-delete` | 删除框选 | `{ id }` |
| `image-add` | 添加图片 | `{ id, url, x, y, width, height }` |
| `image-update` | 更新图片 | `{ id, ... }` |
| `image-delete` | 删除图片 | `{ id }` |

**说明**:
- 操作会经过 OT (Operational Transformation) 转换以解决冲突
- 版本号用于追踪操作顺序
- 操作会立即保存到数据库
- 只有在同一房间同一页面的其他客户端会收到广播

---

#### 2. 接收操作

**服务器广播**:
```json
{
  "type": "operation",
  "operation": {
    "type": "canvas-update",
    "data": "data:image/png;base64,...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "version": 7,
  "fromUser": "507f1f77bcf86cd799439013"
}
```

**客户端处理**:
1. 检查版本号，避免处理旧操作
2. 根据操作类型更新本地数据
3. 触发 UI 重新渲染
4. 更新本地版本号

---

#### 3. 请求同步

**客户端发送**:
```json
{
  "type": "sync",
  "roomId": "507f1f77bcf86cd799439011",
  "pageUrl": "https://example.com/page"
}
```

**服务器响应**:
```json
{
  "type": "sync",
  "annotations": {
    "bookmarks": [ /* ... */ ],
    "canvas": "data:image/png;base64,...",
    "rectangles": [ /* ... */ ],
    "images": [ /* ... */ ]
  },
  "operations": [ /* 操作历史 */ ],
  "version": 10
}
```

**说明**:
- 用于获取房间的最新状态
- 客户端应该在收到 sync 消息后替换本地数据

---

#### 4. 错误消息

**服务器发送**:
```json
{
  "type": "error",
  "message": "未加入该房间"
}
```

**常见错误**:
- `"认证失败"`: Token 无效或已过期
- `"请先认证"`: 未认证就尝试加入房间
- `"房间不存在"`: 房间 ID 无效
- `"未加入该房间"`: 发送操作但未加入房间
- `"页面不匹配"`: 发送操作的页面与当前页面不匹配
- `"消息格式错误"`: 消息 JSON 格式错误

---

#### 5. 连接关闭

**服务器发送**:
```json
{
  "type": "close"
}
```

**客户端处理**:
```javascript
ws.onclose = (event) => {
  console.log('WebSocket 连接关闭', event.code);
  // event.code === 1000: 正常关闭
  // event.code !== 1000: 异常关闭，触发重连
};
```

---

## 数据结构

### 用户 (User)

```typescript
interface User {
  _id: string;              // MongoDB ObjectId
  username: string;         // 用户名
  email: string;            // 邮箱
  password: string;         // 密码哈希（不返回给客户端）
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
}
```

---

### 房间 (Room)

```typescript
interface Room {
  _id: string;              // MongoDB ObjectId
  name: string;             // 房间名称
  description?: string;     // 房间描述
  owner: string | User;     // 所有者 ID 或完整用户对象
  members: string[] | User[]; // 成员 ID 数组或完整用户对象数组
  shareCode?: string;       // 分享码（6位随机字符串）
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
}
```

---

### 标注 (Annotation)

```typescript
interface Annotation {
  _id: string;              // MongoDB ObjectId
  roomId: string;           // 所属房间 ID
  pageUrl: string;          // 页面 URL
  annotations: {            // 标注数据
    bookmarks: Bookmark[];  // 书签数组
    canvas: string;         // 画布数据（Base64）
    rectangles: Rectangle[]; // 框选标注数组
    images: Image[];        // 图片数组
  };
  version: number;          // 版本号（每次更新递增）
  lastModified: Date;       // 最后修改时间
  createdAt: Date;          // 创建时间
  updatedAt: Date;          // 更新时间
}
```

---

### 书签 (Bookmark)

```typescript
interface Bookmark {
  id: string;               // 唯一标识
  text: string;             // 书签文本
  position: {               // 位置信息
    x: number;
    y: number;
  };
  timestamp: string;        // 创建/更新时间（ISO 8601）
}
```

---

### 框选标注 (Rectangle)

```typescript
interface Rectangle {
  id: string;               // 唯一标识
  x: number;                // X 坐标
  y: number;                // Y 坐标
  width: number;            // 宽度
  height: number;           // 高度
  color: string;            // 颜色（十六进制）
  timestamp?: string;       // 创建/更新时间
}
```

---

### 图片 (Image)

```typescript
interface Image {
  id: string;               // 唯一标识
  url: string;              // 图片 URL 或 Base64
  x: number;                // X 坐标
  y: number;                // Y 坐标
  width: number;            // 宽度
  height: number;           // 高度
  timestamp?: string;       // 创建/更新时间
}
```

---

### 操作 (Operation)

```typescript
interface Operation {
  type: OperationType;      // 操作类型
  data: any;                // 操作数据（根据类型不同）
  timestamp: string;        // 时间戳（ISO 8601）
}

type OperationType = 
  | 'bookmark-add'
  | 'bookmark-update'
  | 'bookmark-delete'
  | 'canvas-update'
  | 'rectangle-add'
  | 'rectangle-update'
  | 'rectangle-delete'
  | 'image-add'
  | 'image-update'
  | 'image-delete';
```

---

## 错误处理

### HTTP 错误码

| 状态码 | 说明 | 常见原因 |
|-------|------|---------|
| 400 | Bad Request | 请求参数缺失或格式错误 |
| 401 | Unauthorized | Token 无效、过期或缺失 |
| 403 | Forbidden | 无权访问资源 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误响应格式

```json
{
  "status": "error",
  "message": "错误描述信息"
}
```

---

### WebSocket 错误处理

#### 1. 连接错误

```javascript
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
  // 客户端应该尝试重连
};
```

#### 2. 服务器错误消息

```json
{
  "type": "error",
  "message": "具体错误信息"
}
```

客户端应该：
1. 显示错误信息给用户
2. 根据错误类型决定是否重试
3. 记录错误日志

---

### 重试机制

#### HTTP 请求重试

在 `apiClient.js` 中实现：
- 服务器错误（5xx）自动重试
- 最多重试 3 次
- 指数退避策略（1s, 2s, 3s）

```javascript
if (response.status >= 500 && this.retryCount < this.maxRetries) {
  this.retryCount++;
  await new Promise(resolve => 
    setTimeout(resolve, 1000 * this.retryCount)
  );
  return this.request(endpoint, options);
}
```

#### WebSocket 重连

在 `webSocket.js` 中实现：
- 非正常关闭时自动重连
- 最多重连 3 次
- 指数退避策略（最大 10s）

```javascript
const delay = Math.min(1000 * this.reconnectAttempts, 10000);
setTimeout(() => this.connect(this.url), delay);
```

---

## 客户端使用示例

### 完整流程示例

```javascript
import { authManager } from './services/authManager.js';
import { roomManager } from './services/roomManager.js';
import { webSocketClient } from './services/webSocketClient.js';
import { syncManager } from './services/syncManager.js';

// 1. 用户登录
const loginResult = await authManager.login({
  email: 'test@example.com',
  password: 'password123'
});

if (loginResult.status === 'success') {
  // 2. 连接 WebSocket
  await webSocketClient.connect();
  
  // 3. 加载用户房间
  await roomManager.loadUserRooms();
  
  // 4. 切换到指定房间
  await roomManager.switchRoom(roomId);
  
  // 5. 从云端加载当前页面数据
  await syncManager.loadCurrentPageFromCloud();
  
  // 6. 发送操作
  syncManager.sendOperation({
    type: 'bookmark-add',
    data: {
      id: 'bookmark_001',
      text: '重要内容',
      position: { x: 100, y: 200 },
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}
```

---

## 性能优化建议

### 1. 数据同步策略

- **定时同步**: 每 30 秒同步一次（可配置）
- **WebSocket 优先**: 优先使用 WebSocket，降级到 HTTP
- **离线队列**: WebSocket 断开时操作存入待处理队列

### 2. 版本控制

- 使用版本号追踪操作顺序
- 客户端和服务器都维护版本号
- 通过 OT 算法解决并发冲突

### 3. 缓存策略

- **本地存储**: 使用 `chrome.storage.local` 缓存数据
- **增量更新**: 只同步变化的数据
- **过期清理**: 定期清理 30 天前的数据

### 4. 心跳检测

- WebSocket 每 30 秒发送 ping
- 无响应自动断开并重连
- 保持连接活跃

---

## 安全建议

### 1. Token 管理

- Token 存储在 `chrome.storage.local`（加密存储）
- 设置合理的过期时间
- Token 失效后自动清除本地数据

### 2. 数据验证

- 服务器端验证所有输入
- 客户端也应进行基本验证
- 防止 XSS 和注入攻击

### 3. 权限控制

- 房间操作需要验证成员身份
- 敏感操作（删除房间）仅限所有者
- API 调用必须携带有效 Token

---

## 常见问题

### Q: WebSocket 断开后数据会丢失吗？

A: 不会。断开期间的操作会存入 `pendingOperations` 队列，重连后自动发送。

### Q: 多个用户同时编辑如何处理冲突？

A: 使用 OT (Operational Transformation) 算法，根据时间戳决定优先级。

### Q: 如何确保数据一致性？

A: 
1. 版本号控制
2. 操作顺序追踪
3. 定期全量同步
4. 服务器作为权威数据源

### Q: Token 过期后会发生什么？

A: 
1. API 返回 401 错误
2. 客户端自动清除认证信息
3. 提示用户重新登录

---

## 技术栈

- **后端**: Node.js + Express + MongoDB
- **WebSocket**: ws 库
- **认证**: JWT (jsonwebtoken)
- **前端**: Chrome Extension + Vite
- **存储**: Chrome Storage API



