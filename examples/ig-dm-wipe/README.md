# Example: IG DM Wipe

Ejemplo opcional de dominio real. El framework en sí es **agnóstico**; para jobs nuevos usa `templates/recipe` → `recipes/<name>`.

Borra conversaciones de Instagram Direct (Primary → General → Requests) con state machine in-page + guardians CSP-safe + `/loop` opcional.

**Peligroso / destructivo.** Solo con intención explícita. No pedir password. No commitear labels reales de chats; usa placeholders (`Example User` / `Sticky Group Chat`).

## Scripts

| File | Rol |
|------|-----|
| [scripts/wipe-v3.js](scripts/wipe-v3.js) | State machine + HUD + guardian + sticky |
| [scripts/boot-resilience.js](scripts/boot-resilience.js) | Reset phases, seed skips, helpers |

## Storage

| Key | Contenido |
|-----|-----------|
| `__igDmWipeV3` | estado |
| `__wipeSrcV3` | source b64 |
| `__igDmWipeSkip` | sticky labels |

## Límites

- CSP bloquea `eval` → blob revive
- Sticky / grupos abandonados → skip list
- False-done en Requests vacíos con Primary aún con filas
- Sandbox Cursor: no servir scripts desde localhost

## Uso

Ver [AGENT.md](AGENT.md). Prompt de ejemplo: `prompts/start.md`.
