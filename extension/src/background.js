// 点击插件图标时打开侧边栏
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
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
  if (tab.active && tab.url?.startsWith("http")) {
    // tab.active 只处理当前窗口的活跃标签，避免后台标签无意义刷新
    chrome.tabs.sendMessage(tabId, {
      type: "RELOAD",
    });
  }
});

const normalizePageUrl = (url) => url?.split("#")[0].replace(/\/$/, "");

// 等待页面加载完成
function waitForTabLoad(tab) {
  if (tab.status === "complete") return Promise.resolve();

  const { id: tabId } = tab;
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }, 15000);
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// 新开标签页时，等一下content-script的脚本加载
async function sendToContentScript(tabId, message, attempts = 6) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await delay(150);
    }
  }
  throw lastError || new Error("网页辅助脚本尚未就绪");
}

async function resolveCitationTab(citation) {
  const targetUrl = citation.pageUrl;
  if (!targetUrl) {
    throw new Error("该摘要未保存来源页面，请重新生成摘要");
  }

  const targetBaseUrl = normalizePageUrl(targetUrl);
  const tabs = await chrome.tabs.query({});
  const sourceTab = tabs.find((tab) => normalizePageUrl(tab.url) === targetBaseUrl);
  if (sourceTab) {
    await chrome.windows.update(sourceTab.windowId, { focused: true });
    await chrome.tabs.update(sourceTab.id, { active: true });
    return { tab: sourceTab, mode: "existing-tab" };
  }

  const newTab = await chrome.tabs.create({ url: targetUrl, active: true });
  await waitForTabLoad(newTab);
  const loadedTab = await chrome.tabs.get(newTab.id);
  return { tab: loadedTab, mode: "new-tab" };
}

// 监听网页引用定位和截图请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_PAGE_SELECTION") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id || !/^https?:/.test(tab.url || "")) {
        sendResponse({ error: "当前页面不支持网页选区" });
        return;
      }
      try {
        await sendToContentScript(tab.id, { type: "CAPTURE_PAGE_SELECTION" });
        sendResponse({ ok: true });
      } catch {
        sendResponse({ error: "网页选区功能尚未就绪，请先刷新页面后再重试即可" });
      }
    });
    return true;
  }

  if (request.type === "PAGE_SELECTION_CAPTURED") {
    const pageUrl = sender.tab?.url || request.pageUrl;
    if (!pageUrl) {
      return;
    }

    chrome.runtime.sendMessage({
      ...request,
      type: "PAGE_SELECTION",
      pageUrl,
      citation: {
        ...request.citation,
        pageUrl,
      },
    });
    return;
  }

  if (request.type === "JUMP_TO_CITATION") {
    (async () => {
      try {
        const citation = request.citation || {};
        // 先打开对应 URL
        const { tab: targetTab } = await resolveCitationTab(citation);
        if (!targetTab?.id) throw new Error("未找到可定位的网页标签页");

        const response = await sendToContentScript(targetTab.id, {
          type: "LOCATE_CITATION",
          citation,
        });
        sendResponse(response || { located: false });
      } catch (error) {
        sendResponse({ error: error.message || "无法定位网页引用" });
      }
    })();
    return true;
  }

  if (request.type === "SCREENSHOT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: "png" }, (dataUrl) => {
        sendResponse({ image: dataUrl });
      });
    });
    return true; //告诉 Chrome 异步调用 sendResponse，否则会造成 await sendMessage 会永远 pending 而卡死
  }
});
