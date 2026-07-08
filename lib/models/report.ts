import type { EvidenceSource } from "./evidence";

export type LensCategory = "repository" | "portfolio";

export interface AnalysisLens {
  id: string;
  category: LensCategory;
  title: string;
  guidingQuestion: string;
  description: string;
  promptInstructions: string;
}

export interface ReportObservation {
  observation: string;
  rationale: string;
  confidence: "high" | "medium" | "low";
  supportingEvidence: EvidenceSource[];
}

export interface ReportSection {
  lensId: string;
  title: string;
  guidingQuestion: string;
  observations: ReportObservation[];
}

export interface DeveloperSnapshot {
  username: string;
  name: string | null;
  bio: string | null;
  totalRepositories: number;
  primaryLanguages: string[];
  accountCreated: string;
  profileUrl: string;
}

export interface ReportMetadata {
  analysisSource: string;
  generationTimestamp: string;
  providerName?: string;
  providerVersion?: string;
}

export interface DeveloperPortfolioReport {
  developerSnapshot: DeveloperSnapshot;
  sections: ReportSection[];
  improvementSuggestions: string[];
  metadata: ReportMetadata;
}
