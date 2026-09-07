export type ChatRole = "user" | "assistant" | "error";

export interface Citation {
  summaryId?: string;
  summaryTitle?: string;
  summaryItemId?: string;
  learningUnitId?: string;
  topic?: string;
  pageUrl?: string;
  quote?: string;
  selector?: string;
  prefix?: string;
  suffix?: string;
  textPosition?: { start: number; end: number };
}

export interface MemoryChange {
  learningUnitId: string;
  topic?: string;
  state: "mastered" | "confusing" | "review" | string;
}

export interface ReviewCard {
  learningUnitId: string;
  topic: string;
  question: string;
  content: string;
  citation?: Citation;
  sourceType?: SummaryItem["sourceType"];
  reviewCount: number;
}

export interface SummaryReference {
  id: string;
  serverId?: string;
  title: string;
}

export interface ConversationMessage {
  id: string;
  role: ChatRole;
  content: string;
  // 只读网页引用：对话界面保持简洁，发送和后续历史中仍保留完整上下文。
  pageSelection?: PageSelection;
  // 用户在提问时主动关联的摘要。
  summaryReference?: SummaryReference;
  // 助手本轮回答的相关摘要，包含主动关联与检索命中的摘要。
  summaryReferences?: SummaryReference[];
  citations?: Citation[];
  memoryChanges?: MemoryChange[];
  uncovered?: boolean;
  streaming?: boolean;
}

export interface ConversationMemory {
  summary: string;
  coveredMessageCount: number;
}

export interface SummaryItem {
  id: string;
  content: string;
  citation?: Citation;
  quote?: string;
  generated?: boolean;
  sourceType?: "ai-supplement" | string;
}

export interface SummaryGroup {
  id?: string;
  topic: string;
  items: SummaryItem[];
}

export interface SummaryDocument {
  // 客户端生成且永久稳定的身份，用于本地存储和 React 列表渲染
  id: string;
  // 服务端摘要身份，摘要同步到服务端后才会出现
  serverId?: string;
  title: string;
  source?: Citation;
  sourceUrl?: string;
  groups: SummaryGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PageSelection {
  text: string;
  pageTitle?: string;
  pageUrl?: string;
  citation?: Citation;
  selector?: string;
  prefix?: string;
  suffix?: string;
  textPosition?: { start: number; end: number };
}

export interface StreamEvent {
  type: "ready" | "status" | "delta" | "done" | "error" | "message";
  content?: string;
  answer?: string;
  citations?: Citation[];
  memoryChanges?: MemoryChange[];
  uncovered?: boolean;
  conversationSummary?: string;
  compressedMessageCount?: number;
  message?: string;
}
