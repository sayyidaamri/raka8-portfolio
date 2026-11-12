/* RAKA'8 — projects page: list, hover video, pixel reveal, gallery, claw machine. */
(function () {
  const A = window.ART, K = window.CORE, P = window.PROJECTS;
  const { $, $$, clamp, Sound, reduce } = K;
  const root = document.documentElement;
  const img = (id) => `assets/img/projects/${id}.jpg`;
  const arrowSVG = A.icon("arrow");

  K.logos(); K.gridTrail(); K.contactModal(); K.soundButtons(); K.blips();
  $$("[data-icon]").forEach((el) => (el.innerHTML = A.icon(el.dataset.icon)));
  $$(".projects-nav-arrow").forEach((el) => (el.innerHTML = arrowSVG));
  $$(".gallery-arrow").forEach((el) => (el.innerHTML = arrowSVG));
  $$("[data-icon-arrow]").forEach((el) => (el.innerHTML = A.px(["X...", "XX..", "XXX.", "XXXX", "XXX.", "XX..", "X..."], { X: "#121212" })));
  $$("[data-icon-flip]").forEach((el) => (el.innerHTML = A.px(["...X", "..XX", ".XXX", "XXXX", ".XXX", "..XX", "...X"], { X: "#121212" })));
  $$("[data-goto-mode]").forEach((a) => a.addEventListener("click", () => { try { sessionStorage.setItem("raka8:mode", a.dataset.gotoMode); } catch {} }));

  /* ---------------- list ---------------- */
  const list = $(".projects-list");
  list.innerHTML = P.map((p, i) => `
    <article class="project-row" data-i="${i}">
      <div class="project-info">
        <div>
          <h2 class="heading project-title">${p.title}</h2>
          <p class="project-year">${p.year}</p>
          <dl class="project-details"><div><dt>Client</dt><dd>${p.client}</dd></div><div><dt>Company</dt><dd>${p.company}</dd></div></dl>
        </div>
        <div class="project-meta">
          <button type="button" class="project-link" data-open="${i}">View Project</button>
          <ul class="project-roles">${p.roles.map((r) => `<li class="project-role">${r}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="project-media" data-open="${i}" tabindex="0" role="button" aria-label="Open ${p.title} gallery">
        <img src="${img(p.media[0])}" alt="${p.title} website preview" loading="lazy" decoding="async">
        <canvas class="project-pixels" aria-hidden="true"></canvas>
      </div>
    </article>`).join("");

  const scroller = $(".projects-scroll");
  $(".list-bar").innerHTML = K.barHTML();
  K.pixBar(scroller, $(".list-bar .pix-bar"));

  /* pixel reveal: draw the image at shrinking block sizes */
  function pixelate(media, dur = 650, from = 48) {
    const cv = $("canvas", media), im = $("img", media);
    if (reduce || !im.complete || !im.naturalWidth) { cv.hidden = true; return; }
    const r = media.getBoundingClientRect(); const w = Math.round(r.width), h = Math.round(r.height);
    cv.width = w; cv.height = h; cv.hidden = false;
    const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas"), tc = tmp.getContext("2d");
    const sw = im.naturalWidth, sh = im.naturalHeight, sc = Math.max(w / sw, h / sh), cw = w / sc, ch = h / sc, cx = (sw - cw) / 2, cy = (sh - ch) / 2;
    const t0 = performance.now(); let last = -1;
    const step = (t) => {
      const q = clamp((t - t0) / dur), block = Math.max(1, Math.round(from * Math.pow(1 - q, 1.6)));
      if (block !== last) {
        last = block;
        const bw = Math.max(1, Math.ceil(w / block)), bh = Math.max(1, Math.ceil(h / block));
        tmp.width = bw; tmp.height = bh; tc.drawImage(im, cx, cy, cw, ch, 0, 0, bw, bh);
        ctx.clearRect(0, 0, w, h); ctx.drawImage(tmp, 0, 0, bw, bh, 0, 0, w, h);
      }
      if (q < 1) requestAnimationFrame(step); else cv.hidden = true;
    };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const im = $("img", e.target); const go = () => pixelate(e.target, 800, 64);
    if (im.complete) go(); else im.addEventListener("load", go, { once: true });
  }), { root: matchMedia("(width <= 991px)").matches ? null : scroller, threshold: 0.25 });
  $$(".project-media").forEach((m) => io.observe(m));

  /* hover: pixel flash then play the video */
  $$(".project-media").forEach((m) => {
    const p = P[m.dataset.open]; if (!p.video) return;
    let v = null;
    const on = () => {
      if (!matchMedia("(hover: hover)").matches) return;
      if (!v) { v = document.createElement("video"); v.src = `assets/video/${p.video}`; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; m.insertBefore(v, $("canvas", m)); }
      pixelate(m, 350, 24); v.play().then(() => m.classList.add("is-playing")).catch(() => {});
    };
    const off = () => { if (v) { v.pause(); m.classList.remove("is-playing"); } };
    m.addEventListener("pointerenter", on); m.addEventListener("pointerleave", off);
  });

  /* ---------------- gallery ---------------- */
  const gal = $(".gallery"), track = $(".gallery-track");
  let cur = 0, lastFocus = null;
  track.innerHTML = P.map((p, i) => `<div class="gallery-slot" data-i="${i}"><img src="${img(p.media[1] || p.media[0])}" alt="${p.title} screen" draggable="false" loading="lazy"></div>`).join("");
  const slots = $$(".gallery-slot", track);
  function render() {
    slots.forEach((s, i) => {
      const k = i - cur; s.style.setProperty("--k", k);
      s.classList.toggle("is-current", k === 0); s.classList.toggle("is-off", Math.abs(k) > 1);
      const v = $("video", s);
      if (k === 0 && P[i].video && !v) { const nv = document.createElement("video"); Object.assign(nv, { src: `assets/video/${P[i].video}`, muted: true, loop: true, playsInline: true, autoplay: true, controls: true }); nv.setAttribute("draggable", "false"); s.appendChild(nv); nv.play().catch(() => {}); }
      if (k !== 0 && v) v.remove();
    });
    const p = P[cur];
    $(".gallery-title").textContent = p.title; $(".gallery-year").textContent = p.year;
    $(".g-client").textContent = p.client; $(".g-company").textContent = p.company;
    $(".gallery-roles").innerHTML = p.roles.map((r) => `<li class="gallery-role">${r}</li>`).join("");
    $(".gallery-count").textContent = `${String(cur + 1).padStart(2, "0")} / ${P.length}`;
  }
  function openGallery(i) {
    cur = +i; lastFocus = document.activeElement; gal.hidden = false; root.classList.add("gallery-open");
    render(); requestAnimationFrame(() => gal.classList.add("is-open")); Sound.play("open");
    $(".gallery-close").focus();
  }
  function closeGallery() {
    gal.classList.remove("is-open"); Sound.play("close");
    setTimeout(() => { gal.hidden = true; root.classList.remove("gallery-open"); $$("video", track).forEach((v) => v.remove()); lastFocus && lastFocus.focus && lastFocus.focus(); claw.reset(); }, 260);
  }
  const go = (d) => { cur = (cur + d + P.length) % P.length; render(); Sound.play("hover", 0.3); };
  $(".gallery-prev").addEventListener("click", () => go(-1));
  $(".gallery-next").addEventListener("click", () => go(1));
  $(".gallery-close").addEventListener("click", closeGallery);
  slots.forEach((s, i) => s.addEventListener("click", () => { if (i !== cur && !dragMoved) { cur = i; render(); } }));
  addEventListener("keydown", (e) => {
    if (gal.hidden) return;
    if (e.key === "Escape") closeGallery(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "Tab") { const f = [...gal.querySelectorAll("button")]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });
  let dragX = null, dragMoved = false;
  track.addEventListener("pointerdown", (e) => { if (e.target.closest("video") && e.offsetY > e.target.clientHeight - 50) return; dragX = e.clientX; dragMoved = false; });
  addEventListener("pointermove", (e) => { if (dragX === null) return; const dx = e.clientX - dragX; if (Math.abs(dx) > 6) { dragMoved = true; gal.classList.add("is-dragging"); track.style.setProperty("--drag", dx + "px"); } });
  addEventListener("pointerup", (e) => { if (dragX === null) return; const dx = e.clientX - dragX; dragX = null; gal.classList.remove("is-dragging"); track.style.setProperty("--drag", "0px"); if (Math.abs(dx) > 80) go(dx < 0 ? 1 : -1); setTimeout(() => (dragMoved = false), 0); });
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-open]"); if (t && !e.target.closest(".claw")) openGallery(t.dataset.open); });
  document.addEventListener("keydown", (e) => { const t = e.target.closest && e.target.closest(".project-media"); if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openGallery(t.dataset.open); } });

  /* ---------------- claw machine ---------------- */
  const clawSec = $(".claw"), box = $(".claw-box"), pile = $(".claw-pile"), arm = $(".claw-arm"), rope = $(".claw-rope"), label = $(".claw-label"), status = $(".claw-status");
  const ARM_OPEN = ["....XXXXX....", "....XHHHX....", "..XXXXXXXXX..", ".XX.......XX.", "XX.........XX", "X...........X", "XX.........XX", ".X.........X."];
  const ARM_SHUT = ["....XXXXX....", "....XHHHX....", "..XXXXXXXXX..", "..XX.....XX..", "...XX...XX...", "....X...X....", "....XX.XX....", ".....X.X....."];
  const armSVG = (g) => A.px(g, { X: "#ffffff", H: "#ceff00" });
  const claw = { x: 0.5, state: "idle", held: null, prizes: [], keys: {} };
  function thumb(p) { // tiny pixelated thumbnail canvas
    const c = document.createElement("canvas"); c.width = 32; c.height = 20; const ctx = c.getContext("2d"); const im = new Image();
    im.onload = () => { ctx.imageSmoothingEnabled = false; const s = Math.max(32 / im.width, 20 / im.height); ctx.drawImage(im, (32 - im.width * s) / 2, (20 - im.height * s) / 2, im.width * s, im.height * s); };
    im.src = img(p.media[0]); return c;
  }
  function buildPile() {
    pile.innerHTML = ""; claw.prizes = [];
    const W = box.clientWidth, H = box.clientHeight, chute = W * 0.14, cols = 7;
    const pw = Math.min(110, (W - chute - 20) / cols - 6), ph = pw * 0.62;
    P.forEach((p, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "claw-prize"; b.setAttribute("aria-label", "Open " + p.title); b.dataset.i = i;
      b.style.width = pw + "px"; b.style.height = ph + "px"; b.appendChild(thumb(p));
      const row = i < cols ? 0 : 1, col = i % cols;
      const x = chute + 14 + col * (pw + 6) + (row ? pw * 0.45 : 0) + (Math.random() * 8 - 4), y = H - 4 - (row + 1) * (ph + 4) + (Math.random() * 6 - 3);
      const pr = { el: b, i, x, y, w: pw, h: ph, r: Math.random() * 8 - 4 };
      place(pr); pile.appendChild(b); claw.prizes.push(pr);
      b.addEventListener("click", () => { if (claw.state === "idle") openGallery(i); });
    });
    box.style.setProperty("--chute-w", chute + "px");
  }
  const place = (pr) => (pr.el.style.transform = `translate(${pr.x}px, ${pr.y}px) rotate(${pr.r}deg)`);
  function drawArm(depth = 0) {
    const W = box.clientWidth, aw = arm.offsetWidth, x = 10 + claw.x * (W - aw - 20);
    arm.style.transform = `translate(${x}px, ${depth}px)`; rope.style.transform = `translateX(${x + aw / 2 - 1}px)`; rope.style.height = 10 + depth + "px";
    claw.px = x + aw / 2;
    if (claw.state === "idle") { const t = under(); label.textContent = t ? P[t.i].title : "Pick a project"; }
  }
  const under = () => claw.prizes.filter((p) => claw.px > p.x && claw.px < p.x + p.w).sort((a, b) => a.y - b.y)[0];
  const tween = (dur, fn) => new Promise((res) => { const t0 = performance.now(); const st = (t) => { const q = clamp((t - t0) / dur); fn(q); q < 1 ? requestAnimationFrame(st) : res(); }; requestAnimationFrame(st); });
  async function grab() {
    if (claw.state !== "idle") return;
    claw.state = "busy"; Sound.play("power");
    const H = box.clientHeight, target = under(), floor = H - arm.offsetHeight - 6;
    const depth = target ? target.y - arm.offsetHeight * 0.55 - 6 : floor;
    await tween(650, (q) => drawArm(depth * q));
    arm.innerHTML = armSVG(ARM_SHUT); await tween(160, () => {});
    if (target) { target.el.classList.add("is-held"); claw.held = target; status.textContent = "Grabbed " + P[target.i].title; Sound.play("coin"); }
    const ox = target ? target.x - claw.px : 0;
    await tween(600, (q) => { const d = depth * (1 - q); drawArm(d); if (target) { target.x = claw.px + ox; target.y = d + arm.offsetHeight * 0.55 + 6; place(target); } });
    if (!target) { arm.innerHTML = armSVG(ARM_OPEN); claw.state = "idle"; drawArm(0); Sound.play("hit"); status.textContent = "Missed — try again"; return; }
    const x0 = claw.x, W = box.clientWidth, aw = arm.offsetWidth, xc = (W * 0.07 - 10 - aw / 2) / (W - aw - 20);
    await tween(700, (q) => { claw.x = x0 + (Math.max(0, xc) - x0) * q; drawArm(0); target.x = claw.px + ox; place(target); });
    arm.innerHTML = armSVG(ARM_OPEN); Sound.play("close");
    const y0 = target.y; await tween(450, (q) => { target.y = y0 + (H - y0) * q * q; target.el.style.opacity = 1 - q * 0.6; place(target); });
    label.textContent = P[target.i].title;
    setTimeout(() => openGallery(target.i), 250);
  }
  claw.reset = () => { if (clawSec.hidden) return; claw.state = "idle"; claw.held = null; arm.innerHTML = armSVG(ARM_OPEN); buildPile(); drawArm(0); };
  let raf = 0, prevT = 0;
  function loop(t) {
    const dt = Math.min(50, t - (prevT || t)); prevT = t;
    if (claw.state === "idle") { const dir = (claw.keys.right ? 1 : 0) - (claw.keys.left ? 1 : 0); if (dir) { claw.x = clamp(claw.x + dir * dt * 0.0006); drawArm(0); } }
    raf = requestAnimationFrame(loop);
  }
  function setClaw(on) {
    clawSec.hidden = !on; root.classList.toggle("claw-mode", on);
    const b = $(".projects-claw-toggle"); b.classList.toggle("is-claw", on); b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? "Back to list" : "Switch to claw machine");
    try { sessionStorage.setItem("raka8:claw", on ? "1" : ""); } catch {}
    cancelAnimationFrame(raf);
    if (on) { arm.innerHTML = armSVG(ARM_OPEN); requestAnimationFrame(() => { buildPile(); drawArm(0); raf = requestAnimationFrame(loop); }); }
    Sound.play("switch");
  }
  $(".projects-claw-toggle").addEventListener("click", () => setClaw(clawSec.hidden));
  addEventListener("keydown", (e) => {
    if (clawSec.hidden || !gal.hidden || document.querySelector(".contact-modal[open]")) return;
    if (e.key === "ArrowLeft") { claw.keys.left = true; e.preventDefault(); }
    if (e.key === "ArrowRight") { claw.keys.right = true; e.preventDefault(); }
    if (e.key === " " || e.key === "Enter") { if (e.target.closest && e.target.closest(".claw-prize")) return; e.preventDefault(); grab(); }
  });
  addEventListener("keyup", (e) => { if (e.key === "ArrowLeft") claw.keys.left = false; if (e.key === "ArrowRight") claw.keys.right = false; });
  $$("[data-claw]").forEach((b) => {
    const k = b.dataset.claw;
    if (k === "grab") { b.addEventListener("click", grab); return; }
    const down = (e) => { e.preventDefault(); claw.keys[k] = true; b.classList.add("is-down"); };
    const up = () => { claw.keys[k] = false; b.classList.remove("is-down"); };
    b.addEventListener("pointerdown", down); b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up); b.addEventListener("pointercancel", up);
  });
  addEventListener("resize", () => { if (!clawSec.hidden && claw.state === "idle") { buildPile(); drawArm(0); } });
  try { if (sessionStorage.getItem("raka8:claw")) setClaw(true); } catch {}
})();
