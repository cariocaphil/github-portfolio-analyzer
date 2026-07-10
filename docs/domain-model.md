# Domain Model

## Core Concepts

The application revolves around evidence models, analysis outputs, and workspace presentation.

```text
GitHub Portfolio

↓

Repository

↓

Repository Evidence Profile

↓

Unified Portfolio Evidence Model

↓

Portfolio Analysis Provider

↓

Portfolio Analysis Lens

↓

Engineering Portfolio Assessment

↓

[optional] CV Portfolio Alignment Report

↓

Reports Workspace (presentation)
```

---

# Evidence Provider

Responsible for retrieving raw engineering data.

Current implementation:

* GitHub

---

# Repository Evidence Profile

Represents the engineering evidence extracted from a single repository.

It is an intermediate model between raw GitHub data and portfolio-level analysis.

A Repository Evidence Profile contains:

* repository metadata
* detected technologies
* engineering observations
* references to supporting Evidence Sources

---

# Evidence Source

Represents a concrete piece of observable engineering evidence.

Examples:

* Dockerfile
* package.json
* GitHub workflow
* README
* deployment link

Every observation must reference one or more Evidence Sources.

---

# Unified Portfolio Evidence Model

Represents the complete engineering evidence extracted from the developer's public portfolio.

It aggregates evidence from all Repository Evidence Profiles.

Portfolio Analysis operates exclusively on this model.

The Unified Portfolio Evidence Model is provider-agnostic. Provider-specific metadata does not belong in this model.

---

# Portfolio Analysis Provider

Responsible for interpreting the Unified Portfolio Evidence Model and producing an Engineering Evidence Report.

A provider:

* receives the Unified Portfolio Evidence Model
* applies Portfolio Analysis Lenses
* returns a `DeveloperPortfolioReport`

The application depends on the provider interface rather than on a concrete implementation.

Current implementations:

* Mock provider (default)
* Azure OpenAI provider (production)

---

# Analysis Lens

An Analysis Lens defines how engineering evidence should be interpreted.

An Analysis Lens contains:

* title
* guiding question
* description
* prompt instructions

The application has two categories of lenses:

* Repository Analysis Lenses
* Portfolio Analysis Lenses

Repository lenses analyze individual repositories.

Portfolio lenses analyze the portfolio as a whole.

---

# Engineering Portfolio Assessment

The primary analysis output (`DeveloperPortfolioReport`).

It consists of:

* developer snapshot
* report sections
* observations
* evidence references
* portfolio improvement suggestions
* report metadata
* optional CV alignment fields when a CV was part of the analysis run

Report metadata describes how the report was generated. It includes:

* analysis source
* generation timestamp
* optional provider name
* optional provider version
* optional provider runtime metrics (for example model/deployment identifier, token usage, duration, and confidence aggregates)

Metadata belongs to the generated report, not to the Unified Portfolio Evidence Model.

Every observation must be explainable and traceable back to engineering evidence.

This assessment is always shown as the primary report card in the Reports workspace.

---

# Candidate Evidence Model

Represents normalized CV evidence derived from document extraction.

It is produced after:

1. Azure Document Intelligence layout extraction
2. Azure OpenAI normalization of raw extraction output

Suggested semantic sections include:

* professional summary
* skills
* technologies
* projects
* work experience
* education
* certifications
* explicit claims

The Candidate Evidence Model is evidence, not a final report. It is used for CV ↔ GitHub comparison and developer preview.

---

# CV Portfolio Alignment Report

Represents the structured comparison between normalized CV evidence and unified GitHub portfolio evidence.

It includes:

* overall alignment score
* executive summary
* supported claims
* weakly supported claims
* unsupported or not visible claims
* GitHub strengths missing from the CV
* CV improvement recommendations
* alignment metadata (provider, model, timestamp, repository count)

Alignment findings reference CV evidence and GitHub evidence where available and include confidence levels.

When alignment completes, this report is shown as a separate card in the Reports workspace alongside the Engineering Portfolio Assessment.

---

# Reports Workspace

A presentation-layer container for independent analysis artifacts.

The workspace is built from analysis output by `buildReportsWorkspace()` and rendered by `ReportsWorkspace`. It is not part of the analysis pipeline.

A workspace contains zero or more **workspace reports**. Each workspace report has:

* report identifier and title
* header metadata (sources, counts, scores, timestamps)
* section list for navigation
* default expand/collapse behavior

Current workspace report types:

| Report | Availability |
|--------|----------------|
| Engineering Portfolio Assessment | Always after analysis |
| CV ↔ GitHub Alignment Report | When `cvPortfolioAlignment` is present |

The workspace model is designed so additional report types can be added without coupling reports to one another.
