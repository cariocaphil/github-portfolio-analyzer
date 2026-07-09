export interface LensEvidenceItem {
  repository: string;
  path: string;
  description: string;
  facts: string[];
  githubUrl?: string;
}

export interface LensAnalysisResult {
  score: number;
  confidence: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence: LensEvidenceItem[];
  recommendations: string[];
}

export interface ExecutiveSummaryResult {
  growthOpportunities: string[];
  finalRecommendations: string[];
}

export interface TokenUsageTotals {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface RequestTokenUsage extends TokenUsageTotals {
  requestType: "lens_analysis" | "executive_summary";
  lensId?: string;
  schemaName: string;
}

export interface AzureModelCapabilities {
  supportsTemperature: boolean;
  supportsTopP: boolean;
}

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
  usesV1Endpoint: boolean;
  modelCapabilities: AzureModelCapabilities;
}
