import { useEffect, useState } from "react";
import { BookOpen, RotateCcw } from "lucide-react";
import type { Citation, ReviewCard, ReviewEvaluation } from "../../learning.types";
import "../../styles/review.css";

export function ReviewPanel({
  cards,
  onCitation,
  onReview,
  onNext,
}: {
  cards: ReviewCard[];
  onCitation: (citation: Citation) => void;
  onReview: (card: ReviewCard, answer: string) => Promise<ReviewEvaluation>;
  onNext: (card: ReviewCard) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<ReviewEvaluation | null>(null);
  const card = cards[0];

  useEffect(() => {
    setSubmitting(false);
    setAnswer("");
    setEvaluation(null);
  }, [card?.learningUnitId]);

  async function submitReview() {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      const result = await onReview(card, answer);
      setEvaluation(result);
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
        {!evaluation ? (
          <>
            <textarea
              className="review-answer-input"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="写下你的回答..."
              rows={4}
              disabled={submitting}
            />
            <button
              className="review-reveal"
              type="button"
              disabled={!answer.trim() || submitting}
              onClick={() => void submitReview()}
            >
              {submitting ? "Agent 评估中..." : "提交回答"}
            </button>
          </>
        ) : (
          <>
            <div className={`review-evaluation review-evaluation--${evaluation.state}`}>
              <strong>
                {{ mastered: "已掌握", review: "建议复习", confusing: "还需理解" }[evaluation.state]}
              </strong>
              <span>{evaluation.feedback}</span>
            </div>
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
            <button className="review-next" type="button" onClick={() => onNext(card)}>
              下一张
            </button>
          </>
        )}
      </div>
    </section>
  );
}
