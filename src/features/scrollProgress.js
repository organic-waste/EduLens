// 滚动进度指示器

export function createScrollProgressIndicator() {
  const percentDiv = document.createElement('div');
  percentDiv.className = 'scroll-percent';

  const fillDiv = document.createElement('div');
  fillDiv.className = 'scroll-fill';
  percentDiv.appendChild(fillDiv);

  // 百分比数字
  const counterDiv = document.createElement('div');
  counterDiv.className = 'scroll-counter';
  const h1 = document.createElement('h1');
  h1.textContent = '0%';
  counterDiv.appendChild(h1);
  percentDiv.appendChild(counterDiv);

  document.body.appendChild(percentDiv);

  function updateProgress() {
    const scrollTop   = window.scrollY;
    const docHeight   = document.documentElement.scrollHeight;
    const winHeight   = window.innerHeight;
    //docHeight - winHeight 才能得到需要滚动才能到底的剩余距离
    const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
    const percent = Math.round(progressPct);
    h1.textContent = percent + '%';
    fillDiv.style.height = percent + '%';
  }

  window.addEventListener('scroll', updateProgress);
  updateProgress();

  return {
    destroy() {
      window.removeEventListener('scroll', updateProgress);
      percentDiv.remove();
    }
  };
}
