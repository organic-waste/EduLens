async function evaluateRecallAt3(samples, search) {
  let hits = 0;
  let top1Hits = 0;
  let reciprocalRankTotal = 0;
  for (const sample of samples) {
    const results = await search(sample.query, sample);
    const ids = results.slice(0, 3).map((item) => item.summaryItemId);
    const rank = ids.indexOf(sample.targetSummaryItemId);
    if (rank >= 0) {
      hits += 1;
      reciprocalRankTotal += 1 / (rank + 1);
    }
    if (rank === 0) top1Hits += 1;
  }
  return {
    hits,
    total: samples.length,
    recallAt3: samples.length ? hits / samples.length : 0,
    top1Accuracy: samples.length ? top1Hits / samples.length : 0,
    meanReciprocalRankAt3: samples.length ? reciprocalRankTotal / samples.length : 0,
  };
}

module.exports = { evaluateRecallAt3 };
