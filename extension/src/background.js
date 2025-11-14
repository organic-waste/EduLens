// 启动侧边栏功能
const enableSidePanel = () => {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return;
  }
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => {
      console.warn("设置侧边栏行为失败", error);
    });
};

chrome.runtime.onInstalled.addListener(enableSidePanel);
chrome.runtime.onStartup.addListener(enableSidePanel);

// 监听标签页切换
chrome.tabs.onActivated.addListener(async (activePage) => {
  try {
    const tab = await chrome.tabs.get(activePage.tabId);
    if (tab.url && tab.url.startsWith("http")) {
      // 过滤掉 chrome://、edge://、扩展页面等无效协议
      chrome.tabs.sendMessage(activePage.tabId, {
        type: "RELOAD",
      });
    }
  } catch (error) {
    console.warn("发送 RELOAD 信息失败", error);
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.active && tab.url.startsWith("http")) {
    // tab.active 只处理当前窗口的活跃标签，避免后台标签无意义刷新
    chrome.tabs.sendMessage(tabId, {
      type: "RELOAD",
    });
  }
});

// 监听截屏请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SCREENSHOT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.captureVisibleTab(
        tabs[0].windowId,
        { format: "png" },
        (dataUrl) => {
          sendResponse({ image: dataUrl });
        }
      );
    });
    return true; // 告诉 Chrome 异步调用 sendResponse，否则 await sendMessage 会一直 pending
  }
});
