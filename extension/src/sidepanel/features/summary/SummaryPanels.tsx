import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { cloneSummary, formatTime } from "../../utils/summary";
import type { SummaryDocument, SummaryItem } from "../../learning.types";
import "../../styles/summary.css";

function toError(error: unknown) {
  return error instanceof Error ? error.message : "请求失败，请稍后重试";
}

export function SummaryLibrary({
  documents,
  onOpen,
  onChat,
}: {
  documents: SummaryDocument[];
  onOpen: (summary: SummaryDocument) => void;
  onChat: (summary: SummaryDocument) => void;
}) {
  return (
    <section className="history">
      <div className="history-heading">
        <h2>摘要库</h2>
      </div>
      <div className="history-list">
        {documents.length ? (
          documents.map((record) => (
            <article className="history-item" key={record.id}>
              <button className="history-main" type="button" onClick={() => onOpen(record)}>
                <strong>{record.title}</strong>
                <span>
                  {formatTime(record.updatedAt || record.createdAt)} ·{" "}
                  {record.groups.reduce((count, group) => count + group.items.length, 0)} 个知识点
                </span>
              </button>
              <button
                className="history-chat"
                type="button"
                title="围绕摘要提问"
                aria-label="围绕摘要提问"
                onClick={() => onChat(record)}
              >
                <MessageCircle className="action-icon" aria-hidden="true" />
              </button>
            </article>
          ))
        ) : (
          <p className="history-empty">还没有保存的摘要</p>
        )}
      </div>
    </section>
  );
}

export function SummaryPanel({
  summary,
  onClose,
  onCitation,
  onSave,
  setStatus,
}: {
  summary: SummaryDocument;
  onClose: () => void;
  onCitation: (item: SummaryItem) => void;
  onSave: (summary: SummaryDocument) => Promise<void>;
  setStatus: (status: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SummaryDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const document = draft || summary;
  function edit() {
    setDraft(cloneSummary(summary));
    setEditing(true);
  }
  function updateTitle(value: string) {
    setDraft((current) => (current ? { ...current, title: value } : current));
  }
  function updateItem(groupIndex: number, itemIndex: number, content: string) {
    setDraft((current) => {
      if (!current) return current;
      const next = cloneSummary(current);
      next.groups[groupIndex].items[itemIndex].content = content;
      return next;
    });
  }
  async function save() {
    if (!draft) return;
    const clean = cloneSummary(draft);
    if (
      !clean.title.trim() ||
      clean.groups.some((group) => group.items.some((item) => !item.content.trim()))
    ) {
      setStatus("标题和知识点内容不能为空");
      return;
    }
    clean.title = clean.title.trim();
    clean.groups.forEach((group) =>
      group.items.forEach((item) => {
        item.content = item.content.trim();
      }),
    );
    setSaving(true);
    setStatus("正在保存摘要...");
    try {
      await onSave(clean);
      setEditing(false);
      setDraft(null);
    } catch (error) {
      setStatus(toError(error));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="summary">
      <div className="summary-heading">
        {editing ? (
          <input
            className="summary-title-input"
            value={document.title}
            onChange={(event) => updateTitle(event.target.value)}
            aria-label="摘要标题"
          />
        ) : (
          <h2>{document.title}</h2>
        )}
        <div className="summary-actions">
          {editing ? (
            <>
              <button
                className="summary-edit-button"
                type="button"
                disabled={saving}
                onClick={() => void save()}
              >
                保存
              </button>
              <button
                className="summary-edit-button"
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setDraft(null);
                }}
              >
                取消
              </button>
            </>
          ) : (
            <button className="summary-edit-button" type="button" onClick={edit}>
              编辑
            </button>
          )}
        </div>
        <button
          className="return-button"
          type="button"
          title="围绕摘要提问"
          aria-label="围绕摘要提问"
          onClick={onClose}
        >
          <MessageCircle className="action-icon" aria-hidden="true" />
        </button>
      </div>
      <div className="summary-items">
        {document.groups.map((group, groupIndex) => (
          <section className="summary-group" key={group.id || `${group.topic}-${groupIndex}`}>
            <h3>{group.topic}</h3>
            {group.items.map((item, itemIndex) => (
              <article className="summary-item" key={item.id}>
                {editing ? (
                  <textarea
                    className="summary-content-editor"
                    value={item.content}
                    onChange={(event) => updateItem(groupIndex, itemIndex, event.target.value)}
                    aria-label={`${group.topic} 第 ${itemIndex + 1} 个知识点`}
                  />
                ) : item.sourceType === "ai-supplement" ? (
                  <p className="summary-content summary-content--plain">
                    {itemIndex + 1}. {item.content}
                  </p>
                ) : (
                  <button
                    className="summary-content"
                    type="button"
                    title="回到网页引用位置"
                    onClick={() => onCitation(item)}
                  >
                    {itemIndex + 1}. {item.content}
                  </button>
                )}
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
