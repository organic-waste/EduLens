/* 房间管理 */
import { createEl } from "../../utils/index.js";
import eventStore from "../../stores/eventStore.js";
import { roomManager, webSocketClient } from "../../services/index.js";
import { getPageKey } from "../../utils/index.js";

let selector = null;
let shadowRoot = null;

//初始化房间选择条
export async function activateRoomSelector() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;

  await roomManager.loadUserRooms();
  selector = shadowRoot.querySelector(".room-selector");
  if (selector) selector.remove();
  selector = createEl("div", { class: "room-selector" });
  selector.innerHTML = `
      <div class="current-room-info">
        ${
          roomManager.getCurrentRoom()
            ? `<span class="room-name">${
                roomManager.getCurrentRoom().name
              }</span>
             <span class="room-members">${
               roomManager.getCurrentRoom().members.length
             } 名成员</span>`
            : '<span class="no-room">未选择房间</span>'
        }
      </div>
      <div class="room-actions">
        <button class="button room-list-btn">房间列表</button>
        <button class="button share-room-btn">分享</button>
      </div>
    `;

  const functions = shadowRoot.querySelector(".functions");
  if (functions) {
    functions.appendChild(selector);
  }
  eventStore.on(
    selector.querySelector(".room-list-btn"),
    "click",
    showRoomList
  );
  // eventStore.on(
  //   selector.querySelector(".create-room-btn"),
  //   "click",
  //   showCreateRoomForm
  // );
  const shareBtn = selector.querySelector(".share-room-btn");
  if (shareBtn) eventStore.on(shareBtn, "click", shareRoom);
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
    <dic class="room-operations">
    <button class="button create-room-btn">创建新房间</button>
    <button class="button join-room-btn">加入新房间</button>
    </div>
  `;

  const listWrapper = container.querySelector(".room-list");
  roomManager.getUserRooms().forEach((room) => {
    const item = createEl("div", {
      class: `room-item ${
        roomManager.getCurrentRoom()?._id === room._id ? "active" : ""
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
            roomManager.getCurrentRoom()?._id !== room._id
              ? `<button class="button switch-room-btn" data-id="${room._id}">切换</button>`
              : '<span class="current-label">当前</span>'
          }
        </div>
      `,
    });
    listWrapper.appendChild(item);
  });

  overlay.appendChild(container);
  shadowRoot.appendChild(overlay);

  const close = () => overlay.remove();
  eventStore.on(container.querySelector(".close-btn"), "click", close);
  eventStore.on(overlay, "click", (e) => e.target === overlay && close());
  eventStore.on(container.querySelector(".create-room-btn"), "click", () => {
    overlay.remove();
    showCreateRoomForm();
  });
  eventStore.on(container.querySelector(".join-room-btn"), "click", () => {
    overlay.remove();
    showJoinRoomForm();
  });

  listWrapper.querySelectorAll(".switch-room-btn").forEach((btn) =>
    eventStore.on(btn, "click", async (e) => {
      const newRoomId = e.target.dataset.id;
      await roomManager.switchRoom(newRoomId);

      const pageUrl = getPageKey();
      if (webSocketClient.isConnected()) {
        webSocketClient.joinRoom(newRoomId, pageUrl);
      }
      overlay.remove();
      activateRoomSelector();
      console.log(`已切换到房间: ${roomManager.getCurrentRoom().name}`);
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
  eventStore.on(form, "submit", async (e) => {
    e.preventDefault();
    const room = await roomManager.createRoom({
      name: form.querySelector("#room-name").value.trim(),
      description: form.querySelector("#room-description").value.trim(),
    });
    overlay.remove();
    if (room) {
      activateRoomSelector();
      console.log("房间创建成功");
    } else {
      console.error("创建房间失败");
    }
  });
  eventStore.on(container.querySelector(".close-btn"), "click", () =>
    overlay.remove()
  );
  eventStore.on(container.querySelector(".cancel-btn"), "click", () =>
    overlay.remove()
  );
  eventStore.on(
    overlay,
    "click",
    (e) => e.target === overlay && overlay.remove()
  );
}

//通过分享码加入新房间弹窗
function showJoinRoomForm() {
  const overlay = createEl("div", { class: "room-overlay" });
  const container = createEl("div", { class: "room-form-container" });

  container.innerHTML = `
    <div class="room-form-header">
      <h3>加入新房间</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <form class="room-form">
      <div class="input-group">
        <label for="room-name">房间分享码</label>
        <input type="text" id="room-sharecode" required>
      </div>
      <div class="form-actions">
        <button type="submit" class="button submit-btn">加入房间</button>
        <button type="button" class="button cancel-btn">取消</button>
      </div>
    </form>
  `;

  overlay.appendChild(container);
  shadowRoot.appendChild(overlay);

  const form = container.querySelector(".room-form");
  //提交事件监听直接绑定在表单元素而不是按钮
  eventStore.on(form, "submit", async (e) => {
    e.preventDefault();
    const shareCode = form.querySelector("#room-sharecode").value.trim();
    const room = await roomManager.joinRoom(shareCode);
    overlay.remove();
    if (room) {
      activateRoomSelector();
      console.log("房间创建成功");
    } else {
      console.error("创建房间失败");
      window.alert("创建房间失败");
    }
  });
  eventStore.on(container.querySelector(".close-btn"), "click", () =>
    overlay.remove()
  );
  eventStore.on(container.querySelector(".cancel-btn"), "click", () =>
    overlay.remove()
  );
  eventStore.on(
    overlay,
    "click",
    (e) => e.target === overlay && overlay.remove()
  );
}

//分享房间
async function shareRoom() {
  const code = await roomManager.generateShareCode();
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
  eventStore.on(container.querySelector(".close-btn"), "click", close);
  eventStore.on(overlay, "click", (e) => e.target === overlay && close());
  eventStore.on(container.querySelector(".copy-btn"), "click", () => {
    //将分享码写入剪贴板
    navigator.clipboard.writeText(code);
    console.log("分享码已复制");
    overlay.remove();
  });
}
