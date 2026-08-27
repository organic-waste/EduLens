/* 房间数据实时同步 */
const WebSocket = require("ws");
//用于生成全球唯一id
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const Room = require("./models/room");
const Annotation = require("./models/annotation");
const { logger } = require("./utils/logger");
const {
  applyOperationToData,
  transformOperation,
} = require("./services/annotationOperations");

class WebsocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.rooms = new Map();
    this.operations = new Map(); //储存操作队列

    this.wss.on("connection", this.handleConnection.bind(this));
  }

  async handleConnection(ws) {
    ws.isAlive = true;
    ws.id = uuidv4();
    ws.roomId = null;
    ws.userId = null;
    logger.info("websocket.connected", { connectionId: ws.id });

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
          logger.warn("websocket.unknown_message", {
            connectionId: ws.id,
            type: message.type,
          });
      }
    } catch (error) {
      logger.error("websocket.message_failed", { connectionId: ws.id, error });
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
      if (!this.operations.get(roomId).has(pageUrl)) {
        this.operations.get(roomId).set(pageUrl, []);
      }
      this.rooms.get(roomId).add(ws);
      logger.info("websocket.room_joined", {
        connectionId: ws.id,
        userId: ws.userId,
        roomId,
        pageUrl,
      });

      //发送当前房间状态给新加入的客户端
      await this.sendRoomState(ws, roomId, pageUrl);
    } catch (error) {
      logger.error("websocket.room_join_failed", {
        connectionId: ws.id,
        roomId,
        error,
      });
      this.sendError(ws, "加入房间失败");
    }
  }

  async handleOperation(ws, message) {
    const { roomId, pageUrl, operation, clientVersion } = message;

    if (!ws.roomId || ws.roomId !== roomId) {
      this.sendError(ws, "未加入该房间");
      return;
    }

    if (ws.pageUrl !== pageUrl) {
      this.sendError(ws, "页面不匹配");
      return;
    }

    logger.info("websocket.operation_received", {
      userId: ws.userId,
      roomId,
      pageUrl,
      operationType: operation.type,
    });

    const pageOperations = this.operations.get(roomId)?.get(pageUrl) || [];
    // const serverVersion = pageOperations.length;

    //解决冲突的转换操作函数
    const transformedOp = transformOperation(
      operation,
      pageOperations,
      clientVersion
    );

    // 如果操作因版本落后且冲突被 LWW 策略丢弃，不保存也不广播
    if (transformedOp.type === "reject") {
      this.send(ws, {
        type: "operation-ack",
        version: pageOperations.length,
      });
      return;
    }

    await this.saveOperationToDB(roomId, pageUrl, transformedOp);
    pageOperations.push(transformedOp);

    this.broadcastToRoom(ws.roomId, ws, {
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
        annotation.annotations = applyOperationToData(
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
          annotations: applyOperationToData({}, operation),
        });
        await annotation.save();
      }
    } catch (error) {
      logger.error("annotation.operation_save_failed", {
        roomId,
        pageUrl,
        operationType: operation.type,
        error,
      });
    }
  }

  //向房间内的其他在此页面的客户端广播信息(排除自身)
  broadcastToRoom(roomId, excludeClient, message) {
    // console.log("开始广播 ");
    // console.log("房间ID: ", roomId);
    // console.log("发送操作的客户端: ", {
    //   userId: excludeClient.userId,
    //   roomId: excludeClient.roomId,
    //   pageUrl: excludeClient.pageUrl,
    //   readyState: excludeClient.readyState,
    //   id: excludeClient.id,
    // });

    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn("websocket.room_not_found", { roomId });
      return;
    }

    // console.log(`房间 ${roomId} 中的客户端数量: ${room.size}`);

    let broadcastCount = 0;
    let skippedCount = 0;
    room.forEach((client) => {
      const isSelf = client === excludeClient;
      const isOpen = client.readyState === WebSocket.OPEN;
      const isSamePage = client.pageUrl === excludeClient.pageUrl;

      //只发送给开启ws且为同一页面的其他客户端
      if (!isSelf && isOpen && isSamePage) {
        logger.debug("websocket.operation_broadcast", {
          roomId,
          userId: client.userId,
        });
        this.send(client, message);
        broadcastCount++;
      } else {
        skippedCount++;
        // if (isSelf) {
        //   console.log(`跳过：是发送者自己`);
        // } else if (!isOpen) {
        //   console.log(
        //     `跳过：WebSocket未打开 ，readyState=${client.readyState})`
        //   );
        // } else if (!isSamePage) {
        //   console.log(
        //     `跳过：页面不匹配 (${client.pageUrl} !== ${excludeClient.pageUrl})`
        //   );
        // }
      }
    });

    // console.log(
    //   ` 广播完成:，成功 ${broadcastCount} 个，跳过 ${skippedCount} 个 `
    // );
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
      logger.error("websocket.room_state_failed", { roomId, pageUrl, error });
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
    logger.info("websocket.disconnected", { connectionId: ws.id });
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
