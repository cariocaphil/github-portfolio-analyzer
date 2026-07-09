import type { CandidateCv } from "@/lib/models/candidateCv";

export const CV_NORMALIZATION_SYSTEM_PROMPT = `You normalize CV document extractions into a canonical candidate evidence model.

Rules:
- Use only information supported by the provided extraction input.
- Never invent employers, degrees, certifications, projects, skills, or dates.
- If a field cannot be inferred confidently, return an empty string or empty array.
- Merge duplicate skills and normalize technology names (ReactJS/React.js -> React, JS -> JavaScript, TS -> TypeScript).
- Normalize dates to YYYY-MM when month is known, otherwise YYYY-01 for year-only values.
- Structure employment, education, certifications, projects, and languages as arrays of objects.
- Provide section-level confidence between 0 and 1 based on how clearly the source supports each section.
- Confidence is advisory; lower it when the source is ambiguous, partial, or noisy.
- Return JSON only.`;

export interface CvNormalizationPromptMetadata {
  filename: string;
  blobName: string;
  pagesAnalyzed: number;
  documentModelId: string;
}

export function buildCvNormalizationUserPrompt(
  rawExtraction: CandidateCv,
  metadata: CvNormalizationPromptMetadata,
): string {
  return [
    "Normalize the following document-oriented CV extraction into the canonical candidate evidence schema.",
    "",
    "Document metadata:",
    JSON.stringify(metadata, null, 2),
    "",
    "Raw extraction:",
    JSON.stringify(rawExtraction, null, 2),
    "",
    "Tasks:",
    "- Identify employment history, education, certifications, projects, and languages.",
    "- Normalize technology names and merge duplicate skills.",
    "- Normalize dates to YYYY-MM where possible.",
    "- Preserve uncertainty with lower confidence and empty fields instead of guessing.",
  ].join("\n");
}
