# Cursor Resilient Ops

Framework de **automatización web resiliente exclusivo para Cursor** (Agent chat + IDE Browser + CDP).

Sirve para **cualquier sitio** donde ya tengas sesión abierta: backoffice, dashboards, LinkedIn, correo web, tools internas, etc. El agente monta un job in-page, lo persiste, lo revive tras crashes SPA/CSP, y lo vigila con `/loop`.

No es un bot headless externo. No está atado a un producto concreto.

## Quick start

1. Abre esta carpeta en Cursor (`File → Open Folder`).
2. Nuevo **Agent** chat en este workspace.
3. Describe la automatización y pega:

```text
Lee AGENTS.md y docs/RECIPES.md.
Crea recipes/<nombre> desde templates/recipe para: <qué debe hacer en <url>>.
Implementa la state machine, inyecta por CDP y déjala RUNNING.
Si el job es largo, arma /loop 15s.
No pidas passwords; uso la sesión ya abierta.
```

O, si la recipe ya existe:

```text
Lee AGENTS.md y arranca recipes/<nombre>
```

4. El agente inyecta vía CDP, monta guardians y (si aplica) un `/loop` cada 15s.
5. Cada tick: health → revive si hace falta → reporte corto (`done`/`failed` · `alive` · `phase`).

## Qué hay aquí

| Path | Rol |
|------|-----|
| [AGENTS.md](AGENTS.md) | Contrato del agente (genérico) |
| [docs/METHODOLOGY.md](docs/METHODOLOGY.md) | Playbook de resiliencia web |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Capas: state machine, storage, guardians, loop |
| [docs/RECIPES.md](docs/RECIPES.md) | Cómo crear cualquier recipe |
| [templates/recipe/](templates/recipe/) | **Camino principal** — plantilla + skeleton JS |
| [recipes/](recipes/) | Tus automatizaciones (vacío al clonar) |
| [.cursor/rules/](.cursor/rules/) + [skills/](.cursor/skills/) | Reglas y skills always-on |
| [examples/](examples/) | Ejemplos opcionales (no son el producto). Ver advertencia abajo. |

## Modelo mental

```text
Chat agent  →  CDP inject  →  in-page state machine
                ↑                    ↓
         /loop 15s              sessionStorage
         (revive)               + blob guardian
```

La recipe define *qué* hacer en la UI. El framework define *cómo* no morir (persistencia, CSP, false-done, sticky, supervisor).

## Advertencia: example Instagram DM wipe

`examples/ig-dm-wipe` borra conversaciones de Instagram Direct. Es **peligroso y destructivo**. No arrancar sin intención explícita en el chat.

No commitear nombres ni labels reales de inbox. Los examples usan placeholders genéricos (`Example User` / `Sticky Group Chat`).

## Requisitos

- Cursor con Agent + Browser (IDE) / CDP
- Sesión ya autenticada en el sitio objetivo (el agente **no** pide contraseñas)
- Intención explícita en el chat si la acción es destructiva

## License

[MIT](LICENSE) © 2026 jseramn

## Version

Ver [VERSION](VERSION).
