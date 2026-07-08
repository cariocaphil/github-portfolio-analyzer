import type {
  DetectedTechnology,
  RepositoryObservation,
} from "@/lib/models/evidence";
import type { EvidenceSource } from "@/lib/models/evidence";
import type { RawRepositoryData } from "@/lib/models/portfolio";
import {
  countWords,
  createEvidenceSource,
  daysSince,
  parsePackageJson,
  readmeSections,
  workflowMentionsDeploy,
  workflowMentionsTests,
} from "@/lib/analysis/utils";

export interface LensAnalysisResult {
  observations: Omit<
    RepositoryObservation,
    "lensId" | "lensTitle"
  >[];
  evidenceSources: EvidenceSource[];
  detectedTechnologies: DetectedTechnology[];
}

type RepositoryLensAnalyzer = (raw: RawRepositoryData) => LensAnalysisResult;

function emptyResult(): LensAnalysisResult {
  return { observations: [], evidenceSources: [], detectedTechnologies: [] };
}

const analyzeRepositoryPurpose: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;

  if (raw.metadata.description) {
    const source = createEvidenceSource(
      repo,
      "repository metadata",
      "GitHub repository description",
      [raw.metadata.description],
      raw.metadata.url,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: `The repository description states: "${raw.metadata.description}".`,
      rationale:
        "Repository descriptions are author-provided summaries of project intent.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.metadata.topics.length > 0) {
    const source = createEvidenceSource(
      repo,
      "repository metadata",
      "GitHub repository topics",
      raw.metadata.topics,
      raw.metadata.url,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: `Topics tagged on the repository: ${raw.metadata.topics.join(", ")}.`,
      rationale:
        "GitHub topics categorize repositories and reflect how the author classifies the project.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.readme.exists && raw.readme.content) {
    const intro = raw.readme.content.split("\n").slice(0, 8).join("\n").trim();
    const source = createEvidenceSource(
      repo,
      raw.readme.path,
      "README introduction",
      [intro],
      raw.readme.githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation:
        "The README provides an introductory explanation of the project.",
      rationale:
        "README introductions commonly describe what the project does and who it is for.",
      confidence: intro.length > 40 ? "high" : "medium",
      evidenceSourceIds: [source.id],
    });
  }

  if (
    result.observations.length === 0 &&
    !raw.metadata.description &&
    raw.metadata.topics.length === 0
  ) {
    const source = createEvidenceSource(
      repo,
      "repository metadata",
      "Repository name and URL",
      [raw.metadata.name, raw.metadata.url],
      raw.metadata.url,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation:
        "Limited purpose signals are available beyond the repository name.",
      rationale:
        "Without a description, topics, or README, purpose must be inferred cautiously from naming only.",
      confidence: "low",
      evidenceSourceIds: [source.id],
    });
  }

  return result;
};

