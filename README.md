# GitHub Portfolio Analyzer

Evidence-based analysis of a public GitHub portfolio that produces an Engineering Evidence Report.

## V1 Status

This repository implements the first working vertical slice:

- Real GitHub evidence collection via GitHub REST API
- Deterministic repository analysis (no AI in repository stage)
- Portfolio evidence aggregation into a unified model
- Mock Azure OpenAI report generation layer (AI call not wired yet)
- Next.js frontend for username input, loading/error states, and dynamic report rendering

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
6. Portfolio Analysis (mock Azure OpenAI layer)
7. Engineering Evidence Report

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS

Frontend and backend are in the same Next.js project.

## Current Behavior (Important)

- GitHub API calls are real and data-dependent.
- Portfolio report synthesis is currently mocked in `lib/azureOpenAI.ts`.
- The file includes a clear stub showing how a future Azure OpenAI Structured Outputs call can replace the mock implementation.

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

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

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

## Project Structure

```text
app/
  api/analyze/route.ts
  layout.tsx
  page.tsx
components/
  AnalyzeForm.tsx
  ReportView.tsx
  ReportSection.tsx
  Observation.tsx
  Evidence.tsx
config/
  analysisLenses.ts
lib/
  analysis/
    repository/
    portfolio/
  github/
  models/
  services/
  azureOpenAI.ts
docs/
```

## Notes

- The repository analysis stage is intentionally deterministic and does not use AI.
- Lenses are configuration-first in `config/analysisLenses.ts`.
- If additional lenses are added without implementation wiring, TODO markers indicate extension points.
