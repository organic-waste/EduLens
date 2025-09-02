// 鼠标高亮

let highlightDiv = null;

function Highlight(e) {
  if (!highlightDiv) {
    highlightDiv = document.createElement('div');
    highlightDiv.className = 'mouse-highlight';
    document.body.appendChild(highlightDiv);
  }
  highlightDiv.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
}

export function activateHighlight() {
  window.addEventListener('mousemove', Highlight);
}

export function deactivateHighlight() {
  window.removeEventListener('mousemove', Highlight);
  if (highlightDiv) {
    highlightDiv.remove();
    highlightDiv = null;
  }
}