const analyzeTechnicalStack: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;

  for (const [language, bytes] of Object.entries(raw.languages)) {
    const source = createEvidenceSource(
      repo,
      "languages",
      "GitHub language statistics",
      [`${language}: ${bytes} bytes`],
      `${raw.metadata.url}/graphs/languages`,
    );
    result.evidenceSources.push(source);
    result.detectedTechnologies.push({
      name: language,
      category: "language",
      source: "GitHub language statistics",
    });
  }

  if (raw.packageJson.exists && raw.packageJson.content) {
    const pkg = parsePackageJson(raw.packageJson.content);
    const facts: string[] = [];
    const deps = {
      ...pkg?.dependencies,
      ...pkg?.devDependencies,
    };

    if (pkg?.name) facts.push(`package name: ${pkg.name}`);
    if (pkg?.scripts) facts.push(`scripts: ${Object.keys(pkg.scripts).join(", ")}`);
    if (deps) {
      for (const dep of Object.keys(deps).slice(0, 15)) {
        facts.push(`dependency: ${dep}`);
        result.detectedTechnologies.push({
          name: dep,
          category: dep.includes("react") || dep.includes("next") ? "framework" : "tool",
          source: "package.json",
        });
      }
    }

    const source = createEvidenceSource(
      repo,
      raw.packageJson.path,
      "Node.js package manifest",
      facts,
      raw.packageJson.githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: "A package.json manifest defines Node.js project dependencies and scripts.",
      rationale: "package.json is a standard manifest for JavaScript/TypeScript projects.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.requirementsTxt.exists && raw.requirementsTxt.content) {
    const lines = raw.requirementsTxt.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .slice(0, 15);

    const source = createEvidenceSource(
      repo,
      raw.requirementsTxt.path,
      "Python requirements file",
      lines,
      raw.requirementsTxt.githubUrl,
    );
    result.evidenceSources.push(source);
    for (const line of lines) {
      const pkgName = line.split(/[=<>]/)[0];
      result.detectedTechnologies.push({
        name: pkgName,
        category: "tool",
        source: "requirements.txt",
      });
    }
    result.observations.push({
      observation: "Python dependencies are declared in requirements.txt.",
      rationale: "requirements.txt lists installable Python packages for the project.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.pyprojectToml.exists) {
    const source = createEvidenceSource(
      repo,
      raw.pyprojectToml.path,
      "Python pyproject.toml",
      ["pyproject.toml present"],
      raw.pyprojectToml.githubUrl,
    );
    result.evidenceSources.push(source);
    result.detectedTechnologies.push({
      name: "pyproject.toml",
      category: "tool",
      source: "pyproject.toml",
    });
    result.observations.push({
      observation: "The repository uses pyproject.toml for Python project configuration.",
      rationale: "pyproject.toml is the modern standard for Python packaging and tooling.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.dockerfile.exists) {
    const source = createEvidenceSource(
      repo,
      raw.dockerfile.path,
      "Dockerfile",
      ["Dockerfile present for containerization"],
      raw.dockerfile.githubUrl,
    );
    result.evidenceSources.push(source);
    result.detectedTechnologies.push({
      name: "Docker",
      category: "platform",
      source: "Dockerfile",
    });
    result.observations.push({
      observation: "Docker is used for containerization.",
      rationale: "A Dockerfile indicates container-based packaging or deployment.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (result.observations.length === 0) {
    const source = createEvidenceSource(
      repo,
      "repository metadata",
      "Primary language metadata",
      [raw.metadata.language ?? "No primary language detected"],
      raw.metadata.url,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: raw.metadata.language
        ? `GitHub reports ${raw.metadata.language} as the primary language.`
        : "No dominant language or manifest files were detected.",
      rationale: "Language metadata is derived from GitHub's analysis of repository contents.",
      confidence: raw.metadata.language ? "medium" : "low",
      evidenceSourceIds: [source.id],
    });
  }

  return result;
};

const analyzeProjectStructure: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;
  const entries = raw.rootEntries;

  const source = createEvidenceSource(
    repo,
    "/",
    "Root directory listing",
    entries.length > 0 ? entries : ["No root entries retrieved"],
    `${raw.metadata.url}/tree/${raw.metadata.defaultBranch}`,
  );
  result.evidenceSources.push(source);

  const conventions: string[] = [];
  if (entries.includes("src")) conventions.push("src/ source directory");
  if (entries.includes("lib")) conventions.push("lib/ library directory");
  if (entries.includes("app")) conventions.push("app/ application directory");
  if (entries.includes("docs")) conventions.push("docs/ documentation directory");
  if (entries.some((e) => ["tests", "test", "__tests__"].includes(e.toLowerCase()))) {
    conventions.push("dedicated test directory");
  }

  result.observations.push({
    observation:
      conventions.length > 0
        ? `Visible structural conventions include: ${conventions.join("; ")}.`
        : `Root-level entries include: ${entries.slice(0, 12).join(", ") || "none visible"}.`,
    rationale:
      "Top-level directory names reveal how the author organizes code, docs, and tests.",
    confidence: entries.length > 0 ? "medium" : "low",
    evidenceSourceIds: [source.id],
  });

  return result;
};

const analyzeDocumentation: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;

  if (!raw.readme.exists || !raw.readme.content) {
    const source = createEvidenceSource(
      repo,
      raw.readme.path,
      "README absence",
      ["No README file found"],
      raw.readme.githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: "No README file was found in the repository.",
      rationale:
        "A README is the primary self-documentation artifact for most GitHub projects.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
    return result;
  }

  const content = raw.readme.content;
  const sections = readmeSections(content);
  const wordCount = countWords(content);
  const facts = [
    `Word count: approximately ${wordCount}`,
    `Section headings found: ${sections.length}`,
    ...sections.slice(0, 8),
  ];

  const source = createEvidenceSource(
    repo,
    raw.readme.path,
    "README content",
    facts,
    raw.readme.githubUrl,
  );
  result.evidenceSources.push(source);

  let confidence: "high" | "medium" | "low" = "low";
  if (wordCount >= 200 && sections.length >= 3) confidence = "high";
  else if (wordCount >= 80 || sections.length >= 2) confidence = "medium";

  result.observations.push({
    observation: `README contains approximately ${wordCount} words and ${sections.length} section headings.`,
    rationale:
      "Length and structure of a README indicate how thoroughly the project explains setup and usage.",
    confidence,
    evidenceSourceIds: [source.id],
  });

  return result;
};

const analyzeTestingQuality: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;

  if (raw.testIndicators.length > 0) {
    const paths = raw.testIndicators.map((t) => t.path);
    const source = createEvidenceSource(
      repo,
      paths.join(", "),
      "Visible test files or directories",
      paths,
      raw.testIndicators[0]?.githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: `Test-related paths are visible at the repository root: ${paths.join(", ")}.`,
      rationale:
        "Dedicated test directories or test-named files indicate automated testing intent.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  const testWorkflows = raw.workflows.filter(
    (w) => w.content && workflowMentionsTests(w.content),
  );

  if (testWorkflows.length > 0) {
    const source = createEvidenceSource(
      repo,
      testWorkflows.map((w) => w.path).join(", "),
      "CI workflows referencing tests",
      testWorkflows.map((w) => w.name),
      testWorkflows[0].githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: `${testWorkflows.length} GitHub Actions workflow(s) reference testing.`,
      rationale:
        "CI workflows that run tests show quality checks are automated in the delivery pipeline.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (result.observations.length === 0) {
    const source = createEvidenceSource(
      repo,
      "/",
      "Test evidence scan",
      ["No test directories, test files, or test workflows detected at root level"],
      raw.metadata.url,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: "No visible testing artifacts were found at the repository root.",
      rationale:
        "Absence of root-level test evidence does not prove tests are missing deeper in the tree, but none are observable from collected evidence.",
      confidence: "medium",
      evidenceSourceIds: [source.id],
    });
  }

  return result;
};

const analyzeBuildDeployment: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;

  if (raw.dockerfile.exists) {
    const source = createEvidenceSource(
      repo,
      raw.dockerfile.path,
      "Dockerfile for runnable packaging",
      ["Dockerfile present"],
      raw.dockerfile.githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: "The repository includes a Dockerfile for containerized execution.",
      rationale: "Dockerfiles provide a reproducible way to build and run the application.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.packageJson.exists && raw.packageJson.content) {
    const pkg = parsePackageJson(raw.packageJson.content);
    const scripts = pkg?.scripts ?? {};
    const buildScripts = Object.keys(scripts).filter((s) =>
      /build|start|dev|serve|deploy/i.test(s),
    );
    if (buildScripts.length > 0) {
      const source = createEvidenceSource(
        repo,
        raw.packageJson.path,
        "package.json scripts",
        buildScripts.map((s) => `${s}: ${scripts[s]}`),
        raw.packageJson.githubUrl,
      );
      result.evidenceSources.push(source);
      result.observations.push({
        observation: `package.json defines runnable scripts: ${buildScripts.join(", ")}.`,
        rationale: "npm scripts are common entry points for building and running Node projects.",
        confidence: "high",
        evidenceSourceIds: [source.id],
      });
    }
  }

  const deployWorkflows = raw.workflows.filter(
    (w) => w.content && workflowMentionsDeploy(w.content),
  );
  if (deployWorkflows.length > 0) {
    const source = createEvidenceSource(
      repo,
      deployWorkflows.map((w) => w.path).join(", "),
      "Deployment-related workflows",
      deployWorkflows.map((w) => w.name),
      deployWorkflows[0].githubUrl,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: `${deployWorkflows.length} workflow(s) include deployment or publish steps.`,
      rationale: "Automated deployment workflows indicate delivery beyond local development.",
      confidence: "high",
      evidenceSourceIds: [source.id],
    });
  }

  if (raw.metadata.homepage) {
    const source = createEvidenceSource(
      repo,
      "repository metadata",
      "Published homepage link",
      [raw.metadata.homepage],
      raw.metadata.homepage,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: `A published homepage is linked: ${raw.metadata.homepage}.`,
      rationale: "Homepage links often point to deployed demos or documentation sites.",
      confidence: "medium",
      evidenceSourceIds: [source.id],
    });
  }

  if (result.observations.length === 0) {
    const source = createEvidenceSource(
      repo,
      "/",
      "Build and deployment scan",
      ["No Dockerfile, deployment workflows, or homepage detected"],
      raw.metadata.url,
    );
    result.evidenceSources.push(source);
    result.observations.push({
      observation: "Limited build or deployment evidence is visible from collected artifacts.",
      rationale:
        "Without Docker, deployment workflows, or homepage links, deliverability cannot be strongly evidenced.",
      confidence: "medium",
      evidenceSourceIds: [source.id],
    });
  }

  return result;
};

const analyzeActivityEvolution: RepositoryLensAnalyzer = (raw) => {
  const result = emptyResult();
  const repo = raw.metadata.fullName;
  const daysSincePush = daysSince(raw.metadata.pushedAt);
  const daysSinceCreate = daysSince(raw.metadata.createdAt);

  const source = createEvidenceSource(
    repo,
    "repository metadata",
    "Repository activity timestamps",
    [
      `Created: ${raw.metadata.createdAt}`,
      `Last push: ${raw.metadata.pushedAt}`,
      `Last update: ${raw.metadata.updatedAt}`,
      `Days since last push: ${daysSincePush}`,
      `Repository age in days: ${daysSinceCreate}`,
    ],
    raw.metadata.url,
  );
  result.evidenceSources.push(source);

  let observation: string;
  let confidence: "high" | "medium" | "low" = "high";

  if (daysSincePush <= 30) {
    observation = `The repository was pushed within the last ${daysSincePush} days, indicating recent activity.`;
  } else if (daysSincePush <= 180) {
    observation = `The repository was last pushed ${daysSincePush} days ago, showing moderate recency.`;
  } else if (daysSinceCreate > 365 && daysSincePush > 365) {
    observation = `The repository is ${daysSinceCreate} days old and has not been pushed in ${daysSincePush} days.`;
    confidence = "medium";
  } else {
    observation = `The repository was last pushed ${daysSincePush} days ago.`;
    confidence = "medium";
  }

  result.observations.push({
    observation,
    rationale:
      "Push timestamps reflect when engineering changes were last integrated into the default branch history.",
    confidence,
    evidenceSourceIds: [source.id],
  });

  return result;
};

export const repositoryLensAnalyzers: Record<string, RepositoryLensAnalyzer> = {
  "repository-purpose": analyzeRepositoryPurpose,
  "technical-stack": analyzeTechnicalStack,
  "project-structure": analyzeProjectStructure,
  documentation: analyzeDocumentation,
  "testing-quality": analyzeTestingQuality,
  "build-deployment": analyzeBuildDeployment,
  "activity-evolution": analyzeActivityEvolution,
};
