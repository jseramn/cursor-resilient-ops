# AGENT — example ig-dm-wipe

Ejemplo bajo `examples/` — no es el default del framework. Jobs nuevos: `templates/recipe` → `recipes/<name>`.

## Prerrequisitos

- Usuario dijo explícitamente que quiere borrar DMs (o “arranca wipe”).
- Instagram abierto y logueado en Cursor Browser.
- No pedir credenciales.

## Start

1. Lee skills `browser-cdp-ops` + `resilient-ops`.
2. Lock browser.
3. Navega o confirma `https://www.instagram.com/direct/inbox/`.
4. Inyecta `examples/ig-dm-wipe/scripts/wipe-v3.js` (chunk b64 → `__wipeSrcV3` → blob load).
5. Evalúa `scripts/boot-resilience.js` (o equivalente CDP) para reset a `boot`, seed skips, montar helpers.
6. Health probe: `alive`, `status.deleted`, `phase`, filas visibles.
7. Unlock.
8. Para jobs largos: arranca loop 15s con [prompts/monitor-loop.md](prompts/monitor-loop.md).

Prompt pegable: [prompts/start.md](prompts/start.md).

## Status

CDP `Runtime.evaluate`:

```js
(() => {
  const st = window.__IG_DM_WIPE__ && window.__IG_DM_WIPE__.status && window.__IG_DM_WIPE__.status();
  const alive = !!(window.__IG_DM_LOOP_ALIVE && Date.now() - window.__IG_DM_LOOP_ALIVE < 10000);
  const nav = document.querySelector('[aria-label="Thread list"]');
  const rows = nav
    ? [...nav.querySelectorAll('div[role="button"]')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.height >= 56 &&
            r.height <= 110 &&
            r.width > 200 &&
            getComputedStyle(el).display !== "none" &&
            !/Hidden Requests|Your note/i.test(el.innerText || "")
          );
        })
        .map((el) => (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40))
    : [];
  return {
    alive,
    url: location.href,
    status: st,
    rows,
    srcPresent: !!sessionStorage.getItem("__wipeSrcV3"),
  };
})()
```

Reporta: `deleted` · `alive` · `phase` · `#rows`.

## Revive / false-done

- Si `!alive` y no `_userPaused`: blob-load desde `__wipeSrcV3`.
- Si `phase=done` / paused pero `rows.length > 0` o badge Messages > 0: forzar inbox Primary, `start()`, hide Example User / skip list.
- Confirm Delete solo dentro de `[role=dialog]`.

## Stop

1. `window.__IG_DM_WIPE__.pause()` o set `_userPaused=true`.
2. Parar el `/loop` (matar PID).
3. Unlock si quedó locked.

## API in-page

`window.__IG_DM_WIPE__`: `{ start, pause, reset, status }`
