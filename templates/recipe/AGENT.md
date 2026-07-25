# AGENT — `<name>`

Automatización **web genérica**. Sustituye `<name>`, `<url>`, `<prefix>`, `<id>`.

## Start

1. Confirm user intent (required if destructive).
2. Lock browser → open `<url>`.
3. Ensure `scripts/main.js` has renamed `RECIPE_PREFIX` → `<prefix>`.
4. Inject via CDP: chunk b64 → `__<prefix>Src` → blob load.
5. `window.__<prefix>_API__.start()` (or boot helper).
6. Health probe once; unlock.
7. If long-running: `/loop` 15s with `prompts/monitor-loop.md`, sentinel `AGENT_LOOP_TICK_<id>`.

## Status

```js
(() => {
  const API = window.__RECIPE_PREFIX_API__; // renamed
  const st = API && API.status && API.status();
  const alive = !!(window.__RECIPE_PREFIX_LOOP_ALIVE && Date.now() - window.__RECIPE_PREFIX_LOOP_ALIVE < 10000);
  return {
    alive,
    url: location.href,
    status: st,
    workItems: [], // fill with recipe selectors
    srcPresent: !!sessionStorage.getItem("__RECIPE_PREFIXSrc"),
  };
})()
```

Report 1–2 lines: `done` · `alive` · `phase`.

## Stop

`API.pause()` (`_userPaused=true`) + kill loop PID.

## Contract checklist

- [ ] Target URL(s)
- [ ] Phases
- [ ] Storage keys
- [ ] `findWorkItems` / `performUnit`
- [ ] Revive path
- [ ] False-done rule
- [ ] Sticky/skip rule
- [ ] Loop sentinel id
