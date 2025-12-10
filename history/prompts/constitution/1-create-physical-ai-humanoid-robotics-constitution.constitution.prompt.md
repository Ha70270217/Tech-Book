---
id: 1
title: Create Physical AI Humanoid Robotics Constitution
stage: constitution
date: 2025-12-07
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: Ns Smart
command: /sp.constitution
labels: [constitution,physical-ai,robotics]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - none
---

## Prompt

```text
Project Name: Physical AI & Humanoid Robotics

Purpose:
Define a full constitution for SpeckitPlus to guide the creation of a book on Physical AI & Humanoid Robotics.
The constitution should enable SpeckitPlus to produce clear, concise, accurate, and structured content for the book, ensuring professional-quality, minimal, engineering-grade chapters with predictable structure and deterministic formatting.

Core Principles:

Clarity: No ambiguity, no fluff, no filler text.

Determinism: Outputs must follow strict, repeatable structural patterns.

Minimalism: Only information that is required for implementation.

Accuracy: No hallucinations—content must remain logically, technically, and structurally sound.

Modularity: Each chapter or section is broken into clearly defined parts that can be reused or extended.

Atomicity: Each section answers one purpose cleanly.

Consistency: Formatting, tone, and vocabulary remain uniform across all content.

Engineering Discipline: Content must read like professional textbook material, not essays.

Key Features:

Template-driven content generation

Auto-structured sections (Overview → Components → Flows → Requirements → Constraints → Examples → Summary)

Optional deeper technical expansions

Style modes (ultra-minimal, standard, enterprise)

Export-ready formatting (Markdown-first)

Automatic glossary generation

Strict internal referencing (concepts, modules, APIs)

Version-friendly layouts

Constraints:

No overly verbose explanations

No marketing language or hype

No undefined concepts or functions

No speculative content unless explicitly requested

No unbounded creativity—everything must remain technical and grounded

No deviation from set formatting rules

No dependencies on external tools unless specified

Success Criteria:

Chapters are implementable and understandable by learners without clarification

Uniform structure across all chapters

Zero hallucinated concepts, APIs, or methods

Markdown renders cleanly, with predictable headings

Modular sections can be reused in other chapters

Minimal but complete technical coverage

Deterministic formatting across repeat runs

Deliverable:

Generate the full official SpeckitPlus Constitution, including:

Foundational principles

Section templates

Style rules

Formatting conventions

Allowed / forbidden patterns

Output schemas

Versioning philosophy

Extension guidelines
```

## Response snapshot

Created a comprehensive constitution for the Physical AI & Humanoid Robotics book project based on the specified core principles. The constitution includes six core principles (Clarity and Precision, Deterministic Structure, Minimalist Technical Coverage, Technical Accuracy and Groundedness, Modularity and Reusability, and Engineering Discipline), content standards, development workflow requirements, and governance rules. The constitution is versioned at 1.0.0 and follows the required template structure with Overview → Components → Flows → Requirements → Constraints → Examples → Summary format.

## Outcome

- ✅ Impact: Created foundational constitution document that will guide all future content creation for the Physical AI & Humanoid Robotics book project
- 🧪 Tests: none
- 📁 Files: Created .specify/memory/constitution.md with all required principles and governance structure
- 🔁 Next prompts: Content creation tasks can now follow the established constitution guidelines
- 🧠 Reflection: The constitution successfully captures all specified core principles and provides a clear framework for deterministic, minimal, and accurate content generation

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A