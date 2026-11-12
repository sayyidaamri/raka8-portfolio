/* RAKA'8 — "Pixel Dash": an original mini runner.
   Rule: obstacles in your current mode colour are harmless (you phase through them); the other colour must be jumped,
   zapped (D, dev power) or floated over (C, creative power). Coins refill the matching power. */
(function () {
  const A = window.ART, K = window.CORE;
  const { $, $$, clamp, Sound, store } = K;
  K.logos(); K.gridTrail(); K.contactModal(); K.soundButtons(); K.blips();
  $$(".projects-nav-arrow").forEach((el) => (el.innerHTML = A.icon("arrow")));
  $(".cm-close", $("#scoreModal")).innerHTML = A.icon("close");
  $$("[data-goto-mode]").forEach((a) => a.addEventListener("click", () => { try { sessionStorage.setItem("raka8:mode", a.dataset.gotoMode); } catch {} }));

  /* ---------------- sprites ---------------- */
  function sprite(grid, pal, u = 1) {
    const h = grid.length, w = Math.max(...grid.map((r) => r.length));
    const c = document.createElement("canvas"); c.width = w * u; c.height = h * u; const x = c.getContext("2d");
    grid.forEach((row, y) => [...row].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i * u, y * u, u, u); } }));
    return c;
  }
  const BUG = ["X.......X", ".X.XXX.X.", "..XXXXX..", "XXXKXKXXX", "..XXXXX..", ".XXXXXXX.", "X.X...X.X"];
  const BLOB = ["...XX...", "..XXXX..", ".XXXXXX.", "XXXKXKXX", "XXXXXXXX", "XXXXXXXX", ".XXXXXX.", "..XXXX.."];
  const SPR = {
    dev: sprite(BUG, { X: "#ceff00", K: "#121212" }), creative: sprite(BLOB, { X: "#ff4fa3", K: "#121212" }),
    pDev: sprite(A.mini, A.miniPal.dev), pCre: sprite(A.mini, A.miniPal.creative),
  };

  /* ---------------- canvas ---------------- */
  const cv = $("#gameCanvas"), ctx = cv.getContext("2d"), wrap = $("#game-canvas-wrap");
  const VH = 270; let S = 1, VW = 480;
  function fit() {
    const r = wrap.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d));
    S = cv.height / VH; VW = cv.width / S; ctx.imageSmoothingEnabled = false;
  }
  new ResizeObserver(fit).observe(wrap); fit();
  const GROUND = 226;

  /* ---------------- state ---------------- */
  const g = {};
  function reset() {
    Object.assign(g, { state: "ready", t: 0, speed: 120, dist: 0, coins: 0, score: 0, mode: "dev", switchCd: 0, powerCd: 0, pips: { dev: 3, creative: 3 },
      float: 0, beam: 0, obs: [], coinList: [], parts: [], spawn: 1.2, coinSpawn: 2, py: GROUND, vy: 0, onGround: true, tips: {} });
    hud(); setTip(null);
  }
  const PX = 64, PW = 14 * 1.5, PH = 28 * 1.5;

  /* ---------------- HUD ---------------- */
  function hud() {
    $("#hud-mode").textContent = g.mode === "dev" ? "Developer" : "Creative";
    document.body.dataset.gmode = g.mode;
    $("#hud-switch").textContent = g.switchCd > 0 ? g.switchCd.toFixed(1) + "s" : "Ready";
    $("#hud-cd").textContent = g.powerCd > 0 ? g.powerCd.toFixed(1) + "s" : "Ready";
    ["dev", "creative"].forEach((k) => $$(`#hud-${k} i`).forEach((p, i) => p.classList.toggle("is-empty", i >= g.pips[k])));
    $("#hud-score").textContent = "Score " + Math.floor(g.score);
  }
  let tutorial = store.get("tutorial", true);
  const tipEl = $("#game-tip"); let tipT = 0;
  function setTip(txt, ms = 2600) { clearTimeout(tipT); if (!txt || !tutorial) { tipEl.hidden = true; return; } tipEl.textContent = txt; tipEl.hidden = false; tipT = setTimeout(() => (tipEl.hidden = true), ms); }
  const tipOnce = (k, txt, ms) => { if (!g.tips[k]) { g.tips[k] = 1; setTip(txt, ms); } };
  const tBtn = $("#tutorial-toggle");
  const syncTut = () => { tBtn.classList.toggle("is-on", tutorial); tBtn.setAttribute("aria-pressed", tutorial); $(".tutorial-state", tBtn).textContent = tutorial ? "ON" : "OFF"; };
  tBtn.addEventListener("click", () => { tutorial = !tutorial; store.set("tutorial", tutorial); syncTut(); if (!tutorial) setTip(null); Sound.play("click"); }); syncTut();

  /* ---------------- actions ---------------- */
  function start() { if (g.state === "ready") { g.state = "run"; Sound.play("open"); tipOnce("jump", "Space to jump over obstacles", 2400); } }
  function jump() {
    if (g.state === "over") { reset(); return; }
    if (g.state === "ready") { start(); }
    if (g.onGround) { g.vy = -330; g.onGround = false; Sound.play("jump", 0.25); }
  }
  function switchMode() {
    if (g.state !== "run" || g.switchCd > 0) return;
    g.mode = g.mode === "dev" ? "creative" : "dev"; g.switchCd = 1.2; Sound.play("switch");
    burst(PX + PW / 2, g.py - PH / 2, g.mode === "dev" ? "#ceff00" : "#ff4fa3", 14); hud();
  }
  function power(kind) {
    if (g.state !== "run" || g.powerCd > 0 || g.pips[kind] <= 0) { if (g.state === "run") Sound.play("hit", 0.15); return; }
    g.pips[kind]--; g.powerCd = 2; Sound.play("power");
    if (kind === "dev") { g.beam = 0.35; g.obs.forEach((o) => { if (o.x > PX && o.x < PX + 260) { o.dead = true; burst(o.x + o.w / 2, o.y - o.h / 2, "#ceff00", 18); } }); }
    else { g.float = 3; }
    hud();
  }
  function burst(x, y, col, n) { for (let i = 0; i < n; i++) g.parts.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.8) * 220, life: 0.6, col }); }

  addEventListener("keydown", (e) => {
    if (!$("#scoreModal").hidden || document.querySelector(".contact-modal[open]")) return;
    if (e.target.matches && e.target.matches("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "arrowup" || k === "w") { e.preventDefault(); jump(); }
    else if (k === "s") switchMode(); else if (k === "d") power("dev"); else if (k === "c") power("creative");
  });
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); cv.focus(); jump(); });
  $$("#game-controls [data-act]").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); const a = b.dataset.act; if (a === "jump") jump(); else if (a === "switch") { start(); switchMode(); } else power(g.mode); }));

  /* ---------------- loop ---------------- */
  let prev = performance.now();
  function step(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (g.state === "run") update(dt);
    else if (g.state === "over") g.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt; });
    draw(now);
    requestAnimationFrame(step);
  }
  function update(dt) {
    g.t += dt; g.speed = Math.min(330, 120 + g.t * 4.2); g.dist += g.speed * dt;
    g.switchCd = Math.max(0, g.switchCd - dt); g.powerCd = Math.max(0, g.powerCd - dt); g.float = Math.max(0, g.float - dt); g.beam = Math.max(0, g.beam - dt);
    // player
    const grav = g.float > 0 ? 260 : 900;
    g.vy += grav * dt; g.py += g.vy * dt;
    if (g.float > 0 && g.py > GROUND - 70 && g.vy > 0) g.vy = Math.min(g.vy, 30);
    if (g.py >= GROUND) { g.py = GROUND; g.vy = 0; g.onGround = true; }
    // spawn
    g.spawn -= dt;
    if (g.spawn <= 0) {
      const kind = Math.random() < 0.5 ? "dev" : "creative", u = 3 + (Math.random() < 0.3 ? 1 : 0), spr = SPR[kind];
      const stack = g.t > 20 && Math.random() < 0.25 ? 2 : 1;
      g.obs.push({ kind, x: VW + 20, w: spr.width * u, h: spr.height * u * stack, u, stack, y: GROUND });
      g.spawn = Math.max(0.55, 1.5 - g.t * 0.012) + Math.random() * 0.8;
      if (g.obs.length === 1 && kind !== g.mode) tipOnce("color", `${kind === "dev" ? "Lime bug" : "Pink blob"}! Jump, or press S to switch mode`, 3000);
      if (g.t > 12) tipOnce("power", "D zaps bugs ahead · C lets you float for 3s", 3200);
    }
    g.coinSpawn -= dt;
    if (g.coinSpawn <= 0) { g.coinList.push({ x: VW + 10, y: GROUND - 60 - Math.random() * 70, kind: Math.random() < 0.5 ? "dev" : "creative" }); g.coinSpawn = 1.4 + Math.random() * 1.6; }
    const dx = g.speed * dt;
    g.obs.forEach((o) => (o.x -= dx)); g.coinList.forEach((c) => (c.x -= dx));
    g.obs = g.obs.filter((o) => o.x + o.w > -20 && !o.dead); g.coinList = g.coinList.filter((c) => c.x > -20 && !c.got);
    // collisions
    const px1 = PX + 4, px2 = PX + PW - 4, py1 = g.py - PH + 4, py2 = g.py;
    for (const o of g.obs) {
      if (o.kind === g.mode) continue; // phase through own colour
      if (px2 > o.x + 3 && px1 < o.x + o.w - 3 && py2 > o.y - o.h + 3) { gameOver(); return; }
    }
    for (const c of g.coinList) if (px2 > c.x - 5 && px1 < c.x + 5 && py2 > c.y - 5 && py1 < c.y + 5) {
      c.got = true; g.coins++; g.pips[c.kind] = Math.min(3, g.pips[c.kind] + 1); Sound.play("coin", 0.25); burst(c.x, c.y, c.kind === "dev" ? "#ceff00" : "#ff4fa3", 8);
    }
    g.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt; }); g.parts = g.parts.filter((p) => p.life > 0);
    g.score = g.dist * 0.1 + g.coins * 50;
    hud();
  }
  function gameOver() {
    g.state = "over"; Sound.play("hit", 0.5); burst(PX + PW / 2, g.py - PH / 2, "#ffffff", 30); hud();
    if (g.score >= 1) setTimeout(() => openScore(Math.floor(g.score)), 700);
  }

  function draw(now) {
    ctx.setTransform(S, 0, 0, S, 0, 0); ctx.clearRect(0, 0, VW, VH);
    // parallax pixel skyline + stars
    const off = g.dist || 0;
    ctx.fillStyle = "#1b1b1b";
    for (let i = 0; i < 40; i++) { const bw = 26 + ((i * 37) % 30), bh = 30 + ((i * 53) % 70), x = ((i * 60 - off * 0.2) % (VW + 120) + VW + 120) % (VW + 120) - 60; ctx.fillRect(Math.round(x), GROUND - bh, bw, bh); }
    ctx.fillStyle = "#2a2a2a";
    for (let i = 0; i < 50; i++) { const x = ((i * 97 - off * 0.05) % VW + VW) % VW, y = (i * 61) % (GROUND - 90) + 10; ctx.fillRect(Math.round(x), y, 2, 2); }
    // ground
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, GROUND, VW, 2);
    ctx.fillStyle = "#3a3a3a"; for (let x = -((off) % 24); x < VW; x += 24) ctx.fillRect(Math.round(x), GROUND + 8, 10, 2);
    // coins
    for (const c of g.coinList) { const b = Math.sin(now / 180 + c.x) * 2; ctx.fillStyle = c.kind === "dev" ? "#ceff00" : "#ff4fa3"; ctx.fillRect(Math.round(c.x - 4), Math.round(c.y - 4 + b), 8, 8); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(c.x - 2), Math.round(c.y - 2 + b), 2, 2); }
    // obstacles
    for (const o of g.obs) {
      const spr = SPR[o.kind]; ctx.globalAlpha = o.kind === g.mode ? 0.3 : 1;
      for (let s = 0; s < o.stack; s++) ctx.drawImage(spr, Math.round(o.x), Math.round(o.y - (s + 1) * spr.height * o.u), spr.width * o.u, spr.height * o.u);
      ctx.globalAlpha = 1;
    }
    // beam
    if (g.beam > 0) { ctx.fillStyle = "#ceff00"; ctx.globalAlpha = g.beam / 0.35; ctx.fillRect(PX + PW, Math.round(g.py - PH * 0.6), 260, 4); ctx.globalAlpha = 1; }
    // player
    const bob = g.state === "run" && g.onGround ? (Math.floor(now / 110) % 2) * 1.5 : 0;
    const spr = g.mode === "dev" ? SPR.pDev : SPR.pCre;
    if (g.float > 0) { ctx.fillStyle = "#ff4fa3"; ctx.globalAlpha = 0.35 + 0.2 * Math.sin(now / 90); ctx.fillRect(PX - 4, Math.round(g.py - PH - 4), PW + 8, PH + 8); ctx.globalAlpha = 1; }
    if (g.state !== "over" || Math.floor(now / 120) % 2) ctx.drawImage(spr, PX, Math.round(g.py - PH - bob), PW, PH);
    // particles
    for (const p of g.parts) { ctx.globalAlpha = clamp(p.life / 0.6); ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); }
    ctx.globalAlpha = 1;
    // overlays
    ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.font = "13px Pixel, monospace";
    if (g.state === "ready") ctx.fillText(matchMedia("(pointer: coarse)").matches ? "Tap to Start" : "Click to Start", VW / 2, VH / 2 - 10);
    if (g.state === "over") { ctx.font = "22px Pixel, monospace"; ctx.fillText("GAME OVER", VW / 2, VH / 2 - 26); ctx.font = "12px Pixel, monospace"; ctx.fillText("Space / tap to try again", VW / 2, VH / 2 - 6); }
  }

  /* ---------------- leaderboard ---------------- */
  const SEED = [["pixelpuff", 12880], ["mira.dev", 6120], ["RKP", 4650], ["nanobyte", 3110], ["Juno", 2875], ["kopi_tubruk", 1960], ["Ari", 1720], ["glitchcat", 1405], ["Zed", 990], ["bea", 512]];
  function board(highlight) {
    const mine = store.get("scores", []);
    const all = [...SEED.map(([n, s]) => ({ n, s })), ...mine].sort((a, b) => b.s - a.s).slice(0, 15);
    $("#leaderboard-list").innerHTML = all.map((r) => `<li class="${highlight && r.id === highlight ? "is-you" : ""}"><span class="lb-name">${r.n.replace(/[<>&"]/g, "")}</span><span class="lb-score">${r.s}</span></li>`).join("");
  }
  board();
  $(".lb-bar").innerHTML = K.barHTML(); K.pixBar($("#leaderboard-list"), $(".lb-bar .pix-bar"));

  /* ---------------- score modal ---------------- */
  const modal = $("#scoreModal"), form = $("#score-form"), status = $(".form-status", modal);
  function openScore(score) {
    $("#final-score").textContent = score; modal.hidden = false; modal.dataset.score = score; status.hidden = true;
    document.documentElement.classList.add("popup-open"); Sound.play("open");
    const n = $("#nickname"); n.value = store.get("nick", ""); setTimeout(() => n.focus(), 50);
  }
  function closeScore() { modal.hidden = true; document.documentElement.classList.remove("popup-open"); Sound.play("close"); cv.focus(); }
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-score-close]")) closeScore(); });
  modal.addEventListener("keydown", (e) => { if (e.key === "Escape") closeScore(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = $("#nickname"), v = n.value.trim();
    if (!v) { n.classList.add("is-invalid"); status.hidden = false; status.className = "form-status is-err"; status.innerHTML = A.icon("err") + "<p>Please enter a nickname.</p>"; n.focus(); return; }
    const btn = $(".cm-submit", form); btn.classList.add("is-loading");
    setTimeout(() => {
      btn.classList.remove("is-loading");
      const id = Date.now(); const mine = store.get("scores", []); mine.push({ n: v.slice(0, 12), s: +modal.dataset.score, id }); store.set("scores", mine); store.set("nick", v);
      board(id); status.hidden = false; status.className = "form-status is-ok"; status.innerHTML = A.icon("ok") + "<p>Score saved! Check the board.</p>"; Sound.play("coin");
      setTimeout(closeScore, 1100);
    }, 600);
  });
  $("#nickname").addEventListener("input", (e) => e.target.classList.remove("is-invalid"));

  reset(); requestAnimationFrame(step);
})();
