async function evaluateRecallAt3(samples, search) {
  let hits = 0;
  for (const sample of samples) {
    const results = await search(sample.query, sample);
    const ids = results.slice(0, 3).map((item) => item.summaryItemId);
    if (ids.includes(sample.targetSummaryItemId)) hits += 1;
  }
  return {
    hits,
    total: samples.length,
    recallAt3: samples.length ? hits / samples.length : 0,
  };
}

module.exports = { evaluateRecallAt3 };
