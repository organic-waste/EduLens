const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { evaluateRecallAt3 } = require("./retrieval");
const {
  searchLearningKnowledge,
} = require("../retrieval/search");

dotenv.config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "development"}`) });

async function main() {
  const samples = JSON.parse(
    fs.readFileSync(path.join(__dirname, "retrievalSamples.json"), "utf8"),
  );
  const userId = process.env.EVAL_USER_ID;
  if (!userId) throw new Error("EVAL_USER_ID is required");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const semanticReport = await evaluateRecallAt3(samples, (query, sample) =>
      searchLearningKnowledge({
        userId,
        query,
        activeSummaryId: sample.activeSummaryId,
      }),
    );
    const personalizedReport = await evaluateRecallAt3(samples, (query, sample) =>
      searchLearningKnowledge({
        userId,
        query,
        activeSummaryId: sample.activeSummaryId,
        memories: sample.memories,
      }),
    );
    const report = {
      total: samples.length,
      personalizedSamples: samples.filter((sample) => sample.memories?.length).length,
      semantic: semanticReport,
      personalized: personalizedReport,
    };
    console.log(JSON.stringify(report, null, 2));
    if (personalizedReport.recallAt3 < 0.8) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
