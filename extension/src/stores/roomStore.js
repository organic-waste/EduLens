import { roomManager } from "../services/index.js";
import { webSocketClient } from "../services/index.js";
import { getPageKey } from "../utils/index.js";

/* 管理数据房间 - 现在直接使用 roomManager */
class RoomStore {
  constructor() {
    this.currentRoom = null;
    this.userRooms = [];
  }

  async loadUserRooms() {
    try {
      this.userRooms = await roomManager.loadUserRooms();
      this.currentRoom = roomManager.getCurrentRoom();
    } catch (error) {
      console.error("加载用户房间失败:", error);
      this.userRooms = [];
    }
  }

  async switchRoom(roomId) {
    const room = await roomManager.switchRoom(roomId);
    if (room) {
      this.currentRoom = room;
    }
    return room;
  }

  async createRoom({ name, description }) {
    const room = await roomManager.createRoom({ name, description });
    if (room) {
      this.currentRoom = room;
      this.userRooms = roomManager.getUserRooms();
    }
    return room;
  }

  async joinRoom(shareCode) {
    const room = await roomManager.joinRoom(shareCode);
    if (room) {
      this.currentRoom = room;
      this.userRooms = roomManager.getUserRooms();
    }
    return room;
  }

  async generateShareCode() {
    return await roomManager.generateShareCode();
  }

  get currentRoomId() {
    return this.currentRoom?._id;
  }
}

export const roomStore = new RoomStore();
