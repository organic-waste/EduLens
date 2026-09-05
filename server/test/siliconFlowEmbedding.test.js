const { SiliconFlowEmbedding } = require("../services/siliconFlowEmbedding");

describe("SiliconFlowEmbedding", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.SILICONFLOW_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("uses the provider once for a single embedding without recursion", async () => {
    let requests = 0;
    global.fetch = async () => {
      requests += 1;
      return { ok: true, json: async () => ({ data: [{ index: 0, embedding: [0.1, 0.2] }] }) };
    };

    const embedding = await new SiliconFlowEmbedding().getTextEmbedding("RAG");

    expect(embedding).toEqual([0.1, 0.2]);
    expect(requests).toBe(1);
  });

  it("preserves SiliconFlow response order for a batch", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        data: [
          { index: 1, embedding: [2] },
          { index: 0, embedding: [1] },
        ],
      }),
    });

    const embeddings = await new SiliconFlowEmbedding().getTextEmbeddings(["first", "second"]);

    expect(embeddings).toEqual([[1], [2]]);
  });

  it("extracts text from the query object used by the retriever", async () => {
    let requestBody;
    global.fetch = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ data: [{ index: 0, embedding: [0.1] }] }) };
    };

    await new SiliconFlowEmbedding().getQueryEmbedding({ type: "text", text: "JWT 如何验证身份" });

    expect(requestBody.input).toEqual(["JWT 如何验证身份"]);
  });
});
