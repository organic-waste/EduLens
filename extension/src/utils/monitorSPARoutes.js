/* 监听 SPA 页面路由改动 */
import eventStore from "../stores/eventStore.js";

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

  eventStore.on(window, "popstate", () => {
    // console.log('popstate');
    setTimeout(fn, 0); //把回调推到下一次事件循环, 确保执行 fn 的时候路由，DOM 等都已经更新完成
  });

  eventStore.on(window, "hashchange", () => {
    // console.log('hashchange');
    setTimeout(fn, 0);
  });
}
