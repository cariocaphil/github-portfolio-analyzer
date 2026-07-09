import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";

export const CV_ALIGNMENT_SYSTEM_PROMPT = `You compare structured CV evidence against unified GitHub portfolio evidence.

Rules:
- Treat the CV as claims to verify, not as ground truth.
- Use only the provided CV evidence and GitHub portfolio evidence.
- Never invent repositories, technologies, employers, or projects.
- Be constructive, professional, and hiring-manager-friendly.
- Avoid harsh or accusatory language.
- Prefer phrases such as:
  - "not visible in the analyzed repositories"
  - "weakly evidenced by the available GitHub data"
  - "could be strengthened with a concrete project example"
  - "GitHub suggests an additional strength worth mentioning"
- Classify CV claims into supported, weakly supported, and unsupported/not visible.
- Identify strong GitHub strengths that are missing from the CV.
- Provide practical CV improvement recommendations.
- overallAlignmentScore must be between 0 and 100.
- Keep findings concise and evidence-grounded.
- Return JSON only.`;

export interface CvAlignmentPromptMetadata {
  githubUsername: string;
  repositoryCount: number;
  cvSource?: string;
}

export function buildCvEvidenceMarkdown(
  candidateEvidence: CandidateEvidenceModel,
): string {
  const sections: string[] = ["# Normalized CV Evidence", ""];

  if (candidateEvidence.executiveSummary.text) {
    sections.push(
      "## Professional Summary",
      candidateEvidence.executiveSummary.text,
      "",
    );
  }

  if (candidateEvidence.skills.entries.length > 0) {
    sections.push(
      "## Skills",
      candidateEvidence.skills.entries.join(", "),
      "",
    );
  }

  const technologies = [
    ...new Set(
      candidateEvidence.projects.entries.flatMap(
        (project) => project.technologies ?? [],
      ),
    ),
  ];
  if (technologies.length > 0) {
    sections.push("## Technologies", technologies.join(", "), "");
  }

  if (candidateEvidence.projects.entries.length > 0) {
    sections.push("## Projects");
    for (const project of candidateEvidence.projects.entries) {
      sections.push(
        `- ${project.name ?? "Unnamed project"}: ${project.description ?? "No description"}`,
      );
      if (project.link) {
        sections.push(`  Link: ${project.link}`);
      }
      if (project.technologies?.length) {
        sections.push(`  Technologies: ${project.technologies.join(", ")}`);
      }
    }
    sections.push("");
  }

  if (candidateEvidence.employmentHistory.entries.length > 0) {
    sections.push("## Work Experience");
    for (const role of candidateEvidence.employmentHistory.entries) {
      sections.push(
        `- ${role.role ?? "Role"} at ${role.company ?? "Company"} (${role.startDate ?? "?"} – ${role.endDate ?? "present"})`,
      );
      if (role.description) {
        sections.push(`  ${role.description}`);
      }
    }
    sections.push("");
  }

  if (candidateEvidence.education.entries.length > 0) {
    sections.push("## Education");
    for (const entry of candidateEvidence.education.entries) {
      sections.push(
        `- ${entry.degree ?? "Degree"} in ${entry.fieldOfStudy ?? "field"} at ${entry.institution ?? "Institution"}`,
      );
    }
    sections.push("");
  }

  if (candidateEvidence.certifications.entries.length > 0) {
    sections.push("## Certifications");
    for (const cert of candidateEvidence.certifications.entries) {
      sections.push(
        `- ${cert.name ?? "Certification"} (${cert.issuer ?? "Issuer"}, ${cert.date ?? "date unknown"})`,
      );
    }
    sections.push("");
  }

  const explicitClaims = collectExplicitClaims(candidateEvidence);
  if (explicitClaims.length > 0) {
    sections.push("## Explicit Claims", ...explicitClaims.map((claim) => `- ${claim}`), "");
  }

  return sections.join("\n").trim();
}

function collectExplicitClaims(
  candidateEvidence: CandidateEvidenceModel,
): string[] {
  const claims: string[] = [];

  for (const role of candidateEvidence.employmentHistory.entries) {
    if (role.description) {
      claims.push(role.description);
    }
  }

  for (const project of candidateEvidence.projects.entries) {
    if (project.description) {
      claims.push(`${project.name ?? "Project"}: ${project.description}`);
    }
  }

  return claims.slice(0, 12);
}

export function buildCvAlignmentUserPrompt(
  candidateEvidence: CandidateEvidenceModel,
  portfolioMarkdown: string,
  metadata: CvAlignmentPromptMetadata,
): string {
  return [
    "Compare the normalized CV evidence against the unified GitHub portfolio evidence.",
    "",
    "Analysis metadata:",
    JSON.stringify(metadata, null, 2),
    "",
    buildCvEvidenceMarkdown(candidateEvidence),
    "",
    portfolioMarkdown,
    "",
    "Tasks:",
    "- Identify CV claims clearly supported by GitHub evidence.",
    "- Identify CV claims weakly or partially supported.",
    "- Identify CV claims not visible in the analyzed repositories.",
    "- Identify strong GitHub evidence missing from the CV.",
    "- Provide practical recommendations to improve the CV.",
    "- Keep the tone constructive and hiring-manager-friendly.",
  ].join("\n");
}
