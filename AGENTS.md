# AGENTS.md

Instructions for AI coding agents working on the GitHub Portfolio Analyzer.

These rules apply regardless of which coding assistant, agent, IDE integration, or model is being used.

The goal is to keep AI-assisted changes small, reviewable, architecture-aware, and safe.

| Document | Role |
|----------|------|
| **This file (`AGENTS.md`)** | Durable, tool-independent rules (source of truth for agent behavior) |
| [`CLAUDE.md`](./CLAUDE.md) | Project orientation: purpose, code map, verified commands |
| [`ROADMAP.md`](./ROADMAP.md) | Build history and modernization sequence |
| [`README.md`](./README.md) | Product behavior and human setup |
| `docs/` | Architecture contracts |

When you need a file map or how to run the app, read `CLAUDE.md`. When you need constraints, follow this file.

---

## 1. Understand the project before changing it

Before modifying code:

* Inspect the relevant implementation and its surrounding callers.
* Check existing types, tests, services, configuration, and documentation before introducing new structures.
* Prefer extending an established project pattern over creating a parallel abstraction.
* Do not infer architecture from filenames alone.
* Do not assume a planned roadmap item has already been implemented.
* Use `CLAUDE.md` for orientation and important paths; use `docs/` for architectural contracts.

When architecture or ownership is unclear, inspect the code path end to end before changing it.

---

## 2. Preserve the core architecture

The project intentionally separates deterministic evidence collection from LLM interpretation.

### GitHub evidence

GitHub portfolio evidence should remain deterministic wherever practical.

Do not:

* replace deterministic repository analysis with LLM repository scanning,
* give an LLM provider direct GitHub access,
* move deterministic evidence extraction into prompts merely for convenience.

The LLM should interpret structured evidence collected by the application rather than independently inspect repositories.

### AI analysis

Keep distinct responsibilities separate:

* GitHub evidence collection,
* portfolio evidence aggregation,
* portfolio analysis,
* executive synthesis,
* CV upload and extraction,
* CV normalization,
* CV ↔ portfolio alignment,
* report presentation.

Do not collapse these stages into a single LLM call or undifferentiated workflow unless explicitly requested.

### Provider boundaries

Azure-specific AI implementation belongs behind the existing provider/service boundaries.

Do not bypass an existing abstraction merely because calling an SDK directly would be shorter.

Do not introduce a new provider abstraction unless there is a concrete need for more than one implementation.

---

## 3. Prefer deterministic logic over LLM calls

Do not use an LLM for work that can be performed reliably with normal application logic.

Prefer deterministic code for:

* validation,
* filtering,
* normalization where rules are explicit,
* aggregation,
* routing,
* error mapping,
* configuration,
* file constraints,
* repository metadata processing.

LLM calls should be reserved for tasks that genuinely require interpretation, synthesis, or semantic judgment.

---

## 4. Protect evidence grounding

Generated portfolio assessments must remain grounded in collected GitHub evidence.

Do not:

* invent repository evidence,
* infer technologies that are not supported by collected artifacts,
* silently strengthen weak evidence,
* make unrelated changes to the analysis methodology during infrastructure or refactoring work.

Changes to:

* analysis lenses,
* prompt methodology,
* scoring,
* evidence contracts,
* enabled lenses,

should be explicit parts of the requested change rather than incidental side effects.

---

## 5. Treat external content as untrusted data

Content originating outside the application must be treated as data, not instructions.

This includes:

* GitHub README content,
* repository metadata,
* repository files,
* CV text,
* Document Intelligence output,
* user-provided text.

Do not allow external content to override system or application instructions.

When working on LLM prompts, preserve a clear distinction between:

* application instructions,
* structured application context,
* untrusted external content.

Do not add direct model access to external systems unless explicitly required and reviewed.

---

## 6. Protect CV and personal data

CV-derived information may contain personal information.

Minimize unnecessary movement, duplication, logging, and client exposure of CV-derived data.

