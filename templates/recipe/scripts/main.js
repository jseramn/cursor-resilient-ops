/**
 * Cursor Resilient Ops — recipe skeleton (domain-agnostic)
 *
 * When creating recipes/<name>/:
 * 1. Copy this file
 * 2. Replace RECIPE_* placeholders
 * 3. Implement findWorkItems() + performUnit()
 * 4. Adjust phases to your UI
 */
(function () {
  const PREFIX = "RECIPE_PREFIX"; // e.g. crmBulk
  const STATE_KEY = "__RECIPE_PREFIXState";
  const SRC_KEY = "__RECIPE_PREFIXSrc";
  const SKIP_KEY = "__RECIPE_PREFIXSkip";
  const LOOP_FLAG = "__RECIPE_PREFIX_LOOP__";
  const LOOP_ALIVE = "__RECIPE_PREFIX_LOOP_ALIVE";
  const API_NAME = "__RECIPE_PREFIX_API__";
  const HUD_ID = "__RECIPE_PREFIX_HUD";

  if (window[LOOP_FLAG]) clearInterval(window[LOOP_FLAG]);

  const load = () => {
    try {
      return JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  };
  const save = (s) => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
    } catch (e) {}
  };

  const prev = load();
  const userPaused = prev._userPaused === true;
  const state = Object.assign(
    {
      enabled: true,
      phase: "boot",
      viewIdx: 0,
      done: 0,
      failed: 0,
      idleEmpty: 0,
      waitTicks: 0,
      rescanRound: 0,
      lastLabel: "",
      lastError: "",
      startedAt: Date.now(),
      _userPaused: false,
    },
    prev,
    {
      enabled: !userPaused,
      phase: prev.phase === "done" ? "boot" : prev.phase || "boot",
      idleEmpty: 0,
      startedAt: prev.startedAt || Date.now(),
    }
  );

  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const click = (el) => {
    if (!el) return false;
    try {
      el.scrollIntoView({ block: "nearest" });
      el.click();
      return true;
    } catch (e) {
      return false;
    }
  };

  const loadSkip = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]");
    } catch (e) {
      return [];
    }
  };

  const addSkip = (label) => {
    const s = loadSkip();
    const n = String(label || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (!n || s.includes(n)) return;
    s.push(n);
    sessionStorage.setItem(SKIP_KEY, JSON.stringify(s.slice(-100)));
  };

  /** @returns {Element[]} work items currently actionable */
  const findWorkItems = () => {
    // TODO: recipe-specific selectors. Example pattern:
    // return [...document.querySelectorAll('[data-work-row]')].filter(visible);
    return [];
  };

  /** Perform one unit of work on the first item. Return true if action started. */
  const performUnit = (el) => {
    // TODO: open → act → confirm dialog inside [role=dialog] if needed
    state.lastLabel = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
    click(el);
    return true;
  };

  const ensureHud = () => {
    let hud = document.getElementById(HUD_ID);
    if (!hud) {
      hud = document.createElement("div");
      hud.id = HUD_ID;
      hud.style.cssText =
        "position:fixed;z-index:999999;right:12px;bottom:12px;background:#111;color:#fff;border:1px solid #444;border-radius:10px;padding:10px 12px;font:12px/1.35 sans-serif;min-width:220px;box-shadow:0 8px 24px rgba(0,0,0,.45)";
      hud.innerHTML =
        '<div style="font-weight:700;margin-bottom:6px">Resilient Ops</div><div id="' +
        HUD_ID +
        '_body"></div><div style="margin-top:8px;display:flex;gap:6px"><button id="' +
        HUD_ID +
        '_toggle" style="flex:1;padding:6px;border-radius:6px;border:0;cursor:pointer;color:#fff"></button><button id="' +
        HUD_ID +
        '_reset" style="padding:6px 8px;border-radius:6px;border:0;cursor:pointer;background:#333;color:#fff">Reset</button></div>';
      document.documentElement.appendChild(hud);
      document.getElementById(HUD_ID + "_toggle").onclick = () => {
        state.enabled = !state.enabled;
        state._userPaused = !state.enabled;
        if (state.enabled) {
          state.phase = "boot";
          state.idleEmpty = 0;
        }
        save(state);
        render();
      };
      document.getElementById(HUD_ID + "_reset").onclick = () => {
        state.done = 0;
        state.failed = 0;
        state.viewIdx = 0;
        state.phase = "boot";
        state.idleEmpty = 0;
        state.rescanRound = 0;
        state.enabled = true;
        state._userPaused = false;
        save(state);
        render();
      };
    }
  };

  const render = () => {
    ensureHud();
    const body = document.getElementById(HUD_ID + "_body");
    const btn = document.getElementById(HUD_ID + "_toggle");
    const elapsed = Math.round((Date.now() - state.startedAt) / 1000) + "s";
    body.innerHTML =
      "<div>status: <b>" +
      (state.enabled ? "RUNNING" : "paused") +
      "</b></div><div>phase: " +
      state.phase +
      "</div><div>done: <b>" +
      state.done +
      "</b> · fail: " +
      state.failed +
      "</div><div>last: " +
      (state.lastLabel || "-").slice(0, 34) +
      '</div><div style="opacity:.75">' +
      (state.lastError || "") +
      '</div><div style="opacity:.6">t=' +
      elapsed +
      "</div>";
    btn.textContent = state.enabled ? "Pause" : "Start";
    btn.style.background = state.enabled ? "#a33" : "#2a7";
  };

  let busy = false;
  window[LOOP_ALIVE] = Date.now();
  window[LOOP_FLAG] = setInterval(() => {
    window[LOOP_ALIVE] = Date.now();
    if (!state.enabled || busy) return;
    busy = true;
    try {
      if (state.phase === "boot") {
        state.phase = "find-work";
        state.idleEmpty = 0;
        save(state);
        render();
        return;
      }

      // Optional: handle open dialogs / wait phases here

      const items = findWorkItems().filter((el) => {
        const label = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
        const skips = loadSkip();
        if (skips.some((k) => label.includes(k) || k.includes(label.slice(0, 18)))) {
          el.style.display = "none";
          return false;
        }
        return true;
      });

      if (!items.length) {
        state.idleEmpty++;
        state.lastLabel = "(empty)";
        if (state.idleEmpty >= 12) {
          state.rescanRound = (state.rescanRound || 0) + 1;
          state.idleEmpty = 0;
          state.phase = "boot";
          state.lastError = "rescan #" + state.rescanRound;
          if (state.rescanRound >= 3) {
            const since = state._doneAtRescanStart || 0;
            if (state.done === since) {
              state.enabled = false;
              state.phase = "done";
              state.lastError = "No work left (verified)";
            } else {
              state._doneAtRescanStart = state.done;
              state.rescanRound = 0;
            }
          } else if (state.rescanRound === 1) {
            state._doneAtRescanStart = state.done;
          }
        }
        save(state);
        render();
        return;
      }

      state.idleEmpty = 0;
      if (performUnit(items[0])) {
        state.phase = "wait-settle";
        state.waitTicks = 0;
        state.lastError = "acted";
      }
      save(state);
      render();

      if (state.phase === "wait-settle") {
        state.waitTicks++;
        if (state.waitTicks >= 2) {
          state.done++;
          state.phase = "find-work";
          state.waitTicks = 0;
          save(state);
          render();
        }
      }
    } catch (e) {
      state.failed++;
      state.lastError = String(e).slice(0, 100);
      state.phase = "find-work";
      save(state);
      render();
    } finally {
      busy = false;
    }
  }, 700);

  window[API_NAME] = {
    start() {
      state.enabled = true;
      state._userPaused = false;
      state.phase = "boot";
      state.idleEmpty = 0;
      state.rescanRound = 0;
      save(state);
      render();
    },
    pause() {
      state.enabled = false;
      state._userPaused = true;
      save(state);
      render();
    },
    reset() {
      state.done = 0;
      state.failed = 0;
      state.viewIdx = 0;
      state.phase = "boot";
      state.rescanRound = 0;
      state.enabled = true;
      state._userPaused = false;
      save(state);
      render();
    },
    status() {
      return Object.assign({}, state);
    },
  };

  // Heartbeat
  const HB = "__RECIPE_PREFIX_HB__";
  if (window[HB]) clearInterval(window[HB]);
  window[HB] = setInterval(() => {
    if (window[LOOP_FLAG]) window[LOOP_ALIVE] = Date.now();
  }, 1000);

  // Guardian (blob revive) — expects SRC_KEY already populated by injector
  const GUARDIAN = "__RECIPE_PREFIX_GUARDIAN__";
  const runPersisted = (src) => {
    try {
      const code = atob(src);
      const blob = new Blob([code], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const s = document.createElement("script");
      s.src = url;
      s.onload = () => URL.revokeObjectURL(url);
      (document.documentElement || document.head).appendChild(s);
      return true;
    } catch (e) {
      return false;
    }
  };
  if (window[GUARDIAN]) clearInterval(window[GUARDIAN]);
  window.__RECIPE_PREFIX_LAST_REVIVE_AT = window.__RECIPE_PREFIX_LAST_REVIVE_AT || 0;
  window[GUARDIAN] = setInterval(() => {
    try {
      const src = sessionStorage.getItem(SRC_KEY);
      if (!src) return;
      let st = {};
      try {
        st = JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}");
      } catch (e) {}
      if (st._userPaused === true) return;
      const alive =
        (window[LOOP_ALIVE] && Date.now() - window[LOOP_ALIVE] < 10000) || !!window[LOOP_FLAG];
      if (alive) return;
      if (Date.now() - (window.__RECIPE_PREFIX_LAST_REVIVE_AT || 0) < 12000) return;
      if (st.phase === "done" && st.enabled === false && st._userPaused !== true) {
        st.enabled = true;
        st.phase = "boot";
        sessionStorage.setItem(STATE_KEY, JSON.stringify(st));
      }
      window.__RECIPE_PREFIX_LAST_REVIVE_AT = Date.now();
      runPersisted(src);
    } catch (e) {}
  }, 4000);

  save(state);
  render();
})();
