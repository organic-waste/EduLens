// 阅读聚光灯
let readingSpotlightDiv = null;

function ReadingSpotlight(e) {
  if (!readingSpotlightDiv) return;
  
  // 计算聚光灯位置
  const spotlightHeight = 6; // 6vh
  const vh = window.innerHeight / 100;
  const topPosition = e.clientY - (spotlightHeight * vh / 2);
  
  readingSpotlightDiv.style.transform = `translateY(${topPosition}px)`;
}

export function activateReadingSpotlight() {
  if (!readingSpotlightDiv) {
    readingSpotlightDiv = document.createElement('div');
    readingSpotlightDiv.className = 'reading-spotlight';
    document.body.appendChild(readingSpotlightDiv);
    
    const vh = window.innerHeight / 100;
    const initialTop = (window.innerHeight / 2) - (6 * vh / 2);
    readingSpotlightDiv.style.transform = `translateY(${initialTop}px)`;
  }
  
  readingSpotlightDiv.style.display = 'block';
  window.addEventListener('mousemove', ReadingSpotlight);
}

export function deactivateReadingSpotlight() {
  window.removeEventListener('mousemove', ReadingSpotlight);
  if (readingSpotlightDiv) {
    readingSpotlightDiv.style.display = 'none';
  }
}