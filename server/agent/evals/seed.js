const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../../models/user");
const SummaryDocument = require("../../models/summaryDocument");
const { syncSummaryVectors } = require("../retrieval");

dotenv.config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "development"}`) });

const FIXTURE_EMAIL = "edulens-retrieval-eval@example.test";
const FIXTURE_USERNAME = "edulens_eval";

async function getOrCreateFixtureUser() {
  let user = await User.findOne({ email: FIXTURE_EMAIL });
  if (user) return user;
  user = new User({
    username: FIXTURE_USERNAME,
    email: FIXTURE_EMAIL,
    password: "retrieval-eval-only",
  });
  return user.save();
}

async function main() {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, "retrievalFixture.json"), "utf8"),
  );
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const user = await getOrCreateFixtureUser();
    for (const item of fixture) {
      const summary = await SummaryDocument.findOneAndUpdate(
        { userId: user._id, sourceUrl: item.sourceUrl },
        {
          userId: user._id,
          sourceUrl: item.sourceUrl,
          title: item.title,
          groups: [
            {
              id: item.groupId,
              topic: item.topic,
              items: [
                {
                  id: item.itemId,
                  content: item.content,
                  quote: item.quote,
                  citation: {
                    pageUrl: `${item.sourceUrl}#knowledge-point`,
                    quote: item.quote,
                    selector: "#knowledge-point",
                  },
                },
              ],
            },
          ],
          source: {
            pageUrl: item.sourceUrl,
            citation: {
              pageUrl: item.sourceUrl,
              quote: item.quote,
              selector: "#knowledge-point",
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      // 评测直接写模型会绕过摘要 API；显式走同一向量同步逻辑，保证 Atlas 可检索这些种子。
      await syncSummaryVectors(summary, user._id);
    }
    console.log(`Seeded and indexed ${fixture.length} summaries for EVAL_USER_ID=${user._id}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
