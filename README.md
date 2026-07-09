# GitHub Portfolio Analyzer

Evidence-based analysis of a public GitHub portfolio that produces an Engineering Evidence Report.

## Current Status

This repository includes:

- Real GitHub evidence collection via GitHub REST API
- Deterministic repository analysis (no AI in repository stage)
- Portfolio evidence aggregation into a unified model
- Provider-agnostic portfolio analysis layer (`PortfolioAnalysisProvider`)
- Mock portfolio analysis provider (default, unchanged report output)
- Production Azure OpenAI provider with multi-stage analysis, retries, and structured-output fallbacks
- Next.js frontend for username input, loading/error states, and dynamic report rendering
- V2 report UX improvements (executive summary, sticky navigation, repository evidence explorer, categorized technologies, visual summaries)

## Architecture Alignment

The implementation follows the architecture documents in `docs/` as source of truth:

- `docs/architecture.md`
- `docs/domain-model.md`
- `docs/analysis-lenses.md`

Pipeline:

1. GitHub Evidence Provider
2. Repository Analysis (per repository, deterministic)
3. Repository Evidence Profiles
4. Portfolio Evidence Aggregator
5. Unified Portfolio Evidence Model
6. Portfolio Analysis (`PortfolioAnalysisProvider`)
7. Engineering Evidence Report

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS

Frontend and backend are in the same Next.js project.

## Current Behavior (Important)

- GitHub API calls are real and data-dependent.
- Portfolio report synthesis runs through `PortfolioAnalysisProvider`.
- Default provider is `mock` via `MockPortfolioAnalysisProvider` (same deterministic output as before).
- `azure-openai` performs parallel lens analysis, executive synthesis, confidence aggregation, and token/metadata capture.
- Provider selection is centralized in `getPortfolioAnalysisProvider()`.

## Requirements

- Node.js 18+ (Node 20+ recommended)
- npm

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Optional:

- `GITHUB_TOKEN`: increases GitHub API rate limits and reliability.
- `PORTFOLIO_ANALYSIS_PROVIDER`: `mock` (default) or `azure-openai`.
- `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`: required when using `azure-openai`.

Azure API version notes:

- `AZURE_OPENAI_API_VERSION=v1` uses Azure OpenAI v1 path handling (`/openai/v1/`) and does **not** append `?api-version=v1`.
- Dated Azure API versions (for example `2024-10-21`) continue using legacy `api-version` query handling.

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Report Experience (V2 Presentation Layer)

The analysis pipeline and model remain unchanged, while the report UI has been upgraded for readability and traceability:

- Executive Summary dashboard at the top
- Sticky table of contents with anchor navigation and back-to-top links
- Presentation-layer technology categorization with fallback to `General Utilities`
- Consistent per-lens structure (summary, score, key findings, supporting evidence, repository explorer)
- Repository-first evidence explorer with independent accordion state
- Lightweight visual summaries (lens density, technology categories, repository evidence profile)

## Usage

1. Enter a GitHub username.
2. Click **Analyze**.
3. Review the generated Engineering Evidence Report.

Each report section is rendered dynamically from configured Portfolio Analysis Lenses and includes:

- Lens title
- Guiding question
- Observations
- Rationale
- Confidence
- Supporting evidence (repository, path, description, facts, and GitHub URL when available)

Each major conclusion can be inspected through:

`Conclusion -> Evidence -> Repository -> Expandable Details`

## Project Structure

```text
app/
  api/analyze/route.ts
  layout.tsx
  page.tsx
components/
  AnalyzeForm.tsx
  ExecutiveSummary.tsx
  ReportNavigation.tsx
  ReportVisuals.tsx
  TechnologyBreakdown.tsx
  ReportView.tsx
  ReportSection.tsx
config/
  analysisLenses.ts
lib/
  analysis/
    repository/
    portfolio/
  errors/
  github/
  models/
  presentation/
  providers/
  services/
docs/
```

## Notes

- The repository analysis stage is intentionally deterministic and does not use AI.
- Lenses are configuration-first in `config/analysisLenses.ts`.
- Technology grouping is done only in the UI/presentation layer and does not alter extracted evidence.
- Generated reports include provider metadata (`analysisSource`, `generationTimestamp`, optional `providerName`/`providerVersion`).
- Azure reports additionally include operational metadata such as token usage, analysis duration, and confidence aggregates.
- If additional lenses are added without implementation wiring, TODO markers indicate extension points.
