"use client";

import { useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { CvUploadSection } from "@/components/CvUploadSection";
import { ReportView } from "@/components/ReportView";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import {
  EMPTY_CV_ANALYSIS_CONTEXT,
  type CvAnalysisContext,
} from "@/types/cvAnalysisContext";

export default function HomePage() {
  const [report, setReport] = useState<DeveloperPortfolioReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cvContext, setCvContext] = useState<CvAnalysisContext>(
    EMPTY_CV_ANALYSIS_CONTEXT,
  );

  async function handleAnalyze(username: string) {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          candidateEvidence: cvContext.candidateEvidence,
          cvSource: cvContext.cvSource,
          cvExtractionFailed: cvContext.extractionFailed,
          cvUploaded: cvContext.cvUploaded,
        }),
      });

      const data = (await response.json()) as
        | DeveloperPortfolioReport
        | { error: string };

      if (!response.ok) {
        const errorData = data as { error: string };
        throw new Error(errorData.error || "Analysis failed.");
      }

      setReport(data as DeveloperPortfolioReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          GitHub Portfolio Analyzer
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Generate an evidence-based Engineering Evidence Report from a
          developer&apos;s public GitHub portfolio. Analysis is transparent,
          deterministic at the repository level, and traceable to observable
          artifacts.
        </p>
      </header>

      <AnalyzeForm onAnalyze={handleAnalyze} loading={loading} />

      <CvUploadSection onCvContextChange={setCvContext} />

      {loading && (
        <div
          role="status"
          className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-600"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            Collecting GitHub evidence and generating report...
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
          {error}
        </div>
      )}

      {report && !loading && <ReportView report={report} />}
    </main>
  );
}
