# GitHub Portfolio Analyzer

Evidence-based engineering assessment platform for public GitHub portfolios.

The application runs a single **Analyze** action that produces one or more independent reports in a shared **Reports workspace**:

- **Engineering Portfolio Assessment** (always generated)
- **CV ↔ GitHub Alignment Report** (optional, when a CV PDF is supplied)

The analysis engine collects and reasons over repository evidence. Reports present conclusions as concise executive-style assessments—not internal analysis logs.

## Current Status

This repository includes:

- Real GitHub evidence collection via GitHub REST API
- Deterministic repository analysis across 7 repository lenses (no AI in repository stage)
- Portfolio evidence aggregation into a unified model
- Provider-agnostic portfolio analysis layer (`PortfolioAnalysisProvider`)
- Mock portfolio analysis provider (default)
- Production Azure OpenAI provider with parallel lens analysis, executive synthesis, retries, structured-output fallbacks, and prompt-size optimization
- Optional CV PDF processing (Azure Blob Storage, Document Intelligence, OpenAI normalization)
- Optional CV ↔ GitHub portfolio alignment (Azure OpenAI)
- Unified home page workflow: one **Analyze** button, optional CV input
- Reports workspace with independent, collapsible report cards and grouped navigation

## Architecture Alignment

The implementation follows the architecture documents in `docs/` as source of truth:

- `docs/architecture.md`
- `docs/domain-model.md`
- `docs/analysis-lenses.md`

### Analysis pipeline

1. GitHub Evidence Provider
2. Repository Analysis (per repository, deterministic)
3. Repository Evidence Profiles
4. Portfolio Evidence Aggregator
5. Unified Portfolio Evidence Model
6. Portfolio Analysis Provider
7. Engineering Portfolio Assessment

When a CV is supplied at analysis time:

8. CV upload → Blob Storage → Document Intelligence → CV normalization → Candidate Evidence Model
9. CV ↔ GitHub Portfolio Alignment (optional step; skipped gracefully on CV failure)

### Presentation layer

Analysis output is organized into independent workspace reports via presentation models in `lib/presentation/reportsWorkspace.ts`. The UI renders whichever reports are available without coupling report types together.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS

Frontend and backend are in the same Next.js project.

## Usage

1. Enter a GitHub username.
2. Optionally choose a CV PDF (no processing until you click **Analyze**).
3. Click **Analyze** once.

**Without CV:** generates the Engineering Portfolio Assessment only.

**With CV:** extracts the CV, runs portfolio analysis, and automatically includes the CV ↔ GitHub Alignment Report when normalization succeeds. CV extraction or normalization failures do not block the portfolio report.

Progress steps are shown during analysis so it is clear why CV-enriched runs take longer.

## Report Experience

After analysis, results appear in a **Reports** workspace. Each report is a separate collapsible card with its own header, metadata, sections, and navigation group.

### Engineering Portfolio Assessment

- Executive Summary
- Technology Breakdown
- Portfolio lens sections (summary, score, key findings, representative repositories)
- Portfolio improvement suggestions

### CV ↔ GitHub Alignment Report

Shown only when alignment completed successfully:

- Overall Alignment
- Supported Claims
- Weakly Supported Claims
- Unsupported Claims
- GitHub Strengths Missing From CV
- Recommendations

Reports can be expanded or collapsed independently. Expanding one report does not affect the other.

## Current Behavior (Important)

- GitHub API calls are real and data-dependent.
- Portfolio report synthesis runs through `PortfolioAnalysisProvider`.
- Default provider is `mock` via `MockPortfolioAnalysisProvider`.
- `azure-openai` runs 2 portfolio lenses by default (`technical-breadth`, `project-complexity`) plus executive summary synthesis.
- Azure provider uses lens-specific portfolio context, compact repository blocks, structured JSON outputs, model-aware request parameters, and per-request token metadata.
- Provider selection is centralized in `getPortfolioAnalysisProvider()`.
- CV processing uses `prebuilt-layout` for Document Intelligence (not `prebuilt-resume`).
- Azure OpenAI is required for CV normalization and CV ↔ GitHub alignment when a CV is included.

## Requirements

- Node.js 18+ (Node 20+ recommended)
- npm

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

### GitHub

- `GITHUB_TOKEN` — optional; increases GitHub API rate limits and reliability.

### Portfolio analysis

- `PORTFOLIO_ANALYSIS_PROVIDER` — `mock` (default) or `azure-openai`.
- `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION` — required when using `azure-openai`.

Azure API version notes:

- `AZURE_OPENAI_API_VERSION=v1` uses Azure OpenAI v1 path handling (`/openai/v1/`) and does **not** append `?api-version=v1`.
- Dated Azure API versions (for example `2024-10-21`) continue using legacy `api-version` query handling.

### CV processing (required only when analyzing with a CV)

- `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_CONTAINER_NAME`, `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`, `AZURE_DOCUMENT_INTELLIGENCE_KEY`, `AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID` (default: `prebuilt-layout`)
- Azure OpenAI variables above (also used for CV normalization and alignment)

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
app/
  api/
    analyze/route.ts          # GitHub portfolio analysis (+ optional CV alignment)
    cv/upload/route.ts        # CV blob upload, extraction, normalization
  page.tsx                    # unified Analyze workflow
components/
  AnalysisInputForm.tsx       # GitHub username + optional CV + Analyze
  AnalysisProgress.tsx        # in-progress step display
  reports/
    ReportsWorkspace.tsx      # collapsible report cards
    PortfolioAssessmentReportContent.tsx
    CvAlignmentReportContent.tsx
  ExecutiveSummary.tsx
  ReportNavigation.tsx        # grouped navigation per report
  ReportView.tsx
  ReportSection.tsx
  TechnologyBreakdown.tsx
config/
  analysisLenses.ts
domain/
  candidateEvidence.ts
  cvPortfolioAlignment.ts
lib/
  analysis/
    runAnalysisWorkflow.ts    # client orchestration (CV upload + analyze)
    analysisProgress.ts
    repository/
    portfolio/
  azure/                      # blob, document intelligence, CV normalization
  cv/
  github/
  models/
  presentation/
    reportsWorkspace.ts       # workspace report presentation models
    reportPresentation.ts
    cvPortfolioAlignmentPresentation.ts
    improvementSuggestions.ts
  providers/
    azure/
  services/
    analyzePortfolio.ts
    cvPortfolioAlignmentStep.ts
docs/
```

## Development

```bash
npm test      # vitest
npm run build
npm run lint
```

## Notes

- The repository analysis stage is intentionally deterministic and does not use AI.
- Lenses are configuration-first in `config/analysisLenses.ts`. Additional portfolio lenses are implemented but disabled by default.
- Technology grouping and representative repository selection happen only in the presentation layer and do not alter extracted evidence.
- Generated reports include provider metadata (`analysisSource`, `generationTimestamp`, optional `providerName`/`providerVersion`).
- Azure reports additionally include operational metadata such as per-request token usage (`requestTokenUsage`), analysis duration, and confidence aggregates.
- The report UI reads from the full evidence model but does not expose every internal artifact. Repository mappings, confidence values, extracted facts, and evidence links remain in the underlying model for traceability and future drill-down features.
