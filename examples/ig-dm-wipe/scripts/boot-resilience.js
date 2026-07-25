(() => {
  // Reset wipe state for restart (keep deleted count)
  let st = {};
  try {
    st = JSON.parse(sessionStorage.getItem("__igDmWipeV3") || "{}");
  } catch (e) {}
  st.enabled = true;
  st._userPaused = false;
  st.phase = "boot";
  st.tabIdx = 0;
  st.idleEmpty = 0;
  st.scrollTries = 0;
  st.waitTicks = 0;
  st.spinnerWait = 0;
  st.rescanRound = 0;
  st.lastError = "restart";
  sessionStorage.setItem("__igDmWipeV3", JSON.stringify(st));

  // Seed skips for known undeletable
  const SKIP_KEY = "__igDmWipeSkip";
  let skips = [];
  try {
    skips = JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]");
  } catch (e) {}
  ["Sticky Group Chat Click to chat Unrea", "Sticky Group Chat"].forEach((k) => {
    if (!skips.includes(k)) skips.push(k);
  });
  sessionStorage.setItem(SKIP_KEY, JSON.stringify(skips));

  const norm = (t) => (t || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const hideSkipped = () => {
    const s = (() => {
      try {
        return JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]");
      } catch (e) {
        return [];
      }
    })();
    const nav = document.querySelector('[aria-label="Thread list"]');
    if (!nav) return;
    [...nav.querySelectorAll('div[role="button"]')].forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height < 56 || r.height > 110 || r.width < 200) return;
      const label = norm(el.innerText);
      if (/Example User|Sticky Group Chat/i.test(el.innerText || "") || s.some((k) => label.includes(k.slice(0, 18)) || k.includes(label.slice(0, 18)))) {
        el.style.display = "none";
        if (!s.includes(label) && label) {
          s.push(label);
          sessionStorage.setItem(SKIP_KEY, JSON.stringify(s.slice(-100)));
        }
      }
    });
  };
  if (window.__IG_DM_HIDE_SKIP__) clearInterval(window.__IG_DM_HIDE_SKIP__);
  window.__IG_DM_HIDE_SKIP__ = setInterval(hideSkipped, 1500);
  hideSkipped();

  const runSrc = (src) => {
    const code = atob(src);
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: true });
      };
      s.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: false });
      };
      (document.documentElement || document.head).appendChild(s);
    });
  };
  window.__IG_DM_RUN_SRC__ = runSrc;

  if (window.__IG_DM_HB__) clearInterval(window.__IG_DM_HB__);
  window.__IG_DM_HB__ = setInterval(() => {
    if (window.__IG_DM_LOOP__) window.__IG_DM_LOOP_ALIVE = Date.now();
  }, 1000);

  if (window.__IG_DM_RESILIENCE__) clearInterval(window.__IG_DM_RESILIENCE__);
  window.__IG_DM_LAST_REVIVE_AT = 0;
  window.__IG_DM_RESILIENCE__ = setInterval(async () => {
    try {
      let cur = {};
      try {
        cur = JSON.parse(sessionStorage.getItem("__igDmWipeV3") || "{}");
      } catch (e) {}
      if (cur._userPaused === true) return;
      const alive =
        (window.__IG_DM_LOOP_ALIVE && Date.now() - window.__IG_DM_LOOP_ALIVE < 10000) ||
        !!window.__IG_DM_LOOP__;
      if (alive) return;
      if (Date.now() - (window.__IG_DM_LAST_REVIVE_AT || 0) < 12000) return;
      const nav = document.querySelector('[aria-label="Thread list"]');
      let rows = 0;
      if (nav) {
        rows = [...nav.querySelectorAll('div[role="button"]')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height >= 56 && r.height <= 110 && r.width > 200 && getComputedStyle(el).display !== "none";
        }).length;
      }
      if (cur.phase === "done" || cur.enabled === false) {
        if (rows === 0 && cur.phase === "done") return;
        cur.enabled = true;
        cur._userPaused = false;
        cur.phase = "boot";
        cur.tabIdx = 0;
        cur.idleEmpty = 0;
        sessionStorage.setItem("__igDmWipeV3", JSON.stringify(cur));
      }
      const src = sessionStorage.getItem("__wipeSrcV3");
      if (!src) return;
      window.__IG_DM_LAST_REVIVE_AT = Date.now();
      window.__lastRevive = await runSrc(src);
    } catch (e) {
      window.__lastRevive = { error: String(e) };
    }
  }, 4000);

  // Stuck modal / sticky top recovery
  if (window.__IG_DM_STUCKFIX__) clearInterval(window.__IG_DM_STUCKFIX__);
  let lastPhase = "";
  let lastDeleted = -1;
  let stuckTicks = 0;
  window.__IG_DM_STUCKFIX__ = setInterval(() => {
    try {
      hideSkipped();
      const api = window.__IG_DM_WIPE__;
      const cur = api && api.status ? api.status() : null;
      if (!cur || cur.enabled === false) return;
      const same = cur.phase === lastPhase && cur.deleted === lastDeleted;
      lastPhase = cur.phase;
      lastDeleted = cur.deleted;
      if (!same) {
        stuckTicks = 0;
      } else {
        stuckTicks++;
      }
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog && /Delete chat from inbox/i.test(dialog.innerText || "")) {
        const del = [...dialog.querySelectorAll('div[role="button"],button')].find((el) =>
          /^(Delete|Eliminar)$/.test((el.innerText || "").trim())
        );
        if (del && stuckTicks >= 3) del.click();
        if (stuckTicks >= 15) {
          const cancel = [...dialog.querySelectorAll('div[role="button"],button')].find((el) =>
            /^(Cancel|Cancelar)$/.test((el.innerText || "").trim())
          );
          if (cancel) cancel.click();
          const nav = document.querySelector('[aria-label="Thread list"]');
          const top = nav && [...nav.querySelectorAll('div[role="button"]')].find((el) => {
            const r = el.getBoundingClientRect();
            return r.height >= 56 && r.height <= 110 && r.width > 200 && getComputedStyle(el).display !== "none";
          });
          if (top) {
            const label = norm(top.innerText);
            const s = JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]");
            if (label && !s.includes(label)) {
              s.push(label);
              sessionStorage.setItem(SKIP_KEY, JSON.stringify(s));
            }
            top.style.display = "none";
          }
          stuckTicks = 0;
        }
      }
      if (stuckTicks >= 5) {
        const delChat = [...document.querySelectorAll('div[role="button"],button')].find((el) =>
          /^(Delete chat|Eliminar chat)$/.test((el.innerText || "").trim())
        );
        if (delChat) delChat.click();
      }
    } catch (e) {}
  }, 2000);

  return runSrc(sessionStorage.getItem("__wipeSrcV3")).then((r) => ({
    boot: true,
    revive: r,
    deleted: st.deleted,
    status: window.__IG_DM_WIPE__ && window.__IG_DM_WIPE__.status(),
  }));
})();
