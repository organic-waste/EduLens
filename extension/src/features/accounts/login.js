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
  const loginContainer = createEl("div", { class: "login-container" });
  const closeBtn = createEl("button", {
    class: "login-close-btn",
    innerHTML: "×",
  });

  eventManager.on(closeBtn, "click", () => {
    loginOverlay.remove();
  });

  const loginForm = createLoginFormContent();
  loginContainer.appendChild(closeBtn);
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

//登录表单
function createLoginFormContent() {
  const container = createEl("div", { class: "login-form-container" });
  const title = createEl("h2");
  title.textContent = "登录 EduLens 账号";

  const form = createEl("form", { class: "login-form" });
  form.append(
    createInputGroup({
      type: "email",
      id: "login-email",
      placeholder: "请输入邮箱",
      label: "邮箱",
      required: true,
    }),
    createInputGroup({
      type: "password",
      id: "login-password",
      placeholder: "请输入密码",
      label: "密码",
      required: true,
    }),
    createEl("button", {
      type: "submit",
      class: "login-submit-btn",
      textContent: "登录",
    })
  );

  const errorMsg = createEl("div", { class: "login-error-message" });
  const switchLink = createEl("div", { class: "login-switch" });
  switchLink.innerHTML = `还没有账号？ <a href="#" class="switch-to-register-link">立即注册</a>`;
  container.append(title, form, errorMsg, switchLink);

  eventManager.on(
    switchLink.querySelector(".switch-to-register-link"),
    "click",
    (e) => {
      e.preventDefault();
      switchToRegisterForm(container);
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
  title.textContent = "注册 EduLens 账号";

  const form = createEl("form", { class: "register-form" });
  form.append(
    createInputGroup({
      type: "text",
      id: "register-username",
      placeholder: "请输入用户名",
      label: "用户名",
      required: true,
    }),
    createInputGroup({
      type: "email",
      id: "register-email",
      placeholder: "请输入邮箱",
      label: "邮箱",
      required: true,
    }),
    createInputGroup({
      type: "password",
      id: "register-password",
      placeholder: "请输入密码（至少6位）",
      label: "密码",
      required: true,
    }),
    createInputGroup({
      type: "password",
      id: "register-confirm-password",
      placeholder: "请再次输入密码",
      label: "确认密码",
      required: true,
    }),
    createEl("button", {
      type: "submit",
      class: "register-submit-btn",
      textContent: "注册",
    })
  );

  const errorMsg = createEl("div", { class: "register-error-message" });

  const switchLink = createEl("div", { class: "register-switch" });
  switchLink.innerHTML = `已有账号？ <a href="#" class="switch-to-login-link">立即登录</a>`;

  container.append(title, form, errorMsg, switchLink);

  eventManager.on(
    switchLink.querySelector(".switch-to-login-link"),
    "click",
    (e) => {
      e.preventDefault();
      switchToLoginForm(container);
    }
  );
  eventManager.on(form, "submit", async (e) => {
    e.preventDefault();
    await handleRegister(form, errorMsg);
  });

  return container;
}

function createInputGroup({ type, id, placeholder, label, required }) {
  const group = createEl("div", { class: "input-group" });
  const labelEl = createEl("label");
  labelEl.setAttribute("for", id);
  labelEl.textContent = label;
  const input = createEl("input", { type, id, placeholder, required });

  eventManager.on(input, "focus", () => (input.style.borderColor = "#4f46e5"));
  eventManager.on(input, "blur", () => (input.style.borderColor = "#d1d5db"));

  group.append(labelEl, input);
  return group;
}

function switchToRegisterForm(container) {
  container.parentNode.replaceChild(createRegisterFormContent(), container);
}
function switchToLoginForm(container) {
  container.parentNode.replaceChild(createLoginFormContent(), container);
}

// 登录和注册处理
async function handleLogin(form, errorEl) {
  const email = form.querySelector("#login-email").value.trim();
  const password = form.querySelector("#login-password").value.trim();

  if (!email || !password) return showError(errorEl, "请填写邮箱和密码");
  if (!isValidEmail(email)) return showError(errorEl, "请输入有效的邮箱地址");

  const btn = form.querySelector(".login-submit-btn");
  const btnText = btn.textContent;
  btn.textContent = "登录中...";
  btn.disabled = true;

  try {
    const res = await cloudSync.login({ email, password });
    if (res.status === "success") {
      hideError(errorEl);
      form.closest(".login-overlay").remove();
      updateLoginStatus(res.data.user);
      showSuccessMessage("登录成功");
    } else {
      showError(errorEl, res.message || "登录失败");
    }
  } catch (error) {
    showError(errorEl, error.message || "网络错误，请稍后重试");
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
    return showError(errorEl, "请填写所有字段");
  if (!isValidEmail(email)) return showError(errorEl, "请输入有效的邮箱地址");
  if (username.length < 3) return showError(errorEl, "用户名至少需要3个字符");
  if (password.length < 6) return showError(errorEl, "密码至少需要6个字符");
  if (password !== confirmPassword)
    return showError(errorEl, "两次输入的密码不一致");

  const btn = form.querySelector(".register-submit-btn");
  const btnText = btn.textContent;
  btn.textContent = "注册中...";
  btn.disabled = true;

  try {
    const res = await cloudSync.register({ username, email, password });

    if (res.status === "success") {
      cloudSync.token = res.token;
      cloudSync.user = res.data.user;
      cloudSync.isOnline = true;
      await chrome.storage.local.set({
        cloudToken: res.token,
        cloudUser: res.data.user,
      });
      hideError(errorEl);
      form.closest(".login-overlay").remove();
      updateLoginStatus(res.data.user);
      showSuccessMessage("注册成功");
    } else {
      showError(errorEl, res.message);
    }
  } catch (error) {
    showError(errorEl, "网络错误，请稍后重试");
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
function showSuccessMessage(msg) {
  console.log("Success", msg);
}

export async function updateLoginStatus(user) {
  const shadow = window.__EDULENS_SHADOW_ROOT__;
  shadow.querySelector(".user-status-area")?.remove();
  const area = createEl("div", { class: "user-status-area" });
  area.innerHTML = `
    <div class="user-avatar">${user.username[0].toUpperCase()}</div>
    <div class="user-info">
      <span class="user-name">${user.username}</span>
      <span class="user-email">${user.email}</span>
    </div>
    <button class="logout-btn">退出</button>
  `;

  eventManager.on(area.querySelector(".logout-btn"), "click", handleLogout);

  shadow.querySelector(".card-content")?.prepend(area);

  async function handleLogout() {
    await chrome.storage.local.remove(["cloudToken", "cloudUser"]);
    cloudSync.token = null;
    cloudSync.user = null;
    cloudSync.isOnline = false;
    window.__EDULENS_SHADOW_ROOT__.querySelector(".user-status-area")?.remove();
    showSuccessMessage("已退出登录");
  }
}

export function activateLogin() {
  showForm();
}

export async function checkAndUpdateLoginStatus() {
  await cloudSync.init();
  if (cloudSync.isOnline && cloudSync.user) {
    updateLoginStatus(cloudSync.user);
    return true;
  }
  return false;
}
