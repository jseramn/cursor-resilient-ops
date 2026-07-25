---
name: loop-supervisor
description: >-
  Start and stop Cursor /loop supervisors for any resilient browser recipe: 15s
  interval, AGENT_LOOP_TICK sentinel, JSON health payload, short reports. Use
  when a recipe needs continuous external monitoring.
---

# Loop Supervisor

Works for **any** recipe id — not tied to a specific site.

## When to use

- Long-running in-page jobs that can die silently
- User wants continuous monitoring / resilience
- After initial inject succeeds and the job should run unattended

## Defaults

| Setting | Value |
|---------|-------|
| Interval | **15s** |
| Sentinel | `AGENT_LOOP_TICK_<id>` (choose per recipe) |
| Report | 1–2 lines per tick batch |
| Browser | lock → work → unlock each tick |

## Start

1. Pick short `id` from the recipe name (`crmbulk`, `inboxclean`, …).
2. Prefer `recipes/<name>/prompts/monitor-loop.md` when present.
3. Start `/loop` every 15s that emits the sentinel.
4. Record PID / terminal id for stop.

## Tick handler

1. Lock if needed.
2. CDP health (`alive`, `phase`, progress, work items, url, srcPresent).
3. If dead or false-done → blob revive / re-inject / nudge dialogs / skip sticky.
4. Short report.
5. Unlock.

Batch piled-up ticks into one health check.

## Stop

Kill the loop PID; optionally pause in-page (`_userPaused=true`).

## Prompt skeleton

```json
{
  "sentinel": "AGENT_LOOP_TICK_<id>",
  "intervalSec": 15,
  "actions": [
    "cdp health",
    "revive blob if !alive && !_userPaused",
    "false-done rescan if work remains",
    "skip/hide sticky",
    "unlock",
    "report progress/alive/phase"
  ],
  "debounceReviveMs": 12000
}
```
