# GitHub Portfolio Analyzer – Architecture

## Purpose

The GitHub Portfolio Analyzer is an engineering assessment platform that generates evidence-based reports from a developer's public GitHub portfolio.

The primary output is the **Engineering Portfolio Assessment**. An optional **CV ↔ GitHub Alignment Report** can be produced when the user supplies a CV PDF as part of the same analysis run.

The application is designed around transparency and explainability.

It analyzes only observable engineering evidence and never infers personal characteristics such as intelligence, personality, or hiring suitability.

---

# Application Workflow

The home page exposes a single primary action: **Analyze**.

```text
User input
  ├── GitHub username (required)
  └── CV PDF (optional; selected but not processed until Analyze)

Analyze (one click)
  ├── [optional] CV upload → extraction → normalization
  ├── GitHub evidence collection
  ├── Repository analysis
  ├── Portfolio analysis
  ├── [optional] CV ↔ GitHub alignment
  └── Reports workspace

Reports workspace
  ├── Engineering Portfolio Assessment (always)
  └── CV ↔ GitHub Alignment Report (when alignment completed)
```

Key workflow properties:

* One analysis run — the user never needs to analyze twice.
* CV upload is optional enrichment, not a separate workflow.
* CV processing failures do not block portfolio analysis.
* Each generated report is an independent, collapsible artifact in the Reports workspace.

Client orchestration lives in `lib/analysis/runAnalysisWorkflow.ts`. Backend analysis stages are unchanged.

---

# Architectural Principles

The architecture intentionally separates:

1. Evidence collection
2. Evidence normalization
3. Evidence interpretation
4. Report presentation
5. Workspace organization (independent report cards and navigation)

The AI layer never has direct access to GitHub.

It only interprets structured engineering evidence produced by deterministic analysis.

---

# Source Domain

A GitHub Portfolio consists of:

* GitHub Profile
* One or more Repositories

Repositories contain engineering artifacts such as:

* README
* package.json
* requirements.txt
* pyproject.toml
* Dockerfile
* GitHub workflows
* configuration files
* source code
* tests
* deployment configuration

---

# Analysis Pipeline

```text
GitHub Portfolio

↓

Evidence Provider (GitHub)

↓

Repository Analysis
(applied independently to every repository)

↓

Repository Evidence Profiles

↓

Portfolio Evidence Aggregator

↓

Unified Portfolio Evidence Model

↓

Portfolio Analysis Provider
(applies Portfolio Analysis Lenses)

↓

Engineering Portfolio Assessment

↓

[optional] CV Portfolio Alignment

↓

Reports Workspace
```

---

# Stage 1 — Repository Analysis

Every repository is analyzed independently.

Repository Analysis answers questions such as:

* What technologies are used?
* What engineering practices are visible?
* Is there testing?
* Is deployment configured?

The result is a Repository Evidence Profile.

---

# Stage 2 — Portfolio Analysis

The Portfolio Evidence Aggregator combines repository evidence into a Unified Portfolio Evidence Model.

Portfolio Analysis applies configurable Portfolio Analysis Lenses to this complete body of evidence.

The portfolio is treated as a single engineering portfolio rather than a collection of isolated repositories.

Portfolio analysis is performed through a **Portfolio Analysis Provider**.

The application depends on the provider interface, not on any specific LLM or analysis backend. The report rendering layer does not know which provider produced the report.

Current implementations:

* **Mock** — deterministic analysis used as the default provider
* **Azure OpenAI** — production provider with:
  * repository-context markdown construction
  * parallel lens analysis
  * executive synthesis after lens completion
  * structured outputs with strict fallbacks
  * retry and partial-failure recovery for failed lens requests only

Provider selection is centralized and configured via `PORTFOLIO_ANALYSIS_PROVIDER`. When unset, the application falls back to `mock`.

---

# Portfolio Analysis Provider

The provider layer sits between the Unified Portfolio Evidence Model and the Engineering Evidence Report.

