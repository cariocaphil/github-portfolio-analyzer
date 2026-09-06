# Roadmap

Build history for the GitHub Portfolio Analyzer.

PR numbers match merged GitHub pull requests. Future work continues from **PR 11**.

The README keeps a short **Current Status** summary and how the system works today; this file holds the full checklist and the planned modernization sequence.

---

## Completed work

### Initial Setup ✅

- [x] Scaffold Next.js App Router + TypeScript + Tailwind project
- [x] Add architecture source docs (`docs/architecture.md`, `docs/domain-model.md`, `docs/analysis-lenses.md`)
- [x] Add `.env.example` / local env pattern

### PR 1 — Initial MVP ✅

- [x] Real GitHub evidence collection (`lib/github/client.ts`, `evidenceProvider.ts`)
- [x] Deterministic repository analysis across 7 repository lenses
- [x] Portfolio evidence aggregation into a Unified Portfolio Evidence Model
- [x] Mock portfolio report generation (placeholder Azure module)
- [x] Analyze API (`app/api/analyze/route.ts`) and basic report UI
- [x] Lens configuration in `config/analysisLenses.ts`
- [x] Project README

### PR 2 — Improve Report Experience ✅

- [x] Executive summary and technology breakdown presentation
- [x] Report navigation and section organization
- [x] Evidence-oriented report visuals and improved reading experience
- [x] Presentation helpers in `lib/presentation/reportPresentation.ts`

### PR 3 — AI Provider Abstraction ✅

- [x] Introduce `PortfolioAnalysisProvider` interface
- [x] Move mock analysis into `MockPortfolioAnalysisProvider`
- [x] Add Azure placeholder provider + factory (`getPortfolioAnalysisProvider`)
- [x] Provider selection via `PORTFOLIO_ANALYSIS_PROVIDER` (default `mock`)
- [x] Typed provider errors (`ProviderConfigurationError`, `UnsupportedProviderError`, …)
- [x] Report metadata (`analysisSource`, `generationTimestamp`, optional provider fields)
- [x] Remove direct coupling to the old mock Azure module

### PR 4 — Azure OpenAI Integration ✅

- [x] Production `AzureOpenAIAnalysisProvider` with parallel lens analysis
- [x] Executive synthesis after lens completion
- [x] Structured outputs, retries, diagnostics, and confidence handling
- [x] Prompt construction and portfolio context builders under `lib/providers/azure/`
- [x] Add `openai` dependency and Vitest suite for provider internals

### PR 5 — Default Lenses Reduction ✅

- [x] Reduce default enabled portfolio lenses to `technical-breadth` and `project-complexity`
- [x] Keep remaining portfolio lenses implemented and re-enableable by configuration
- [x] Document MVP default scope in `docs/analysis-lenses.md`

### PR 6 — Token Optimizations ✅

- [x] Compact lens-specific repository context and tighter Azure context limits
- [x] Prompt/schema compaction and model-aware request parameters
- [x] Per-request token metadata and prompt-size diagnostics
- [x] Cleaner technology extraction/presentation and consolidated improvement suggestions
- [x] Executive-style report presentation refinements

### PR 7 — CV Analysis Pipeline ✅

- [x] CV upload vertical slice (`app/api/cv/upload/route.ts`)
- [x] Azure Blob Storage integration for PDF persistence
- [x] Azure Document Intelligence extraction (`prebuilt-layout`)
- [x] Azure OpenAI normalization into `CandidateEvidenceModel` (`domain/candidateEvidence.ts`)
- [x] Preserve raw extraction for debugging; isolate Azure SDKs behind services
- [x] CV validation, logging, typed errors, and Vitest coverage for mappers/services

### PR 8 — CV ↔ Portfolio Alignment ✅

- [x] Align normalized CV evidence against unified GitHub portfolio evidence
- [x] Produce `CvPortfolioAlignmentReport` (supported / weak / unsupported / missing / recommendations)
- [x] Unify home page into one **Analyze** action with optional CV input
- [x] Client orchestration (`runAnalysisWorkflow`) and analysis progress steps
- [x] Reports workspace with independent collapsible report cards
- [x] Graceful skip when CV extraction/normalization fails

### PR 9 — Cloud Deployment Hardening ✅

