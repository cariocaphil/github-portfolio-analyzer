import type { AnalysisProgressStepId } from "@/lib/analysis/analysisProgress";
import {
  getAnalysisProgressSteps,
  getStepStatus,
} from "@/lib/analysis/analysisProgress";

interface AnalysisProgressProps {
  includeCv: boolean;
  currentStepId: AnalysisProgressStepId | null;
}

export function AnalysisProgress({
  includeCv,
  currentStepId,
}: AnalysisProgressProps) {
  const steps = getAnalysisProgressSteps(includeCv);

  return (
    <div
      role="status"
      className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        Analysis in progress
      </h2>

      <ul className="mt-4 space-y-3">
        {steps.map((step) => {
          const status = getStepStatus(steps, currentStepId, step.id);

          return (
            <li key={step.id} className="flex items-center gap-3 text-sm">
              <StepIndicator status={status} />
              <span
                className={
                  status === "current"
                    ? "font-medium text-slate-900"
                    : status === "completed"
                      ? "text-slate-600"
                      : "text-slate-400"
                }
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepIndicator({
  status,
}: {
  status: "completed" | "current" | "upcoming";
}) {
  if (status === "completed") {
    return (
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700"
      >
        ✓
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 rounded-full border border-slate-200 bg-slate-50"
    />
  );
}
