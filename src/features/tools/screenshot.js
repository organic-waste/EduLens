//DOM截图或者区域截图
import eventManager from '../../utils/eventManager.js';
import { createEl } from '../../utils/operateEl.js'

let funcDiv = null;
let screenshotDiv = null;
let DOMBtn = null;
let regionBtn = null;

export function activateScreenshot(){
    //创建截图按钮
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    funcDiv = shadowRoot.querySelector('.functions');
    screenshotDiv = createEl('div',{class: 'function'});
    DOMBtn = createEl('button',{class: 'button',textContent: chrome.i18n.getMessage('screenshotDOMBtn')});
    regionBtn = createEl('button',{class: 'button',textContent: chrome.i18n.getMessage('screenshotRegionBtn')});
    screenshotDiv.append(DOMBtn,regionBtn);
    funcDiv.appendChild(screenshotDiv);

    //绑定按钮点击事件
    eventManager.on(DOMBtn,'click',e=>handleScreenshot('dom',e));
    eventManager.on(regionBtn,'click',e=>handleScreenshot('region',e));    
}

function handleScreenshot(type,event){
    if(type === 'dom'){
        DOMScreenshot();
    }
    else if(type === 'region'){
        regionScreenshot();
    }
}

//DOM截屏相关
function DOMScreenshot(){
    let maskDom = createMask();
    let isSelectModel = false;
    let isMousedown = false;
    let target = null;
    //使用mouse模拟click事件，防止页面上的元素禁止冒泡导致无法检测到click事件
    window.glo
}




function regionScreenshot(){
    
}
