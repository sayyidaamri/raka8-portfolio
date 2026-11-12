/* RAKA'8 — shared behaviour: scramble text, cursor grid trail, sound, contact modal, logo. */
(function () {
  const A = window.ART;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("raka8:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("raka8:" + k, JSON.stringify(v)); } catch {} },
  };

  /* ---------------- SOUND ---------------- */
  const base = document.documentElement.dataset.base || "";
  const SFX = {};
  const Sound = {
    on: store.get("sound", false),
    music: null,
    play(name, vol = 0.35) {
      if (!this.on) return;
      try {
        if (!SFX[name]) SFX[name] = new Audio(`${base}assets/audio/${name}.mp3`);
        const a = SFX[name].cloneNode(); a.volume = vol; a.play().catch(() => {});
      } catch {}
    },
    set(v) {
      this.on = v; store.set("sound", v);
      document.dispatchEvent(new CustomEvent("sound:change", { detail: v }));
      if (this.wantMusic) this.syncMusic();
    },
    syncMusic() {
      if (!this.music) { this.music = new Audio(`${base}assets/audio/music.mp3`); this.music.loop = true; this.music.volume = 0.22; }
      if (this.on) this.music.play().catch(() => {}); else this.music.pause();
    },
  };

  /* ---------------- SCRAMBLE ---------------- */
  const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=<>/?";
  const PAINTS = ["#ceff00", "#9b5cff", "#ff4fa3", "#00d4ff", "#ff8a00"];
  const rg = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const rp = () => PAINTS[(Math.random() * PAINTS.length) | 0];

  function split(el) {
    if (el._chars) return el._chars;
    const chars = [];
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "tr-word";
            for (const ch of part) {
              const c = document.createElement("span"); c.className = "tr-char"; c.textContent = ch;
              c.style.setProperty("--paint", rp()); w.appendChild(c); chars.push(c);
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("tr-skip")) walk(n);
      }
    };
    walk(el);
    el._chars = chars;
    el.classList.add("tr-ready");
    return chars;
  }
  const setState = (c, s) => { c.classList.toggle("tr-hide", s === "hide"); c.classList.toggle("tr-paint", s === "paint"); c.classList.toggle("tr-scr", s === "scr"); };

  /* animate chars: mode "in" (hidden → text) or "out" (text → hidden) */
  function scramble(el, mode = "in", dur = 1100) {
    const chars = split(el);
    cancelAnimationFrame(el._raf);
    el._mode = mode;
    if (reduce) { chars.forEach((c) => setState(c, mode === "in" ? "show" : "hide")); return Promise.resolve(); }
    const n = chars.length, spread = dur * 0.55;
    const starts = chars.map((_, i) => (i / Math.max(1, n - 1)) * spread * 0.6 + Math.random() * spread * 0.4);
    const t0 = performance.now();
    return new Promise((res) => {
      const tick = (t) => {
        const e = t - t0; let done = true;
        chars.forEach((c, i) => {
          const s = starts[i], d = e - s;
          let st;
          if (mode === "in") st = d < 0 ? "hide" : d < 70 ? "paint" : d < 330 ? "scr" : "show";
          else st = d < 0 ? "show" : d < 230 ? "scr" : d < 300 ? "paint" : "hide";
          if (d < 330) done = false;
          if (st === "scr" && (!c._g || t - c._g > 55)) { c.dataset.g = rg(); c._g = t; }
          setState(c, st);
        });
        if (!done) el._raf = requestAnimationFrame(tick); else res();
      };
      el._raf = requestAnimationFrame(tick);
    });
  }
  function hideNow(el) { split(el).forEach((c) => setState(c, "hide")); el._mode = "out"; }
  /* swap text with scramble (used for mode text) */
  async function swapText(el, html, dur = 900) {
    await scramble(el, "out", dur * 0.6);
    el._chars = null; el.innerHTML = html; split(el); hideNow(el);
    return scramble(el, "in", dur);
  }
  /* reveal when visible (non-pinned elements) */
  function autoReveal(root = document) {
    const els = $$("[data-scramble]", root);
    els.forEach((el) => { split(el); hideNow(el); });
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      const el = en.target;
      if (en.isIntersecting && el._mode !== "in") scramble(el, "in", +el.dataset.dur || 1100);
      else if (!en.isIntersecting && el._mode === "in" && el.dataset.scramble !== "once") hideNow(el);
    }), { threshold: 0.15 });
    els.filter((el) => el.dataset.scramble !== "manual").forEach((el) => io.observe(el));
  }

  /* ---------------- CURSOR GRID TRAIL ---------------- */
  function gridTrail() {
    if (!matchMedia("(pointer: fine)").matches || reduce) return;
    const cv = document.createElement("canvas"); cv.id = "grid-trail"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d"); const CELL = 23; let W, H, dpr;
    const cells = new Map();
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    let last = null, running = false, prevT = 0;
    const mark = (x, y) => { const k = ((x / CELL) | 0) + "," + ((y / CELL) | 0); cells.set(k, 1); };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (last) { const dx = e.clientX - last.x, dy = e.clientY - last.y, n = Math.ceil(Math.hypot(dx, dy) / (CELL / 2)); for (let i = 1; i <= n; i++) mark(last.x + (dx * i) / n, last.y + (dy * i) / n); }
      else mark(e.clientX, e.clientY);
      last = { x: e.clientX, y: e.clientY };
      if (!running) { running = true; prevT = performance.now(); requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => (last = null));
    function loop(t) {
      const dt = t - prevT; prevT = t;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#ceff00";
      for (const [k, v] of cells) {
        const nv = v - dt / 520;
        if (nv <= 0) { cells.delete(k); continue; }
        cells.set(k, nv);
        const [cx, cy] = k.split(",").map(Number);
        ctx.globalAlpha = Math.min(1, nv * 1.3);
        ctx.fillRect(cx * CELL, cy * CELL, CELL, CELL);
      }
      ctx.globalAlpha = 1;
      if (cells.size) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, W, H); }
    }
  }

  /* ---------------- PIXEL SCROLLBAR (for scroll areas) ---------------- */
  function pixBar(scroller, bar) {
    const thumb = $(".pix-bar-thumb", bar), track = $(".pix-bar-track", bar);
    const sync = () => {
      const h = track.clientHeight, ratio = scroller.clientHeight / Math.max(1, scroller.scrollHeight);
      const th = Math.max(40, h * Math.min(1, ratio));
      thumb.style.height = th + "px";
      const max = scroller.scrollHeight - scroller.clientHeight;
      thumb.style.top = (max > 0 ? (scroller.scrollTop / max) * (h - th) : 0) + "px";
    };
    scroller.addEventListener("scroll", sync, { passive: true });
    new ResizeObserver(sync).observe(scroller);
    $(".pix-bar-up", bar).addEventListener("click", () => scroller.scrollBy({ top: -120, behavior: "smooth" }));
    $(".pix-bar-down", bar).addEventListener("click", () => scroller.scrollBy({ top: 120, behavior: "smooth" }));
    thumb.addEventListener("pointerdown", (e) => {
      e.preventDefault(); thumb.setPointerCapture(e.pointerId);
      const y0 = e.clientY, s0 = scroller.scrollTop;
      const mv = (ev) => { const h = track.clientHeight - thumb.offsetHeight; scroller.scrollTop = s0 + ((ev.clientY - y0) / Math.max(1, h)) * (scroller.scrollHeight - scroller.clientHeight); };
      const up = () => { thumb.removeEventListener("pointermove", mv); thumb.removeEventListener("pointerup", up); };
      thumb.addEventListener("pointermove", mv); thumb.addEventListener("pointerup", up);
    });
    sync();
    return sync;
  }
  const barHTML = () => `<div class="pix-bar" aria-hidden="true"><button type="button" tabindex="-1" class="pix-bar-btn pix-bar-up">${A.icon("up")}</button><div class="pix-bar-track"><div class="pix-bar-thumb"></div></div><button type="button" tabindex="-1" class="pix-bar-btn pix-bar-down">${A.icon("down")}</button></div>`;

  /* ---------------- CONTACT MODAL ---------------- */
  const EMAIL = "hello@raka8.dev";
  function contactModal() {
    const d = document.createElement("dialog");
    d.className = "contact-modal"; d.setAttribute("aria-labelledby", "contact-heading");
    d.innerHTML = `<div class="cm-backdrop" data-close></div>
      <div class="cm-window" id="contact" role="document">
        <div class="cm-titlebar"><div class="cm-title">C:/RAKA8.DEV/CONTACT</div><button type="button" class="cm-close" data-close aria-label="Close">${A.icon("close")}</button></div>
        <div class="cm-body">
          <div class="cm-scroll">
            <h3 id="contact-heading" class="cm-heading">Great ideas deserve the spotlight. Let's Talk.</h3>
            <form class="cm-form" novalidate>
              <div class="cm-group"><label class="cm-label" for="cm-name">Name</label><input class="cm-input" id="cm-name" name="name" autocomplete="name" placeholder="Type your name *" required></div>
              <div class="cm-group"><label class="cm-label" for="cm-email">Email</label><input class="cm-input" id="cm-email" name="email" type="email" autocomplete="email" placeholder="Type your email address *" required></div>
              <div class="cm-group"><label class="cm-label" for="cm-company">Company</label><input class="cm-input" id="cm-company" name="company" autocomplete="organization" placeholder="Type your company name *" required></div>
              <div class="cm-group"><label class="cm-label" for="cm-msg">Message</label><textarea class="cm-input cm-textarea" id="cm-msg" name="message" placeholder="Tell me about your idea *" required></textarea></div>
              <div class="form-status" role="status" hidden></div>
              <div class="cm-actions"><button type="submit" class="cm-submit"><span class="cm-submit-text">Submit</span><span class="cm-spin"></span></button></div>
            </form>
          </div>
          ${barHTML()}
        </div>
      </div>`;
    document.body.appendChild(d);
    const scroller = $(".cm-scroll", d), sync = pixBar(scroller, $(".pix-bar", d));
    const form = $("form", d), status = $(".form-status", d), submit = $(".cm-submit", d);
    let lastFocus = null;
    const open = () => {
      if (d.open) return;
      lastFocus = document.activeElement;
      d.classList.remove("is-closing");
      status.hidden = true;
      d.showModal(); document.documentElement.classList.add("popup-open");
      Sound.play("open"); requestAnimationFrame(sync);
      setTimeout(() => $("#cm-name", d).focus(), 60);
    };
    const close = () => {
      if (!d.open) return;
      d.classList.add("is-closing"); Sound.play("close");
      setTimeout(() => { d.close(); d.classList.remove("is-closing"); document.documentElement.classList.remove("popup-open"); lastFocus && lastFocus.focus && lastFocus.focus(); }, 220);
    };
    d.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    d.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    form.addEventListener("input", (e) => e.target.classList.remove("is-invalid"));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = $$(".cm-input", form); let bad = null;
      fields.forEach((f) => { const ok = f.value.trim() && (f.type !== "email" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)); f.classList.toggle("is-invalid", !ok); if (!ok && !bad) bad = f; });
      const show = (ok, html) => { status.hidden = false; status.className = "form-status " + (ok ? "is-ok" : "is-err"); status.innerHTML = A.icon(ok ? "ok" : "err") + `<p>${html}</p>`; sync(); scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }); };
      if (bad) { show(false, "Please fill in every field with a valid value."); bad.focus(); Sound.play("hit"); return; }
      submit.classList.add("is-loading");
      setTimeout(() => {
        submit.classList.remove("is-loading");
        const v = Object.fromEntries(new FormData(form));
        const body = encodeURIComponent(`${v.message}\n\n— ${v.name} (${v.company})\n${v.email}`);
        show(true, `Thanks, ${v.name.replace(/[<>&]/g, "")}! Your mail app is opening with the message ready to send. If nothing opens, write to <a href="mailto:${EMAIL}">${EMAIL}</a>.`);
        Sound.play("coin");
        location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Project enquiry — " + v.company)}&body=${body}`;
        form.reset();
      }, 900);
    });
    document.addEventListener("click", (e) => {
      const t = e.target.closest('[data-popup-open="contact"]');
      if (t) { e.preventDefault(); open(); }
    });
    return { open, close };
  }

  /* ---------------- LOGO + misc ---------------- */
  function logos() { $$("[data-logo]").forEach((el) => (el.innerHTML = A.logo())); }
  function soundButtons() {
    const sync = () => $$("[data-sound-toggle]").forEach((b) => {
      b.setAttribute("aria-pressed", String(Sound.on));
      const st = $(".tutorial-state", b); if (st) { st.textContent = Sound.on ? "ON" : "OFF"; b.classList.toggle("is-on", Sound.on); }
      const ic = $("[data-sound-icon]", b); if (ic) ic.innerHTML = A.icon(Sound.on ? "soundOn" : "soundOff");
      b.title = Sound.on ? "Sound on" : "Sound off";
    });
    document.addEventListener("click", (e) => { const b = e.target.closest("[data-sound-toggle]"); if (b) { Sound.set(!Sound.on); Sound.play("click"); } });
    document.addEventListener("sound:change", sync); sync();
  }
  /* hover + click blips on interactive things */
  function blips() {
    document.addEventListener("pointerover", (e) => { const t = e.target.closest("a, button, .selection-button"); if (t && !t.contains(e.relatedTarget)) Sound.play("hover", 0.18); });
  }

  window.CORE = { $, $$, clamp, store, Sound, split, scramble, hideNow, swapText, autoReveal, gridTrail, pixBar, barHTML, contactModal, logos, soundButtons, blips, reduce, EMAIL };
})();
