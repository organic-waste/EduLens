const express = require("express");
const SummaryDocument = require("../models/summaryDocument");
const auth = require("../middleware/auth");

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
    items: (group.items || []).map((item) => ({
      ...item,
      citation: {
        ...source.citation,
        ...item.citation,
        pageUrl: item.citation?.pageUrl || source.pageUrl,
        quote: item.citation?.quote || item.quote || source.citation?.quote,
      },
    })),
  }));
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
    const { id, title, groups, source, sourceUrl } = req.body;
    const normalizedSource = Array.isArray(groups)
      ? normalizeSummarySource(source, sourceUrl, groups)
      : null;
    if (!title || !Array.isArray(groups) || !normalizedSource) {
      return res
        .status(400)
        .json({ status: "error", message: "摘要数据不完整" });
    }
    const document =
      id &&
      (await SummaryDocument.findOneAndUpdate(
        { _id: id, userId: req.userId },
        {
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
        title,
        groups: attachSourceToItems(groups, normalizedSource),
        source: normalizedSource,
        sourceUrl: normalizedSource.pageUrl,
      }));
    res.json({ status: "success", data: { summary: saved } });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: `保存摘要失败：${error.message}` });
  }
});

module.exports = router;
