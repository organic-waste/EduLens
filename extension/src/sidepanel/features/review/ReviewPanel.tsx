import { useEffect, useState } from "react";
import { BookOpen, RotateCcw } from "lucide-react";
import type { Citation, ReviewCard } from "../../learning.types";
import "../../styles/review.css";

export function ReviewPanel({
  cards,
  onCitation,
  onReview,
}: {
  cards: ReviewCard[];
  onCitation: (citation: Citation) => void;
  onReview: (card: ReviewCard, remembered: boolean) => Promise<void>;
}) {
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const card = cards[0];

  useEffect(() => {
    setRevealed(false);
    setSubmitting(false);
  }, [card?.learningUnitId]);

  async function submitReview(remembered: boolean) {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      await onReview(card, remembered);
    } finally {
      // 请求失败时卡片仍在队列中，按钮恢复后可安全重试。
      setSubmitting(false);
    }
  }

  if (!card) {
    return (
      <section className="review-panel review-panel--complete">
        <RotateCcw size={28} aria-hidden="true" />
        <strong>今日复习已完成</strong>
        <span>下次到期的知识点会自动出现在这里。</span>
      </section>
    );
  }

  return (
    <section className="review-panel">
      <header className="review-heading">
        <div>
          <p>今日待复习 {cards.length} 条</p>
          <h2>{card.topic}</h2>
        </div>
        <RotateCcw size={20} aria-hidden="true" />
      </header>
      <div className="review-card">
        <span className="review-label">主动回忆</span>
        <p>{card.question}</p>
        {!revealed ? (
          <button className="review-reveal" type="button" onClick={() => setRevealed(true)}>
            查看答案
          </button>
        ) : (
          <>
            <div className="review-answer">{card.content}</div>
            {card.citation?.pageUrl ? (
              <button
                className="review-source"
                type="button"
                onClick={() => onCitation(card.citation!)}
              >
                <BookOpen size={14} aria-hidden="true" />
                查看网页原文
              </button>
            ) : (
              <p className="review-generated-note">AI 补充内容，无可回跳的网页原文</p>
            )}
            <div className="review-feedback">
              <span>刚才回忆得怎样？</span>
              <button type="button" disabled={submitting} onClick={() => void submitReview(false)}>
                没记住
              </button>
              <button type="button" disabled={submitting} onClick={() => void submitReview(true)}>
                记住了
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
