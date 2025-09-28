// 注入图标样式文件
export function injectIcon(){
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  if (!shadowRoot.querySelector('#fa-content-script')) {
  const fa = document.createElement('link');
  fa.id = 'fa-content-script'; //加 `id` 是为了避免重复注入
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  shadowRoot.appendChild(fa);
  }
}


//创建 shadow DOM 隔离插件和原网站样式
const CSS_FILES = [
  'styles/draggable-panel.css',
  'styles/base.css',
  'styles/scroll-progress.css',
  'styles/bookmark.css',
  'styles/countdown.css',
  'styles/mouse-enhance.css',
  'styles/graffiti.css',
  'styles/rectangleAnnotation.css',
  'styles/screenshot.css'
];

let shadowRoot = null;
let host = null;

//注入样式
export async function injectStyles() {
    host = document.createElement('div');
    host.id = 'edulens-host';
    host.style.display = 'contents'; //不占布局
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open'}); // 外部可以通过 host.shadowRoot 访问

    //获取所有CSS文件
    const cssPromises = CSS_FILES.map(async (file) =>{
        try{
            const url = chrome.runtime.getURL(file);  //扩展里的任何静态文件(css/png/html) 在运行时都要先过 chrome.runtime.getURL，否则浏览器会按“当前页面域名”去拼路径
            const response = await fetch(url);
            if(!response.ok){
                throw new Error(`Failed to load ${file}`);
            }
            return await response.text();
        }catch(error){
            console.warn(`could not load${file}`,error);
        }
    })
    const cssContents = await Promise.all(cssPromises);
    // 将返回的数组形式的样式连接为一个文件
    const combinedCSS = cssContents.join('\n') 


    const style = document.createElement('style');
    style.id = 'edulens-styles';
    style.textContent = combinedCSS;
    shadowRoot.appendChild(style);

    //将这两个根节点挂载到window全局  
    window.__EDULENS_SHADOW_ROOT__ = shadowRoot;
    window.__EDULENS_HOST__        = host;
}

