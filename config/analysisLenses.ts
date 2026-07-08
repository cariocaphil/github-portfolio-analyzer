import type { AnalysisLens } from "@/lib/models/report";

export const REPOSITORY_ANALYSIS_LENSES: AnalysisLens[] = [
  {
    id: "repository-purpose",
    category: "repository",
    title: "Repository Purpose",
    guidingQuestion: "What does this repository appear to be built for?",
    description:
      "Examines repository metadata, README content, and topics to infer the apparent purpose of the project.",
    promptInstructions:
      "Describe the apparent purpose based only on observable metadata, README text, and topics. Do not speculate about intent beyond what the evidence supports.",
  },
  {
    id: "technical-stack",
    category: "repository",
    title: "Technical Stack",
    guidingQuestion:
      "Which technologies, frameworks and tools are used in this repository?",
    description:
      "Identifies languages, dependencies, and tooling from manifest files and GitHub language statistics.",
    promptInstructions:
      "List technologies that are directly evidenced by language stats, package manifests, Dockerfiles, or workflow files.",
  },
  {
    id: "project-structure",
    category: "repository",
    title: "Project Structure",
    guidingQuestion: "How is this repository organized?",
    description:
      "Analyzes top-level directory layout and common structural conventions.",
    promptInstructions:
      "Describe the visible organization of the repository based on root entries and known file locations.",
  },
  {
    id: "documentation",
    category: "repository",
    title: "Documentation",
    guidingQuestion: "How well does this repository explain itself?",
    description:
      "Evaluates README presence, length, and structural elements.",
    promptInstructions:
      "Assess documentation quality using only README content and repository description. Note gaps where evidence is absent.",
  },
  {
    id: "testing-quality",
    category: "repository",
    title: "Testing & Quality",
    guidingQuestion: "What quality assurance practices are visible?",
    description:
      "Looks for test directories, test files, and CI workflows that run tests.",
    promptInstructions:
      "Report only visible testing and quality practices. Distinguish between direct test file evidence and CI configuration evidence.",
  },
  {
    id: "build-deployment",
    category: "repository",
    title: "Build & Deployment",
    guidingQuestion:
      "Is there evidence that this repository can be built, deployed and run?",
    description:
      "Checks for Dockerfiles, package scripts, and deployment-related workflows.",
    promptInstructions:
      "Identify build, containerization, and deployment evidence from Dockerfiles, manifests, and GitHub Actions workflows.",
  },
  {
    id: "activity-evolution",
    category: "repository",
    title: "Activity & Evolution",
    guidingQuestion:
      "Does this repository demonstrate iterative development over time?",
    description:
      "Uses repository timestamps and activity signals to assess ongoing development.",
    promptInstructions:
      "Comment on update recency and repository age using only timestamp metadata from GitHub.",
  },
];

export const PORTFOLIO_ANALYSIS_LENSES: AnalysisLens[] = [
  {
    id: "technical-breadth",
    category: "portfolio",
    title: "Technical Breadth",
    guidingQuestion:
      "Which technologies and tools does the developer demonstrate across the complete portfolio?",
    description:
      "Aggregates technology evidence across all repositories to assess breadth of demonstrated skills.",
    promptInstructions:
      "Summarize technologies evidenced across the portfolio. Group by category where helpful and cite representative repositories.",
  },
  {
    id: "project-complexity",
    category: "portfolio",
    title: "Project Complexity",
    guidingQuestion: "How technically sophisticated is the portfolio overall?",
    description:
      "Considers project scale signals such as multi-service setups, CI/CD, containerization, and diverse stacks.",
    promptInstructions:
      "Assess complexity using observable signals like workflow count, Docker usage, dependency breadth, and repository diversity.",
  },
  {
    id: "engineering-practices",
    category: "portfolio",
    title: "Engineering Practices",
    guidingQuestion:
      "Which professional engineering practices are consistently demonstrated across projects?",
    description:
      "Looks for recurring patterns of CI, testing, documentation, and structured project layout.",
    promptInstructions:
      "Identify practices that appear consistently across multiple repositories, citing evidence from each.",
  },
  {
    id: "portfolio-documentation",
    category: "portfolio",
    title: "Documentation",
    guidingQuestion:
      "How well is the developer's work documented across the portfolio?",
    description:
      "Evaluates README coverage and quality patterns across all repositories.",
    promptInstructions:
      "Compare documentation practices across repositories. Quantify coverage where possible using evidence counts.",
  },
  {
    id: "portfolio-testing-quality",
    category: "portfolio",
    title: "Testing & Quality",
    guidingQuestion:
      "How consistently is software quality addressed across projects?",
    description:
      "Measures how often testing and quality tooling appear across the portfolio.",
    promptInstructions:
      "Report the proportion of repositories with visible tests or CI quality checks. Note exceptions and gaps.",
  },
  {
    id: "deployment-delivery",
    category: "portfolio",
    title: "Deployment & Delivery",
    guidingQuestion:
      "Is there evidence that the developer builds, deploys and delivers usable software?",
    description:
      "Assesses deployment readiness signals such as Docker, release workflows, and homepage links.",
    promptInstructions:
      "Summarize delivery-related evidence across repositories including Dockerfiles, deployment workflows, and published homepages.",
  },
  {
    id: "project-evolution",
    category: "portfolio",
    title: "Project Evolution",
    guidingQuestion:
      "Do the projects demonstrate sustained engineering evolution over time?",
    description:
      "Examines update patterns and repository lifecycles across the portfolio.",
    promptInstructions:
      "Describe portfolio-wide activity patterns using repository creation and update timestamps.",
  },
];

export function getRepositoryLenses(): AnalysisLens[] {
  return REPOSITORY_ANALYSIS_LENSES;
}

export function getPortfolioLenses(): AnalysisLens[] {
  return PORTFOLIO_ANALYSIS_LENSES;
}

export function getLensById(id: string): AnalysisLens | undefined {
  return [...REPOSITORY_ANALYSIS_LENSES, ...PORTFOLIO_ANALYSIS_LENSES].find(
    (lens) => lens.id === id,
  );
}
