# CLAUDE.md

Project orientation for Claude Code (and similar assistants) working in this repository.

**Coding rules are not defined here.** Follow [`AGENTS.md`](./AGENTS.md) for all tool-independent agent constraints, workflow, and safety rules.

| Document | Role |
|----------|------|
| [`AGENTS.md`](./AGENTS.md) | Durable rules for any coding agent |
| [`ROADMAP.md`](./ROADMAP.md) | Build history and modernization sequence |
| [`README.md`](./README.md) | Product behavior and local setup |
| `docs/` | Architecture contracts (`architecture.md`, `domain-model.md`, `analysis-lenses.md`) |

---

## What this project is

Evidence-based engineering assessment for public GitHub portfolios.

One **Analyze** action produces:

1. **Engineering Portfolio Assessment** (always)
2. **CV ↔ GitHub Alignment Report** (optional, when a CV PDF is supplied and normalization succeeds)

Stack: Next.js App Router, TypeScript, React, Tailwind, Vitest. Frontend and API routes share the same project.

**Critical boundary:** GitHub evidence collection and repository analysis are deterministic. LLMs only interpret structured evidence (portfolio analysis, CV normalization, CV alignment). Details and hard constraints: `AGENTS.md`.

---

## Important code paths

### Entry points

- `app/page.tsx` — unified Analyze UI
- `lib/analysis/runAnalysisWorkflow.ts` — client orchestration (optional CV upload, then analyze)
- `app/api/analyze/route.ts` — portfolio analysis (+ optional alignment input)
- `app/api/cv/upload/route.ts` — CV upload, extraction, normalization

### Portfolio pipeline

- `lib/github/` — GitHub client, evidence provider, concurrency, retries
- `lib/analysis/repository/` — deterministic per-repo analyzers
- `lib/analysis/portfolio/aggregator.ts` — unified evidence model
- `lib/services/analyzePortfolio.ts` — server orchestration
- `lib/providers/PortfolioAnalysisProvider.ts` — provider interface
- `lib/providers/PortfolioAnalysisProviderFactory.ts` — `mock` | `azure-openai`
- `lib/providers/azure/` — Azure OpenAI prompts, context builders, schemas, client

### CV pipeline

- `lib/azureBlobStorage.ts` + `lib/azure/` — blob persistence
- `lib/azureDocumentIntelligence.ts` — layout extraction (`prebuilt-layout`)
- `lib/azureCvNormalizer.ts` — raw extraction → `CandidateEvidenceModel`
- `domain/candidateEvidence.ts` — canonical CV evidence
- `lib/cvPortfolioAlignment.ts` + `lib/services/cvPortfolioAlignmentStep.ts` — alignment
- `domain/cvPortfolioAlignment.ts` — alignment report types

### Presentation and errors

- `lib/presentation/reportsWorkspace.ts` — independent workspace reports
- `components/reports/` — report cards and content
- `config/analysisLenses.ts` — lens methodology (configuration-first)
- `lib/errors/` — typed application errors; API responses expose only `{ title, message }`

---

## Verified commands

From the repository root (Node 18+, Node 20+ recommended):

```bash
npm install
npm run dev          # Next.js dev server → http://localhost:3000
npm test             # vitest run
npm run test:watch   # vitest watch mode
npm run lint         # next lint
npm run build        # production build (also used by container image)
npm start            # start production server after build
```

Environment: copy `.env.example` → `.env.local`. Default `PORTFOLIO_ANALYSIS_PROVIDER=mock`. Azure OpenAI, Blob Storage, and Document Intelligence variables are required only for real Azure provider / CV flows.

Container (local):

```bash
podman build -f containerfile -t github-portfolio-analyzer:local .
# or: docker build -f containerfile ...
```

Deploy automation: `.github/workflows/deploy.yml` (build/push/deploy on `main` only). PR quality gates are planned separately in `ROADMAP.md`.

---

## Claude-specific notes

- Adding or updating this file does **not** imply changing the application's runtime AI provider.
- Do not add Claude-specific application dependencies for development guidance.
- For modernization work, implement the next scoped PR from `ROADMAP.md` and obey `AGENTS.md` (especially scope, validation, and git handoff: stage and propose a commit message; do not commit unless the user asks).
