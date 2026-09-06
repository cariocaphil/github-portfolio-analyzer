# Roadmap

Build history for the GitHub Portfolio Analyzer.

PR numbers match merged GitHub pull requests. Future work continues from **PR 12**.

The README keeps a short **Current Status** summary and how the system works today; this file holds the full checklist and the planned modernization sequence. AI-assisted development guidance lives in [`CLAUDE.md`](./CLAUDE.md).

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

### PR 12 — Claude Development Guidance ✅

- [x] Add repository-level `CLAUDE.md`
- [x] Document the current architecture and important code paths
- [x] Document the distinction between deterministic evidence collection and LLM interpretation
- [x] Record project-specific development principles and architectural boundaries
- [x] Document verified development, test, and build commands
- [x] Reference this roadmap for modernization priorities
- [x] Documentation-only — no runtime changes or Claude-specific application dependencies

---

## Planned modernization sequence

Future PRs continue the engineering story without rewriting the core analysis methodology.

The modernization has four goals:

1. make AI-assisted development safer and more consistent,
2. strengthen existing service and data boundaries,
3. make AI behavior measurable and observable,
4. harden the deployed application for controlled public use.

Each PR should remain narrowly scoped and independently reviewable.

---

### Phase 5 — Development and Engineering Foundation

### PR 13 — Pull Request CI Quality Gates

* [ ] Add a PR checks workflow separate from deployment
* [ ] Run lint
* [ ] Run Vitest
* [ ] Run TypeScript / build validation
* [ ] Require successful checks before modernization changes are merged
* [ ] Keep deployment-on-`main` as a separate concern

### PR 14 — Hygiene and Dead Code Removal

* [ ] Remove orphaned UI (`CvDeveloperPreview`, unused `ReportVisuals` / helpers)
* [ ] Clear stale TODOs that predate CV alignment
* [ ] Remove clearly obsolete code paths discovered during repository inspection
* [ ] Allow opportunistic naming cleanups only where touched
* [ ] Avoid broad renames or architecture changes

---

### Phase 6 — Service and Data Boundary Cleanup

### PR 15 — CV Upload Service Extraction

* [ ] Extract `processCvUpload()` (or equivalent) from `app/api/cv/upload/route.ts`
* [ ] Keep the API route responsible primarily for transport, validation, and error mapping
* [ ] Move CV workflow orchestration into a testable service boundary
* [ ] Mirror the existing `analyzeGitHubPortfolio` service structure where appropriate
* [ ] Preserve current CV behavior

### PR 16 — CV Type and Validation Consolidation

* [ ] Unify overlapping CV context types such as `CvAnalysisContext` / `CvAlignmentInput`
* [ ] Deduplicate client/server CV file validation rules where practical
* [ ] Centralize shared validation messages and constraints
* [ ] Prefer shared typed contracts over repeated manual mapping across workflow → API → service
* [ ] Preserve explicit boundaries where client and server representations genuinely differ

### PR 17 — Server-Side CV Reference Flow

* [ ] Avoid round-tripping full normalized `candidateEvidence` through the browser into `/api/analyze`
* [ ] Pass an opaque server-side analysis reference, blob reference, or equivalent handle
* [ ] Rehydrate CV-derived evidence on the server
* [ ] Reduce unnecessary exposure of CV-derived personal data to the client
* [ ] Keep portfolio-only analysis completely independent of CV enrichment
* [ ] Preserve graceful portfolio analysis when CV processing fails

This PR should explicitly document the resulting trust and data-flow boundary.

### PR 18 — Service and API Coverage

* [ ] Add direct tests for `analyzeGitHubPortfolio` orchestration
* [ ] Add direct tests for the extracted CV upload service
* [ ] Cover `/api/analyze` validation, error mapping, and happy paths
* [ ] Cover `/api/cv/upload` validation, error mapping, and happy paths
* [ ] Prefer service and boundary tests over brittle UI snapshots
* [ ] Add coverage reporting / Codecov once meaningful boundary coverage exists

