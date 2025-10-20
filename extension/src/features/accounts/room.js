import { createEl } from "../../utils/operateEl.js";
import eventManager from "../../stores/eventManager.js";
import { roomManager } from "../../stores/roomManager.js";

let selector = null;
let shadowRoot = null;

//初始化房间选择条
export async function activateRoomSelector() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;

  await roomManager.loadUserRooms();

  selector = createEl("div", { class: "room-selector" });
  const currentRoomInfo = createEl("div", { class: "current-room-info" });
  const roomActions = createEl("div", { class: "room-actions" });

  if (this.currentRoom) {
    currentRoomInfo.innerHTML = `
        <span class="room-name">${this.currentRoom.name}</span>
        <span class="room-members">${this.currentRoom.members.length} 名成员</span>
      `;
  } else {
    currentRoomInfo.innerHTML = '<span class="no-room">未选择房间</span>';
  }

  roomActions.innerHTML = `
      <button class="button room-list-btn">房间列表</button>
      <button class="button create-room-btn">创建房间</button>
      ${
        this.currentRoom
          ? `
        <button class="button share-room-btn">分享</button>
      `
          : ""
      }
    `;

  selector.appendChild(currentRoomInfo);
  selector.appendChild(roomActions);

  const functions = shadowRoot.querySelector(".functions");
  if (functions) {
    functions.appendChild(selector);
  }
  eventManager.on(
    selector.querySelector(".room-list-btn"),
    "click",
    showRoomList
  );
  eventManager.on(
    selector.querySelector(".create-room-btn"),
    "click",
    showCreateRoomForm
  );
  const shareBtn = selector.querySelector(".share-room-btn");
  if (shareBtn) eventManager.on(shareBtn, "click", shareRoom);
}

//展示房间列表
async function showRoomList() {
  const overlay = createEl("div", { class: "room-overlay" });
  const container = createEl("div", { class: "room-list-container" });

  container.innerHTML = `
    <div class="room-list-header">
      <h3>我的房间</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <div class="room-list"></div>
    <button class="button create-room-btn">创建新房间</button>
  `;

  const listWrapper = container.querySelector(".room-list");
  roomStore.userRooms.forEach((room) => {
    const item = createEl("div", {
      class: `room-item ${
        roomStore.currentRoomId === room._id ? "active" : ""
      }`,
      innerHTML: `
        <div class="room-info">
          <div class="room-name">${room.name}</div>
          <div class="room-meta">${room.members.length} 名成员 · ${new Date(
        room.updatedAt
      ).toLocaleDateString()}</div>
        </div>
        <div class="room-actions">
          ${
            roomStore.currentRoomId !== room._id
              ? `<button class="button switch-room-btn" data-id="${room._id}">切换</button>`
              : '<span class="current-label">当前</span>'
          }
        </div>
      `,
    });
    listWrapper.appendChild(item);
  });

  overlay.appendChild(container);
  sel.shadowRoot.appendChild(overlay);

  const close = () => overlay.remove();
  eventManager.on(container.querySelector(".close-btn"), "click", close);
  eventManager.on(overlay, "click", (e) => e.target === overlay && close());
  eventManager.on(container.querySelector(".create-room-btn"), "click", () => {
    overlay.remove();
    showCreateRoomForm();
  });

  listWrapper.querySelectorAll(".switch-room-btn").forEach((btn) =>
    eventManager.on(btn, "click", async (e) => {
      await roomStore.switchRoom(e.target.dataset.id);
      overlay.remove();
      renderRoomSelector();
      console.log(`已切换到房间: ${roomStore.currentRoom.name}`);
    })
  );
}

//创建房间弹窗
function showCreateRoomForm() {
  const overlay = createEl("div", { class: "room-overlay" });
  const container = createEl("div", { class: "room-form-container" });

  container.innerHTML = `
    <div class="room-form-header">
      <h3>创建新房间</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <form class="room-form">
      <div class="input-group">
        <label for="room-name">房间名称</label>
        <input type="text" id="room-name" required>
      </div>
      <div class="input-group">
        <label for="room-description">房间描述</label>
        <textarea id="room-description"></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="button submit-btn">创建房间</button>
        <button type="button" class="button cancel-btn">取消</button>
      </div>
    </form>
  `;

  overlay.appendChild(container);
  shadowRoot.appendChild(overlay);

  const form = container.querySelector(".room-form");
  eventManager.on(form, "submit", async (e) => {
    e.preventDefault();
    const room = await roomStore.createRoom({
      name: form.querySelector("#room-name").value.trim(),
      description: form.querySelector("#room-description").value.trim(),
    });
    overlay.remove();
    if (room) {
      renderRoomSelector();
      console.log("房间创建成功");
    } else {
      console.error("创建房间失败");
    }
  });
  eventManager.on(container.querySelector(".close-btn"), "click", () =>
    overlay.remove()
  );
  eventManager.on(container.querySelector(".cancel-btn"), "click", () =>
    overlay.remove()
  );
  eventManager.on(
    overlay,
    "click",
    (e) => e.target === overlay && overlay.remove()
  );
}

//分享房间
async function shareRoom() {
  const code = await roomStore.generateShareCode();
  if (!code) return console.error("生成分享码失败");
  const overlay = createEl("div", { class: "room-overlay" });
  const container = createEl("div", { class: "share-dialog" });

  container.innerHTML = `
    <div class="share-header">
      <h3>分享房间</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <div class="share-content">
      <p>分享码: <strong>${code}</strong></p>
      <p class="share-hint">其他人可以使用此代码加入房间</p>
      <button class="button copy-btn">复制分享码</button>
    </div>
  `;

  overlay.appendChild(container);
  shadowRoot.appendChild(overlay);

  const close = () => overlay.remove();
  eventManager.on(container.querySelector(".close-btn"), "click", close);
  eventManager.on(overlay, "click", (e) => e.target === overlay && close());
  eventManager.on(container.querySelector(".copy-btn"), "click", () => {
    navigator.clipboard.writeText(code);
    console.log("分享码已复制");
    overlay.remove();
  });
}
