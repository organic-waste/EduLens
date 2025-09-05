// 滚动进度指示器

let scrollDiv = null;
let fillDiv = null;
let h1 = null;

function ScrollProgress() {
  if (!scrollDiv) return;
  const scrollTop   = window.scrollY;
  const docHeight   = document.documentElement.scrollHeight;
  const winHeight   = window.innerHeight;
  const progressPct = (scrollTop / (docHeight - winHeight)) * 100;
  const percent = Math.round(progressPct);
  // h1.textContent = percent + '%';
  // fillDiv.style.height = (100-percent) + '%';
  fillDiv.style.height = percent + '%';
}

export function activateScrollProgress() {
  if (!scrollDiv) {
    scrollDiv = document.createElement('div');
    scrollDiv.className = 'scroll-percent';

    fillDiv = document.createElement('div');
    fillDiv.className = 'scroll-fill';
    scrollDiv.appendChild(fillDiv);

    // const counterDiv = document.createElement('div');
    // counterDiv.className = 'scroll-counter';
    // h1 = document.createElement('h1');
    // h1.textContent = '0%';
    // counterDiv.appendChild(h1);
    // scrollDiv.appendChild(counterDiv);

    const cardDiv=document.getElementsByClassName("card-content")[0]
    if(cardDiv){
      cardDiv.appendChild(scrollDiv);
    }

  }
  window.addEventListener('scroll', ScrollProgress);
  ScrollProgress();
}

export function deactivateScrollProgress() {
  window.removeEventListener('scroll', ScrollProgress);
  if (scrollDiv) {
    scrollDiv.remove();
    scrollDiv = null;
    fillDiv = null;
    h1 = null;
  }
}
