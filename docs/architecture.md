# GitHub Portfolio Analyzer – Architecture

## Purpose

The GitHub Portfolio Analyzer generates an evidence-based Engineering Evidence Report from a developer's public GitHub portfolio.

The application is designed around transparency and explainability.

It analyzes only observable engineering evidence and never infers personal characteristics such as intelligence, personality, or hiring suitability.

---

# Architectural Principles

The architecture intentionally separates:

1. Evidence collection
2. Evidence normalization
3. Evidence interpretation
4. Report presentation

The AI layer never has direct access to GitHub.

It only interprets structured engineering evidence produced by deterministic analysis.

---

# Source Domain

A GitHub Portfolio consists of:

* GitHub Profile
* One or more Repositories

Repositories contain engineering artifacts such as:

* README
* package.json
* requirements.txt
* pyproject.toml
* Dockerfile
* GitHub workflows
* configuration files
* source code
* tests
* deployment configuration

---

# Analysis Pipeline

```text
GitHub Portfolio

↓

Evidence Provider (GitHub)

↓

Repository Analysis
(applied independently to every repository)

↓

Repository Evidence Profiles

↓

Portfolio Evidence Aggregator

↓

Unified Portfolio Evidence Model

↓

Portfolio Analysis Provider
(applies Portfolio Analysis Lenses)

↓

Engineering Evidence Report
```

---

# Stage 1 — Repository Analysis

Every repository is analyzed independently.

Repository Analysis answers questions such as:

* What technologies are used?
* What engineering practices are visible?
* Is there testing?
* Is deployment configured?

The result is a Repository Evidence Profile.

---

# Stage 2 — Portfolio Analysis

The Portfolio Evidence Aggregator combines repository evidence into a Unified Portfolio Evidence Model.

Portfolio Analysis applies configurable Portfolio Analysis Lenses to this complete body of evidence.

The portfolio is treated as a single engineering portfolio rather than a collection of isolated repositories.

Portfolio analysis is performed through a **Portfolio Analysis Provider**.

The application depends on the provider interface, not on any specific LLM or analysis backend. The report rendering layer does not know which provider produced the report.

Current implementations:

* **Mock** — deterministic analysis used as the default provider
* **Azure OpenAI** — placeholder for future Structured Outputs integration

Provider selection is centralized and configured via `PORTFOLIO_ANALYSIS_PROVIDER`. When unset, the application falls back to `mock`.

---

# Portfolio Analysis Provider

The provider layer sits between the Unified Portfolio Evidence Model and the Engineering Evidence Report.

Responsibilities:

* receive the Unified Portfolio Evidence Model as input
* apply Portfolio Analysis Lenses
* produce a complete Engineering Evidence Report
* attach report metadata describing how the report was generated

The provider never accesses GitHub directly. It only interprets structured evidence produced upstream.

Adding a new provider requires:

1. implementing the `PortfolioAnalysisProvider` interface
2. registering the provider in the provider factory

No changes are required to evidence extraction, aggregation, or report presentation.

---

# AI Responsibilities

The AI never:

* invents technologies
* invents repositories
* invents files
* invents observations without evidence

The AI only:

* organizes evidence
* summarizes evidence
* generates observations
* explains rationale

---

# Future Extension Points

The architecture intentionally separates concerns at two boundaries:

1. **Evidence collection** — how raw engineering data is retrieved
2. **Portfolio analysis** — how unified evidence is interpreted into a report

## Evidence providers

Future evidence providers could include:

* GitLab
* Azure DevOps
* Personal portfolio websites
* CVs
* Technical blogs
* Conference talks

The analysis methodology should remain unchanged regardless of the evidence provider.

## Portfolio analysis providers

Future portfolio analysis providers could include:

* Azure OpenAI
* OpenAI
* Anthropic Claude
* Google Gemini
* Local LLMs

Registering a new provider should not require changes to repository scanning, evidence extraction, portfolio aggregation, or report presentation.
