const express = require("express");
const SummaryDocument = require("../models/summaryDocument");
const auth = require("../middleware/auth");
const {
  syncSummaryVectors,
} = require("../agent/retrieval");

const router = express.Router();

function normalizeSummarySource(source, sourceUrl, groups) {
  const itemCitation = groups
    .flatMap((group) => group.items || [])
    .find((item) => item.citation?.pageUrl)?.citation;
  const pageUrl = source?.pageUrl || sourceUrl || itemCitation?.pageUrl;
  if (!pageUrl) return null;

  return {
    ...source,
    pageUrl,
    citation: source?.citation || itemCitation,
  };
}

function attachSourceToItems(groups, source) {
  return groups.map((group) => ({
    ...group,
    items: (group.items || []).map((item) => {
      if (item.sourceType === "ai-supplement") {
        const { citation, quote, ...plainItem } = item;
        return plainItem;
      }
      return {
        ...item,
        citation: {
          ...source.citation,
          ...item.citation,
          pageUrl: item.citation?.pageUrl || source.pageUrl,
          quote: item.citation?.quote || item.quote || source.citation?.quote,
        },
      };
    }),
  }));
}

function hasStableItemIds(groups) {
  return groups.every(
    (group) =>
      group?.id &&
      Array.isArray(group.items) &&
      group.items.every((item) => item?.id),
  );
}

router.get("/", auth, async (req, res) => {
  try {
    const summaries = await SummaryDocument.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json({ status: "success", data: { summaries } });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `获取摘要失败：${error.message}` });
  }
});

router.post("/upsert", auth, async (req, res) => {
  try {
    const {
      serverId,
      clientId,
      id: legacyServerId,
      title,
      groups,
      source,
      sourceUrl,
    } = req.body;
    const targetServerId = serverId || legacyServerId;
    const normalizedSource = Array.isArray(groups)
      ? normalizeSummarySource(source, sourceUrl, groups)
      : null;
    if (
      !title ||
      !Array.isArray(groups) ||
      !normalizedSource ||
      !hasStableItemIds(groups)
    ) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "摘要数据不完整或缺少稳定知识点 ID",
        });
    }
    const document =
      targetServerId &&
      (await SummaryDocument.findOneAndUpdate(
        { _id: targetServerId, userId: req.userId },
        {
          ...(clientId ? { clientId } : {}),
          title,
          groups: attachSourceToItems(groups, normalizedSource),
          source: normalizedSource,
          sourceUrl: normalizedSource.pageUrl,
        },
        { new: true },
      ));
    const saved =
      document ||
      (await SummaryDocument.create({
        userId: req.userId,
        clientId,
        title,
        groups: attachSourceToItems(groups, normalizedSource),
        source: normalizedSource,
        sourceUrl: normalizedSource.pageUrl,
      }));
    await syncSummaryVectors(saved, req.userId);
    res.json({ status: "success", data: { summary: saved } });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `保存摘要失败：${error.message}` });
  }
});

module.exports = router;
