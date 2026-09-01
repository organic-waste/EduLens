import type { Citation, SummaryDocument, SummaryItem } from "./types";

type SummaryInput = Partial<SummaryDocument> & {
  _id?: string;
  remoteId?: string;
};

export function normalizeSummaryDocument(summary: SummaryInput | null): SummaryDocument | null {
  if (!summary) return null;
  // 兼容迁移前已缓存的 `_id` / `remoteId`，但标准化后的前端对象只暴露 serverId。
  const { _id: legacyServerId, remoteId: legacyRemoteId, ...document } = summary;
  const source = document.source || {};
  const sourceUrl = source.pageUrl || document.sourceUrl || document.groups
    ?.flatMap((group) => group.items || [])
    .find((item) => item.citation?.pageUrl)?.citation?.pageUrl;
  const groups = document.groups?.length ? document.groups : [{ topic: "知识点", items: [] }];
  return {
    ...document,
    id: document.id || crypto.randomUUID(),
    serverId: document.serverId || legacyServerId || legacyRemoteId,
    title: document.title || "网页摘要",
    source: { ...source, pageUrl: sourceUrl },
    sourceUrl,
    groups: groups.map((group) => ({
      ...group,
      topic: group.topic || "知识点",
      items: (group.items || []).map((item) => normalizeItem(item, source, sourceUrl)),
    })),
  };
}

function normalizeItem(item: SummaryItem, source: Citation, sourceUrl?: string): SummaryItem {
  if (item.sourceType === "ai-supplement") {
    const { citation: _citation, quote: _quote, ...plainItem } = item;
    return plainItem;
  }
  return {
    ...item,
    citation: {
      ...source,
      ...item.citation,
      pageUrl: item.citation?.pageUrl || sourceUrl,
      quote: item.citation?.quote || item.quote || source.quote,
    },
  };
}

export function sourceKey(summary: SummaryDocument): string {
  return (summary.sourceUrl || "").split("#")[0].replace(/\/$/, "");
}

export function mergeSummaryDocuments(existing: SummaryDocument, incoming: SummaryDocument): SummaryDocument {
  const groupsByTopic = new Map(existing.groups.map((group) => [
    group.topic.trim().toLocaleLowerCase(),
    { ...group, items: [...group.items] },
  ]));
  incoming.groups.forEach((group) => {
    const key = group.topic.trim().toLocaleLowerCase();
    const current = groupsByTopic.get(key);
    if (!current) {
      groupsByTopic.set(key, { ...group, items: [...group.items] });
      return;
    }
    const existingQuotes = new Set(current.items.map((item) => item.citation?.quote || item.quote || item.content));
    group.items.forEach((item) => {
      const quote = item.citation?.quote || item.quote || item.content;
      if (!existingQuotes.has(quote)) {
        current.items.push(item);
        existingQuotes.add(quote);
      }
    });
  });
  return normalizeSummaryDocument({
    ...existing,
    groups: [...groupsByTopic.values()],
    updatedAt: incoming.updatedAt || new Date().toISOString(),
  })!;
}

export function mergeSummariesBySource(documents: SummaryDocument[]): SummaryDocument[] {
  const summariesBySource = new Map<string, SummaryDocument>();
  documents.forEach((summary) => {
    const key = sourceKey(summary) || summary.id;
    const existing = summariesBySource.get(key);
    summariesBySource.set(key, existing ? mergeSummaryDocuments(existing, summary) : summary);
  });
  return [...summariesBySource.values()];
}

export function getCitation(summary: SummaryDocument, item: SummaryItem): Citation {
  const source = summary.source || {};
  return {
    ...source,
    ...item.citation,
    pageUrl: item.citation?.pageUrl || source.pageUrl || summary.sourceUrl,
    quote: item.citation?.quote || item.quote || source.quote,
    selector: item.citation?.selector || source.selector,
  };
}

export function cloneSummary(summary: SummaryDocument): SummaryDocument {
  return JSON.parse(JSON.stringify(summary)) as SummaryDocument;
}

export function formatTime(value?: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value || Date.now()));
}
