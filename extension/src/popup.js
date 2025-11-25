const titleEl = document.getElementById("popup-title");
const toggleBtn = document.getElementById("toggle-bubble-btn");

const hideBtnText =
  chrome.i18n.getMessage("bubbleHideButton") || "Hide floating panel";
const showBtnText =
  chrome.i18n.getMessage("bubbleShowButton") || "Show floating panel";

titleEl.textContent = chrome.i18n.getMessage("popupTitle") || "EduLens";
toggleBtn.textContent = hideBtnText;
toggleBtn.disabled = true;

let panelVisible = true;

function renderVisibility() {
  toggleBtn.textContent = panelVisible ? hideBtnText : showBtnText;
  toggleBtn.dataset.visible = String(panelVisible);
}

function queryTabs(filter) {
  return new Promise((resolve) => {
    chrome.tabs.query(filter, (tabs) => resolve(tabs));
  });
}

async function broadcastVisibility(visible) {
  const tabs = await queryTabs({ url: ["http://*/*", "https://*/*"] });
  await Promise.all(
    tabs.map(
      (tab) =>
        new Promise((resolve) => {
          chrome.tabs.sendMessage(
            tab.id,
            { type: "SET_PANEL_VISIBILITY", visible },
            () => {
              // 忽略因标签页未加载内容脚本导致的错误
              const err = chrome.runtime.lastError;
              if (err) {
                console.debug(err.message);
              }
              resolve();
            }
          );
        })
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
