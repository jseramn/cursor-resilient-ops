# Prompt payload: monitor-loop (`<id>`)

Interval: **15s**. Sentinel:

```text
AGENT_LOOP_TICK_<id>
```

```json
{
  "sentinel": "AGENT_LOOP_TICK_<id>",
  "intervalSec": 15,
  "actions": [
    "CDP health",
    "revive blob if !alive && !_userPaused",
    "false-done rescan if work remains",
    "skip/hide sticky",
    "unlock",
    "report progress/alive/phase"
  ],
  "debounceReviveMs": 12000
}
```
