# Analysis Lenses

The application's methodology is defined through configurable Analysis Lenses.

Analysis Lenses are the core of the analysis engine.

Changing the lens configuration changes the methodology without changing the implementation.

## MVP Default Lens Scope (V5)

For the MVP default configuration, **Portfolio Analysis** is intentionally reduced to:

* Technical Breadth
* Project Complexity

The remaining Portfolio Analysis Lenses stay fully implemented and can be re-enabled by configuration changes only. Repository Analysis Lenses remain fully enabled and unchanged.

---

# Repository Analysis Lenses

Repository Analysis Lenses are applied independently to every repository.

Their purpose is to understand what engineering evidence exists within that repository.

## Repository Purpose

**Guiding Question**

What does this repository appear to be built for?

---

## Technical Stack

**Guiding Question**

Which technologies, frameworks and tools are used in this repository?

---

## Project Structure

**Guiding Question**

How is this repository organized?

---

## Documentation

**Guiding Question**

How well does this repository explain itself?

---

## Testing & Quality

**Guiding Question**

What quality assurance practices are visible?

---

## Build & Deployment

**Guiding Question**

Is there evidence that this repository can be built, deployed and run?

---

## Activity & Evolution

**Guiding Question**

Does this repository demonstrate iterative development over time?

---

# Portfolio Analysis Lenses

Portfolio Analysis Lenses are applied to the Unified Portfolio Evidence Model.

Each lens examines the developer's complete public engineering portfolio rather than any individual repository.

## Technical Breadth

**Guiding Question**

Which technologies and tools does the developer demonstrate across the complete portfolio?

---

## Project Complexity

**Guiding Question**

How technically sophisticated is the portfolio overall?

---

## Engineering Practices

**Guiding Question**

Which professional engineering practices are consistently demonstrated across projects?

---

## Documentation

**Guiding Question**

How well is the developer's work documented across the portfolio?

---

## Testing & Quality

**Guiding Question**

How consistently is software quality addressed across projects?

---

## Deployment & Delivery

**Guiding Question**

Is there evidence that the developer builds, deploys and delivers usable software?

---

## Project Evolution

**Guiding Question**

Do the projects demonstrate sustained engineering evolution over time?

---

# Design Principles

* Repository Analysis Lenses analyze one repository.
* Portfolio Analysis Lenses analyze the complete portfolio.
* All observations must be evidence-based.
* The same engineering evidence may support observations in multiple portfolio lenses.
* Adding a new lens should require only configuration changes, not changes to the analysis engine.

The Analysis Lenses define the methodology of the application and should be treated as first-class architectural artifacts.
