import { injectStyles, injectIcon } from "./utils/injectAssets.js";
import store from "./stores/filterStore.js";
import { activateDraggablePanel } from "./features/draggablePanel.js";
import eventStore from "./stores/eventStore.js";
import { cloudSync } from "./services/cloudSync.js";

//统一的键盘管理
function keydown(e, key, name) {
  if (e.altKey && e.key === key) {
    if (store.active === name) {
      store.setActive(null);
    } else {
      store.setActive(name);
    }
  }
}

eventStore.on(window, "keydown", (e) => {
  keydown(e, "h", "mouseHighlight");
  keydown(e, "s", "spotlight");
  keydown(e, "r", "readingSpotlight");
});

(async function activatePlugin() {
  await injectStyles();
  // injectIcon();
  activateDraggablePanel();

  //测试是否能连接到后端云服务
  const connected = await cloudSync.testConnection();
  if (connected) {
    console.log("[EduLens] 云服务已连接");
  } else {
    console.log("[EduLens] 使用本地模式");
  }
})();