- [x] Next.js standalone `containerfile` for container deployment
- [x] GitHub fetch concurrency limiting and transient retry (502/503/504, rate limits)
- [x] Typed application error hierarchy and centralized API error mapping
- [x] User-facing `AnalysisErrorAlert` (no raw upstream leakage)

### PR 10 — CI/CD Automation ✅

- [x] GitHub Actions workflow to build, push ACR image, and update Azure Container Apps
- [x] Document container and production deploy path in README

### PR 11 — Project Roadmap ✅

- [x] Add `ROADMAP.md` capturing build history and modernization sequence
- [x] Documentation-only — no runtime, dependency, or tooling changes

---

## Planned modernization sequence

Future PRs continue the engineering story without rewriting the analysis methodology. Each item is intentionally scoped so AI-assisted work stays reviewable.

### PR 12 — Hygiene and Dead Code Removal

- [ ] Remove orphaned UI (`CvDeveloperPreview`, unused `ReportVisuals` / helpers)
- [ ] Clear stale TODOs that predate CV alignment
- [ ] Opportunistic naming cleanups only where touched (no broad renames)

### PR 13 — CV Upload Service Extraction

- [ ] Extract `processCvUpload()` (or equivalent) from `app/api/cv/upload/route.ts`
- [ ] Keep the API route thin: transport + error mapping only
- [ ] Mirror the `analyzeGitHubPortfolio` service boundary for testability

### PR 14 — CV Type and Validation Consolidation

- [ ] Unify overlapping CV context types (`CvAnalysisContext` / `CvAlignmentInput`)
- [ ] Deduplicate client/server CV file validation rules and messages
- [ ] Prefer shared types over manual field mapping across workflow → API → service

### PR 15 — Server-Side CV Reference Flow

- [ ] Avoid round-tripping full `candidateEvidence` (and PII) through the browser into `/api/analyze`
- [ ] Pass a server-side reference (for example blob name / analysis handle) and rehydrate on the server
- [ ] Keep portfolio analysis working when CV enrichment is absent or failed

### PR 16 — Reports Workspace Registry

- [ ] Replace hardcoded report-id switches with a registry of workspace reports
- [ ] Single place to declare visibility, header, sections, and content component
- [ ] Prepare for additional report types without growing `DeveloperPortfolioReport` ad hoc

### PR 17 — Service and API Test Coverage

- [ ] Add direct tests for `analyzeGitHubPortfolio` orchestration
- [ ] Cover analyze and CV upload API routes (validation, error mapping, happy paths)
- [ ] Prefer boundary tests over brittle UI snapshots unless a component owns non-trivial logic

### PR 18 — Honest Analysis Progress

- [ ] Align progress step timing with real workflow phases (CV compare does not finish before analyze)
- [ ] Prefer coarse accurate steps, or stream/server callbacks if finer granularity is required
- [ ] Keep progress UX understandable for portfolio-only and CV-enriched runs

### PR 19 — Azure Module Layout Cleanup

- [ ] Normalize root facades vs `lib/azure/` / `lib/providers/azure/` layout
- [ ] Optional shared structured-completion helper for normalizer/alignment boilerplate
- [ ] No changes to lens methodology or evidence contracts

### PR 20 — Domain / Model Boundary Clarification

- [ ] Document and enforce where types live (`domain/` vs `lib/models/` vs `types/`)
- [ ] Reduce coupling of workspace/CV status fields into the primary portfolio report model
- [ ] Consider an explicit multi-report analysis result shape before a third report type

### Later / optional follow-ons

- [ ] PR checks workflow (lint + test) on pull requests, separate from deploy-on-`main`
- [ ] Shared env/config helpers across Azure subsystems
- [ ] Provider abstraction for CV alignment (only if a second backend is needed)
- [ ] Client-side GitHub username validation parity with the API
- [ ] Re-enable additional portfolio lenses via configuration when cost/latency allows

---

## Out of scope for modernization (unless explicitly reopened)

- Replacing deterministic repository analysis with LLM repository scanning
- Giving any AI provider direct GitHub access
- Merging portfolio and CV reports into a single undifferentiated document
- Broad dependency upgrades or new tooling inside feature PRs
- Personal/psychological inference features
