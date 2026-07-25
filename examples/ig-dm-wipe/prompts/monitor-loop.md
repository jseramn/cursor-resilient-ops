# Prompt payload: monitor-loop (igwipe)

Usar con Cursor `/loop` cada **15 segundos**. El shell/tick debe emitir:

```text
AGENT_LOOP_TICK_igwipe
```

## Instrucciones JSON para el agente en cada tick (o batch)

```json
{
  "sentinel": "AGENT_LOOP_TICK_igwipe",
  "intervalSec": 15,
  "target": "instagram.com/direct",
  "storage": {
    "state": "__igDmWipeV3",
    "src": "__wipeSrcV3",
    "skip": "__igDmWipeSkip"
  },
  "actions": [
    "browser_lock if needed",
    "CDP health: alive, phase, deleted, rows, url, srcPresent",
    "if url not /direct/* → go https://www.instagram.com/direct/inbox/",
    "if !alive && !_userPaused → blob revive from __wipeSrcV3",
    "if phase done/paused but rows remain or Messages badge>0 → Primary + start() (false-done)",
    "hide/skip Example User and __igDmWipeSkip labels",
    "if confirm dialog open → click Delete inside [role=dialog]",
    "browser_unlock",
    "report 1-2 lines: deleted / alive / phase / rows"
  ],
  "debounceReviveMs": 12000
}
```

## Stop

```text
Para el loop AGENT_LOOP_TICK_igwipe y pausa el wipe in-page (_userPaused).
```
