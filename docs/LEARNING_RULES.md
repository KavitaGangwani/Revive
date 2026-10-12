
LEARNING NOTES: standing rule for every task in this project

The owner is learning Electron, desktop OS fundamentals and software design. For EVERY task, write docs/notes/NN-short-title.md
(NN = task number). Also keep docs/README.md (index of all notes) and docs/GLOSSARY.md (alphabetical, one line per term; add new terms every task).

VOICE: explain every idea TWICE.
  1) "Like I'm 10": plain words, a real-life analogy (restaurant, post office, school, traffic), zero jargon.
  2) "CS student level": the precise version with correct terms, how it works under the hood, trade-offs and limits.
Short sentences. Define every term the first time it appears. No filler, no hype. Never invent facts: take versions from
package.json, and if unsure say "I'm not certain" and say how to verify it.

VISUALS: use them wherever they help (at least 3 per note).
  - Mermaid diagrams in ```mermaid blocks: flowcharts for logic, sequence diagrams for who-talks-to-whom, state diagrams for state machines.
  - Plus an ASCII version of the single most important diagram, so it reads in any editor.
  - Tables for comparisons (process vs thread, option A vs B).
  - Small code examples with line-by-line comments, taken from real files in THIS repo (give path and line numbers).

EACH NOTE HAS THESE SECTIONS, IN THIS ORDER
  1. What we built (kid version, then student version)
  2. Why this order: what came first and why
  3. Install and command log: each package or command, what it is, why this one over alternatives, what breaks without it
  4. Files created or changed: path, one-line purpose, where it sits in the architecture diagram
  5. Concepts used this time: each with kid explanation, student explanation, a diagram or table, and a real example from this repo
  6. How the pieces talk: a sequence diagram of the main flow of this task
  7. Common mistakes and how to debug them
  8. Interview questions: at least 8, new for this task, with 3 to 6 line answers
  9. Try it yourself: 3 safe experiments with expected results
  10. Recap in 5 bullets

Concepts to cover this time are listed in the task prompt. Cover them even if the code only touches them lightly.