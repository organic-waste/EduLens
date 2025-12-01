const titleEl = document.getElementById("popup-title");
const toggleBtn = document.getElementById("toggle-bubble-btn");

const hideBtnText = chrome.i18n.getMessage("bubbleHideButton");
const showBtnText = chrome.i18n.getMessage("bubbleShowButton");

titleEl.textContent = chrome.i18n.getMessage("popupTitle");
toggleBtn.textContent = hideBtnText;
toggleBtn.disabled = true; // 先把按钮禁用，防止用户在真正拿到缓存状态前狂点

let panelVisible = true;

function renderVisibility() {
  toggleBtn.textContent = panelVisible ? hideBtnText : showBtnText;
  toggleBtn.dataset.visible = String(panelVisible);
}

async function broadcastVisibility(visible) {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });

  // 并发给每一个标签页都发消息，确保popup的隐藏状态影响全部标签页
  await Promise.all(
    tabs.map(
      (tab) =>
        chrome.tabs
          .sendMessage(tab.id, { type: "SET_PANEL_VISIBILITY", visible })
          .catch((err) => console.debug(err.message)) // 内容脚本未注入等异常
    )
  );
}
async function loadVisibility() {
  const result = await chrome.storage.local.get({
    ["edulensPanelVisible"]: true,
  });
  panelVisible = Boolean(result["edulensPanelVisible"]);
  renderVisibility();
  toggleBtn.disabled = false;
}

toggleBtn.addEventListener("click", async () => {
  toggleBtn.disabled = true;
  panelVisible = !panelVisible;
  renderVisibility();
  await chrome.storage.local.set({ ["edulensPanelVisible"]: panelVisible });
  await broadcastVisibility(panelVisible);
  toggleBtn.disabled = false;
});

loadVisibility();
