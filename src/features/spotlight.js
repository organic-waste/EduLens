// 聚光灯
import eventManager from '../utils/eventManager.js';

let spotlightDiv = null;

function Spotlight(e) {
  if (!spotlightDiv) {
    spotlightDiv = document.createElement('div');
    spotlightDiv.className = 'spotlight';
    spotlightDiv.style.left = 0 + 'px';
    spotlightDiv.style.top = 0 + 'px';
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

