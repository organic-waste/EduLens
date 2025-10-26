/* 房间数据实时同步 */
const WebSocket = require("ws");
//用于生成全球唯一id
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const Room = require("./models/room");
const Annotation = require("./models/annotation");

class WebsocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.rooms = new Map();
    this.operations = new Map(); //储存操作队列

    this.wss.on("connection", this.handleConnection.bind(this));
  }

  async handleConnection(ws) {
    console.log("建立新的WebSocket连接");
    ws.isAlive = true;
    ws.id = uuidv4();
    ws.roomId = null;
    ws.userId = null;

    ws.on("message", (data) => this.handleMessage(ws, data));
    ws.on("close", () => this.handleDisconnect(ws));
    ws.on("pong", () => (ws.isAlive = true));
    //每30秒一次心跳检测
    const heartbeat = setInterval(() => {
      if (!ws.isAlive) {
        ws.terminate();
        clearInterval(heartbeat);
        return;
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);
    ws.on("close", () => clearInterval(heartbeat));
  }

  async handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);

      //根据消息类型分发处理
      switch (message.type) {
        case "authenticate":
          await this.handleAuthentication(ws, message);
          break;
        case "join-room":
          await this.handleJoinRoom(ws, message);
          break;
        case "operation":
          await this.handleOperation(ws, message);
          break;
        case "sync":
          await this.handleSync(ws, message);
          break;
        case "leave-room":
          this.handleLeaveRoom(ws);
          break;
        default:
          console.warn("未知的消息类型:", message.type);
      }
    } catch (error) {
      console.error("消息处理错误:", error);
      this.sendError(ws, "消息格式错误");
    }
  }

  async handleAuthentication(ws, message) {
    try {
      const { token } = message;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;

      this.send(ws, {
        type: "authentication-success",
        userId: decoded.id,
      });
    } catch (error) {
      this.sendError(ws, "认证失败");
    }
  }

  async handleJoinRoom(ws, message) {
    if (!ws.userId) {
      this.sendError(ws, "请先认证");
      return;
    }
    const { roomId, pageUrl } = message;
    console.log("message: ", message);
    try {
      const room = await Room.findOne({
        _id: roomId,
      });
      if (!room) {
        this.sendError(ws, "房间不存在");
        return;
      }

      if (!room.members.includes(ws.userId)) {
        room.members.push(ws.userId);
        await room.save();
      }

      //离开之前的房间
      if (ws.roomId) {
        this.handleLeaveRoom(ws);
      }
      ws.roomId = roomId;
      ws.pageUrl = pageUrl;

      //初始化数据
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
        this.operations.set(roomId, new Map());
      }
      //初始化该页面的操作队列
      if (!this.operations.get(roomId).has(pageUrl)) {
        this.operations.get(roomId).set(pageUrl, []);
      }
      this.rooms.get(roomId).add(ws);
      console.log(`客户端 ${ws.userId} 加入房间 ${roomId}, 页面 ${pageUrl}`);

      //发送当前房间状态给新加入的客户端
      await this.sendRoomState(ws, roomId, pageUrl);
    } catch (error) {
      console.error("加入房间错误:", error);
      this.sendError(ws, "加入房间失败");
    }
  }

  async handleOperation(ws, message) {
    const { roomId, pageUrl, operation, clientVersion } = message;
    if (ws.roomId !== roomId) {
      this.sendError(ws, "未加入该房间");
      return;
    }
    const pageOperations = this.operations.get(roomId)?.get(pageUrl) || [];
    const serverVersion = pageOperations.length;

    //解决冲突的转换操作函数
    const transformedOp = this.transformedOperation(
      operation,
      pageOperations,
      clientVersion
    );
    await this.saveOperationToDB(roomId, pageUrl, transformedOp);
    pageOperations.push(transformedOp);

    // 广播操作给房间内其他客户端
    this.broadcastToRoom(roomId, ws, {
      type: "operation",
      operation: transformedOp,
      version: pageOperations.length,
      fromUser: ws.userId,
    });

    this.send(ws, {
      type: "operation-ack",
      version: pageOperations.length,
    });
  }

  async saveOperationToDB(roomId, pageUrl, operation) {
    try {
      let annotation = await Annotation.findOne({ roomId, pageUrl });
      if (annotation) {
        annotation.annotations = this.applyOperationToData(
          annotation.annotations,
          operation
        );
        annotation.version += 1;
        annotation.lastModified = new Date();
        await annotation.save();
      } else {
        annotation = new Annotation({
          roomId,
          pageUrl,
          annotations: this.applyOperationToData({}, operation),
        });
        await annotation.save();
      }
    } catch (error) {
      console.error("保存操作到数据库失败:", error);
    }
  }

  //将操作应用到不同类型的数据
  applyOperationToData(data, operation) {
    const newData = { ...data };

    switch (operation.type) {
      case "bookmark-add":
      case "bookmark-update":
        if (!newData.bookmarks) newData.bookmarks = [];
        const existingIndex = newData.bookmarks.findIndex(
          (b) => b.id === operation.data.id
        );
        if (existingIndex >= 0) {
          newData.bookmarks[existingIndex] = operation.data;
        } else {
          newData.bookmarks.push(operation.data);
        }
        break;
      case "bookmark-delete":
        if (newData.bookmarks) {
          newData.bookmarks = newData.bookmarks.filter(
            (b) => b.id !== operation.data.id
          );
        }
        break;

      case "canvas-update":
        newData.canvas = operation.data;
        break;

      case "rectangle-add":
      case "rectangle-update":
        if (!newData.rectangles) newData.rectangles = [];
        const rectIndex = newData.rectangles.findIndex(
          (r) => r.id === operation.data.id
        );
        if (rectIndex >= 0) {
          newData.rectangles[rectIndex] = operation.data;
        } else {
          newData.rectangles.push(operation.data);
        }
        break;
      case "rectangle-delete":
        if (newData.rectangles) {
          newData.rectangles = newData.rectangles.filter(
            (r) => r.id !== operation.data.id
          );
        }
        break;

      case "image-add":
      case "image-update":
        if (!newData.images) newData.iamges = [];
        const imgIndex = newData.images.findIndex(
          (i) => i.id === operation.data.id
        );
        if (imgIndex >= 0) {
          newData.images[imgIndex] = operation.data;
        } else {
          newData.images.push(operation.data);
        }
        break;

      case "image-delete":
        if (newData.images) {
          newData.images = newData.images.filter(
            (i) => i.id !== operation.data.id
          );
        }
        break;
    }
    return newData;
  }

  //解决客户端和服务器总操作之间的冲突
  transformedOperation(operation, opQueue, clientVersion) {
    let transformedOp = { ...operation };
    //对高于客户端版本的服务器操作进行转换
    for (let i = clientVersion; i < opQueue.length; i++) {
      const serverOp = opQueue[i];
      transformedOp = this.transformSingleOperation(transformedOp, serverOp);
    }
    return transformedOp;
  }

  //转换单个操作
  transformSingleOperation(clientOp, serverOp) {
    if (clientOp.type !== serverOp.type) return clientOp;

    switch (clientOp.type) {
      case "bookmark-update":
        return this.transformBookmarkOperation(clientOp, serverOp);
      case "canvas-update":
        return this.transformCanvasOperation(clientOp, serverOp);
      case "rectangle-update":
        return this.transformRectangleOperation(clientOp, serverOp);
      case "image-update":
        return this.transformImageOperation(clientOp, serverOp);
      default:
        return clientOp;
    }
  }

  transformBookmarkOperation(clientOp, serverOp) {
    if (new Date(clientOp.timestamp) > new Date(serverOp.timestamp)) {
      return clientOp;
    }
    return serverOp;
  }

  transformCanvasOperation(clientOp, serverOp) {
    if (new Date(clientOp.timestamp) > new Date(serverOp.timestamp)) {
      return clientOp;
    }
    return serverOp;
  }

  transformRectangleOperation(clientOp, serverOp) {
    if (new Date(clientOp.timestamp) > new Date(serverOp.timestamp)) {
      return clientOp;
    }
    return serverOp;
  }

  transformImageOperation(clientOp, serverOp) {
    if (new Date(clientOp.timestamp) > new Date(serverOp.timestamp)) {
      return clientOp;
    }
    return serverOp;
  }

  //向房间内的其他客户端广播信息(排除自身)
  broadcastToRoom(roomId, excludeClient, message) {
    const room = this.rooms.get(roomId);
    room.forEach((client) => {
      //只发送给开启ws且为同一页面的其他客户端
      if (
        client !== excludeClient &&
        client.readyState === WebSocket.OPEN &&
        client.pageUrl === excludeClient.pageUrl
      ) {
        this.send(client, message);
      }
    });
  }

  //发送房间状态到客户端
  async sendRoomState(ws, roomId, pageUrl) {
    try {
      const annotation = await Annotation.findOne({ roomId, pageUrl });
      const pageOperations = this.operations.get(roomId)?.get(pageUrl) || [];

      this.send(ws, {
        type: "sync",
        annotations: annotation?.annotations || {},
        operations: pageOperations,
        version: pageOperations.length,
      });
    } catch (error) {
      console.error("发送房间状态失败:", error);
      this.sendError(ws, "加载房间数据失败");
    }
  }

  async handleSync(ws, message) {
    const { roomId, pageUrl } = message;
    await this.sendRoomState(ws, roomId, pageUrl);
  }

  handleLeaveRoom(ws) {
    if (ws.roomId) {
      const room = this.rooms.get(ws.roomId);
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(ws.roomId);
        this.operations.delete(ws.roomId);
      }
    }
    ws.roomId = null;
    ws.pageUrl = null;
  }

  handleDisconnect(ws) {
    if (ws.roomId) {
      this.handleLeaveRoom(ws);
    }
    console.log(`客户端 ${ws.id} 断开连接`);
  }

  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  //发送错误信息到客户端
  sendError(ws, message) {
    this.send(ws, {
      type: "error",
      message,
    });
  }
}

module.exports = WebsocketServer;
