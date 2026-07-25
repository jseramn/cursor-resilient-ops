# Recipes

Una **recipe** es cualquier automatización web empaquetada: scripts in-page, prompts de chat y un `AGENT.md`.

El camino por defecto es **crear la tuya** desde la plantilla. Los contenidos de `examples/` son opcionales.

## Crear una recipe (flujo principal)

1. Copia la plantilla:

```text
templates/recipe/  →  recipes/<nombre>/
```

2. Renombra placeholders en `scripts/main.js` (`RECIPE_PREFIX`, keys, selectores, fases).
3. Rellena:
   - `README.md` — objetivo, URL, límites
   - `AGENT.md` — start / status / stop
   - `prompts/start.md` (+ `monitor-loop.md` si es largo)
4. Define el contrato:

| Pieza | Pregunta |
|-------|----------|
| Target URL(s) | ¿dónde corre? |
| Storage keys | estado + source b64 (+ skip) |
| Phases | lista finita |
| `findWork()` | ¿cómo se detecta el siguiente item? |
| `act()` | ¿qué click/flujo completa una unidad de trabajo? |
| Health probe | expresión CDP con `alive` + progreso |
| False-done | ¿qué cuenta como “aún hay trabajo”? |
| Sticky | ¿qué skipear tras N fallos? |
| Loop id | `AGENT_LOOP_TICK_<id>` |

5. Sigue [METHODOLOGY.md](METHODOLOGY.md) y [ARCHITECTURE.md](ARCHITECTURE.md).
6. Prueba: inject → 1 unidad de trabajo → matar loop in-page → verificar revive.
7. No commits salvo que el usuario lo pida.

## Layout canónico

```text
recipes/<name>/
  README.md
  AGENT.md
  scripts/
    main.js              # desde templates/recipe/scripts/main.js
    boot-resilience.js   # opcional
  prompts/
    start.md
    monitor-loop.md      # opcional
```

## Ejemplos (opcionales)

Ver [examples/](../examples/). Úsalos solo como referencia de patrones; **no** los trates como default del framework.

## Checklist de aceptación

- [ ] State machine `setInterval`
- [ ] Persistencia estado + source
- [ ] Revive blob CSP-safe
- [ ] Heartbeat + guardian debounce
- [ ] Skip/sticky si aplica
- [ ] False-done / rescan
- [ ] Health probe CDP
- [ ] Prompts start (+ loop si aplica)
- [ ] Límites y ética en README
- [ ] Sin acoplar keys/globals a otro producto
