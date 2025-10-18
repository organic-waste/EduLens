/* 控制页面交互 */
export function preventPageInteraction() {
  document.body.style.userSelect = "none";
  document.body.style.pointerEvents = "none";
}

export function restorePageInteraction() {
  document.body.style.userSelect = "";
  document.body.style.pointerEvents = "";
}

export function disableUserScroll() {
  document.documentElement.classList.add("no-scroll");
  window.addEventListener("wheel", blockScroll, { passive: false });
  window.addEventListener("touchmove", blockScroll, { passive: false });
  window.addEventListener("keydown", blockKeys, false);
}

export function enableUserScroll() {
  document.documentElement.classList.remove("no-scroll");
  window.removeEventListener("wheel", blockScroll);
  window.removeEventListener("touchmove", blockScroll);
  window.removeEventListener("keydown", blockKeys);
}

function blockScroll(e) {
  e.preventDefault();
}
function blockKeys(e) {
  // 空格、方向键、PageUp/Dn、Home、End
  const keys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
  if (keys.includes(e.keyCode)) {
    e.preventDefault();
  }
}
