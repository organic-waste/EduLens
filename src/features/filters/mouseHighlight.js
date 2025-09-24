// 鼠标高亮
import eventManager from '../../utils/eventManager.js';
import { createEl } from '../../utils/operateEl.js';

let highlightDiv = null;


function Highlight(e) {
  if (!highlightDiv) {
    const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
    //记得写明初始top和left值，否则fixed定位错乱（别忘了加上'px'）
    highlightDiv = createEl('div',{class:'mouse-highlight',left:'0px',top:'0px'});
    shadowRoot.appendChild(highlightDiv);
  }
  highlightDiv.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
}

export function activateHighlight() {
  eventManager.on(document,'mousemove', Highlight);
}

export function deactivateHighlight() {
  eventManager.off(window,'mousemove', Highlight);
  if (highlightDiv) {
    highlightDiv.remove();
    highlightDiv = null;
  }
}

