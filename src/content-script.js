// 鼠标高亮功能
let highlightDiv = null;
function showHighlight(e) {
  if (!highlightDiv) {
    highlightDiv = document.createElement('div');
    highlightDiv.style.position = 'fixed';
    highlightDiv.style.width = '40px';
    highlightDiv.style.height = '40px';
    highlightDiv.style.borderRadius = '50%';
    highlightDiv.style.background = 'rgba(255,255,0,0.5)';
    highlightDiv.style.pointerEvents = 'none';
    highlightDiv.style.zIndex = '9999';
    document.body.appendChild(highlightDiv);
  }
  highlightDiv.style.left = (e.clientX - 20) + 'px';
  highlightDiv.style.top = (e.clientY - 20) + 'px';
}
function toggleHighlight(e) {
  if (e.altKey && e.key === 'h') {
    if (highlightDiv) {
      highlightDiv.remove();
      highlightDiv = null;
      document.removeEventListener('mousemove', showHighlight);
    } else {
      document.addEventListener('mousemove', showHighlight);
    }
  }
}
window.addEventListener('keydown', toggleHighlight);

// 聚光灯功能
let spotlightDiv = null;
function showSpotlight(e) {
  if (!spotlightDiv) {
    spotlightDiv = document.createElement('div');
    spotlightDiv.style.position = 'fixed';
    spotlightDiv.style.width = '120px';
    spotlightDiv.style.height = '120px';
    spotlightDiv.style.borderRadius = '50%';
    spotlightDiv.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.7)';
    spotlightDiv.style.pointerEvents = 'none';
    spotlightDiv.style.zIndex = '9999';
    document.body.appendChild(spotlightDiv);
  }
  spotlightDiv.style.left = (e.clientX - 60) + 'px';
  spotlightDiv.style.top = (e.clientY - 60) + 'px';
}
function toggleSpotlight(e) {
  if (e.altKey && e.key === 's') {
    if (spotlightDiv) {
      spotlightDiv.remove();
      spotlightDiv = null;
      document.removeEventListener('mousemove', showSpotlight);
    } else {
      document.addEventListener('mousemove', showSpotlight);
    }
  }
}
window.addEventListener('keydown', toggleSpotlight);

// 放大镜功能
let magnifierDiv = null;
function showMagnifier(e) {
  if (!magnifierDiv) {
    magnifierDiv = document.createElement('div');
    magnifierDiv.style.position = 'fixed';
    magnifierDiv.style.width = '100px';
    magnifierDiv.style.height = '100px';
    magnifierDiv.style.borderRadius = '50%';
    magnifierDiv.style.overflow = 'hidden';
    magnifierDiv.style.border = '2px solid #2196f3';
    magnifierDiv.style.boxShadow = '0 0 8px 2px rgba(33,150,243,0.3)';
    magnifierDiv.style.pointerEvents = 'none';
    magnifierDiv.style.zIndex = '9999';
    magnifierDiv.style.background = '#fff';
    document.body.appendChild(magnifierDiv);
  }
  magnifierDiv.style.left = (e.clientX - 50) + 'px';
  magnifierDiv.style.top = (e.clientY - 50) + 'px';
  // 简单放大效果（仅放大鼠标区域截图，实际项目可用 canvas 实现更复杂效果）
}
function toggleMagnifier(e) {
  if (e.altKey && e.key === 'm') {
    if (magnifierDiv) {
      magnifierDiv.remove();
      magnifierDiv = null;
      document.removeEventListener('mousemove', showMagnifier);
    } else {
      document.addEventListener('mousemove', showMagnifier);
    }
  }
}
window.addEventListener('keydown', toggleMagnifier);
