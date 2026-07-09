import { getPortfolioLenses } from "@/config/analysisLenses";
import { daysSince } from "@/lib/analysis/utils";
import type { EvidenceSource } from "@/lib/models/evidence";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type {
  DeveloperPortfolioReport,
  ReportObservation,
  ReportSection,
} from "@/lib/models/report";
import type { PortfolioAnalysisProvider } from "./PortfolioAnalysisProvider";

const PROVIDER_NAME = "MockPortfolioAnalysisProvider";
const PROVIDER_VERSION = "1.0.0";

/**
 * Deterministic mock portfolio analysis provider.
 *
 * In production, a real provider (e.g. Azure OpenAI) would send each portfolio
 * lens to Structured Outputs with a schema matching ReportSection.
 */
export class MockPortfolioAnalysisProvider implements PortfolioAnalysisProvider {
  async analyzePortfolio(
    evidence: UnifiedPortfolioEvidenceModel,
  ): Promise<DeveloperPortfolioReport> {
    const lenses = getPortfolioLenses();
    const sections: ReportSection[] = [];

    for (const lens of lenses) {
      const generator = portfolioLensGenerators[lens.id];
      if (!generator) {
        // TODO: Wire new portfolio lenses when added to configuration.
        sections.push({
          lensId: lens.id,
          title: lens.title,
          guidingQuestion: lens.guidingQuestion,
          observations: [],
        });
        continue;
      }

      sections.push({
        lensId: lens.id,
        title: lens.title,
        guidingQuestion: lens.guidingQuestion,
        observations: generator(evidence),
      });
    }

    return {
      developerSnapshot: {
        username: evidence.profile.username,
        name: evidence.profile.name,
        bio: evidence.profile.bio,
        totalRepositories: evidence.summary.totalRepositories,
        primaryLanguages: evidence.summary.primaryLanguages,
        accountCreated: evidence.profile.createdAt,
        profileUrl: evidence.profile.url,
      },
      sections,
      improvementSuggestions: buildImprovementSuggestions(evidence),
      metadata: {
        analysisSource: "mock",
        generationTimestamp: new Date().toISOString(),
        providerName: PROVIDER_NAME,
        providerVersion: PROVIDER_VERSION,
        aggregatedTechnologies: evidence.aggregatedTechnologies,
      },
    };
  }
}

type PortfolioLensGenerator = (
  evidence: UnifiedPortfolioEvidenceModel,
) => ReportObservation[];

function resolveEvidence(
  evidence: UnifiedPortfolioEvidenceModel,
  matcher: (source: EvidenceSource) => boolean,
  limit = 5,
): EvidenceSource[] {
  return evidence.evidenceSources.filter(matcher).slice(0, limit);
}

const generateTechnicalBreadth: PortfolioLensGenerator = (evidence) => {
  const technologies = evidence.aggregatedTechnologies;
  const supportingEvidence = resolveEvidence(
    evidence,
    (source) =>
      source.description.toLowerCase().includes("language") ||
      source.path === "package.json" ||
      source.path === "requirements.txt",
  );

  if (technologies.length === 0) {
    return [
      {
        observation: "Few technologies could be identified across the analyzed repositories.",
        rationale:
          "Technology detection depends on manifest files and GitHub language statistics.",
        confidence: "low",
        supportingEvidence,
      },
    ];
  }

  return [
    {
      observation: `Across ${evidence.summary.totalRepositories} repositories, ${technologies.length} distinct technologies were evidenced: ${technologies.slice(0, 12).join(", ")}${technologies.length > 12 ? ", ..." : ""}.`,
      rationale:
        "Breadth is measured by unique technologies found in language stats, manifests, and container tooling.",
      confidence: technologies.length >= 5 ? "high" : "medium",
      supportingEvidence,
    },
    {
      observation: `Primary languages by repository count: ${evidence.summary.primaryLanguages.join(", ") || "none dominant"}.`,
      rationale:
        "GitHub primary language metadata highlights the most frequently represented languages.",
      confidence: evidence.summary.primaryLanguages.length > 0 ? "high" : "low",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.includes("language statistics"),
        3,
      ),
    },
  ];
};

