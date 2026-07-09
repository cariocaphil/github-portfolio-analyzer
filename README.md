# GitHub Portfolio Analyzer

Evidence-based analysis of a public GitHub portfolio that produces an Engineering Portfolio Assessment.

The analysis engine collects and reasons over repository evidence. The report presents those conclusions as a concise executive-style assessment—not an internal analysis log.

## Current Status

This repository includes:

- Real GitHub evidence collection via GitHub REST API
- Deterministic repository analysis across 7 repository lenses (no AI in repository stage)
- Portfolio evidence aggregation into a unified model
- Provider-agnostic portfolio analysis layer (`PortfolioAnalysisProvider`)
- Mock portfolio analysis provider (default, unchanged report output)
- Production Azure OpenAI provider with parallel lens analysis, executive synthesis, retries, structured-output fallbacks, and prompt-size optimization
- Next.js frontend for username input, loading/error states, and dynamic report rendering
- Executive assessment presentation layer (concise summaries, representative evidence, consolidated improvements)

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

The report UI reads from the full evidence model but does not expose every internal artifact. Repository mappings, confidence values, extracted facts, and evidence links remain in the underlying model for traceability and future drill-down features.

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
- `azure-openai` runs 2 portfolio lenses by default (`technical-breadth`, `project-complexity`) plus executive summary synthesis.
- Azure provider uses lens-specific portfolio context, compact repository blocks, structured JSON outputs, model-aware request parameters, and per-request token metadata.
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

## Report Experience (Presentation Layer)

The analysis pipeline and evidence model are unchanged. Presentation transforms the report into a consulting-style assessment:

- **Engineering Portfolio Assessment** header with developer snapshot
- **Executive Summary** with strengths, positioning, and readiness signals
- **Technology Breakdown** with normalized, categorized technologies
- **Portfolio lens sections** (summary, score, key findings, representative repositories)
- **Improvement suggestions** consolidated into a short, theme-based list (max 5)

Per-lens sections emphasize conclusions supported by representative examples—not full repository dumps. Each lens shows 3–5 **representative repositories** chosen to best support that lens's conclusions (for example: `github-portfolio-analyzer — React, Next.js, Azure OpenAI integration`).

Presentation-only refinements:

- Key findings deduplicated against lens summaries
- Boilerplate rationales filtered from the UI
- Technology names normalized for readability
- Repository Explorer removed from the default report view (underlying evidence grouping remains available in `lib/presentation/reportPresentation.ts` for future drill-down)

## Usage

1. Enter a GitHub username.
2. Click **Analyze**.
3. Review the generated Engineering Portfolio Assessment.

The reader should quickly understand engineering strengths, maturity, technical positioning, and improvement areas without wading through internal analysis artifacts.

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
  ReportVisuals.tsx          # retained for future drill-down; not in default report
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
    reportPresentation.ts    # executive summary, representative repos, evidence grouping
    improvementSuggestions.ts
  providers/
    azure/                   # context limits, prompts, completion client, schemas
  services/
  technology/
    normalization.ts
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
- If additional lenses are added without implementation wiring, TODO markers indicate extension points.
