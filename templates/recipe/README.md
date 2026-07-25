# Recipe: `<name>`

Automatización web genérica para Cursor Resilient Ops.

## Objetivo

Una frase: qué hace en `<url>`.

## Requirements

- Sesión ya abierta en el browser de Cursor en: `<url>`
- Destructiva: yes/no (si yes → intención explícita en el chat)

## Scripts

| File | Role |
|------|------|
| [scripts/main.js](scripts/main.js) | State machine + HUD + guardian (renombrar placeholders `RECIPE_PREFIX`) |
| `scripts/boot-resilience.js` | Opcional: seed skips / reset phases |

## Storage keys (tras renombrar prefijo)

| Key | Content |
|-----|---------|
| `__<prefix>State` | JSON state |
| `__<prefix>Src` | source b64 |
| `__<prefix>Skip` | sticky labels (optional) |

## Implementar

1. `findWorkItems()` — selectores del trabajo pendiente
2. `performUnit(el)` — una unidad de trabajo (clicks / diálogo)
3. Ajustar fases / false-done / sticky en `AGENT.md`

## Limits

CSP, sticky UI, false-done, sandbox Cursor — documentar lo que encuentres.

## Usage

Ver [AGENT.md](AGENT.md).
