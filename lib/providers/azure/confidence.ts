export function aggregateConfidence(values: number[]): {
  averageConfidence: number;
  highestConfidence: number;
  lowestConfidence: number;
} {
  if (values.length === 0) {
    return {
      averageConfidence: 0,
      highestConfidence: 0,
      lowestConfidence: 0,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    averageConfidence: Math.round(total / values.length),
    highestConfidence: Math.max(...values),
    lowestConfidence: Math.min(...values),
  };
}

export function confidenceToLevel(
  confidence: number,
): "high" | "medium" | "low" {
  if (confidence >= 75) {
    return "high";
  }
  if (confidence >= 50) {
    return "medium";
  }
  return "low";
}

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}
