function cssPath(node) {
  if (!node || node === document.body) return "body";
  if (node.id) return `#${CSS.escape(node.id)}`;
  const parent = node.parentElement;
  if (!parent) return node.tagName?.toLowerCase() || "body";
  const siblings = [...parent.children].filter((child) => child.tagName === node.tagName);
  const suffix = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : "";
  return `${cssPath(parent)} > ${node.tagName.toLowerCase()}${suffix}`;
}

function capturePageSelection() {
  if (window.__edulensSelectionHandler) return;
  const handler = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !text) {
      chrome.runtime.sendMessage({ type: "PAGE_SELECTION", text: "" });
    } else {
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      const pageText = document.body.textContent || "";
      const offsetBefore = (node, offset) => {
        const positionRange = document.createRange();
        positionRange.setStart(document.body, 0);
        positionRange.setEnd(node, offset);
        return positionRange.toString().length;
      };
      const start = offsetBefore(range.startContainer, range.startOffset);
      const end = offsetBefore(range.endContainer, range.endOffset);
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
    }
    selection?.removeAllRanges();
    window.removeEventListener("mouseup", handler, true);
    delete window.__edulensSelectionHandler;
  };
  window.__edulensSelectionHandler = handler;
  window.addEventListener("mouseup", handler, true);
}

async function locateCitation(citation) {
  const flash = (element) => {
    if (!element) return;
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
  const highlightRange = (range, method) => {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    flash(range.startContainer.parentElement);
    setTimeout(() => selection.removeAllRanges(), 1800);
    return { located: true, method };
  };
  const findQuoteRange = (quote) => {
    const pageText = document.body.textContent || "";
    let start = pageText.indexOf(quote);
    while (start >= 0) {
      const end = start + quote.length;
      const prefixMatches = !citation.prefix || pageText.slice(
        Math.max(0, start - citation.prefix.length), start,
      ) === citation.prefix;
      const suffixMatches = !citation.suffix || pageText.slice(end, end + citation.suffix.length) === citation.suffix;
      if (prefixMatches && suffixMatches) return rangeFromTextOffsets(start, end);
      start = pageText.indexOf(quote, start + 1);
    }
    return null;
  };
  const quote = citation.quote?.trim();
  const normalizedQuote = quote?.replace(/\s+/g, " ");
  // SPA 页面在 load 后仍可能异步渲染正文，保留有限重试和多级定位降级。
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (citation.textPosition) {
      const range = rangeFromTextOffsets(citation.textPosition.start, citation.textPosition.end);
      if (range?.toString() === quote) return highlightRange(range, "text-position");
    }
    if (quote) {
      const range = findQuoteRange(quote);
      if (range) return highlightRange(range, "text-quote");
    }
    if (citation.selector && citation.selector !== "body") {
      try {
        const element = document.querySelector(citation.selector);
        if (element) {
          flash(element);
          return { located: true, method: "selector" };
        }
      } catch {
        // 旧网页的 CSS selector 可能已经失效，继续走文本块降级。
      }
    }
    if (normalizedQuote) {
      for (const element of document.querySelectorAll("p, li, blockquote, pre, h1, h2, h3, h4, td")) {
        if (element.innerText.replace(/\s+/g, " ").includes(normalizedQuote)) {
          flash(element);
          return { located: true, method: "text-block" };
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return { located: false };
}

export function registerPageCitationHandlers() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "CAPTURE_PAGE_SELECTION") {
      capturePageSelection();
      sendResponse({ ok: true });
      return;
    }
    if (message.type === "LOCATE_CITATION") {
      locateCitation(message.citation || {}).then(sendResponse, (error) => {
        sendResponse({ error: error.message || "无法定位网页引用" });
      });
      return true;
    }
  });
}