Responsibilities:

* receive the Unified Portfolio Evidence Model as input
* apply Portfolio Analysis Lenses
* produce a complete Engineering Evidence Report
* attach report metadata describing how the report was generated
* enforce evidence-grounded conclusions and confidence scoring

The provider never accesses GitHub directly. It only interprets structured evidence produced upstream.

For Azure OpenAI, endpoint handling supports both:

* Azure v1 path-based mode (`/openai/v1/`) when `AZURE_OPENAI_API_VERSION=v1`
* legacy `api-version` query-based mode for dated API versions

Adding a new provider requires:

1. implementing the `PortfolioAnalysisProvider` interface
2. registering the provider in the provider factory

No changes are required to evidence extraction, aggregation, or report presentation.

---

# AI Responsibilities

The AI never:

* invents technologies
* invents repositories
* invents files
* invents observations without evidence

The AI only:

* organizes evidence
* summarizes evidence
* generates observations
* explains rationale

---

# Future Extension Points

The architecture intentionally separates concerns at multiple boundaries:

1. **Evidence collection** — how raw engineering data is retrieved
2. **Portfolio analysis** — how unified evidence is interpreted into a report
3. **CV alignment** — how normalized CV evidence is compared against portfolio evidence

## Evidence providers

Future evidence providers could include:

* GitLab
* Azure DevOps
* Personal portfolio websites
* Technical blogs
* Conference talks

The analysis methodology should remain unchanged regardless of the evidence provider.

## Portfolio analysis providers

Future portfolio analysis providers could include:

* Azure OpenAI
* OpenAI
* Anthropic Claude
* Google Gemini
* Local LLMs

Registering a new provider should not require changes to repository scanning, evidence extraction, portfolio aggregation, or report presentation.

---

# CV Processing Pipeline

CV processing is independent from GitHub evidence collection but can be compared against it in a later alignment step.

```text
CV PDF Upload

↓

Azure Blob Storage

↓

Azure Document Intelligence (layout extraction)

↓

Raw CV Extraction (document-oriented, debug only)

↓

Azure OpenAI CV Normalization

↓

Candidate Evidence Model (canonical CV evidence)
```

CV extraction and normalization failures do not block GitHub portfolio analysis.

---

# CV ↔ GitHub Portfolio Alignment

After GitHub portfolio evidence has been generated and normalized CV evidence is available, the application can run a CV Portfolio Alignment step.

```text
Candidate Evidence Model

+

Unified Portfolio Evidence Model

↓

Azure OpenAI CV Portfolio Alignment

↓

CvPortfolioAlignmentReport
```

The alignment step:

* compares structured CV claims against observable GitHub portfolio evidence
* classifies findings as supported, weakly supported, unsupported/not visible, or missing from the CV
* produces practical CV improvement recommendations
* uses constructive, hiring-manager-friendly language

Alignment is optional. If no CV was uploaded, portfolio analysis behaves unchanged and no alignment report is shown. If CV extraction or normalization failed, portfolio analysis still completes and the workspace shows a graceful skip notice.

Alignment logic lives outside UI components and does not make the CV the primary source of truth.

---

# Reports Workspace (Presentation)

The Reports workspace is a presentation-layer concept. It does not alter analysis output; it organizes completed analyses for reading.

Presentation models in `lib/presentation/reportsWorkspace.ts` describe independent workspace reports:

* **Engineering Portfolio Assessment** — primary report; always present after analysis
* **CV ↔ GitHub Alignment Report** — secondary report; present only when alignment completed

Each workspace report has:

* a stable report identifier
* header metadata (sources, repository count or alignment score, generation timestamp)
* a list of navigable sections
* independent expand/collapse state in the UI

Grouped navigation (`ReportNavigation`) lists sections only for expanded reports. This keeps navigation synchronized with what the user can currently read.

Future report types (for example Job Match or Interview Preparation) should register as additional workspace reports without changing the analysis pipeline.
