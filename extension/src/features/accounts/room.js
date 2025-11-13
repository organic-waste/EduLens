/* 房间管理 */
import { createEl } from "../../utils/index.js";
import eventStore from "../../stores/eventStore.js";
import { roomManager, webSocketClient } from "../../services/index.js";
import { getPageKey } from "../../utils/index.js";

let shadowRoot = null;

//初始化房间数据
export async function activateRoomSelector() {
  shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  await roomManager.loadUserRooms();
}

export function getRoomState() {
  const currentRoom = roomManager.getCurrentRoom();
  return {
    currentRoom: currentRoom
      ? {
          id: currentRoom._id,
          name: currentRoom.name,
          members: currentRoom.members.length,
        }
      : null,
    totalRooms: roomManager.getUserRooms().length,
  };
}

export async function openRoomListOverlay() {
  if (!shadowRoot) shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  await roomManager.loadUserRooms();
  showRoomList();
}

export async function openShareRoomDialog() {
  if (!shadowRoot) shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  await roomManager.loadUserRooms();
  shareRoom();
}

//展示房间列表
async function showRoomList() {
  const overlay = createEl("div", { class: "room-overlay" });
  const container = createEl("div", { class: "room-list-container" });

  container.innerHTML = `
    <div class="room-list-header">
      <h3>${chrome.i18n.getMessage("myRooms")}</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <div class="room-list"></div>
    <dic class="room-operations">
    <button class="button create-room-btn">${chrome.i18n.getMessage("createRoomBtn")}</button>
    <button class="button join-room-btn">${chrome.i18n.getMessage("joinRoomBtn")}</button>
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
          <div class="room-meta">${room.members.length} ${chrome.i18n.getMessage("roomMembers")} · ${new Date(
        room.updatedAt
      ).toLocaleDateString()}</div>
        </div>
        <div class="room-actions">
          ${
            roomManager.getCurrentRoom()?._id !== room._id
              ? `<button class="button switch-room-btn" data-id="${room._id}">${chrome.i18n.getMessage("switchRoomBtn")}</button>`
              : `<span class="current-label">${chrome.i18n.getMessage("currentRoom")}</span>`
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
      // console.log(`已切换到房间: ${roomManager.getCurrentRoom().name}`);
    })
  );
}

//创建房间弹窗
function showCreateRoomForm() {
  const overlay = createEl("div", { class: "room-overlay" });
  const container = createEl("div", { class: "room-form-container" });

  container.innerHTML = `
    <div class="room-form-header">
      <h3>${chrome.i18n.getMessage("createRoomTitle")}</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <form class="room-form">
      <div class="input-group">
        <label for="room-name">${chrome.i18n.getMessage("roomNameLabel")}</label>
        <input type="text" id="room-name" required>
      </div>
      <div class="input-group">
        <label for="room-description">${chrome.i18n.getMessage("roomDescLabel")}</label>
        <textarea id="room-description"></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="button submit-btn">${chrome.i18n.getMessage("createRoomSubmit")}</button>
        <button type="button" class="button cancel-btn">${chrome.i18n.getMessage("cancelBtn")}</button>
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
        // console.log("房间创建成功");
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
      <h3>${chrome.i18n.getMessage("joinRoomTitle")}</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <form class="room-form">
      <div class="input-group">
        <label for="room-name">${chrome.i18n.getMessage("roomShareCodeLabel")}</label>
        <input type="text" id="room-sharecode" required>
      </div>
      <div class="form-actions">
        <button type="submit" class="button submit-btn">${chrome.i18n.getMessage("joinRoomSubmit")}</button>
        <button type="button" class="button cancel-btn">${chrome.i18n.getMessage("cancelBtn")}</button>
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
      // console.log("房间创建成功");
    } else {
      console.error("创建房间失败");
      window.alert(chrome.i18n.getMessage("joinRoomFailed"));
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
      <h3>${chrome.i18n.getMessage("shareRoomTitle")}</h3>
      <button class="icon-btn close-btn">×</button>
    </div>
    <div class="share-content">
      <p>${chrome.i18n.getMessage("shareCodePrefix")}<strong>${code}</strong></p>
      <p class="share-hint">${chrome.i18n.getMessage("shareCodeHint")}</p>
      <button class="button copy-btn">${chrome.i18n.getMessage("copyShareCodeBtn")}</button>
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
    // console.log("分享码已复制");
    overlay.remove();
  });
}
