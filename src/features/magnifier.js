// 放大镜

let magnifierDiv = null;

function Magnifier(e) {
  if (!magnifierDiv) {
    magnifierDiv = document.createElement('div');
    magnifierDiv.className = 'magnifier';
    document.body.appendChild(magnifierDiv);
  }
  magnifierDiv.style.left = (e.clientX - 50) + 'px';
  magnifierDiv.style.top = (e.clientY - 50) + 'px';
}

export function activateMagnifier() {
  window.addEventListener('mousemove', Magnifier);
}

export function deactivateMagnifier() {
  window.removeEventListener('mousemove', Magnifier);
  if (magnifierDiv) {
    magnifierDiv.remove();
    magnifierDiv = null;
  }
}
