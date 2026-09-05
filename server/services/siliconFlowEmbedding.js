const { BaseEmbedding } = require("llamaindex");
const { createSiliconFlowEmbeddings } = require("./modelClient");

function contentToText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.text === "string") {
    return value.text;
  }
  if (Array.isArray(value)) {
    return value
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join(" ");
  }
  return String(value || "");
}

class SiliconFlowEmbedding extends BaseEmbedding {
  constructor() {
    super();
    this.getTextEmbeddings = async (texts) => {
      if (!texts.length) return [];
      const result = await createSiliconFlowEmbeddings(texts);
      return (result.data || [])
        .slice()
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .map((item) => item.embedding);
    };
  }

  async getTextEmbedding(text) {
    const embeddings = await this.getTextEmbeddings([text]);
    return embeddings[0] || [];
  }

  async getQueryEmbedding(query) {
    return this.getTextEmbedding(contentToText(query));
  }
}

module.exports = { SiliconFlowEmbedding };
