---
name: resilient-ops
description: >-
  Orchestrate Cursor-only resilient web automations for any site: create recipes
  from templates, inject state-machine scripts, persist state, mount guardians,
  and supervise with /loop. Use when starting, debugging, or designing recipes.
---

# Resilient Ops

Domain-agnostic. Prefer `recipes/<name>` created from `templates/recipe`. Use `examples/` only if the user points at them.

## When to use

- User wants a new browser automation on any URL
- User asks to start/stop/status a recipe under `recipes/`
- A long browser job keeps dying and needs persist + guardian + loop

## Workflow — new automation

1. Read [AGENTS.md](../../../AGENTS.md) and [docs/RECIPES.md](../../../docs/RECIPES.md).
2. Copy `templates/recipe` → `recipes/<name>/`.
3. Rename placeholders in `scripts/main.js` (prefix, keys, selectors, phases).
4. Fill `AGENT.md`, `README.md`, prompts.
5. Confirm destructive intent if applicable.
6. Inject via **browser-cdp-ops**; verify health probe.
7. For long jobs, use **loop-supervisor** (~15s).
8. Report 1–2 lines per intervention.

## Workflow — existing recipe

1. Read `recipes/<name>/AGENT.md`.
2. Inject/boot → health → optional loop.
3. Same report format.

## Success criteria

- Works on the user's target site (not a hard-coded product)
- State survives reload/SPA navigation via storage + blob revive
- False-done is detected and rescanned
- Loop ticks can revive without babysitting