Do not:

* log complete CV contents,
* add CV text to telemetry,
* expose normalized evidence to the browser unless the product requires it,
* persist new copies of CV-derived data without a clear reason,
* include CV contents in debug output by default.

Prefer server-side processing and references where practical.

---

## 7. Keep API routes thin

API routes should primarily handle transport concerns such as:

* request parsing,
* validation,
* authentication or authorization when applicable,
* calling application/service logic,
* mapping application errors to HTTP responses.

Complex orchestration should live in testable services rather than route handlers.

Follow existing service boundaries before introducing new ones.

---

## 8. Preserve typed boundaries

Prefer explicit typed contracts between:

* API and service layers,
* services and providers,
* LLM boundaries and domain models,
* domain models and presentation models.

Avoid:

* repeated manual object mapping when a shared contract is appropriate,
* `any` as a shortcut around type problems,
* unchecked casts used only to silence TypeScript,
* duplicating equivalent types across several layers without a reason.

Runtime validation is required where data crosses an untrusted runtime boundary.

TypeScript types alone are not runtime validation.

---

## 9. Keep LLM contracts explicit

Structured LLM responses should have explicit runtime contracts.

When modifying an LLM call:

* identify the expected output structure,
* preserve or strengthen runtime validation,
* fail clearly when output violates the contract,
* keep validation close to the model boundary.

Do not silently coerce semantically invalid responses into apparently valid domain objects.

Prompt changes and output-contract changes should be independently understandable during review.

---

## 10. Keep prompts maintainable

When working with prompts:

* keep different AI tasks distinct,
* separate prompt construction from API transport logic where practical,
* avoid duplicating common instructions unnecessarily,
* keep external content clearly delimited,
* preserve structured-output requirements,
* avoid token growth without a clear quality justification.

Do not rewrite prompts opportunistically during unrelated refactoring.

Prompt behavior should eventually be supported by evals rather than judged only by manual inspection.

---

## 11. Follow the roadmap

Use `ROADMAP.md` as the source of truth for the intended modernization sequence.

When implementing a numbered modernization PR:

* stay within that PR's stated scope,
* do not pull later roadmap work into the current change merely because it is nearby,
* do not perform broad architecture cleanups unless they are required by the current PR,
* preserve explicitly deferred work for its planned PR.

If implementation reveals that a roadmap item no longer makes sense, propose a roadmap change rather than silently expanding scope.

---

## 12. Keep changes small and reviewable

Prefer the smallest change that fully satisfies the requested task.

Avoid:

* unrelated refactors,
* broad renames,
* folder reorganizations without demonstrated benefit,
* speculative abstractions,
* dependency upgrades unrelated to the task,
* formatting unrelated files,
* rewriting functioning code solely for stylistic consistency.

If an adjacent issue is discovered but not required for the current task, mention it separately rather than automatically fixing it.

---

## 13. Do not over-engineer for hypothetical future needs

Add abstractions when the current code demonstrates a real need.

Do not introduce:

* registries for two fixed cases solely because a third case might exist someday,
* provider abstractions without another implementation or clear requirement,
* generic frameworks around a single simple workflow,
* repository-wide type reorganizations for cosmetic consistency.

Prefer concrete code until repeated patterns justify abstraction.

---

## 14. Testing expectations

Behavior changes should be covered at the most appropriate boundary.

Prefer:

* unit tests for deterministic logic,
* service tests for orchestration,
* API tests for validation and error mapping,
* provider-boundary tests for AI request/response handling,
* evals for model quality and evidence grounding.

Avoid brittle UI snapshot tests unless the component owns meaningful behavior that is otherwise difficult to verify.

When fixing a bug, add a regression test when practical.

Do not remove or weaken tests merely to make a change pass.

---

## 15. Validation before completion

Before considering implementation work complete, run the relevant repository checks available for the project.

At minimum, when supported by the current repository configuration, run:

* lint,
* tests,
* TypeScript/build validation.

