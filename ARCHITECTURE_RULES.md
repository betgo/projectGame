# Architecture Rules

Version: v1

## Mandatory Boundaries

1. `editor` can read and mutate `GameProject` data only.
2. `runtime` can only consume exported `GamePackage` data and produce snapshots.
3. `runtime` must not import from `editor` or `runtime/render`.
4. `runtime/render` is read-only and must not mutate runtime state.
5. `ai` can only produce and adjust data packages, never runtime logic code.

## Data-Driven Constraints

1. Gameplay definitions must live in JSON-compatible types.
2. Every package must pass schema validation and semantic validation.
3. Template payloads must be versioned and backward-compatible for one minor version.

## Git and Delivery Rules

1. One issue maps to one branch and one pull request.
2. Branch format: `codex/<issue>-<topic>`.
3. Commits must include `Prompt-Refs`.
4. Merge strategy is squash merge with green CI.

## Determinism Rules

1. Runtime simulation must use fixed tick processing.
2. Random behavior must come from seedable PRNG.
3. Same package + same seed must produce identical match result.
