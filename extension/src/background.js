// 点击插件图标时打开侧边栏
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => {
      console.warn("配置侧边栏打开行为失败：", error);
    });
}

// 监听标签页切换
chrome.tabs.onActivated.addListener(async (activePage) => {
  try {
    const tab = await chrome.tabs.get(activePage.tabId);
    if (tab.url && tab.url.startsWith("http")) {
      // 过滤掉 chrome://、edge://、扩展自带页等无效协议
      chrome.tabs.sendMessage(activePage.tabId, {
        type: "RELOAD",
      });
    }
  } catch (error) {
    console.warn("发送 RELOAD 信息失败：", error);
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

//监听截屏请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_PAGE_SELECTION") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id || !/^https?:/.test(tab.url || "")) {
        sendResponse({ error: "当前页面不支持网页选区" });
        return;
      }
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.__edulensSelectionHandler) return;
            const handler = () => {
              const text = window.getSelection()?.toString().trim() || "";
              chrome.runtime.sendMessage({ type: "PAGE_SELECTION", text });
              window.getSelection()?.removeAllRanges();
              window.removeEventListener("mouseup", handler, true);
              delete window.__edulensSelectionHandler;
            };
            window.__edulensSelectionHandler = handler;
            window.addEventListener("mouseup", handler, true);
          },
        });
        sendResponse({ ok: true });
      } catch {
        sendResponse({ error: "无法注入网页选区监听器" });
      }
    });
    return true;
  }

  if (request.type === "SCREENSHOT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.captureVisibleTab(
        tabs[0].windowId,
        { format: "png" },
        (dataUrl) => {
          sendResponse({ image: dataUrl });
        },
      );
    });
    return true; //告诉 Chrome 异步调用 sendResponse，否则会造成 await sendMessage 会永远 pending 而卡死
  }
});
