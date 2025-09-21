// 聚光灯
import eventManager from '../utils/eventManager.js';
import { createEl } from '../utils/operateEl.js';

let spotlightDiv = null;

function Spotlight(e) {
  if (!spotlightDiv) {
    spotlightDiv = createEl('div',{class:'spotlight',left:'0px',top:'0px'});
    document.body.appendChild(spotlightDiv);
  }
  spotlightDiv.style.transform = `translate(${e.clientX - 60}px, ${e.clientY - 60}px)`;
}

export function activateSpotlight() {
  eventManager.on(document,'mousemove', Spotlight);
}

export function deactivateSpotlight() {
  eventManager.off(window,'mousemove', Spotlight);
  if (spotlightDiv) {
    spotlightDiv.remove();
    spotlightDiv = null;
  }
}

