# AGENTS.md — Cursor Resilient Ops

Contrato para automatizar **cualquier web** con Cursor en este workspace. Detalle: [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

## Antes de tocar el browser

1. Si no existe recipe: créala desde `templates/recipe` → `recipes/<name>/` ([docs/RECIPES.md](docs/RECIPES.md)).
2. Si existe: lee `recipes/<name>/AGENT.md` y `prompts/`.
3. Confirma intención explícita si la acción es destructiva.
4. No pidas contraseñas ni secretos; usa la sesión ya abierta.
5. No asumas Instagram ni ningún dominio concreto salvo que la recipe lo diga.

## Ciclo operativo (cada intervención / tick)

```text
lock browser → CDP health → fix/revive → short report → unlock
```

Reporte en **1–2 líneas**: progreso (`done`/`failed` o equivalente) · `alive` · `phase`.

## Patrones obligatorios (cualquier sitio)

- State machine con `setInterval` en página — no bucles `async` largos.
- Persistir **estado JSON + source b64** en `sessionStorage` (keys de la recipe).
- Revive CSP-safe: `blob:` + `<script src>` (nunca depender de `eval` si CSP lo bloquea).
- Heartbeat independiente; no poner `LOOP_ALIVE = 0` en cada `history.pushState`.
- Guardian con debounce (≥10–12s entre revives).
- Skip list para targets sticky / que nunca completan.
- **False-done**: `phase=done` pero aún hay trabajo visible (filas, badge, queue) → rescan.
- Jobs largos: `/loop` ~15s con sentinel `AGENT_LOOP_TICK_<id>`.
- Inyectar vía CDP (chunks si hace falta / `Page.addScriptToEvaluateOnNewDocument`).
- HUD Pause/Reset cuando el job deba ser observable.

## Anti-patrones

- Atar el framework a un solo producto en docs o prompts por defecto.
- `eval` / `new Function` bajo CSP estricta.
- Servir scripts desde `localhost` en el sandbox del browser de Cursor.
- Clear global de todos los intervals.
- Sleep loops que mueren con navegación SPA.
- Commits o pushes sin pedirlo el usuario.

## Skills del proyecto

| Skill | Cuándo |
|-------|--------|
| `resilient-ops` | Crear/arrancar/parar cualquier recipe |
| `browser-cdp-ops` | Inject, blob revive, onNewDocument, HUD |
| `loop-supervisor` | Armar / parar `/loop` y payload de tick |

## Prompts de arranque

```text
Lee AGENTS.md y docs/RECIPES.md. Crea recipes/<nombre> para: <objetivo en <url>>.
```

```text
Lee AGENTS.md y arranca recipes/<nombre>
```

```text
Health check CDP de recipes/<nombre> — alive / phase / progress
```

```text
Para el loop supervisor de <id>
```

Ejemplos de dominio (opcionales, no defaults): ver [examples/](examples/).
