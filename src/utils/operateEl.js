// 操作元素相关工具函数

export function createEl(tag, attrs = {}, ...children){
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key,value]) => {
        el.setAttribute(key,value);
    })
    el.append(...children);
    return el;
}

export function getOffsetPos(event,div){
    const el = div;
    if(typeof(div) === "string"){
        el = document.querySelector(div);
    }
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x , y };
}