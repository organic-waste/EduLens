// 聚光灯

let spotlightDiv = null;

function Spotlight(e) {
  if (!spotlightDiv) {
    spotlightDiv = document.createElement('div');
    spotlightDiv.className = 'spotlight';
    document.body.appendChild(spotlightDiv);
  }
  spotlightDiv.style.left = (e.clientX - 60) + 'px';
  spotlightDiv.style.top = (e.clientY - 60) + 'px';
}

export function activateSpotlight() {
  window.addEventListener('mousemove', Spotlight);
}

export function deactivateSpotlight() {
  window.removeEventListener('mousemove', Spotlight);
  if (spotlightDiv) {
    spotlightDiv.remove();
    spotlightDiv = null;
  }
}

