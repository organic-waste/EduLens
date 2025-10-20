import { cloudSync } from "../services/cloudSync";

/* 管理数据房间 */
class RoomStore {
  constructor() {
    this.currentRoom = null;
    this.userRooms = [];
  }

  async loadUserRooms() {
    try {
      this.userRooms = await cloudSync.getUserRooms();

      // 确保 userRooms 是数组
      // if (!Array.isArray(this.userRooms)) {
      //   this.userRooms = [];
      // }

      //无任何房间时创建默认房间
      if (this.userRooms.length === 0) {
        const defaultRoom = await cloudSync.createRoom({
          name: "我的个人空间",
          description: "默认个人工作区",
        });
        this.userRooms = defaultRoom ? [defaultRoom] : [];
        await this.switchRoom(defaultRoom._id);
      }
      //无选中房间时默认取第一个
      else if (!this.currentRoom && this.userRooms.length > 0) {
        await this.switchRoom(this.userRooms[0]._id);
      }
    } catch (error) {
      console.error("加载用户房间失败:", error);
      this.userRooms = [];
    }
  }

  async switchRoom(roomId) {
    const room = this.userRooms.find((r) => r._id === roomId);
    if (!room) return false;
    this.currentRoom = room;
    cloudSync.setCurrentRoom(roomId); // 把当前房间 id 同步到 cloudSync
    return room;
  }

  async createRoom({ name, description }) {
    const room = await cloudSync.createRoom({ name, description });
    if (room) {
      this.userRooms.unshift(room);
      await this.switchRoom(room._id);
    }
    return room;
  }

  async joinRoom(shareCode) {
    const room = await cloudSync.joinRoom(shareCode);
    if (room) {
      // 防止重复加入
      const exist = this.userRooms.find((r) => r._id === room._id);
      if (!exist) this.userRooms.unshift(room);
      await this.switchRoom(room._id);
    }
    return room;
  }

  async generateShareCode() {
    if (!this.currentRoom) return null;
    return await cloudSync.generateShareCode(this.currentRoom._id);
  }
}

export const roomStore = new RoomStore();
