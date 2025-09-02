// 聚光灯

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
  window.addEventListener('mousemove', Spotlight);
}

export function deactivateSpotlight() {
  window.removeEventListener('mousemove', Spotlight);
  if (spotlightDiv) {
    spotlightDiv.remove();
    spotlightDiv = null;
  }
}

