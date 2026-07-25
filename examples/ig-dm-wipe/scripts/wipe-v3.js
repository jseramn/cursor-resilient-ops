(function () {
  if (window.__IG_DM_LOOP__) clearInterval(window.__IG_DM_LOOP__);
  try {
    if (window.__dmJob) window.__dmJob.running = false;
  } catch (e) {}

  const TABS = ["Primary", "General", "Requests"];
  const KEY = "__igDmWipeV3";
  const load = () => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  };
  const save = (s) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  };

  const prev = load();
  // Always resume when re-injected (crash recovery) unless user paused via HUD
  const userPaused = prev._userPaused === true;
  const state = Object.assign(
    {
      enabled: true,
      phase: "boot",
      tabIdx: 0,
      deleted: 0,
      failed: 0,
      idleEmpty: 0,
      waitTicks: 0,
      spinnerWait: 0,
      scrollTries: 0,
      rescanRound: 0,
      lastLabel: "",
      lastError: "",
      startedAt: Date.now(),
      _userPaused: false,
    },
    prev,
    {
      enabled: !userPaused,
      // if previously "done", force a fresh full rescan
      phase:
        !prev.phase || prev.phase === "done" || prev.phase === "goto-inbox"
          ? "boot"
          : "boot",
      tabIdx: prev.phase === "done" ? 0 : prev.tabIdx || 0,
      idleEmpty: 0,
      scrollTries: 0,
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
  const findInfoBtn = () => {
    const s = document.querySelector(
      'svg[aria-label="Conversation information"], svg[aria-label="Información de la conversación"]'
    );
    return s ? s.closest('[role="button"]') || s.parentElement : null;
  };
  const findDeleteChat = () =>
    [...document.querySelectorAll('div[role="button"],button')].find((el) => {
      const t = (el.innerText || "").trim();
      return visible(el) && (t === "Delete chat" || t === "Eliminar chat");
    }) || null;
  const dialogOpen = () =>
    [...document.querySelectorAll('[role="dialog"],h1,h2')].some((h) =>
      /Delete chat from inbox|Eliminar chat/i.test(h.textContent || "")
    );
  const findDeleteConfirm = () => {
    const dels = [...document.querySelectorAll('div[role="button"],button')].filter(
      (el) => {
        const t = (el.innerText || "").trim();
        return (
          visible(el) &&
          (t === "Delete" || t === "Eliminar") &&
          !el.disabled
        );
      }
    );
    return dels.find((el) => el.closest('[role="dialog"]')) || dels[dels.length - 1] || null;
  };

  const threadList = () =>
    document.querySelector('[aria-label="Thread list"]') ||
    document.querySelector('div[aria-label*="Thread"]') ||
    null;

  const SKIP_KEY = "__igDmWipeSkip";
  const normLabel = (t) => (t || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const loadSkip = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]");
    } catch (e) {
      return [];
    }
  };
  const addSkip = (label) => {
    const s = loadSkip();
    const n = normLabel(label);
    if (!n || s.includes(n)) return;
    s.push(n);
    sessionStorage.setItem(SKIP_KEY, JSON.stringify(s.slice(-100)));
  };
  const isSkipped = (t) => {
    const n = normLabel(t);
    const skips = loadSkip();
    if (skips.includes(n)) return true;
    return skips.some((k) => n.includes(k) || k.includes(n.slice(0, 20)));
  };

  // Broader matcher: row-like buttons in thread list that look like chats
  const getThreads = () => {
    const nav = threadList();
    if (!nav) return [];
    return [...nav.querySelectorAll('div[role="button"]')].filter((el) => {
      if (!visible(el)) return false;
      if (getComputedStyle(el).display === "none") return false;
      const r = el.getBoundingClientRect();
      // real chat rows are ~64-88px tall and fairly wide
      if (r.height < 56 || r.height > 110) return false;
      if (r.width < 200) return false;
      const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (t.length < 3) return false;
      if (isSkipped(t)) {
        el.style.display = "none";
        return false;
      }
      if (
        /Your note|What.?s new|New message|^Search$|Hidden Requests|Message requests|Chats will appear/i.test(
          t
        )
      )
        return false;
      // Prefer known preview patterns, but also accept "name + age" rows
      if (
        /(You:|sent an attachment|Reacted|Active|Unread|Click to chat|Message unavailable|\b\d+\s*[wdhmy]\b|·)/i.test(
          t
        )
      )
        return true;
      // Fallback: multi-line-ish preview with enough text (lazy-loaded ages)
      return t.length >= 8 && !/^Primary$|^General$|^Requests$/i.test(t);
    });
  };

  const scrollThreadList = () => {
    const nav = threadList();
    if (!nav) return false;
    // find nearest scrollable ancestor
    let el = nav;
    for (let i = 0; i < 8 && el; i++) {
      const st = getComputedStyle(el);
      if (
        /(auto|scroll)/.test(st.overflowY) &&
        el.scrollHeight > el.clientHeight + 20
      ) {
        const before = el.scrollTop;
        el.scrollTop = Math.min(el.scrollTop + Math.max(240, el.clientHeight * 0.8), el.scrollHeight);
        return el.scrollTop !== before;
      }
      el = el.parentElement;
    }
    // fallback: scroll first/last thread into view
    const threads = getThreads();
    if (threads.length) {
      threads[threads.length - 1].scrollIntoView({ block: "end" });
      return true;
    }
    return false;
  };

  const ensureHud = () => {
    let hud = document.getElementById("__igDmWipeHud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "__igDmWipeHud";
      hud.style.cssText =
        "position:fixed;z-index:999999;right:12px;bottom:12px;background:#111;color:#fff;border:1px solid #444;border-radius:10px;padding:10px 12px;font:12px/1.35 sans-serif;min-width:220px;box-shadow:0 8px 24px rgba(0,0,0,.45)";
      hud.innerHTML =
        '<div style="font-weight:700;margin-bottom:6px">IG DM Wipe</div><div id="__igDmWipeHudBody"></div><div style="margin-top:8px;display:flex;gap:6px"><button id="__igDmWipeToggle" style="flex:1;padding:6px;border-radius:6px;border:0;cursor:pointer;color:#fff"></button><button id="__igDmWipeReset" style="padding:6px 8px;border-radius:6px;border:0;cursor:pointer;background:#333;color:#fff">Reset</button></div>';
      document.documentElement.appendChild(hud);
    }
    document.getElementById("__igDmWipeToggle").onclick = () => {
      state.enabled = !state.enabled;
      state._userPaused = !state.enabled;
      if (state.enabled) {
        state.phase = "boot";
        state.idleEmpty = 0;
      }
      save(state);
      render();
    };
    document.getElementById("__igDmWipeReset").onclick = () => {
      state.deleted = 0;
      state.failed = 0;
      state.tabIdx = 0;
      state.phase = "boot";
      state.idleEmpty = 0;
      state.scrollTries = 0;
      state.rescanRound = 0;
      state.enabled = true;
      state._userPaused = false;
      save(state);
      render();
    };
  };

  const render = () => {
    ensureHud();
    const body = document.getElementById("__igDmWipeHudBody");
    const btn = document.getElementById("__igDmWipeToggle");
    const elapsed = Math.round((Date.now() - state.startedAt) / 1000) + "s";
    body.innerHTML = `<div>status: <b>${state.enabled ? "RUNNING" : "paused"}</b></div><div>phase: ${state.phase}</div><div>tab: ${TABS[state.tabIdx]} · r${state.rescanRound || 0}</div><div>deleted: <b>${state.deleted}</b> · fail: ${state.failed}</div><div>last: ${(state.lastLabel || "-").slice(0, 34)}</div><div style="opacity:.75">${state.lastError || ""}</div><div style="opacity:.6">t=${elapsed}</div>`;
    btn.textContent = state.enabled ? "Pause" : "Start";
    btn.style.background = state.enabled ? "#a33" : "#2a7";
  };

  let busy = false;
  window.__IG_DM_LOOP_ALIVE = Date.now();
  window.__IG_DM_LOOP__ = setInterval(() => {
    window.__IG_DM_LOOP_ALIVE = Date.now();
    if (!state.enabled || busy) return;
    busy = true;
    try {
      // Always prefer inbox; Requests subpage hides Primary list
      if (!/\/direct\//.test(location.pathname)) {
        state.phase = "goto-inbox";
        location.href = "https://www.instagram.com/direct/inbox/";
        save(state);
        return;
      }
      if (/\/direct\/requests\//.test(location.pathname) && state.tabIdx < 2) {
        location.href = "https://www.instagram.com/direct/inbox/";
        state.phase = "boot";
        save(state);
        return;
      }

      if (dialogOpen()) {
        const del = findDeleteConfirm();
        if (del) {
          click(del);
          state.phase = "wait-gone";
          state.spinnerWait = 0;
          state.lastError = "confirmed";
          save(state);
          render();
          return;
        }
        state.phase = "wait-spinner";
        state.spinnerWait++;
        state.lastError = "spinner " + state.spinnerWait;
        if (state.spinnerWait > 50) {
          const cancel = [...document.querySelectorAll('div[role="button"],button')].find(
            (el) => {
              const t = (el.innerText || "").trim();
              return t === "Cancel" || t === "Cancelar";
            }
          );
          if (cancel) click(cancel);
          state.failed++;
          state.spinnerWait = 0;
          state.phase = "open-thread";
          state.lastError = "spinner timeout";
        }
        save(state);
        render();
        return;
      }

      if (state.phase === "wait-gone" || state.phase === "wait-spinner") {
        state.deleted++;
        state.phase = "cooldown";
        state.waitTicks = 0;
        state.spinnerWait = 0;
        state.lastError = "";
        save(state);
        render();
        return;
      }

      if (state.phase === "cooldown") {
        state.waitTicks++;
        if (state.waitTicks < 2) {
          render();
          return;
        }
        state.waitTicks = 0;
        state.phase = "open-thread";
        save(state);
        render();
        return;
      }

      if (state.phase === "boot" || state.phase === "select-tab" || state.phase === "goto-inbox") {
        // Ensure we are on inbox for Primary/General
        if (state.tabIdx < 2 && !/\/direct\/inbox/.test(location.pathname)) {
          location.href = "https://www.instagram.com/direct/inbox/";
          save(state);
          return;
        }
        if (state.tabIdx === 2) {
          // Requests: use inbox Requests tab first; if missing, go to requests URL
          const tab = [...document.querySelectorAll('[role="tab"]')].find(
            (t) => (t.textContent || "").trim() === "Requests"
          );
          if (tab) click(tab);
          else if (!/\/direct\/requests/.test(location.pathname)) {
            location.href = "https://www.instagram.com/direct/requests/";
            save(state);
            return;
          }
        } else {
          const tab = [...document.querySelectorAll('[role="tab"]')].find(
            (t) => (t.textContent || "").trim() === TABS[state.tabIdx]
          );
          if (tab) click(tab);
        }
        state.phase = "open-thread";
        state.idleEmpty = 0;
        state.scrollTries = 0;
        save(state);
        render();
        return;
      }

      if (state.phase === "open-info") {
        const info = findInfoBtn();
        if (!info) {
          state.waitTicks++;
          state.lastError = "no info btn";
          if (state.waitTicks > 8) {
            state.failed++;
            state.waitTicks = 0;
            state.phase = "open-thread";
          }
          save(state);
          render();
          return;
        }
        click(info);
        state.phase = "wait-details";
        state.waitTicks = 0;
        state.lastError = "opened info";
        save(state);
        render();
        return;
      }

      if (state.phase === "wait-details") {
        const delChat = findDeleteChat();
        if (!delChat) {
          state.waitTicks++;
          state.lastError = "waiting details";
          if (state.waitTicks > 10) {
            state.phase = "open-info";
            state.waitTicks = 0;
          }
          save(state);
          render();
          return;
        }
        click(delChat);
        state.phase = "confirm";
        state.waitTicks = 0;
        state.lastError = "clicked delete chat";
        save(state);
        render();
        return;
      }

      if (state.phase === "confirm") {
        state.waitTicks++;
        state.lastError = "waiting confirm dialog";
        if (state.waitTicks > 12) {
          state.failed++;
          state.phase = "open-thread";
          state.waitTicks = 0;
        }
        save(state);
        render();
        return;
      }

      const threads = getThreads();
      if (!threads.length) {
        state.idleEmpty++;
        state.lastLabel = "(empty)";
        // Scroll to load more before advancing tab
        if (state.idleEmpty % 3 === 1 && state.scrollTries < 8) {
          scrollThreadList();
          state.scrollTries++;
          state.lastError = "scroll " + state.scrollTries;
          save(state);
          render();
          return;
        }
        // Need sustained empty (not a transient SPA glitch)
        if (state.idleEmpty >= 12) {
          if (state.tabIdx < TABS.length - 1) {
            state.tabIdx++;
            state.idleEmpty = 0;
            state.scrollTries = 0;
            state.phase = "select-tab";
            state.lastError = "next tab";
          } else {
            // Full pass done — rescan from Primary instead of permanent stop
            state.rescanRound = (state.rescanRound || 0) + 1;
            state.tabIdx = 0;
            state.idleEmpty = 0;
            state.scrollTries = 0;
            state.phase = "boot";
            state.lastError = "rescan #" + state.rescanRound;
            // After 3 clean rescans with 0 deletes in between, pause
            if (state.rescanRound >= 3) {
              const since = state._deletedAtRescanStart || 0;
              if (state.deleted === since) {
                state.enabled = false;
                state.phase = "done";
                state.lastError = "All tabs cleared (verified)";
              } else {
                state._deletedAtRescanStart = state.deleted;
                state.rescanRound = 0;
              }
            } else if (state.rescanRound === 1) {
              state._deletedAtRescanStart = state.deleted;
            }
          }
        }
        save(state);
        render();
        return;
      }

      state.idleEmpty = 0;
      state.scrollTries = 0;
      state.lastLabel = (threads[0].innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
      click(threads[0]);
      state.phase = "open-info";
      state.waitTicks = 0;
      state.lastError = "opened thread";
      save(state);
      render();
    } catch (e) {
      state.failed++;
      state.lastError = String(e).slice(0, 100);
      state.phase = "open-thread";
      save(state);
      render();
    } finally {
      busy = false;
    }
  }, 700);

  window.__IG_DM_WIPE__ = {
    start() {
      state.enabled = true;
      state._userPaused = false;
      state.phase = "boot";
      state.tabIdx = 0;
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
      state.deleted = 0;
      state.failed = 0;
      state.tabIdx = 0;
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

  // Do NOT zero LOOP_ALIVE on history — IG SPA spam caused false crash/revive thrash
  window.__IG_DM_HISTORY_WRAP__ = true;

  // Independent heartbeat
  if (window.__IG_DM_HB__) clearInterval(window.__IG_DM_HB__);
  window.__IG_DM_HB__ = setInterval(() => {
    if (window.__IG_DM_LOOP__) window.__IG_DM_LOOP_ALIVE = Date.now();
  }, 1000);

  // CSP-safe revive: Instagram blocks eval(); blob: is allowed in script-src
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
      console.warn("[IG wipe] blob revive failed", e);
      return false;
    }
  };
  if (window.__IG_DM_GUARDIAN__) clearInterval(window.__IG_DM_GUARDIAN__);
  window.__IG_DM_LAST_REVIVE_AT = window.__IG_DM_LAST_REVIVE_AT || 0;
  window.__IG_DM_GUARDIAN__ = setInterval(() => {
    try {
      const src = sessionStorage.getItem("__wipeSrcV3");
      if (!src) return;
      let st = {};
      try {
        st = JSON.parse(sessionStorage.getItem(KEY) || "{}");
      } catch (e) {}
      if (st._userPaused === true) return;
      const alive =
        (window.__IG_DM_LOOP_ALIVE && Date.now() - window.__IG_DM_LOOP_ALIVE < 10000) ||
        !!window.__IG_DM_LOOP__;
      if (alive) return;
      if (Date.now() - (window.__IG_DM_LAST_REVIVE_AT || 0) < 12000) return;
      if (st.phase === "done" && st.enabled === false && st._userPaused !== true) {
        st.enabled = true;
        st.phase = "boot";
        st.tabIdx = 0;
        sessionStorage.setItem(KEY, JSON.stringify(st));
      }
      window.__IG_DM_LAST_REVIVE_AT = Date.now();
      runPersisted(src);
    } catch (e) {
      console.warn("[IG wipe] guardian failed", e);
    }
  }, 4000);

  // Sticky undeletable chat detector
  if (window.__IG_DM_STICKY__) clearInterval(window.__IG_DM_STICKY__);
  let stickyTop = "";
  let stickyHits = 0;
  window.__IG_DM_STICKY__ = setInterval(() => {
    try {
      if (!state.enabled) return;
      const threads = getThreads();
      if (!threads.length) return;
      const top = normLabel(threads[0].innerText || "");
      if (top && top === stickyTop) stickyHits++;
      else {
        stickyTop = top;
        stickyHits = 0;
      }
      if (stickyHits >= 25) {
        addSkip(top);
        threads[0].style.display = "none";
        stickyHits = 0;
        state.failed++;
        state.phase = "open-thread";
        state.lastError = "skipped sticky";
        save(state);
        render();
      }
    } catch (e) {}
  }, 1000);

  // Persist this source for crash recovery
  try {
    // filled by injector after upload; keep existing if present
    if (!sessionStorage.getItem("__wipeSrcV3") && window.__wipeSrcPending) {
      sessionStorage.setItem("__wipeSrcV3", window.__wipeSrcPending);
    }
  } catch (e) {}

  save(state);
  render();
  return { started: true, status: window.__IG_DM_WIPE__.status() };
})();
