# Methodology — Resilient Web Ops for Cursor

Playbook para automatizar **cualquier UI web** con **Cursor Agent + IDE Browser + CDP**, sobre todo SPAs hostiles (CSP, remounts, modales, listas infinitas).

Los ejemplos de dominio viven en `examples/`; el producto es el patrón, no un sitio concreto.

## Problema

1. **Navegación SPA** destruye contextos `async` largos y listeners frágiles.
2. **CSP** bloquea `eval()` / `new Function`.
3. **Crashes / reloads** matan variables en memoria; sin persistencia el job muere.
4. **Sandbox del browser de Cursor** a menudo no puede `fetch` a `127.0.0.1` para cargar scripts.
5. **False-done**: una vista vacía (tab, filtro, carpeta) se interpreta como “terminado” mientras otra cola sigue con trabajo.
6. **Sticky targets**: filas/modales que nunca completan la acción (permisos, bugs UI, items indelebles).

## Decisiones de diseño

### 1. State machine en página (`setInterval`)

Tick corto (~700ms–1s) lee `phase` y actúa. No `while (true)` ni cadenas `await` de minutos.

### 2. Persistencia dual (keys por recipe)

| Key (convención) | Contenido |
|------------------|-----------|
| `__<recipe>State` | JSON: `phase`, progreso, `enabled`, `_userPaused`, … |
| `__<recipe>Src` | Source del script en base64 para revive |
| `__<recipe>Skip` | Labels/ids sticky a ignorar (opcional) |

Al reinyectar, **reanudar** salvo `_userPaused === true`.

### 3. Revive CSP-safe

```js
const code = atob(src);
const blob = new Blob([code], { type: "text/javascript" });
const url = URL.createObjectURL(blob);
const s = document.createElement("script");
s.src = url;
document.documentElement.appendChild(s);
```

### 4. Heartbeat independiente

`__LOOP_ALIVE = Date.now()` en intervalo aparte. **No** poner alive a 0 en cada `history.pushState` (muchas SPAs spamean historial → thrash).

### 5. Guardian con debounce

Revisa alive ~cada 4s; revive desde storage si muerto y no pausado — **mínimo ~12s** entre revives.

### 6. Skip list / sticky detector

Si el mismo item falla N veces → skip + ocultar/saltar → seguir.

### 7. False-done → rescan

Tras “vacío” en la vista actual: cambiar filtro/tab/carpeta, volver al inicio, o recontar badges. Solo `done` tras N pasadas limpias sin progreso nuevo.

### 8. Supervisor externo (`/loop`)

Cada **15s**, sentinel `AGENT_LOOP_TICK_<id>`: health CDP → revive/nudge → reporte 1–2 líneas → unlock.

### 9. Inyección por CDP

Chunks en buffer si el script es grande → `sessionStorage` → blob-load. Opcional `Page.addScriptToEvaluateOnNewDocument` para boot corto.

### 10. HUD

Pause / Reset + contadores. Pause implica `_userPaused=true` para que guardian/loop no peleen.

### 11. Versionado de scripts + prompts estables

`main` versionado en la recipe; prompts `start` / `monitor-loop` / stop en chat.

## Anti-patrones

| Evitar | Por qué |
|--------|---------|
| Framework “de un solo producto” | Limita reutilización |
| `eval` / `new Function` | CSP |
| `fetch('http://127.0.0.1:…')` | Sandbox Cursor browser |
| Bucle `async` largo | Muere con remount |
| Matar todos los `setInterval` | Rompe heartbeat/guardian/host |
| Done en una sola vista vacía | False-done |
| Pedir password | Sesión ya abierta |

## Checklist: recipe lista

- [ ] State machine `setInterval` + fases explícitas
- [ ] Estado + source persistidos (keys propias)
- [ ] Revive blob documentado
- [ ] Heartbeat + guardian debounce
- [ ] Skip / sticky strategy (si aplica)
- [ ] False-done / rescan policy
- [ ] Health probe CDP
- [ ] HUD o telemetría mínima
- [ ] `AGENT.md` + prompts
- [ ] Loop 15s si el job es largo
- [ ] Ética: destructivo solo con intención explícita

## Flujo del agente

```text
Usuario describe job en cualquier URL
  → crear o elegir recipes/<name>
  → lock → inject/boot → unlock
  → /loop 15s si largo
  → ticks: health → fix → reporte corto
```
