import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { X } from "lucide-react";
import { authManager } from "./services/authManager.js";
import {
  loadLearningProfile,
  saveLearningProfile,
  updateLearningMemory,
} from "./sidepanel/api/learningApi";
import "./profile.css";

type LearningState = "mastered" | "confusing" | "review";

interface LearningProfile {
  targetDirection: string;
  explanationLevel: "beginner" | "intermediate" | "advanced";
  summaryDepth: "concise" | "balanced" | "detailed";
  preferExamples: boolean;
  preferInterviewView: boolean;
}

interface LearningMemory {
  summaryItemId: string;
  state: LearningState;
  topic?: string;
  content?: string;
}

interface Account {
  username: string;
  email?: string;
  createdAt?: string;
}

const defaultProfile: LearningProfile = {
  targetDirection: "",
  explanationLevel: "beginner",
  summaryDepth: "balanced",
  preferExamples: false,
  preferInterviewView: false,
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请求失败，请稍后重试";
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function ProfilePage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<LearningProfile>(defaultProfile);
  const [memories, setMemories] = useState<LearningMemory[]>([]);
  const [status, setStatus] = useState("正在加载...");
  const [saving, setSaving] = useState(false);
  const [updatingMemory, setUpdatingMemory] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    if (!globalThis.chrome?.runtime) {
      setStatus("个人主页仅能在扩展中使用");
      return;
    }
    await authManager.init();
    const user = authManager.getUser() as Account | null;
    if (!user) {
      setStatus("请先登录后查看学习主页");
      return;
    }
    setAccount(user);
    await refresh();
  }

  async function refresh() {
    try {
      const data = (await loadLearningProfile()) as {
        profile: LearningProfile;
        memories: LearningMemory[];
      };
      setProfile({ ...defaultProfile, ...data.profile });
      setMemories(data.memories || []);
      setStatus("");
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("保存中...");
    try {
      const result = (await saveLearningProfile({
        ...profile,
        targetDirection: profile.targetDirection.trim(),
      })) as { profile: LearningProfile };
      setProfile({ ...defaultProfile, ...result.profile });
      setStatus("已保存");
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function updateMemory(memory: LearningMemory, state: LearningState) {
    setUpdatingMemory(memory.summaryItemId);
    try {
      await updateLearningMemory(memory.summaryItemId, state);
      await refresh();
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setUpdatingMemory(null);
    }
  }

  return (
    <main className="profile-shell">
      <header className="profile-header">
        <div>
          <p>EDULENS</p>
          <h1>个人学习主页</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          title="关闭"
          aria-label="关闭"
          onClick={() => window.close()}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      {account && (
        <section className="card account-card">
          <div className="avatar">{account.username.slice(0, 1).toLocaleUpperCase()}</div>
          <div>
            <h2>{account.username}</h2>
            <p>{account.email}</p>
            <small>{account.createdAt ? `加入于 ${formatDate(account.createdAt)}` : ""}</small>
          </div>
        </section>
      )}
      <form className="card form-card" onSubmit={saveProfile}>
        <div className="section-heading">
          <h2>学习画像</h2>
          <span>影响 AI 讲解与摘要风格</span>
        </div>
        <label>
          目标方向
          <input
            value={profile.targetDirection}
            onChange={(event) => setProfile({ ...profile, targetDirection: event.target.value })}
            placeholder="例如：前端工程师"
          />
        </label>
        <label>
          讲解等级
          <select
            value={profile.explanationLevel}
            onChange={(event) =>
              setProfile({
                ...profile,
                explanationLevel: event.target.value as LearningProfile["explanationLevel"],
              })
            }
          >
            <option value="beginner">入门：概念与步骤</option>
            <option value="intermediate">进阶：机制与实践</option>
            <option value="advanced">深入：边界与面试</option>
          </select>
        </label>
        <label>
          摘要概括程度
          <select
            value={profile.summaryDepth}
            onChange={(event) =>
              setProfile({
                ...profile,
                summaryDepth: event.target.value as LearningProfile["summaryDepth"],
              })
            }
          >
            <option value="concise">核心观点</option>
            <option value="balanced">均衡</option>
            <option value="detailed">详细学习笔记</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={profile.preferExamples}
            onChange={(event) => setProfile({ ...profile, preferExamples: event.target.checked })}
          />
          偏好示例辅助理解
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={profile.preferInterviewView}
            onChange={(event) =>
              setProfile({ ...profile, preferInterviewView: event.target.checked })
            }
          />
          偏好面试视角
        </label>
        <div className="form-footer">
          <span>{status}</span>
          <button className="primary-button" type="submit" disabled={saving || !account}>
            {saving ? "保存中..." : "保存学习画像"}
          </button>
        </div>
      </form>
      <section className="card memory-card">
        <div className="section-heading">
          <div>
            <h2>学习记忆</h2>
          </div>
        </div>
        <div className="memory-list">
          {memories.length ? (
            memories.map((memory) => (
              <article className="memory-item" key={memory.summaryItemId}>
                <div>
                  <strong>{memory.topic || "知识点"}</strong>
                  <p>{memory.content || memory.summaryItemId}</p>
                </div>
                <select
                  value={memory.state}
                  disabled={updatingMemory === memory.summaryItemId}
                  onChange={(event) =>
                    void updateMemory(memory, event.target.value as LearningState)
                  }
                >
                  <option value="mastered">已掌握</option>
                  <option value="review">待复习</option>
                  <option value="confusing">未掌握</option>
                </select>
              </article>
            ))
          ) : (
            <p className="empty-copy">
              还没有学习状态。与 AI 对话或在摘要中学习后，记忆会显示在这里。
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<ProfilePage />);
