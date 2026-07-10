export type AnalysisProgressStepId =
  | "github"
  | "cv-extract"
  | "cv-compare"
  | "generating-portfolio"
  | "generating-reports";

export interface AnalysisProgressStep {
  id: AnalysisProgressStepId;
  label: string;
}

export function getAnalysisProgressSteps(
  includeCv: boolean,
): AnalysisProgressStep[] {
  if (includeCv) {
    return [
      { id: "cv-extract", label: "Extracting CV..." },
      { id: "github", label: "Analyzing GitHub portfolio..." },
      {
        id: "cv-compare",
        label: "Comparing CV against GitHub evidence...",
      },
      { id: "generating-reports", label: "Generating reports..." },
    ];
  }

  return [
    { id: "github", label: "Analyzing GitHub portfolio..." },
    {
      id: "generating-portfolio",
      label: "Generating Engineering Portfolio Assessment...",
    },
  ];
}

export function getStepStatus(
  steps: AnalysisProgressStep[],
  currentStepId: AnalysisProgressStepId | null,
  stepId: AnalysisProgressStepId,
): "completed" | "current" | "upcoming" {
  if (!currentStepId) {
    return "upcoming";
  }

  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  const stepIndex = steps.findIndex((step) => step.id === stepId);

  if (stepIndex < currentIndex) {
    return "completed";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}
