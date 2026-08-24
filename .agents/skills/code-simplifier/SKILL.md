---
name: code-simplifier
description: Simplify recently modified code for clarity, consistency, and maintainability while preserving behavior. Use after tests pass or when the user explicitly asks for a focused cleanup.
license: Apache-2.0; adapted from Anthropic's code-simplifier agent
compatibility: Codex and OpenCode
metadata:
  source-repository: anthropics/claude-plugins-official
  source-commit: cf99fc252a44e3f36763abe1db8744757f1b0297
---

# Code Simplifier

Adapted from Anthropic's `plugins/code-simplifier/agents/code-simplifier.md` for portable Agent Skills discovery. The adaptation removes Claude-specific model selection and makes the coding standards language-neutral.

Refine code for clarity, consistency, and maintainability without changing its behavior.

## Guardrails

1. Preserve all observable functionality, outputs, public interfaces, and error behavior.
2. Read and follow the repository's instructions and conventions before editing.
3. Limit the default scope to code modified in the current task or explicitly named by the user.
4. Run the relevant tests before simplifying. If no useful tests exist, explain the risk and avoid broad refactors.
5. Review the diff and rerun the same tests after simplifying.
6. Stop if the cleanup would require an architectural change, new dependency, or behavior change; propose that separately.

## What to improve

- Reduce unnecessary complexity, nesting, duplication, and indirection.
- Improve names and make control flow explicit.
- Consolidate related logic when doing so does not combine distinct concerns.
- Remove comments that merely restate obvious code while retaining rationale, constraints, and warnings.
- Avoid nested ternaries and dense one-liners when clearer conditionals are easier to maintain.
- Keep useful abstractions; do not optimize for fewer lines.

## Workflow

1. Identify the exact recently modified sections.
2. Confirm the current verification command and run it.
3. Note targeted simplification opportunities.
4. Apply the smallest behavior-preserving edits.
5. Inspect the diff for accidental scope growth.
6. Rerun verification and report only significant changes and any remaining risk.

