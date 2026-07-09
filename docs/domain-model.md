# Domain Model

## Core Concepts

The application revolves around seven domain concepts.

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

Engineering Evidence Report
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

# Engineering Evidence Report

The final report presented to the user.

It consists of:

* developer snapshot
* report sections
* observations
* evidence references
* portfolio improvement suggestions
* report metadata

Report metadata describes how the report was generated. It includes:

* analysis source
* generation timestamp
* optional provider name
* optional provider version
* optional provider runtime metrics (for example model/deployment identifier, token usage, duration, and confidence aggregates)

Metadata belongs to the generated report, not to the Unified Portfolio Evidence Model.

Every observation must be explainable and traceable back to engineering evidence.