---

### Phase 7 — AI Contract and Prompt Maturity

### PR 19 — Prompt Architecture

* [ ] Inventory all Azure OpenAI prompt paths
* [ ] Normalize prompt ownership and naming
* [ ] Clearly separate prompt construction from transport/provider mechanics
* [ ] Keep portfolio analysis, CV normalization, CV alignment, and executive synthesis prompts distinct
* [ ] Make prompts independently reviewable and testable
* [ ] Preserve the existing analysis methodology and enabled lenses
* [ ] Avoid prompt changes that increase token cost without a demonstrated reason

This PR is about prompt organization, not changing what the application is intended to conclude.

### PR 20 — Runtime AI Contracts

* [ ] Inventory TypeScript types, JSON schemas, and structured-output definitions used by LLM calls
* [ ] Remove unnecessary duplication between compile-time types and runtime output contracts
* [ ] Establish one clear runtime validation contract for each structured LLM response
* [ ] Fail explicitly when model output violates the expected contract
* [ ] Keep validation close to the LLM boundary
* [ ] Do not silently repair semantically invalid output

---

### Phase 8 — AI Evaluation

### PR 21 — Evaluation Foundation

* [ ] Add a dedicated `evals/` structure
* [ ] Support deterministic fixtures and saved model outputs
* [ ] Separate evaluation datasets from runtime tests
* [ ] Allow offline evaluation without requiring live Azure OpenAI calls
* [ ] Record evaluation results in a reproducible format
* [ ] Keep eval tooling separate from production runtime paths

### PR 22 — Portfolio Grounding Evaluations

Evaluate whether generated portfolio assessments are justified by deterministic GitHub evidence.

Candidate checks:

* [ ] Required report structure is present
* [ ] Referenced technologies exist in collected evidence
* [ ] Repository examples correspond to actual evidence
* [ ] Scores stay within expected ranges
* [ ] Claims do not materially exceed available evidence
* [ ] Representative evidence is selected rather than fabricated
* [ ] Disabled lenses do not unexpectedly influence output

### PR 23 — CV Alignment Evaluations

Evaluate the core CV ↔ GitHub reasoning task.

Create labeled cases covering:

* [ ] clearly supported CV claims
* [ ] weakly supported claims
* [ ] unsupported claims
* [ ] evidence present in GitHub but absent from the CV
* [ ] ambiguous or overly broad CV claims
* [ ] recommendations based on evidence gaps

Measure whether the generated alignment classification and explanation agree with expected evidence.

Use deterministic scoring where possible; introduce LLM-as-judge only where deterministic checks are insufficient.

---

### Phase 9 — Trust, Security, and Observability

### PR 24 — Untrusted Content Boundaries

Treat GitHub content and uploaded CV text as untrusted model input.

* [ ] Explicitly delimit external content in prompts
* [ ] Make clear that repository/CV content is evidence, not instructions
* [ ] Review README, repository metadata, extracted document text, and similar inputs for prompt-injection exposure
* [ ] Add adversarial test/eval cases
* [ ] Preserve deterministic GitHub collection as the source of portfolio evidence
* [ ] Do not give the LLM direct GitHub access

### PR 25 — OpenTelemetry and Application Insights

Add end-to-end tracing around the analysis pipeline.

Candidate spans:

* [ ] portfolio analysis run
* [ ] GitHub evidence collection
* [ ] evidence aggregation
* [ ] portfolio lens calls
* [ ] executive synthesis
* [ ] CV upload/storage
* [ ] Document Intelligence extraction
* [ ] CV normalization
* [ ] CV alignment

Correlate where practical:

* [ ] request/run identifier
* [ ] model/provider
* [ ] duration
* [ ] retries
* [ ] prompt/completion/total tokens
* [ ] failures

Avoid recording CV contents, repository contents, prompts, or other sensitive payloads in telemetry.

### PR 26 — CI/CD and Supply-Chain Hardening

