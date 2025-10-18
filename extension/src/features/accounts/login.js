import { createEl } from "../../utils/operateEl.js";
import { cloudSync } from "../../utils/cloudSync.js";
import eventManager from "../../utils/eventManager.js";

function showForm() {
  const shadowRoot = window.__EDULENS_SHADOW_ROOT__;

  // 如果已经存在登录界面，先移除
  const existingOverlay = shadowRoot.querySelector(".login-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const loginOverlay = createEl("div", { class: "login-overlay" });
  const loginContainer = createEl("div", {
    class: "login-container  login-mode open",
  });

  const closeBtn = createEl("button", {
    class: "login-close-btn icon-btn",
    innerHTML: "×",
  });

  eventManager.on(closeBtn, "click", () => {
    loginOverlay.remove();
  });

  const animationElements = createEl("div", { class: "animation-elements" });

  const element1 = createEl("div", {
    class: "anim-element anim-element-1 circle-shape",
  });
  const element2 = createEl("div", {
    class: "anim-element anim-element-2 square-shape",
  });
  const element3 = createEl("div", {
    class: "anim-element anim-element-3 triangle-shape",
  });
  const element4 = createEl("div", {
    class: "anim-element anim-element-4 heart-shape",
  });

  animationElements.appendChild(element1);
  animationElements.appendChild(element2);
  animationElements.appendChild(element3);
  animationElements.appendChild(element4);

  const loginForm = createLoginFormContent();
  loginContainer.appendChild(closeBtn);
  loginContainer.appendChild(animationElements);
  loginContainer.appendChild(loginForm);
  loginOverlay.appendChild(loginContainer);

  shadowRoot.appendChild(loginOverlay);

  eventManager.on(loginOverlay, "click", (e) => {
    if (e.target === loginOverlay) {
      loginOverlay.remove();
    }
  });

  eventManager.on(loginContainer, "click", (e) => {
    e.stopPropagation();
  });
}

// 登录表单
function createLoginFormContent() {
  const container = createEl("div", { class: "login-form-container" });
  const title = createEl("h2");
  title.textContent = chrome.i18n.getMessage("loginTitle");

  const form = createEl("form", { class: "login-form" });
  form.append(
    createInputGroup({
      type: "email",
      id: "login-email",
      placeholder: chrome.i18n.getMessage("emailPlaceholder"),
      label: chrome.i18n.getMessage("emailLabel"),
      required: true,
    }),
    createInputGroup({
      type: "password",
      id: "login-password",
      placeholder: chrome.i18n.getMessage("passwordPlaceholder"),
      label: chrome.i18n.getMessage("passwordLabel"),
      required: true,
    }),
    createEl("button", {
      type: "submit",
      class: "login-submit-btn button",
      textContent: chrome.i18n.getMessage("loginButton"),
    })
  );

  const errorMsg = createEl("div", { class: "login-error-message" });
  const switchLink = createEl("div", { class: "login-switch" });
  switchLink.innerHTML = `${chrome.i18n.getMessage(
    "noAccount"
  )} <a href="#" class="switch-to-register-link">${chrome.i18n.getMessage(
    "registerLink"
  )}</a>`;
  container.append(title, form, errorMsg, switchLink);

  eventManager.on(
    switchLink.querySelector(".switch-to-register-link"),
    "click",
    async (e) => {
      e.preventDefault();
      await switchToRegisterForm(container);
    }
  );

  eventManager.on(form, "submit", async (e) => {
    e.preventDefault();
    await handleLogin(form, errorMsg);
  });

  return container;
}

// 注册表单
function createRegisterFormContent() {
  const container = createEl("div", { class: "register-form-container" });

  const title = createEl("h2");
  title.textContent = chrome.i18n.getMessage("registerTitle");

  const form = createEl("form", { class: "register-form" });
  form.append(
    createInputGroup({
      type: "text",
      id: "register-username",
      placeholder: chrome.i18n.getMessage("usernamePlaceholder"),
      label: chrome.i18n.getMessage("usernameLabel"),
      required: true,
    }),
    createInputGroup({
      type: "email",
      id: "register-email",
      placeholder: chrome.i18n.getMessage("emailPlaceholder"),
      label: chrome.i18n.getMessage("emailLabel"),
      required: true,
    }),
    createInputGroup({
      type: "password",
      id: "register-password",
      placeholder: chrome.i18n.getMessage("passwordPlaceholder"),
      label: chrome.i18n.getMessage("passwordLabel"),
      required: true,
    }),
    createInputGroup({
      type: "password",
      id: "register-confirm-password",
      placeholder: chrome.i18n.getMessage("confirmPasswordPlaceholder"),
      label: chrome.i18n.getMessage("confirmPasswordLabel"),
      required: true,
    }),
    createEl("button", {
      type: "submit",
      class: "register-submit-btn button",
      textContent: chrome.i18n.getMessage("registerButton"),
    })
  );

  const errorMsg = createEl("div", { class: "register-error-message" });

  const switchLink = createEl("div", { class: "register-switch" });
  switchLink.innerHTML = `${chrome.i18n.getMessage(
    "hasAccount"
  )} <a href="#" class="switch-to-login-link">${chrome.i18n.getMessage(
    "loginLink"
  )}</a>`;

  container.append(title, form, errorMsg, switchLink);

  eventManager.on(
    switchLink.querySelector(".switch-to-login-link"),
    "click",
    async (e) => {
      e.preventDefault();
      await switchToLoginForm(container);
    }
  );

  eventManager.on(form, "submit", async (e) => {
    e.preventDefault();
    await handleRegister(form, errorMsg);
  });

  return container;
}

// 带动画的表单切换
async function switchToRegisterForm(currentContainer) {
  const parent = currentContainer.parentElement;
  parent.classList.remove("login-mode");
  parent.classList.add("register-mode");
  const animationElements = parent.querySelector(".animation-elements");
  const animElement = animationElements.querySelector(".anim-element-2");

  animElement.classList.add("anim-element-expand");

  // 等待动画展开
  await new Promise((resolve) => setTimeout(resolve, 400));

  const newContainer = createRegisterFormContent();
  currentContainer.remove();
  parent.appendChild(newContainer);

  await new Promise((resolve) => setTimeout(resolve, 200));
}

async function switchToLoginForm(currentContainer) {
  const parent = currentContainer.parentElement;
  parent.classList.remove("register-mode");
  parent.classList.add("login-mode");
  const animationElements = parent.querySelector(".animation-elements");
  const animElement = animationElements.querySelector(".anim-element-1");

  // 移除扩展类以恢复原状
  animElement.classList.remove("anim-element-expand");

  await new Promise((resolve) => setTimeout(resolve, 400));

  const newContainer = createLoginFormContent();
  currentContainer.remove();
  parent.appendChild(newContainer);
}

function createInputGroup({ type, id, placeholder, label, required }) {
  const group = createEl("div", { class: "input-group" });
  const labelEl = createEl("label");
  labelEl.setAttribute("for", id);
  labelEl.textContent = label;
  const input = createEl("input", { type, id, placeholder, required });

  eventManager.on(input, "focus", () => {
    input.style.borderColor = "var(--hover-color)";
    input.style.boxShadow = "0 0 0 3px rgba(84, 132, 201, 0.1)";
  });

  eventManager.on(input, "blur", () => {
    input.style.borderColor = "var(--secondary-color)";
    input.style.boxShadow = "none";
  });

  group.append(labelEl, input);
  return group;
}

// 登录和注册处理
async function handleLogin(form, errorEl) {
  const email = form.querySelector("#login-email").value.trim();
  const password = form.querySelector("#login-password").value.trim();

  if (!email || !password)
    return showError(errorEl, chrome.i18n.getMessage("fillEmailPassword"));
  if (!isValidEmail(email))
    return showError(errorEl, chrome.i18n.getMessage("validEmail"));

  const btn = form.querySelector(".login-submit-btn");
  const btnText = btn.textContent;
  btn.textContent = chrome.i18n.getMessage("loggingIn");
  btn.disabled = true;

  try {
    const res = await cloudSync.login({ email, password });
    if (res.status === "success") {
      hideError(errorEl);

      form.closest(".login-overlay").remove();
      updateLoginStatus(res.data.user);
      console.log(username + ":" + chrome.i18n.getMessage("loginSuccess"));
    } else {
      showError(errorEl, res.message || chrome.i18n.getMessage("loginFailed"));
    }
  } catch (error) {
    showError(errorEl, error.message || chrome.i18n.getMessage("networkError"));
  } finally {
    btn.textContent = btnText;
    btn.disabled = false;
  }
}

async function handleRegister(form, errorEl) {
  const username = form.querySelector("#register-username").value.trim();
  const email = form.querySelector("#register-email").value.trim();
  const password = form.querySelector("#register-password").value.trim();
  const confirmPassword = form
    .querySelector("#register-confirm-password")
    .value.trim();

  if (!username || !email || !password || !confirmPassword)
    return showError(errorEl, chrome.i18n.getMessage("fillAllFields"));
  if (!isValidEmail(email))
    return showError(errorEl, chrome.i18n.getMessage("validEmail"));
  if (username.length < 3)
    return showError(errorEl, chrome.i18n.getMessage("usernameMinLength"));
  if (password.length < 6)
    return showError(errorEl, chrome.i18n.getMessage("passwordMinLength"));
  if (password !== confirmPassword)
    return showError(errorEl, chrome.i18n.getMessage("passwordMismatch"));

  const btn = form.querySelector(".register-submit-btn");
  const btnText = btn.textContent;
  btn.textContent = chrome.i18n.getMessage("registering");
  btn.disabled = true;

  try {
    const res = await cloudSync.register({ username, email, password });
    if (res.status === "success") {
      hideError(errorEl);
      form.closest(".login-overlay").remove();
      updateLoginStatus(res.data.user);
      console.log(username + ":" + chrome.i18n.getMessage("loginSuccess"));
    } else {
      showError(errorEl, res.message);
    }
  } catch (error) {
    showError(errorEl, chrome.i18n.getMessage("networkError"));
  } finally {
    btn.textContent = btnText;
    btn.disabled = false;
  }
}

/* 工具函数 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function showError(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}
function hideError(el) {
  el.textContent = "";
  el.style.display = "none";
}

// 在面板上显示账号信息
export async function updateLoginStatus(user) {
  const shadow = window.__EDULENS_SHADOW_ROOT__;
  shadow.querySelector(".user-status-area")?.remove();
  const area = createEl("div", { class: "user-status-area" });
  area.innerHTML = `
    <div class="user-info">
      <span class="user-name">${user.username}</span>
    </div>
    <button class="logout-btn">${chrome.i18n.getMessage(
      "logoutButton"
    )}</button>
  `;

  eventManager.on(area.querySelector(".logout-btn"), "click", handleLogout);

  shadow.querySelector(".functions")?.append(area);

  async function handleLogout() {
    await cloudSync.clearAuth();
    window.__EDULENS_SHADOW_ROOT__.querySelector(".user-status-area")?.remove();
    showSuccessMessage(chrome.i18n.getMessage("logoutSuccess"));
  }
}

export async function activateLogin() {
  await cloudSync.init();

  // 如果本地有token，就验证有效性
  if (cloudSync.token) {
    const isValid = await cloudSync.validateToken();
    if (isValid && cloudSync.user) {
      updateLoginStatus(cloudSync.user);
    }
  } else {
    showForm();
  }
}
