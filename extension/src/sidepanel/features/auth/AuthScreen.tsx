import { type FormEvent, useState } from "react";
import { authManager } from "../../../services/authManager.js";
import "../../styles/auth.css";

type AuthMode = "login" | "register";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isRegister && !account.trim()) return setError("请填写用户名或邮箱。");
    if (isRegister && username.trim().length < 3) return setError("用户名至少需要 3 个字符。");
    if (isRegister && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("请输入有效的邮箱地址。");
    if (password.length < 6) return setError("密码至少需要 6 个字符。");
    if (isRegister && password !== confirmation) return setError("两次输入的密码不一致。");
    setSubmitting(true);
    setError("");
    try {
      const result = isRegister
        ? await authManager.register({ username: username.trim(), email: email.trim(), password })
        : await authManager.login({ account: account.trim(), password });
      if (result.status !== "success") throw new Error(result.message || "认证失败");
      onAuthenticated();
    } catch (reason) {
      setError(toError(reason));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="auth-screen">
      <div className="auth-card">
        <div className="auth-animation-elements" aria-hidden="true">
          <span className="auth-anim-element auth-anim-circle" />
          <span className="auth-anim-element auth-anim-square" />
        </div>
        <p className="eyebrow">EDULENS</p>
        <h1>{isRegister ? "创建 EduLens 账号" : "登录学习助手"}</h1>
        <p className="auth-description">
          {isRegister
            ? "注册后即可保存学习画像、摘要和个性化学习记忆。"
            : "登录后即可使用 AI 对话、摘要库和个性化学习记忆。"}
        </p>
        <form className="auth-form" onSubmit={submit} noValidate>
          {isRegister ? (
            <>
              <label>
                用户名
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="至少 3 个字符"
                />
              </label>
              <label>
                邮箱
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                />
              </label>
            </>
          ) : (
            <label>
              用户名或邮箱
              <input
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                autoComplete="username"
                placeholder="输入用户名或邮箱"
              />
            </label>
          )}
          <label>
            密码
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="至少 6 个字符"
            />
          </label>
          {isRegister && (
            <label>
              确认密码
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="再次输入密码"
              />
            </label>
          )}
          <p className="auth-error" role="alert">
            {error}
          </p>
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? "处理中..." : isRegister ? "注册并进入" : "登录"}
          </button>
        </form>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setError("");
          }}
        >
          {isRegister ? "已有账号？去登录" : "还没有账号？去注册"}
        </button>
      </div>
    </section>
  );
}

