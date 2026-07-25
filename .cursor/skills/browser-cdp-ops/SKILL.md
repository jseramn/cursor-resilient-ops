---
name: browser-cdp-ops
description: >-
  CDP patterns for Cursor IDE browser on any site: chunked script inject,
  sessionStorage persistence, CSP-safe blob revive, onNewDocument, HUD, and
  health probes. Use when injecting or recovering in-page automations.
---

# Browser CDP Ops

Site-agnostic injection and recovery patterns.

## Tools

- `cursor-ide-browser` → `browser_cdp` (`Runtime.evaluate`, optional `Page.addScriptToEvaluateOnNewDocument`)
- `browser_lock` / unlock around multi-step work
- Screenshots when the UI is ambiguous

## Inject large scripts (chunk pattern)

1. Read recipe script from disk; base64 encode.
2. `window.__w=''`
3. Append slices (~3000 chars) into `window.__w`
4. `sessionStorage.setItem(SRC_KEY, window.__w)` — `SRC_KEY` from the recipe
5. Blob-load (`Blob` + `<script src=blob:>`). Never rely on `eval` under strict CSP. Avoid `fetch` to localhost from the Cursor browser sandbox.

## Boot / restart state

Set storage: `enabled=true`, `_userPaused=false`, `phase=boot`; keep progress counters unless user Reset.

Expose `window.__<PREFIX>_API__ = { start, pause, reset, status }`.

## onNewDocument

Short boot only: if src in sessionStorage and loop dead and not user-paused → blob-load.

## Health probe template

```js
(() => {
  const st = window.__API__?.status?.() || null;
  const alive = !!(window.__LOOP_ALIVE && Date.now() - window.__LOOP_ALIVE < 10000);
  return {
    alive,
    url: location.href,
    status: st,
    srcPresent: !!sessionStorage.getItem(SRC_KEY),
    workItems: /* recipe-specific */ [],
  };
})()
```

## HUD

Fixed overlay: status, phase, counters, Pause/Reset. Pause sets `_userPaused=true`.

## Modals

Prefer buttons inside `[role="dialog"]` (or the site's dialog root). Don't click Cancel while a primary action is in-flight.

## Anti-thrash

Debounce revives (≥12s). Don't zero heartbeat on every `pushState`. Skip sticky tops after N failures.
