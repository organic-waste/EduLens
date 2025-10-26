class WS {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.messageHandlers = new Map(); //事件总线
    this.url = null; //保存最近一次连接地址，重连时好复用
    this.RoomId = null;
    this.PageUrl = null;
  }

  connect(url) {
    this.url = url;
    return new Promise((resolve, reject) => {
      try {
        // 关闭现有连接
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log("WebSocket连接成功");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        //解析消息后交给事件总线再处理
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("消息解析错误:", error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket连接关闭");
          this.isConnected = false;
          // 只有非正常关闭才重连
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket错误:", error);
          reject(error);
        };
      } catch (error) {
        console.error("WebSocket连接错误:", error);
        reject(error);
      }
    });
  }

  authenticate(token) {
    return this.send({ type: "authenticate", token });
  }

  joinRoom(roomId, pageUrl) {
    this.RoomId = roomId;
    this.PageUrl = pageUrl;
    return this.send({ type: "join-room", roomId, pageUrl });
  }

  sendOperation(operation, clientVersion) {
    return this.send({
      type: "operation",
      roomId: this.RoomId,
      pageUrl: this.PageUrl,
      operation,
      clientVersion,
    });
  }

  send(message) {
    console.log("this.ws: ", this.ws);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket未连接，消息丢弃:", message);
    return false;
  }

  handleMessage(message) {
    //获取该消息类型对应的全部处理事件
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach((handler) => handler(message));
  }

  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }

  //指数退避的自动重连
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return false;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 10000);
    console.log(
      `尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );
    setTimeout(() => this.connect(this.url), delay);
  }

  disconnect() {
    // 重连次数置为最大值，防止 onclose 里再次重连
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close(1000, "正常断开连接");
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const webSocket = new WS();
