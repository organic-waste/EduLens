/* 监听 SPA 页面路由改动 */

import eventManager from "./eventManager.js";

export default function MonitorSPARoutes(fn) {
  let lastURL = window.location.href;

  const observer = new MutationObserver(() => {
    const currentURL = window.location.href;

    if (currentURL !== lastURL) {
      lastURL = currentURL;
      // console.log('URL变化:', currentURL);
      fn();
    }
  });

  // 监听整个document的变化
  observer.observe(document, {
    subtree: true,
    childList: true,
  });

  eventManager.on(window, "popstate", () => {
    // console.log('popstate');
    setTimeout(fn, 0);
  });

  eventManager.on(window, "hashchange", () => {
    // console.log('hashchange');
    setTimeout(fn, 0);
  });
}
