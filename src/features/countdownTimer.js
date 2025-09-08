// 倒计时组件
let countdownContainer = null;
let countdownInput = null;
let countdownButton = null;
let countdownDisplay = null;
let countdownCancel = null;
let countdownInterval = null;
let remainingTime = 0;

function createCountdown() {
  if (!countdownInput.value.trim()) return;
  
  const minutes = parseFloat(countdownInput.value);
  if (isNaN(minutes) || minutes <= 0) return;
  
  // 转换为毫秒
  remainingTime = minutes * 60 * 1000;
  
  // 隐藏输入区域，显示倒计时区域
  const inputArea = countdownContainer.querySelector('.countdown-input-area');
  const displayArea = countdownContainer.querySelector('.countdown-display-area');
  
  inputArea.style.display = 'none';
  displayArea.style.display = 'flex'; 
  
  startCountdown();
}

function startCountdown() {
  clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
    remainingTime -= 1000;
    
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      countdownComplete();
      return;
    }
    
    updateDisplay();
  }, 1000);
  
  updateDisplay();
}

function updateDisplay() {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  countdownDisplay.textContent = `还剩 ${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

function countdownComplete() {
  countdownDisplay.textContent = '倒计时结束';
  
  setTimeout(() => {
    resetCountdown();
  }, 2000);
}

function cancelCountdown() {
  clearInterval(countdownInterval);
  countdownDisplay.textContent = '终止倒计时';
  
  setTimeout(() => {
    resetCountdown();
  }, 1000);
}

function resetCountdown() {
  clearInterval(countdownInterval);
  
  const inputArea = countdownContainer.querySelector('.countdown-input-area');
  const displayArea = countdownContainer.querySelector('.countdown-display-area');
  
  inputArea.style.display = 'flex';
  displayArea.style.display = 'none';
  
  countdownInput.value = '';
  remainingTime = 0;
}

export function activateCountdown() {
  if (countdownContainer) return;
  
  countdownContainer = document.createElement('div');
  countdownContainer.className = 'countdown-container';
  
  // 输入区域
  const inputArea = document.createElement('div');
  inputArea.className = 'countdown-input-area';
  
  countdownInput = document.createElement('input');
  countdownInput.type = 'text';
  countdownInput.className = 'countdown-input';
  countdownInput.placeholder = '输入分钟数（如1.5）';
  
  countdownButton = document.createElement('button');
  countdownButton.className = 'countdown-button';
  countdownButton.textContent = '开始倒计时';
  countdownButton.addEventListener('click', createCountdown);
  
  inputArea.appendChild(countdownInput);
  inputArea.appendChild(countdownButton);
  
  // 倒计时显示区域
  const displayArea = document.createElement('div');
  displayArea.className = 'countdown-display-area';
  displayArea.style.display = 'none'; // 初始隐藏
  
  countdownDisplay = document.createElement('div');
  countdownDisplay.className = 'countdown-display';
  
  countdownCancel = document.createElement('button');
  countdownCancel.className = 'countdown-cancel';
  countdownCancel.innerHTML = '×';
  countdownCancel.addEventListener('click', cancelCountdown);
  
  displayArea.appendChild(countdownDisplay);
  displayArea.appendChild(countdownCancel);
  
  countdownContainer.appendChild(inputArea);
  countdownContainer.appendChild(displayArea);
  
  // 添加到功能区域
  const functionsDiv = document.querySelector('.functions');
  if (functionsDiv) {
    functionsDiv.appendChild(countdownContainer);
  }
  
  // 输入验证
  countdownInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (!/^[0-9]*([.][0-9]?)?$/.test(value)) {
      e.target.value = value.slice(0, -1);
    }
  });
}