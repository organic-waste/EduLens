

export function getOffsetPos(event,div){
    const el = div;
    if(typeof(div) === "string"){
        const el = document.querySelector(div);
    }
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x , y };
}