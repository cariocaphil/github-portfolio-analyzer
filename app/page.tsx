"use client";

import { useState } from "react";
import { AnalysisErrorAlert } from "@/components/AnalysisErrorAlert";
import { AnalysisInputForm } from "@/components/AnalysisInputForm";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { ReportView } from "@/components/ReportView";
import type { AnalysisProgressStepId } from "@/lib/analysis/analysisProgress";
import { runAnalysisWorkflow, AnalysisWorkflowError } from "@/lib/analysis/runAnalysisWorkflow";
import type { DeveloperPortfolioReport } from "@/lib/models/report";

export default function HomePage() {
  const [report, setReport] = useState<DeveloperPortfolioReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [analysisIncludesCv, setAnalysisIncludesCv] = useState(false);
  const [currentStepId, setCurrentStepId] =
    useState<AnalysisProgressStepId | null>(null);

  async function handleAnalyze(input: {
    username: string;
    cvFile: File | null;
  }) {
    setLoading(true);
    setError(null);
    setReport(null);
    setAnalysisIncludesCv(Boolean(input.cvFile));
    setCurrentStepId(input.cvFile ? "cv-extract" : "github");

    try {
      const result = await runAnalysisWorkflow({
        username: input.username,
        cvFile: input.cvFile,
        onStepChange: setCurrentStepId,
      });

      setReport(result);
    } catch (err) {
      if (err instanceof AnalysisWorkflowError) {
        setError({ title: err.title, message: err.message });
      } else {
        setError({
          title: "Analysis could not be completed",
          message:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setLoading(false);
      setCurrentStepId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          GitHub Portfolio Analyzer
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Run one engineering assessment from a public GitHub portfolio. Optionally
          enrich the analysis with a CV to generate a CV ↔ GitHub alignment
          report alongside the Engineering Portfolio Assessment.
        </p>
      </header>

      <AnalysisInputForm onAnalyze={handleAnalyze} loading={loading} />

      {loading && (
        <AnalysisProgress
          includeCv={analysisIncludesCv}
          currentStepId={currentStepId}
        />
      )}

      {error && (
        <AnalysisErrorAlert title={error.title} message={error.message} />
      )}

      {report && !loading && <ReportView report={report} />}
    </main>
  );
}
