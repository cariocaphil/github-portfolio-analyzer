export const LENS_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    confidence: { type: "number" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          repository: { type: "string" },
          path: { type: "string" },
          description: { type: "string" },
          facts: { type: "array", items: { type: "string" } },
        },
        required: ["repository", "path", "description", "facts"],
        additionalProperties: false,
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "score",
    "confidence",
    "summary",
    "strengths",
    "concerns",
    "evidence",
    "recommendations",
  ],
  additionalProperties: false,
} as const;

export const EXECUTIVE_SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    growthOpportunities: { type: "array", items: { type: "string" } },
    finalRecommendations: { type: "array", items: { type: "string" } },
  },
  required: ["growthOpportunities", "finalRecommendations"],
  additionalProperties: false,
} as const;
