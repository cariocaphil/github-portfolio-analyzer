const optionalString = { type: "string" } as const;

const alignmentFindingSchema = {
  type: "object",
  properties: {
    claimOrStrength: { type: "string" },
    category: { type: "string" },
    cvEvidence: optionalString,
    githubEvidence: { type: "array", items: { type: "string" } },
    assessment: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: [
    "claimOrStrength",
    "category",
    "cvEvidence",
    "githubEvidence",
    "assessment",
    "confidence",
  ],
  additionalProperties: false,
} as const;

export const CV_ALIGNMENT_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    overallAlignmentScore: { type: "number" },
    supportedClaims: { type: "array", items: alignmentFindingSchema },
    weaklySupportedClaims: { type: "array", items: alignmentFindingSchema },
    unsupportedClaims: { type: "array", items: alignmentFindingSchema },
    missingCvStrengths: { type: "array", items: alignmentFindingSchema },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "summary",
    "overallAlignmentScore",
    "supportedClaims",
    "weaklySupportedClaims",
    "unsupportedClaims",
    "missingCvStrengths",
    "recommendations",
  ],
  additionalProperties: false,
} as const;

export type CvAlignmentModelResponse = {
  summary: string;
  overallAlignmentScore: number;
  supportedClaims: Array<{
    claimOrStrength: string;
    category: string;
    cvEvidence: string;
    githubEvidence: string[];
    assessment: string;
    confidence: "high" | "medium" | "low";
  }>;
  weaklySupportedClaims: Array<{
    claimOrStrength: string;
    category: string;
    cvEvidence: string;
    githubEvidence: string[];
    assessment: string;
    confidence: "high" | "medium" | "low";
  }>;
  unsupportedClaims: Array<{
    claimOrStrength: string;
    category: string;
    cvEvidence: string;
    githubEvidence: string[];
    assessment: string;
    confidence: "high" | "medium" | "low";
  }>;
  missingCvStrengths: Array<{
    claimOrStrength: string;
    category: string;
    cvEvidence: string;
    githubEvidence: string[];
    assessment: string;
    confidence: "high" | "medium" | "low";
  }>;
  recommendations: string[];
};