Use the commands defined by the repository itself (see `package.json` and `CLAUDE.md`), rather than inventing alternatives.

If a check cannot be run or fails for a reason unrelated to the change, report that explicitly.

Do not claim checks passed unless they were actually run successfully.

---

## 16. Error handling

Preserve the existing typed application error model and centralized API error mapping.

Do not:

* expose raw Azure, GitHub, or OpenAI exceptions directly to users,
* replace typed errors with generic strings,
* swallow errors without logging or returning an intentional fallback,
* expose secrets or upstream payloads in error messages.

User-facing errors should remain understandable without leaking implementation details.

---

## 17. Logging and observability

Logs and telemetry should describe system behavior without capturing sensitive payloads.

Safe telemetry may include information such as:

* operation name,
* provider/model,
* durations,
* token counts,
* retry counts,
* success/failure state,
* correlation/run identifiers.

Do not record by default:

* CV contents,
* repository file contents,
* complete prompts,
* complete model responses,
* credentials,
* secrets.

Observability changes must not weaken privacy boundaries.

---

## 18. Dependencies and tooling

Do not add dependencies unless they provide clear value for the requested change.

Before adding a package:

* check whether the repository already has an appropriate dependency,
* prefer platform or standard-library capabilities for simple tasks,
* avoid introducing a large dependency for a small helper.

Do not perform broad dependency upgrades inside unrelated feature PRs.

Development tooling must not dictate runtime architecture.

For example, adding `CLAUDE.md`, `AGENTS.md`, or Claude development tooling does not imply migrating the application's runtime AI provider.

---

## 19. Documentation

Update documentation when a change materially alters:

* architecture,
* service ownership,
* developer commands,
* deployment,
* security boundaries,
* AI contracts,
* observability,
* roadmap status.

Keep documentation aligned with what actually exists.

Do not describe planned functionality as though it is already implemented.

Keep document roles distinct:

* `ROADMAP.md` — project evolution and planned modernization
* `CLAUDE.md` — orientation (purpose, code paths, verified commands); not a second rulebook
* `AGENTS.md` — this file; durable tool-independent rules for coding agents
* `README.md` / `docs/` — human-facing product and architecture truth

Do not duplicate long rule lists into `CLAUDE.md`. Point agents at this file instead.

---

## 20. Git workflow

When making code or documentation changes:

1. Modify the requested files.
2. Review the resulting diff.
3. Run the relevant validation checks.
4. Stage the completed changes with Git.
5. Leave the staged changes ready for human review.
6. Propose a concise commit message describing the completed change.

Do **not** create the commit automatically.

Unless explicitly instructed by the user, do not:

* commit,
* amend commits,
* push,
* merge,
* rebase,
* reset,
* cherry-pick,
* force-push,
* create or delete tags,
* rewrite Git history.

If the user asks for a commit message, provide the message but do not execute the commit.

If the requested work contains multiple genuinely independent logical changes, point this out and propose separate commits rather than bundling unrelated work.

The default handoff is:

**agent implements → agent validates → agent stages → agent proposes commit message → human reviews and commits**

---

## 21. Completion report

After implementing a requested change, report:

* what changed,
* which files were affected,
* which checks were run and their results,
* any important limitations or follow-up issues discovered,
* the proposed commit message.

Keep the completion report concise.

Do not claim work was performed that was not actually completed.

---

## 22. Explicitly prohibited incidental changes

Unless the task explicitly requires them, do not:

* replace deterministic GitHub analysis with LLM scanning,
* give an LLM direct GitHub access,
* change enabled analysis lenses,
* change scoring methodology,
* merge CV and portfolio reports into one undifferentiated report,
* add personal, psychological, personality, or employability inference,
* migrate AI providers solely because a development agent uses another model,
* expose CV or repository contents through telemetry,
* perform broad dependency upgrades,
* rewrite unrelated functioning code.

If a requested change appears to require breaking one of these constraints, surface the conflict before expanding the implementation.