const generateProjectComplexity: PortfolioLensGenerator = (evidence) => {
  const withCi = evidence.summary.repositoriesWithCi;
  const withDocker = evidence.summary.repositoriesWithDocker;
  const multiStack =
    evidence.summary.primaryLanguages.length >= 3 ||
    evidence.aggregatedTechnologies.length >= 8;

  return [
    {
      observation: `${withCi} of ${evidence.summary.totalRepositories} repositories include CI workflows; ${withDocker} include Docker configuration.`,
      rationale:
        "CI and containerization are observable complexity signals beyond basic source code.",
      confidence: "high",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) =>
          source.description.toLowerCase().includes("workflow") ||
          source.path.toLowerCase() === "dockerfile",
        4,
      ),
    },
    {
      observation: multiStack
        ? "The portfolio spans multiple languages and tooling ecosystems."
        : "The portfolio shows a narrower technology focus across projects.",
      rationale:
        "Diversity of languages and dependencies suggests breadth of technical contexts worked in.",
      confidence: multiStack ? "medium" : "medium",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.path === "package.json" || source.path === "languages",
        4,
      ),
    },
  ];
};

const generateEngineeringPractices: PortfolioLensGenerator = (evidence) => {
  const total = evidence.summary.totalRepositories;
  const readmeRatio = evidence.summary.repositoriesWithReadme / Math.max(total, 1);
  const testRatio = evidence.summary.repositoriesWithTests / Math.max(total, 1);
  const ciRatio = evidence.summary.repositoriesWithCi / Math.max(total, 1);

  const observations: ReportObservation[] = [];

  if (ciRatio >= 0.5) {
    observations.push({
      observation: `CI workflows appear in ${Math.round(ciRatio * 100)}% of analyzed repositories.`,
      rationale: "Repeated CI usage suggests automation is a consistent practice.",
      confidence: ciRatio >= 0.7 ? "high" : "medium",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.toLowerCase().includes("workflow"),
        3,
      ),
    });
  }

  if (testRatio >= 0.4) {
    observations.push({
      observation: `Visible testing artifacts appear in ${Math.round(testRatio * 100)}% of analyzed repositories.`,
      rationale:
        "Test directories, test files, or test workflows indicate quality practices are recurring.",
      confidence: testRatio >= 0.6 ? "high" : "medium",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.toLowerCase().includes("test"),
        3,
      ),
    });
  }

  if (readmeRatio >= 0.5) {
    observations.push({
      observation: `README documentation is present in ${Math.round(readmeRatio * 100)}% of repositories.`,
      rationale: "Consistent README usage supports maintainability and onboarding.",
      confidence: "high",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.path.toLowerCase().includes("readme"),
        3,
      ),
    });
  }

  if (observations.length === 0) {
    observations.push({
      observation: "Few recurring engineering practices were strongly evidenced across the portfolio.",
      rationale:
        "Practice detection is limited to observable artifacts such as CI, tests, and documentation.",
      confidence: "medium",
      supportingEvidence: evidence.evidenceSources.slice(0, 3),
    });
  }

  return observations;
};

const generatePortfolioDocumentation: PortfolioLensGenerator = (evidence) => {
  const total = evidence.summary.totalRepositories;
  const withReadme = evidence.summary.repositoriesWithReadme;
  const coverage = Math.round((withReadme / Math.max(total, 1)) * 100);

  return [
    {
      observation: `${withReadme} of ${total} repositories (${coverage}%) include a README.`,
      rationale:
        "README coverage is a direct measure of how consistently projects explain themselves.",
      confidence: "high",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) =>
          source.path.toLowerCase().includes("readme") ||
          source.description.toLowerCase().includes("readme"),
        4,
      ),
    },
    {
      observation:
        coverage >= 70
          ? "Documentation appears to be a consistent habit across the portfolio."
          : "Documentation coverage is uneven across repositories.",
      rationale:
        "Portfolio-level documentation quality is inferred from README presence rates, not prose quality alone.",
      confidence: coverage >= 70 ? "high" : "medium",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.includes("README"),
        3,
      ),
    },
  ];
};

