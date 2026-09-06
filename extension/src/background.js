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

async function resolveCitationTab(citation) {
  const targetUrl = citation.pageUrl;
  if (!targetUrl) {
    throw new Error("该摘要未保存来源页面，请重新生成摘要");
  }

  const targetBaseUrl = normalizePageUrl(targetUrl);
  const tabs = await chrome.tabs.query({});
  const sourceTab = tabs.find(
    (tab) => normalizePageUrl(tab.url) === targetBaseUrl,
  );
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
      // 注入网页选区脚本以读取选中文本、标题、URL、Selector、位置等信息
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.__edulensSelectionHandler) return;
            const handler = () => {
              const selection = window.getSelection();
              const text = selection?.toString().trim() || "";
              const range = selection?.rangeCount
                ? selection.getRangeAt(0)
                : null;
              if (!range || !text) {
                chrome.runtime.sendMessage({ type: "PAGE_SELECTION", text: "" });
                selection?.removeAllRanges();
                window.removeEventListener("mouseup", handler, true);
                delete window.__edulensSelectionHandler;
                return;
              }
              const container = range?.commonAncestorContainer;
              const element =
                container?.nodeType === Node.ELEMENT_NODE
                  ? container
                  : container?.parentElement;
              const pageText = document.body.textContent || "";
              const offsetBefore = (node, offset) => {
                const positionRange = document.createRange();
                positionRange.setStart(document.body, 0);
                positionRange.setEnd(node, offset);
                return positionRange.toString().length;
              };
              const start = offsetBefore(range.startContainer, range.startOffset);
              const end = offsetBefore(range.endContainer, range.endOffset);
              const cssPath = (node) => {
                if (!node || node === document.body) return "body";
                if (node.id) return `#${CSS.escape(node.id)}`;
                const parent = node.parentElement;
                if (!parent) return node.tagName?.toLowerCase() || "body";
                const siblings = [...parent.children].filter(
                  (child) => child.tagName === node.tagName,
                );
                const suffix =
                  siblings.length > 1
                    ? `:nth-of-type(${siblings.indexOf(node) + 1})`
                    : "";
                return `${cssPath(parent)} > ${node.tagName.toLowerCase()}${suffix}`;
              };
              chrome.runtime.sendMessage({
                type: "PAGE_SELECTION_CAPTURED",
                text,
                pageTitle: document.title,
                pageUrl: location.href,
                citation: {
                  quote: text,
                  prefix: pageText.slice(Math.max(0, start - 40), start),
                  suffix: pageText.slice(end, end + 40),
                  selector: cssPath(range.startContainer.parentElement || element),
                  textPosition: { start, end },
                },
              });
              selection?.removeAllRanges();
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

        // 跳转回定位处
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          args: [citation],
          func: async (citation) => {
            const flash = (element) => {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              const previousOutline = element.style.outline;
              const previousOffset = element.style.outlineOffset;
              element.style.outline = "2px solid #5fa6c0";
              element.style.outlineOffset = "3px";
              setTimeout(() => {
                element.style.outline = previousOutline;
                element.style.outlineOffset = previousOffset;
              }, 1800);
            };
            // 匹配项加个边框强调
            const highlightRange = (range, method) => {
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
              flash(range.startContainer.parentElement);
              setTimeout(() => selection.removeAllRanges(), 1800);
              return { located: true, method };
            };
            // 用 TreeWalker 遍历节点找出对应位置 DOM 
            const rangeFromTextOffsets = (start, end) => {
              const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
              let cursor = 0;
              let startBoundary;
              let endBoundary;
              let node;
              while ((node = walker.nextNode())) {
                const nextCursor = cursor + node.nodeValue.length;
                if (!startBoundary && start >= cursor && start <= nextCursor) {
                  startBoundary = { node, offset: start - cursor };
                }
                if (end >= cursor && end <= nextCursor) {
                  endBoundary = { node, offset: end - cursor };
                  break;
                }
                cursor = nextCursor;
              }
              if (!startBoundary || !endBoundary) return null;
              const range = document.createRange();
              range.setStart(startBoundary.node, startBoundary.offset);
              range.setEnd(endBoundary.node, endBoundary.offset);
              return range;
            };
            const findQuoteRange = (quote) => {
              const pageText = document.body.textContent || "";
              let start = pageText.indexOf(quote);
              while (start >= 0) {
                const end = start + quote.length;
                const prefixMatches = !citation.prefix || pageText.slice(
                  Math.max(0, start - citation.prefix.length),
                  start,
                ) === citation.prefix;
                const suffixMatches = !citation.suffix || pageText.slice(
                  end,
                  end + citation.suffix.length,
                ) === citation.suffix;
                // 两个锚点都存在时必须同时满足，否则重复段落会跳到错误位置。
                if (prefixMatches && suffixMatches) return rangeFromTextOffsets(start, end);
                start = pageText.indexOf(quote, start + 1);
              }
              return null;
            };
            // 找到位置后再匹配quote文本和前后缀，否则匹配 CSS Selector
            const quote = citation.quote?.trim();
            const normalizedQuote = quote?.replace(/\s+/g, " ");
            for (let attempt = 0; attempt < 8; attempt += 1) {
              if (citation.textPosition) {
                const positionRange = rangeFromTextOffsets(
                  citation.textPosition.start,
                  citation.textPosition.end,
                );
                if (positionRange?.toString() === quote) {
                  return highlightRange(positionRange, "text-position");
                }
              }
              if (quote) {
                const quoteRange = findQuoteRange(quote);
                if (quoteRange) return highlightRange(quoteRange, "text-quote");
              }
              if (citation.selector && citation.selector !== "body") {
                let element;
                try {
                  element = document.querySelector(citation.selector);
                } catch {
                  element = null;
                }
                if (element) {
                  flash(element);
                  return { located: true, method: "selector" };
                }
              }
              if (normalizedQuote) {
                const elements = document.querySelectorAll(
                  "p, li, blockquote, pre, h1, h2, h3, h4, td",
                );
                for (const element of elements) {
                  if (
                    element.innerText.replace(/\s+/g, " ").includes(normalizedQuote)
                  ) {
                    flash(element);
                    return { located: true, method: "text-block" };
                  }
                }
              }
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            return { located: false };
          },
        });
        const response = {
          ...result.result,
        };
        sendResponse(response);
      } catch (error) {
        sendResponse({ error: error.message || "无法定位网页引用" });
      }
    })();
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