* [ ] Make production deployment dependent on successful CI
* [ ] Add dependency/security scanning
* [ ] Add container image scanning
* [ ] Prefer immutable image identifiers / commit-SHA tagging where practical
* [ ] Review GitHub Actions permissions
* [ ] Keep GitHub → Azure authentication based on OIDC
* [ ] Avoid unrelated dependency upgrades in this PR

---

### Phase 10 — Controlled Public Deployment

### PR 27 — Authentication

* [ ] Add Azure Container Apps / Easy Auth-based authentication
* [ ] Support an appropriate low-friction login experience for portfolio reviewers
* [ ] Keep authentication concerns separate from analysis logic
* [ ] Ensure unauthenticated users cannot trigger paid analysis operations

### PR 28 — Per-User Quotas and Cost Controls

* [ ] Add per-user usage accounting
* [ ] Enforce a conservative analysis quota
* [ ] Keep quota storage outside the application process
* [ ] Return clear quota-exceeded behavior
* [ ] Preserve portfolio-only and CV-enriched analysis as distinguishable cost paths where useful
* [ ] Document the application's cost-control model

### PR 29 — Azure Identity Hardening

* [ ] Review Azure service authentication paths
* [ ] Prefer managed identity + RBAC over secrets/connection strings where supported and practical
* [ ] Apply least-privilege permissions
* [ ] Document intentionally retained secrets and why they remain necessary
* [ ] Do not replace working authentication mechanisms solely for architectural purity

---

## Candidate follow-ons

These are valid improvements, but should only become numbered PRs when the preceding modernization work demonstrates a real need.

### Reports Workspace Registry

* [ ] Replace hardcoded report-id switches with a report registry if a third report type is introduced or current branching becomes difficult to maintain
* [ ] Centralize report visibility, headers, sections, and content ownership
* [ ] Avoid introducing the abstraction solely to generalize two report types

### Honest Analysis Progress

* [ ] Align displayed progress with actual workflow phases
* [ ] Avoid showing CV comparison as complete before server-side analysis has actually performed it
* [ ] Prefer coarse but truthful progress over simulated precision
* [ ] Consider streaming/server callbacks only if the UX benefit justifies the complexity

### Azure Module Layout Cleanup

* [ ] Normalize root facades vs `lib/azure/` / `lib/providers/azure/` only where existing boundaries cause real navigation or ownership problems
* [ ] Consider a shared structured-completion helper if repeated Azure OpenAI boilerplate remains after prompt/contract modernization
* [ ] Avoid folder restructuring for cosmetic consistency alone

### Domain / Model Boundary Clarification

* [ ] Clarify where domain models, transport models, UI/workspace models, and provider contracts belong
* [ ] Reduce workspace/CV UI state leaking into the primary portfolio domain model
* [ ] Introduce an explicit multi-report result type if additional report types make the existing result shape inadequate
* [ ] Avoid repo-wide type movement unless it solves demonstrated coupling

### Other possible follow-ons

* [ ] Shared environment/config helpers across Azure subsystems
* [ ] Client-side GitHub username validation parity with the API
* [ ] Provider abstraction for CV alignment only if a second implementation is genuinely planned
* [ ] Re-enable additional portfolio lenses through configuration when evaluation results justify the added cost/latency
* [ ] Add specialized `.claude/skills/` only after repeated development workflows make them worthwhile

---

## Out of scope for modernization unless explicitly reopened

* Replacing deterministic repository evidence collection with LLM repository scanning
* Giving an AI provider direct GitHub access
* Rewriting the portfolio analysis methodology as part of infrastructure/refactoring PRs
* Merging portfolio and CV reports into one undifferentiated report
* Introducing generic abstractions solely for hypothetical future use cases
* Broad dependency upgrades bundled into feature PRs
* Switching AI providers merely to support development tooling such as `CLAUDE.md`
* Personal, psychological, personality, employability, or other unsupported inference features
* Sending CV contents, repository contents, prompts, or model responses to telemetry by default

