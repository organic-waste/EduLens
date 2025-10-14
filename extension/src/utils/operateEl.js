// 操作元素相关工具函数

export function createEl(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "textContent") {
      el.textContent = value;
    } else if (key === "innerHTML") {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  el.append(...children);
  return el;
}

export function getOffsetPos(event, div) {
  let element = div;
  if (typeof div === "string") {
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    element = shadowRoot.querySelector(div);
  }
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}
