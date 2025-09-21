// 滚动进度指示器
import eventManager from '../utils/eventManager.js';
import { createEl } from '../utils/operateEl.js';

let scrollDiv = null;
let fillDiv = null;
// let h1 = null;
let cardDiv=null;

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
  scrollDiv=createEl('div',{class:'scroll-percent'});
  fillDiv=createEl('div',{class:'scroll-fill'});
  scrollDiv.appendChild(fillDiv);

  cardDiv=document.querySelector('.card-content');

    // const counterDiv = document.createElement('div');
    // counterDiv.className = 'scroll-counter';
    // h1 = document.createElement('h1');
    // h1.textContent = '0%';
    // counterDiv.appendChild(h1);
    // scrollDiv.appendChild(counterDiv);

    if(cardDiv){
      const funcDiv=createEl('div',{class:'functions'});
      funcDiv.appendChild(scrollDiv);
      cardDiv.appendChild(funcDiv);
    }

  }
  eventManager.on(window,'scroll', ScrollProgress);
  ScrollProgress();
}

export function deactivateScrollProgress() {
  eventManager.off(window,'scroll', ScrollProgress);
  if (scrollDiv) {
    scrollDiv.remove();
    scrollDiv = null;
    fillDiv = null;
    h1 = null;
  }
}
