// 生成唯一id标识符
export function getId() {
  let date = Date.now().toString(36);
  let random = Math.random().toString(36).slice(0, 3);
  return date + random;
}

//用页面URL来作为切换页面时的key
export function getPageKey() {
  return window.location.origin + window.location.pathname;
}