const generatePortfolioTestingQuality: PortfolioLensGenerator = (evidence) => {
  const total = evidence.summary.totalRepositories;
  const withTests = evidence.summary.repositoriesWithTests;
  const ratio = withTests / Math.max(total, 1);

  return [
    {
      observation: `${withTests} of ${total} repositories show visible testing evidence (${Math.round(ratio * 100)}%).`,
      rationale:
        "Testing consistency is measured by observable test paths and test-related CI workflows.",
      confidence: "high",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.toLowerCase().includes("test"),
        4,
      ),
    },
    {
      observation:
        ratio >= 0.6
          ? "Testing practices appear regularly across the portfolio."
          : "Testing evidence is present in some projects but not consistently across the portfolio.",
      rationale:
        "A portfolio with recurring test artifacts suggests quality is addressed beyond isolated projects.",
      confidence: ratio >= 0.6 ? "high" : "medium",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.toLowerCase().includes("workflow"),
        2,
      ),
    },
  ];
};

const generateDeploymentDelivery: PortfolioLensGenerator = (evidence) => {
  const total = evidence.summary.totalRepositories;
  const deployable = evidence.summary.repositoriesWithDeploymentConfig;

  return [
    {
      observation: `${deployable} of ${total} repositories show build, deployment, or delivery evidence.`,
      rationale:
        "Delivery evidence includes Dockerfiles, deployment workflows, and published homepage links.",
      confidence: "high",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) =>
          source.path.toLowerCase() === "dockerfile" ||
          source.description.toLowerCase().includes("deploy") ||
          source.description.toLowerCase().includes("homepage"),
        4,
      ),
    },
    {
      observation:
        deployable > 0
          ? "Some projects demonstrate a path from code to runnable or published software."
          : "Little deployment or delivery evidence was observed across the portfolio.",
      rationale:
        "Deliverability is assessed only from observable packaging and publishing artifacts.",
      confidence: deployable >= total * 0.4 ? "medium" : "low",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.toLowerCase().includes("script"),
        2,
      ),
    },
  ];
};

const generateProjectEvolution: PortfolioLensGenerator = (evidence) => {
  const recentlyActive = evidence.repositoryProfiles.filter(
    (profile) => daysSince(profile.metadata.pushedAt) <= 90,
  ).length;
  const total = evidence.summary.totalRepositories;
  const ages = evidence.repositoryProfiles.map((p) =>
    daysSince(p.metadata.createdAt),
  );
  const avgAge =
    ages.length > 0
      ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
      : 0;

  return [
    {
      observation: `${recentlyActive} of ${total} repositories were pushed within the last 90 days.`,
      rationale:
        "Recent push activity indicates ongoing engineering work across the portfolio.",
      confidence: "high",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.description.includes("timestamps"),
        3,
      ),
    },
    {
      observation: `Analyzed repositories have an average age of approximately ${avgAge} days.`,
      rationale:
        "Repository age combined with recency helps distinguish sustained portfolios from one-off experiments.",
      confidence: ages.length > 0 ? "medium" : "low",
      supportingEvidence: resolveEvidence(
        evidence,
        (source) => source.facts.some((fact) => fact.includes("Created:")),
        3,
      ),
    },
  ];
};

const portfolioLensGenerators: Record<string, PortfolioLensGenerator> = {
  "technical-breadth": generateTechnicalBreadth,
  "project-complexity": generateProjectComplexity,
  "engineering-practices": generateEngineeringPractices,
  "portfolio-documentation": generatePortfolioDocumentation,
  "portfolio-testing-quality": generatePortfolioTestingQuality,
  "deployment-delivery": generateDeploymentDelivery,
  "project-evolution": generateProjectEvolution,
};

function buildImprovementSuggestions(
  evidence: UnifiedPortfolioEvidenceModel,
): string[] {
  const suggestions: string[] = [];
  const total = evidence.summary.totalRepositories;

  if (evidence.summary.repositoriesWithReadme < total) {
    suggestions.push(
      "Add or expand README files in repositories that lack project documentation.",
    );
  }

  if (evidence.summary.repositoriesWithTests < total * 0.5) {
    suggestions.push(
      "Increase visible testing artifacts and CI test steps across more repositories.",
    );
  }

  if (evidence.summary.repositoriesWithCi < total * 0.5) {
    suggestions.push(
      "Introduce GitHub Actions workflows for build and quality checks where absent.",
    );
  }

  if (evidence.summary.repositoriesWithDeploymentConfig === 0) {
    suggestions.push(
      "Document how projects are run or deployed using Dockerfiles, scripts, or deployment workflows.",
    );
  }

  return suggestions;
}
