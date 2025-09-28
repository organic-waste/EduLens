//DOM截图或者区域截图
import eventManager from '../../utils/eventManager.js';
import { createEl } from '../../utils/operateEl.js'
import store from '../../stores/tools.js';

let funcDiv = null;
let screenshotDiv = null;
let DOMBtn = null;
let maskDiv = null;
let regionBtn = null;
let shadowRoot = null;
let imageData = null;

export function activateScreenshot(){
    //创建截图按钮
    shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    funcDiv = shadowRoot.querySelector('.functions');
    screenshotDiv = createEl('div',{class: 'function'});
    DOMBtn = createEl('button',{class: 'button',textContent: chrome.i18n.getMessage('screenshotDOMBtn')});
    regionBtn = createEl('button',{class: 'button',textContent: chrome.i18n.getMessage('screenshotRegionBtn')});
    screenshotDiv.append(DOMBtn,regionBtn);
    funcDiv.appendChild(screenshotDiv);

    //绑定按钮点击事件
    eventManager.on(DOMBtn,'click',e => handleScreenshot('dom',e));
    eventManager.on(regionBtn,'click',e => handleScreenshot('region',e));    
}

async function handleScreenshot(type,event){
    //通知service-worker截取屏幕
    const response = await chrome.runtime.sendMessage({type:'SCREENSHOT'})
    imageData = response.image;

    if(type === 'dom'){
        store.updateState('isDOM');
        DOMScreenshot();
    }
    else if(type === 'region'){
        store.updateState('isRegion')
        regionScreenshot();
    }
}

//DOM截屏相关
function DOMScreenshot(){
    maskDiv = createEl('div',{style: 'background: rgba(15, 59, 139, 0.2); position: fixed; pointer-events: none; z-index: 9999999; display: none;border: 1px solid #0f3b8b;border-radius: 4px'});
    shadowRoot.appendChild(maskDiv);

    let isMousedown = false;
    let target = null;

    //使用mouse模拟click事件，防止页面上的元素禁止冒泡导致无法检测到click事件
    window.globalClickMouseDowned = null;
    window.globalClickDownTime = null;

    eventManager.on( document ,'mousedown',listenerMousedown);
    eventManager.on( document ,'mousemove',listenerMousemove);    
    eventManager.on( document ,'mouseup',listenerMouseup);

    function listenerMousedown(event){
        if(!store.isDOM) return;
        target.style.pointerEvents = 'none';
        isMousedown = true;

        //只响应按下左键
        if(event.which === 1){
            window.globalClickMouseDowned = true;
            window.globalClickDownTime = new Date().getTime();
        }
    }

    function listenerMousemove(event){
        if(!store.isDOM) return;

        if(!isMousedown){
            const paths = document.elementsFromPoint(event.clientX, event.clientY);
            target = paths[0]; //获取表面的第一个DOM元素
            if(target){
                const targetDomInfo = target.getBoundingClientRect();
                maskDiv.style.width = targetDomInfo.width + 'px';
                maskDiv.style.height = targetDomInfo.height + 'px';
                maskDiv.style.left = targetDomInfo.left + 'px';
                maskDiv.style.top = targetDomInfo.top + 'px';
                maskDiv.style.display = 'block';
            }else{
                maskDiv.style.display = 'none';
            }
        }
    }

    async function listenerMouseup(event){
        if(!store.isDOM) return;
        isMousedown = false;
        target.style.pointerEvents = 'auto';

        //点击DOM元素时
        if(window.globalClickMouseDowned && event.which === 1){
            window.globalClickMouseDowned = false;
            const now = new Date().getTime();
            //在300ms内视为点击
            if(now - window.globalClickDownTime < 300){
                //记得将浮点数转换为INT
                const infos = {
                    x: parseInt(maskDiv.style.left),
                    y: parseInt(maskDiv.style.top),
                    w: parseInt(maskDiv.style.width),
                    h: parseInt(maskDiv.style.height)
                };
                console.log(infos);
                const croppedImage = await cropImg(imageData,infos);
                copyImg(croppedImage);
                downloadImg(croppedImage);

                store.updateState();
                maskDiv.style.display = 'none';
            }
        }
    }

}




function regionScreenshot(){
    
}

//裁剪截图
function cropImg(image,infos){
    return new Promise((resolve,reject)=>{
        //现代浏览器支持离线 canvas,可以不用插入到页面DOM中
        const dpr = window.devicePixelRatio || 1;
        
        // 将CSS坐标转换为设备像素坐标
        const deviceInfos = {
            x: Math.round(infos.x * dpr),
            y: Math.round(infos.y * dpr),
            w: Math.round(infos.w * dpr),
            h: Math.round(infos.h * dpr)
        };

        const canvas = document.createElement('canvas');
        canvas.width = deviceInfos.w;
        canvas.height = deviceInfos.h;

        const img = new Image();
        img.onload = ()=>{
            const context = canvas.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.drawImage( img,
                deviceInfos.x, deviceInfos.y, deviceInfos.w, deviceInfos.h, // 源图像区域
                0, 0, deviceInfos.w, deviceInfos.h // 目标canvas区域
            );
            const croppedImg = canvas.toDataURL(`image/png`);
            resolve(croppedImg);
        }
        img.onerror = () => reject(new Error('image load failed'));
        img.src = image;
    })
}

//将截图以图片文件形式写入剪贴板
async function copyImg(image) {
    try {
        const [header, base64] = image.split(',');
        const matches = /data:(.*);base64/.exec(header);
        const mimeType = matches[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        
        const blob = new Blob([array], { type: mimeType });
        const clipboardItem = new ClipboardItem({ [mimeType]: blob });
        
        await navigator.clipboard.write([clipboardItem]);
    } catch (error) {
        console.error(error);
    }
}

//自动下载截图图像
function downloadImg(image, filename = `screenshot-${Date.now()}.png`){
    return new Promise((resolve,reject)=>{
        try{
            const link = document.createElement('a');
            link.href = image;
            link.download = filename;
            link.click();
            resolve(true);
        }catch(error){
            console.error(error);
            reject(false);
        }
    })
}