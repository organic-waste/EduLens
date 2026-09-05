import type { FormEvent, RefObject } from "react";
import { BookOpen, SendHorizontal, X } from "lucide-react";
import { markdown } from "../../utils/markdown";
import type {
  Citation,
  ConversationMessage,
  MemoryChange,
  PageSelection,
  SummaryDocument,
  SummaryReference,
} from "../../learning.types";
import "../../styles/chat.css";

type LearningMemoryState = "mastered" | "confusing" | "review";

export function ChatPanel({
  messages,
  documents,
  prompt,
  busy,
  status,
  activeSummary,
  selectedPage,
  messagesRef,
  promptRef,
  onPrompt,
  onSend,
  onSelectPage,
  onSummarize,
  onClearSelection,
  onClearSummary,
  onCitation,
  onSupplement,
  onMemoryChange,
  updatingMemoryItemIds,
}: {
  messages: ConversationMessage[];
  documents: SummaryDocument[];
  prompt: string;
  busy: boolean;
  status: string;
  activeSummary: SummaryDocument | null;
  selectedPage: PageSelection | null;
  messagesRef: RefObject<HTMLElement | null>;
  promptRef: RefObject<HTMLTextAreaElement | null>;
  onPrompt: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onSelectPage: () => void;
  onSummarize: () => void;
  onClearSelection: () => void;
  onClearSummary: () => void;
  onCitation: (citation: Citation) => void;
  onSupplement: (answer: string) => void;
  onMemoryChange: (messageId: string, change: MemoryChange) => void;
  updatingMemoryItemIds: Set<string>;
}) {
  return (
    <>
      {activeSummary && (
        <div className="summary-context" aria-label="当前关联摘要">
          <BookOpen size={14} aria-hidden="true" />
          <span>相关摘要</span>
          <strong>{activeSummary.title}</strong>
          <button
            className="summary-context-close"
            type="button"
            title="移除摘要上下文"
            aria-label="移除摘要上下文"
            onClick={onClearSummary}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <section ref={messagesRef} className="messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-state">
            <strong>从一个问题开始</strong>
            <span>让 AI 帮你理解当前学习内容。</span>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              documents={documents}
              onCitation={onCitation}
              onSupplement={onSupplement}
              onMemoryChange={onMemoryChange}
              updatingMemoryItemIds={updatingMemoryItemIds}
              activeSummary={activeSummary}
            />
          ))
        )}
      </section>
      <form className="composer" onSubmit={onSend}>
        {selectedPage?.text && (
          <div
            className="page-selection-chip"
            title={selectedPage.text}
            aria-label="已引用网页选区"
          >
            <span className="page-selection-chip-label">已引用网页选区</span>
            <span className="page-selection-chip-text">{selectedPage.text}</span>
            <button
              type="button"
              className="page-selection-chip-remove"
              title="移除网页选区"
              aria-label="移除网页选区"
              disabled={busy}
              onClick={onClearSelection}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        <textarea
          ref={promptRef}
          rows={3}
          value={prompt}
          disabled={busy}
          onChange={(event) => onPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }}
          placeholder="输入你的问题..."
          required
        />
        <div className="composer-footer">
          <span className={`status${busy ? " loading" : ""}`}>{status}</span>
          <div className="composer-actions">
            <button className="tool-button" type="button" disabled={busy} onClick={onSelectPage}>
              引用网页选区
            </button>
            <button
              className="tool-button"
              type="button"
              disabled={busy || !selectedPage?.text}
              onClick={onSummarize}
            >
              生成摘要
            </button>
            <button
              className="send-button"
              type="submit"
              title="发送"
              aria-label="发送"
              disabled={busy}
            >
              <SendHorizontal className="action-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

function Message({
  message,
  documents,
  onCitation,
  onSupplement,
  onMemoryChange,
  updatingMemoryItemIds,
  activeSummary,
}: {
  message: ConversationMessage;
  documents: SummaryDocument[];
  onCitation: (citation: Citation) => void;
  onSupplement: (answer: string) => void;
  onMemoryChange: (messageId: string, change: MemoryChange) => void;
  updatingMemoryItemIds: Set<string>;
  activeSummary: SummaryDocument | null;
}) {
  const canSupplement =
    message.role === "assistant" &&
    !message.streaming &&
    Boolean(activeSummary && (message.uncovered || activeSummary));
  const relatedSummaryMap = new Map<string, SummaryReference>();
  for (const reference of message.summaryReferences || []) {
    relatedSummaryMap.set(reference.serverId || reference.id, reference);
  }
  // 兼容迁移前仅保存 citations 的历史对话。
  for (const citation of message.citations || []) {
    if (!citation.summaryId) continue;
    const summary = documents.find(
      (item) => item.serverId === citation.summaryId || item.id === citation.summaryId,
    );
    const reference: SummaryReference = {
      id: summary?.id || citation.summaryId,
      serverId: summary?.serverId || citation.summaryId,
      title: summary?.title || citation.summaryTitle || "未命名摘要",
    };
    relatedSummaryMap.set(reference.serverId || reference.id, reference);
  }
  const relatedSummaries = [...relatedSummaryMap.values()];
  const memoryTargets = new Map<string, { summaryItemId: string; topic?: string }>();
  for (const citation of message.citations || []) {
    if (!citation.summaryItemId) continue;
    memoryTargets.set(citation.summaryItemId, {
      summaryItemId: citation.summaryItemId,
      topic: citation.topic,
    });
  }
  const memoryStates = new Map(
    (message.memoryChanges || []).map((change) => [change.summaryItemId, change.state]),
  );
  return (
    <article className={`message ${message.role}`}>
      <span className="message-label">{message.role === "user" ? "我" : "AI 助手"}</span>
      {message.role === "assistant" ? (
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: markdown(message.content) }}
        />
      ) : (
        <p>{message.content}</p>
      )}
      {message.role === "user" && message.summaryReference && (
        <button
          className="message-summary-reference"
          type="button"
          onClick={() =>
            onCitation({
              summaryId: message.summaryReference?.serverId || message.summaryReference?.id,
            })
          }
        >
          <BookOpen size={14} aria-hidden="true" />
          <span>关联摘要</span>
          <strong>{message.summaryReference.title}</strong>
        </button>
      )}
      {message.role === "assistant" && relatedSummaries.length ? (
        <div className="message-summary-references">
          <span>相关摘要</span>
          {relatedSummaries.map((reference) => (
            <button
              type="button"
              key={reference.serverId || reference.id}
              onClick={() => onCitation({ summaryId: reference.serverId || reference.id })}
            >
              {reference.title}
            </button>
          ))}
        </div>
      ) : null}
      {message.memoryChanges?.length ? (
        <div className="memory-changes">
          {message.memoryChanges.map((change) => (
            <span key={change.summaryItemId}>
              {change.topic || "知识点"}：
              {{ mastered: "已掌握", confusing: "易混淆", review: "稍后复习" }[change.state] ||
                change.state}
            </span>
          ))}
        </div>
      ) : null}
      {canSupplement && (
        <button
          className="supplement-button"
          type="button"
          onClick={() => onSupplement(message.content)}
        >
              {message.uncovered ? "补充到当前摘要库" : "补充到当前摘要"}
            </button>
          )}
      {message.retrievalStatus === "no_reliable_evidence" ? (
        <p className="message-retrieval-notice">知识库无可靠依据，本回答未引用学习资料。</p>
      ) : null}
      {message.role === "assistant" && !message.streaming && memoryTargets.size ? (
        <div className="message-memory-actions">
          <span>标记学习状态</span>
          {[...memoryTargets.values()].map((target) => {
            const currentState = memoryStates.get(target.summaryItemId);
            return (
              <div className="memory-action-row" key={target.summaryItemId}>
                <strong>{target.topic || "知识点"}</strong>
                {(
                  [
                    ["mastered", "已掌握"],
                    ["confusing", "易混淆"],
                    ["review", "稍后复习"],
                  ] as const
                ).map(([state, label]) => (
                  <button
                    className={`memory-action memory-action--${state}${
                      currentState === state ? " is-active" : ""
                    }`}
                    type="button"
                    key={state}
                    disabled={updatingMemoryItemIds.has(target.summaryItemId)}
                    onClick={() =>
                      onMemoryChange(message.id, {
                        summaryItemId: target.summaryItemId,
                        topic: target.topic,
                        state: state as LearningMemoryState,
                      })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

