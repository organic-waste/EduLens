/* 倒计时组件 */
import eventStore from "../../stores/eventStore.js";
import { createEl } from "../../utils/index.js";

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
  if (isNaN(minutes) || minutes <= 0) return; //排除错误的输入

  // 转换为毫秒
  remainingTime = minutes * 60 * 1000;

  const inputArea = countdownContainer.querySelector(".countdown-input-area");
  const displayArea = countdownContainer.querySelector(
    ".countdown-display-area"
  );

  inputArea.style.display = "none";
  displayArea.style.display = "flex";

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
  countdownDisplay.textContent = chrome.i18n.getMessage("countdownRemain", [
    minutes,
    seconds.toString().padStart(2, "0"),
  ]);
}

function countdownComplete() {
  countdownDisplay.textContent = chrome.i18n.getMessage("countdownEnd");
  setTimeout(resetCountdown, 2000);
}

function cancelCountdown() {
  clearInterval(countdownInterval);
  countdownDisplay.textContent = chrome.i18n.getMessage("countdownCancel");
  setTimeout(resetCountdown, 1000);
}

function resetCountdown() {
  clearInterval(countdownInterval);

  const inputArea = countdownContainer.querySelector(".countdown-input-area");
  const displayArea = countdownContainer.querySelector(
    ".countdown-display-area"
  );

  inputArea.style.display = "flex";
  displayArea.style.display = "none";

  countdownInput.value = "";
  remainingTime = 0;
}

export function activateCountdown() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;
  if (countdownContainer) return;
  countdownContainer = createEl("div", { class: "countdown-container" });

  const inputArea = createEl("div", { class: "function countdown-input-area" });
  countdownInput = createEl("input", {
    type: "text",
    class: "input",
    placeholder: chrome.i18n.getMessage("countdownPlaceholder"),
  });
  countdownButton = createEl("button", {
    class: "button",
    textContent: chrome.i18n.getMessage("countdownStartBtn"),
  });
  eventStore.on(countdownButton, "click", createCountdown);
  inputArea.append(countdownInput, countdownButton);

  const displayArea = createEl("div", {
    class: "function countdown-display-area",
    style: "display:none;",
  });
  countdownDisplay = createEl("div", { class: "countdown-display" });
  countdownCancel = createEl("button", {
    class: "delete-button",
    textContent: "×",
  });
  eventStore.on(countdownCancel, "click", cancelCountdown);
  displayArea.append(countdownDisplay, countdownCancel);

  countdownContainer.append(inputArea, displayArea);

  const funcDiv = shadowRoot.querySelector(".functions");
  if (funcDiv) {
    funcDiv.appendChild(countdownContainer);
  }

  // 正则输入验证
  eventStore.on(countdownInput, "input", (e) => {
    const value = e.target.value;
    if (!/^[0-9]*([.][0-9]{0,1})?$/.test(value)) {
      // console.log("正则不匹配");
      e.target.value = value.slice(0, -1);
    }
  });
}
