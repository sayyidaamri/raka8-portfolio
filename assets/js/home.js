/* RAKA'8 — home page: loader, intro, modes, chomper nav, scroll-driven scenes. */
(function () {
  const A = window.ART, K = window.CORE;
  const { $, $$, clamp, Sound, scramble, hideNow, split, reduce } = K;
  const root = document.documentElement;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const isMobile = () => innerWidth <= 767;
  let mode = (() => { try { return sessionStorage.getItem("raka8:mode") || "dev"; } catch { return "dev"; } })();

  /* ---------------- static art injection ---------------- */
  K.logos();
  $$("[data-icon]").forEach((el) => (el.innerHTML = A.icon(el.dataset.icon)));
  $$(".selection-arrow").forEach((el) => (el.innerHTML = A.icon("arrow")));
  $$(".mode-arrow").forEach((el) => (el.innerHTML = A.px(["X......", "XX.....", "XXX....", "XXXX...", "XXXXX..", "XXXXXX.", "XXXXXXX", "XXXXXX.", "XXXXX..", "XXXX...", "XXX....", "XX.....", "X......"], { X: "currentColor" })));
  const tail = A.px(["WKW", "WKW", "WW.", "W.."], { W: "#fff", K: "#121212" }, { attrs: 'preserveAspectRatio="none"' });
  $$(".bubble-tail").forEach((el) => (el.innerHTML = tail));
  $("#about-hearts").innerHTML = [0, 1, 2].map(() => A.px(A.heart, A.heartPal)).join("");
  $$("#about-hearts svg")[2].classList.add("heart-beat");
  $(".brain-l").innerHTML = A.px(A.brainL, A.brainPal);
  $(".brain-r").innerHTML = A.px(A.mirror(A.brainL), A.brainPal);
  $$(".card").forEach((c) => (c.innerHTML = A.px(A.card, A.cardPal, { attrs: 'preserveAspectRatio="none"' })));
  $(".g-frame").innerHTML = A.px(A.glasses, A.glassesPal);
  $("#hand-left").innerHTML = A.px(A.handL, A.handLPal);
  $("#hand-right").innerHTML = A.px(A.handR, A.handRPal);
  const food = A.px(A.chomp.food, { X: "currentColor" });
  $$(".section-nav-food").forEach((a) => (a.innerHTML = food));
  const chompOpen = A.px(A.chomp.open, { X: "currentColor" }), chompClosed = A.px(A.chomp.closed, { X: "currentColor" });
  const chomper = $(".section-nav-chomper"); chomper.innerHTML = chompOpen;
  const spark = $("#hands-spark");
  for (let i = 0; i < 10; i++) { const s = document.createElement("i"); const a = (i / 10) * Math.PI * 2; s.style.setProperty("--sx", Math.cos(a) * 70 + "px"); s.style.setProperty("--sy", Math.sin(a) * 70 + "px"); s.style.animationDelay = -i * 0.06 + "s"; spark.appendChild(s); }

  function renderMode(animate) {
    $("#hero-avatar").innerHTML = A.px(A.avatar, A.avatarPal[mode], { attrs: 'preserveAspectRatio="xMidYMax meet"' });
    $("#character-mode").innerHTML = A.px(A.mini, A.miniPal[mode]);
    $$("#hero-modes .selection-button").forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on); });
    $(".mode-arrow-prev").disabled = mode === "dev";
    $(".mode-arrow-next").disabled = mode === "creative";
    $("#about-mode-title").textContent = mode === "dev" ? "Developer Mode" : "Creative Mode";
    document.body.dataset.mode = mode;
    const txt = mode === "dev"
      ? "I’m a developer who writes tidy code, ships with intent, and obsesses over structure, motion, and real-world speed on every device."
      : "I’m a designer who tells stories with pixels, mixing color, motion, and play to craft interfaces that feel alive and personal.";
    const el = $("#about-mode-text");
    if (animate) K.swapText(el, txt, 800); else { el._chars = null; el.textContent = txt; split(el); if (el._mode !== "in") hideNow(el); }
  }
  function setMode(m) {
    if (m === mode) return;
    mode = m; try { sessionStorage.setItem("raka8:mode", m); } catch {}
    Sound.play("switch");
    const ch = $("#character-mode"); ch.classList.add("is-walking"); setTimeout(() => ch.classList.remove("is-walking"), 700);
    const av = $("#hero-avatar"); wipe(av, 450);
    renderMode(true);
  }
  $$("#hero-modes .selection-button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  $(".mode-arrow-prev").addEventListener("click", () => setMode("dev"));
  $(".mode-arrow-next").addEventListener("click", () => setMode("creative"));
  $("#hero-modes").addEventListener("keydown", (e) => { if (/Arrow(Up|Down|Left|Right)/.test(e.key)) { e.preventDefault(); setMode(mode === "dev" ? "creative" : "dev"); $(`#hero-modes [data-mode="${mode}"]`).focus(); } });

  /* avatar wipe: column-by-column reveal with a lime scan line */
  function wipe(el, dur = 800) {
    if (reduce) return;
    const svg = el.querySelector("svg"); if (!svg) return;
    const t0 = performance.now();
    let bar = el.querySelector(".scanbar");
    if (!bar) { bar = document.createElement("i"); bar.className = "scanbar"; Object.assign(bar.style, { position: "absolute", top: 0, bottom: 0, width: "3.2%", background: "#ceff00", mixBlendMode: "difference", pointerEvents: "none" }); el.style.position = "relative"; el.appendChild(bar); }
    const step = (t) => {
      const q = clamp((t - t0) / dur), cols = Math.round(q * 32) / 32;
      svg.style.clipPath = `inset(0 ${100 - cols * 100}% 0 0)`;
      bar.style.left = cols * 100 + "%"; bar.style.display = q < 1 ? "block" : "none";
      if (q < 1) requestAnimationFrame(step); else svg.style.clipPath = "";
    };
    requestAnimationFrame(step);
  }

  /* ---------------- loader + intro ---------------- */
  const heroTexts = ["#hero-title", "#hero-lead", ...$$("#hero-modes .selection-text")].map((s) => (typeof s === "string" ? $(s) : s));
  $$("[data-scramble]").forEach((el) => { split(el); hideNow(el); });
  renderMode(false);

  function intro() {
    root.classList.add("is-ready");
    wipe($("#hero-avatar"), 900);
    heroTexts.forEach((el, i) => setTimeout(() => scramble(el, "in", 1200), 250 + i * 120));
    setTimeout(greetLoop, 1300);
    setTimeout(ring, 3400);
    K.autoReveal($("#about"));
  }
  const loader = $("#loader");
  if (root.classList.contains("no-loader") || reduce) { loader.remove(); intro(); }
  else {
    const box = $(".loader-icons", loader); let n = 0;
    const show = () => { box.innerHTML = [0, 1, 2].map((i) => A.px(A.glyphs[(Math.random() * A.glyphs.length) | 0], { X: i === 1 ? "#ceff00" : "#ffffff" })).join(""); };
    show(); const iv = setInterval(() => { show(); if (++n > 9) { clearInterval(iv); loader.classList.add("is-done"); setTimeout(() => loader.remove(), 450); intro(); } }, 220);
    try { sessionStorage.setItem("raka8:seen", "1"); } catch {}
  }

  /* greeting typewriter */
  const GREETS = ["Hello", "I'm Raka", "Halo", "Hola", "Bonjour", "Ciao", "Hej"];
  function greetLoop() {
    const out = $(".greet-text"); let w = 0;
    const type = (s, i = 0) => { out.textContent = s.slice(0, i); if (i < s.length) setTimeout(() => type(s, i + 1), 110); else setTimeout(() => del(s, s.length), 1700); if (i && i % 2) Sound.play("type", 0.06); };
    const del = (s, i) => { out.textContent = s.slice(0, i); if (i > 0) setTimeout(() => del(s, i - 1), 55); else { w = (w + 1) % GREETS.length; setTimeout(() => type(GREETS[w]), 300); } };
    const b = $("#hero-bubble"); b.style.setProperty("--float-dur", rand(3.2, 4.2).toFixed(2) + "s"); b.style.setProperty("--float-delay", -rand(0, 3).toFixed(2) + "s");
    out.textContent = ""; type(GREETS[0]);
  }
  function ring() {
    const p = $("#home-phone"); p.classList.add("is-ringing"); setTimeout(() => p.classList.remove("is-ringing"), 2100);
    setTimeout(ring, 25000);
  }

  /* ---------------- core modules ---------------- */
  K.gridTrail(); K.contactModal(); K.soundButtons(); K.blips();
  Sound.wantMusic = true; if (Sound.on) addEventListener("pointerdown", () => Sound.syncMusic(), { once: true });

  /* ---------------- sections & chomper nav ---------------- */
  const sections = $$(".section-nav-food").map((a) => $("#" + a.dataset.section));
  const foods = $$(".section-nav-food");
  let current = 0, lastY = scrollY, chompT = 0;
  const secTop = (s) => s.getBoundingClientRect().top + scrollY;
  function updateNav() {
    const y = scrollY + innerHeight * 0.4;
    let idx = 0; sections.forEach((s, i) => { if (secTop(s) <= y) idx = i; });
    const dir = scrollY >= lastY ? 1 : -1; lastY = scrollY;
    if (idx !== current) {
      current = idx;
      chomper.style.setProperty("--face", dir > 0 ? "90deg" : "-90deg");
      chomper.innerHTML = chompClosed; clearTimeout(chompT); chompT = setTimeout(() => (chomper.innerHTML = chompOpen), 180);
      if (current) Sound.play("coin", 0.12);
    }
    chomper.style.transform = `translateY(${current * (isMobile() ? 34 : 40)}px)`;
    foods.forEach((f, i) => { f.classList.toggle("is-eaten", i <= current); f.classList.toggle("is-current", i === current); });
  }
  const goto = (i) => { const s = sections[i]; window.scrollTo({ top: i === 0 ? 0 : secTop(s), behavior: reduce ? "auto" : "smooth" }); };
  foods.forEach((f, i) => f.addEventListener("click", (e) => { e.preventDefault(); goto(i); }));
  chomper.addEventListener("click", () => goto(current >= sections.length - 1 ? 0 : current + 1));

  /* ---------------- text windows (scramble by progress) ---------------- */
  function textWin(el, p, a, b = 2) {
    const vis = p >= a && p <= b;
    if (vis && el._mode !== "in") scramble(el, "in", 1000);
    else if (!vis && el._mode === "in") scramble(el, "out", 600);
  }
  const progress = (sec) => { const r = sec.getBoundingClientRect(); const len = r.height - innerHeight; return clamp(-r.top / Math.max(1, len)); };
  const visible = (sec) => { const r = sec.getBoundingClientRect(); return r.bottom > -50 && r.top < innerHeight + 50; };

  /* canvas helper */
  function cnv(el) {
    const ctx = el.getContext("2d");
    const o = { el, ctx, w: 0, h: 0, fit() { const d = Math.min(2, devicePixelRatio || 1), r = el.getBoundingClientRect(); if (Math.round(r.width) !== o.w || Math.round(r.height) !== o.h) { o.w = Math.round(r.width); o.h = Math.round(r.height); el.width = o.w * d; el.height = o.h * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.imageSmoothingEnabled = false; } } };
    return o;
  }

  /* ---- ABOUT: mini character drops in ---- */
  const about = $("#about");
  function sceneAbout() {
    const r = about.getBoundingClientRect();
    const q = clamp((innerHeight - r.top) / (innerHeight * 1.1));
    $("#character-mode").style.setProperty("--drop", (-(1 - ease(q)) * 340).toFixed(1) + "px");
    about.classList.toggle("is-in", r.top < innerHeight * 0.35 && r.bottom > innerHeight * 0.3);
  }

  /* ---- PIXELS ---- */
  const pix = { sec: $("#pixels"), c: cnv($("#pixels-canvas")), cells: null, h2: $("#pixels h2"), lead: $("#pixels .pin-lead"), dot: $("#pixels-dot") };
  function scenePixels(p) {
    const { c } = pix; c.fit();
    const S = 23, cols = Math.ceil(c.w / S), rows = Math.ceil(c.h / S);
    if (!pix.cells || pix.cells.cols !== cols || pix.cells.rows !== rows) {
      const arr = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const d = Math.abs((x + 0.5) / cols - 0.5) * 2; // 0 centre, 1 edge
        arr.push({ x, y, d, r: Math.random(), a: rand(0.12, 1), g: Math.random() < 0.25 });
      }
      pix.cells = Object.assign(arr, { cols, rows });
    }
    const { ctx } = c; ctx.clearRect(0, 0, c.w, c.h);
    const grow = clamp((p - 0.28) / 0.45), fade = clamp((p - 0.8) / 0.18);
    for (const k of pix.cells) {
      const thr = 1 - k.d; // edge cells first
      const v = grow * 1.25 - thr * 0.9 - k.r * 0.35;
      if (v <= 0 || k.r < fade) continue;
      ctx.globalAlpha = Math.min(1, v * 2) * k.a * (1 - fade * 0.3);
      ctx.fillStyle = k.g ? "#4f6a00" : "#ceff00";
      ctx.fillRect(k.x * S, k.y * S, S, S);
    }
    ctx.globalAlpha = 1;
    textWin(pix.h2, p, 0.0, 0.62); textWin(pix.lead, p, 0.08, 0.8);
    pix.dot.style.opacity = p > 0.9 ? 0 : 1;
  }

  /* ---- IDEAS: head assembles from scattered pixels ---- */
  const ideas = { sec: $("#ideas"), c: cnv($("#ideas-canvas")), pts: null, h2: $("#ideas-copy h2"), lead: $("#ideas-copy p"), t: 0 };
  (() => { const pts = []; A.head.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "Q" || ch === "K") pts.push({ x, y, k: ch, sx: Math.random(), sy: Math.random(), d: Math.random() * 0.3 }); })); ideas.pts = pts;
    ideas.stream = []; for (let y = 2; y <= 10; y++) for (let x = 7; x <= 18; x++) { const dx = (x - 12.5) / 6, dy = (y - 6) / 4.5; if (dx * dx + dy * dy <= 1 && Math.random() < 0.82) ideas.stream.push({ bx: x, by: y, t: Math.random(), o: Math.random(), dark: Math.random() < 0.3 }); } })();
  function sceneIdeas(p, now) {
    const { c } = ideas; c.fit(); const { ctx } = c; ctx.clearRect(0, 0, c.w, c.h);
    const s = Math.floor(Math.min((c.w * (isMobile() ? 0.9 : 0.48)) / 24, (c.h * 0.66) / 25));
    const ox = Math.round(c.w / 2 - (24 * s) / 2 + (isMobile() ? 0 : c.w * 0.04)), oy = c.h - 25 * s;
    for (const pt of ideas.pts) {
      const k = ease(clamp((p * 1.6 - pt.d) / 0.55));
      const x = lerp(pt.sx * c.w, ox + pt.x * s, k), y = lerp(pt.sy * c.h, oy + pt.y * s, k);
      ctx.fillStyle = pt.k === "K" ? "#121212" : "#efe6d0";
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
    // lime 'thoughts' gather into a brain inside the head
    const q = ease(clamp((p - 0.3) / 0.4));
    if (q > 0) {
      for (const st of ideas.stream) {
        const tx = ox + st.bx * s, ty = oy + st.by * s;
        const x = lerp(-60 + st.t * c.w * 0.3, tx, q), y = lerp(c.h * (0.2 + st.t * 0.6), ty, q);
        const flick = Math.sin(now / 160 + st.o * 9) > 0.6 ? 0.55 : 1;
        ctx.globalAlpha = flick; ctx.fillStyle = st.dark ? "#6b8400" : "#ceff00";
        ctx.fillRect(Math.round(x), Math.round(y), s, s);
      }
      ctx.globalAlpha = 1;
    }
    textWin(ideas.h2, p, 0.2, 2); textWin(ideas.lead, p, 0.3, 2);
  }

  /* ---- BRAIN ---- */
  const brain = { sec: $("#brain"), out: $(".bt-text"), art: $("#brain-art"), words: ["Idea", "Sketch", "Build", "Launch"] };
  function sceneBrain(p) {
    const w = brain.art.offsetWidth;
    const open = ease(clamp((p - 0.08) / 0.2)), exit = ease(clamp((p - 0.88) / 0.12));
    const split = open * w * (isMobile() ? 0.14 : 0.2) + exit * innerWidth * 0.6;
    brain.art.style.setProperty("--split", split.toFixed(1));
    const tp = clamp((p - 0.22) / 0.64) * brain.words.length;
    const wi = Math.min(brain.words.length - 1, Math.floor(tp)), q = tp - wi;
    const word = brain.words[wi];
    const n = q < 0.7 ? Math.round(clamp(q / 0.45) * word.length) : Math.round(clamp((1 - q) / 0.3) * word.length);
    const showN = wi === brain.words.length - 1 && q >= 0.7 ? word.length : n;
    if (brain.out.textContent !== word.slice(0, showN)) { brain.out.textContent = word.slice(0, showN); Sound.play("type", 0.05); }
    $("#brain-typing").style.setProperty("--type-o", open > 0.5 && exit < 0.5 ? 1 : 0);
  }

  /* ---- DNA helix ---- */
  const dna = { sec: $("#dna"), c: cnv($("#dna-canvas")), h2: $("#dna-copy h2"), lead: $("#dna-copy p") };
  function sceneDna(p, now) {
    const { c } = dna; c.fit(); const { ctx } = c; ctx.clearRect(0, 0, c.w, c.h);
    const s = isMobile() ? 12 : 16, cx = Math.round(c.w / 2 / s) * s - s, A2 = isMobile() ? 9 : 11;
    const enter = ease(clamp(p / 0.2)), leave = ease(clamp((p - 0.85) / 0.15));
    const offY = (1 - enter) * c.h - leave * c.h;
    const rows = Math.ceil(c.h / s) + 2, phase = p * 14 + now * 0.0006;
    const strands = [];
    for (let r = 0; r < rows; r++) {
      const y = r * s + offY; if (y < -s || y > c.h) continue;
      const ph = r * 0.16 + phase;
      const a = Math.sin(ph) * A2, z = Math.cos(ph);
      const x1 = Math.round(a), x2 = -Math.round(a);
      strands.push({ y, x1, x2, z });
    }
    const draw = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(cx + x * s, Math.round(y), s * 3, s); };
    for (const st of strands) { // back strand
      if (st.z < 0) draw(st.x1, st.y, "#7a1f1f"); else draw(st.x2, st.y, "#7a1f1f");
    }
    strands.forEach((st, i) => { // rungs
      if (i % 2) return;
      const l = Math.min(st.x1, st.x2) + 3, rr = Math.max(st.x1, st.x2);
      for (let x = l; x < rr; x++) { if ((x + i) % 7 === 0) continue; ctx.fillStyle = (x + (i >> 1)) % 5 === 0 ? "#121212" : "#ffffff"; ctx.fillRect(cx + x * s, Math.round(st.y), s, s); }
    });
    for (const st of strands) { if (st.z >= 0) draw(st.x1, st.y, "#e53935"); else draw(st.x2, st.y, "#e53935"); }
    textWin(dna.h2, p, 0.28, 0.92); textWin(dna.lead, p, 0.34, 0.92);
  }

  /* ---- EMOTION cards ---- */
  const emo = { sec: $("#emotion"), cards: $$(".card"), title: $("#emotion-title"), lead: $("#emotion-lead") };
  function sceneEmotion(p) {
    const inn = ease(clamp(p / 0.25)), fan = ease(clamp((p - 0.25) / 0.35)), flip = ease(clamp((p - 0.62) / 0.25)), out = ease(clamp((p - 0.9) / 0.1));
    const m = isMobile() ? 0.6 : 1;
    const conf = [
      { r: -14 * fan - 8 * flip, tx: -110 * fan * m, ty: 20 * fan },
      { r: -4 * fan + 6 * flip, tx: -30 * fan * m + 60 * flip * m, ty: -10 * fan },
      { r: 6 * fan + 70 * flip, tx: 40 * fan * m + 110 * flip * m, ty: -40 * flip },
    ];
    emo.cards.forEach((cd, i) => {
      const k = conf[i];
      cd.style.setProperty("--r", k.r.toFixed(2) + "deg");
      cd.style.setProperty("--tx", k.tx.toFixed(1) + "px");
      cd.style.setProperty("--ty", (k.ty + (1 - inn) * (innerHeight + i * 120) - out * (innerHeight + 200)).toFixed(1) + "px");
    });
    textWin(emo.title, p, 0.2, 0.95); textWin(emo.lead, p, 0.3, 0.95);
  }

  /* ---- BEAUTY glasses ---- */
  const beauty = { sec: $("#beauty"), title: $("#beauty-title"), lead: $("#beauty-lead"), g: $("#beauty-glasses"), eyes: $$(".g-eye") };
  let mouse = { x: 0.5, y: 0.5 };
  addEventListener("pointermove", (e) => (mouse = { x: e.clientX / innerWidth, y: e.clientY / innerHeight }), { passive: true });
  setInterval(() => { beauty.eyes.forEach((e) => e.classList.add("is-blink")); setTimeout(() => beauty.eyes.forEach((e) => e.classList.remove("is-blink")), 140); }, 3600);
  function sceneBeauty(p) {
    const inn = ease(clamp(p / 0.2)), out = ease(clamp((p - 0.9) / 0.1));
    beauty.g.style.opacity = inn * (1 - out);
    beauty.g.style.transform = `translate(-50%, calc(-50% + ${((1 - inn) * 120 - out * 120).toFixed(1)}px))`;
    const eyesOn = p > 0.3 && p < 0.92;
    beauty.eyes.forEach((e) => { e.style.visibility = eyesOn ? "visible" : "hidden"; e.style.setProperty("--ex", mouse.x.toFixed(3)); e.style.setProperty("--ey", mouse.y.toFixed(3)); });
    beauty.title.style.setProperty("--blur", (clamp(1 - (p - 0.08) / 0.25) * 10).toFixed(1) + "px");
    textWin(beauty.title, p, 0.06, 0.94); textWin(beauty.lead, p, 0.32, 0.94);
  }

  /* ---- HANDS ---- */
  const hands = { sec: $("#hands"), l: $("#hand-left"), r: $("#hand-right"), h2: $("#hands-title h2"), lead: $("#hands-title p") };
  function sceneHands(p) {
    const k = ease(clamp((p - 0.05) / 0.5)), out = ease(clamp((p - 0.88) / 0.12));
    const far = innerWidth * 0.55, near = isMobile() ? 0.02 * innerWidth : 6;
    hands.l.style.setProperty("--hx", (-lerp(far, near, k) - out * far) + "px");
    hands.r.style.setProperty("--hx", (lerp(far, near, k) + out * far) + "px");
    spark.classList.toggle("is-on", k > 0.98 && out < 0.1);
    textWin(hands.h2, p, 0.12, 0.9); textWin(hands.lead, p, 0.2, 0.9);
  }

  /* ---- WINDOWS ---- */
  const WINS = [
    ["BOOT.LOG", "Booting creative engine…"], ["RENDER.EXE", "Sharpening pixels for crisp results."], ["FILES.DLL", "Fetching design assets… Done."],
    ["NOTICE.EXE", "This site may trigger fresh ideas."], ["SYNC.SYS", "Merging design + code workflows…"], ["PIXEL_CORE.EXE", "Drawing scenes in 8-bit detail."],
    ["DIAGNOSE.SCAN", "Checking imagination levels… All green."], ["WORK_LOADER.SYS", "Opening projects from /Raka8/Works…"], ["ALL_SET", "Every creative module is online."],
  ];
  const desk = $("#windows-desktop"); let zTop = 10;
  const mkWin = (title, body, extra = "") => { const w = document.createElement("div"); w.className = "window " + extra; w.innerHTML = `<div class="win-bar"><span class="win-title">${title}</span><button type="button" class="x-btn" aria-label="Close ${title}">${A.icon("close")}</button></div><div class="win-body">${body}</div>`; desk.appendChild(w); return w; };
  const wins = WINS.map(([t, b]) => mkWin(t, `<p class="win-text">${b}</p>`));
  const finalWin = mkWin("WORKS.EXE", `<p class="win-text">Your project folder is ready.<br>Open it now?</p><div class="win-actions"><a href="#" class="btn btn-light win-no">No</a><a href="projects.html" class="btn btn-primary win-yes">Yes</a></div>`, "window-final");
  const allWins = [...wins, finalWin];
  function layoutWins() {
    const W = desk.clientWidth, H = desk.clientHeight, mob = isMobile();
    wins.forEach((w, i) => {
      if (w._moved) return;
      const x = mob ? 12 + i * 10 : (W / 2 - 390) + i * 60, y = mob ? 80 + i * 52 : (H / 2 - 360) + i * 80;
      Object.assign(w.style, { left: x + "px", top: y + "px", zIndex: i + 1 });
    });
    if (!finalWin._moved) Object.assign(finalWin.style, { left: W / 2 - finalWin.offsetWidth / 2 + (mob ? 0 : -0) + "px", top: (mob ? H * 0.32 : H / 2 - 120) + "px", zIndex: 20 });
  }
  allWins.forEach((w) => {
    w.querySelector(".x-btn").addEventListener("click", (e) => { e.stopPropagation(); w.classList.add("is-closed"); Sound.play("close"); });
    w.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, a")) return;
      e.preventDefault(); w.setPointerCapture(e.pointerId); w.classList.add("is-drag"); w.style.zIndex = ++zTop; w._moved = true;
      const sx = e.clientX - w.offsetLeft, sy = e.clientY - w.offsetTop;
      const mv = (ev) => { w.style.left = ev.clientX - sx + "px"; w.style.top = ev.clientY - sy + "px"; };
      const up = () => { w.classList.remove("is-drag"); w.removeEventListener("pointermove", mv); w.removeEventListener("pointerup", up); };
      w.addEventListener("pointermove", mv); w.addEventListener("pointerup", up);
    });
  });
  finalWin.querySelector(".win-no").addEventListener("click", (e) => { e.preventDefault(); finalWin.classList.add("is-closed"); Sound.play("hit"); });
  let winShown = -1;
  function sceneWindows(p) {
    const n = Math.floor(clamp((p - 0.04) / 0.62) * wins.length + (p > 0.04 ? 1 : 0));
    if (n !== winShown) {
      if (n > winShown && n > 0) Sound.play("open", 0.15);
      winShown = n;
      wins.forEach((w, i) => { const on = i < n; if (on && !w.classList.contains("is-shown")) w.classList.add("is-shown"); if (!on) w.classList.remove("is-shown", "is-closed"); });
    }
    const f = p > 0.72;
    if (f && !finalWin.classList.contains("is-shown")) finalWin.classList.add("is-shown");
    if (!f) finalWin.classList.remove("is-shown", "is-closed");
  }

  /* ---- TETRIS ---- */
  const T = { sec: $("#tetris"), c: $("#tetris-canvas"), n: $("#tetris-next-canvas"), perfect: $("#tetris-perfect"), texts: $$("#tetris-cta [data-scramble]") };
  const SHAPES = { I: [[0, 0], [1, 0], [2, 0], [3, 0]], I2: [[0, 0], [0, 1], [0, 2], [0, 3]], O: [[0, 0], [1, 0], [0, 1], [1, 1]], T: [[0, 0], [1, 0], [2, 0], [1, 1]], T2: [[1, 0], [0, 1], [1, 1], [2, 1]], L: [[0, 0], [0, 1], [0, 2], [1, 2]], J: [[1, 0], [1, 1], [1, 2], [0, 2]], S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], L2: [[0, 0], [1, 0], [2, 0], [0, 1]], J2: [[0, 0], [1, 0], [2, 0], [2, 1]], S2: [[0, 0], [0, 1], [1, 1], [1, 2]], Z2: [[1, 0], [0, 1], [1, 1], [0, 2]] };
  const TCOL = ["#f7a1c4", "#ceff00", "#00c2a8", "#e53935", "#ff8a00", "#9b5cff", "#1e88e5", "#f6c53a"];
  const COLS = 10, ROWS = 16, FILL = 8;
  T.pieces = (() => { // tile the bottom 10x8 area exactly with tetrominoes (DFS)
    const g = Array.from({ length: FILL }, () => Array(COLS).fill(-1)); const out = []; const keys = Object.keys(SHAPES);
    const dfs = () => {
      let fx = -1, fy = -1;
      outer: for (let y = FILL - 1; y >= 0; y--) for (let x = 0; x < COLS; x++) if (g[y][x] < 0) { fx = x; fy = y; break outer; }
      if (fx < 0) return true;
      const order = keys.slice().sort(() => Math.random() - 0.5);
      for (const k of order) for (const [ax, ay] of SHAPES[k]) {
        const cells = SHAPES[k].map(([x, y]) => [fx + x - ax, fy + y - ay]);
        if (cells.every(([x, y]) => x >= 0 && x < COLS && y >= 0 && y < FILL && g[y][x] < 0)) {
          cells.forEach(([x, y]) => (g[y][x] = out.length)); out.push({ k, cells, col: TCOL[out.length % TCOL.length] });
          if (dfs()) return true;
          out.pop(); cells.forEach(([x, y]) => (g[y][x] = -1));
        }
      }
      return false;
    };
    dfs();
    return out.map((pc) => ({ ...pc, cells: pc.cells.map(([x, y]) => [x, y + ROWS - FILL]) }));
  })();
  function drawCell(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.fillRect(x, y, s, s); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(x, y + s - 3, s, 3); ctx.fillRect(x + s - 3, y, 3, s); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x, y, s - 3, 3); }
  function sceneTetris(p) {
    const ctx = T.c.getContext("2d"), s = 30; ctx.clearRect(0, 0, 300, 500);
    const oy = 500 - ROWS * s;
    const np = T.pieces.length, k = clamp((p - 0.05) / 0.62) * np, done = Math.floor(k), frac = k - done;
    for (let i = 0; i < Math.min(done, np); i++) for (const [x, y] of T.pieces[i].cells) drawCell(ctx, x * s, oy + y * s, s, T.pieces[i].col);
    if (done < np && k > 0) {
      const pc = T.pieces[done], top = Math.min(...pc.cells.map((c) => c[1]));
      const dy = (1 - frac) * (top + 2);
      for (const [x, y] of pc.cells) drawCell(ctx, x * s, oy + (y - Math.round(dy * 2) / 2) * s, s, pc.col);
    }
    const complete = k >= np;
    if (complete && p > 0.74) { const fl = Math.floor(performance.now() / 120) % 2; if (fl) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(0, oy + (ROWS - FILL) * s, 300, FILL * s); } }
    T.perfect.classList.toggle("is-on", complete && p > 0.74);
    // next preview
    const n = T.n.getContext("2d"); n.clearRect(0, 0, 80, 420);
    for (let j = 0; j < 5; j++) { const pc = T.pieces[done + 1 + j]; if (!pc) break; const mx = Math.min(...pc.cells.map((c) => c[0])), my = Math.min(...pc.cells.map((c) => c[1])); const w = Math.max(...pc.cells.map((c) => c[0])) - mx + 1; for (const [x, y] of pc.cells) drawCell(n, 40 - (w * 16) / 2 + (x - mx) * 16, 14 + j * 82 + (y - my) * 16, 16, pc.col); }
    T.texts.forEach((el, i) => textWin(el, p, isMobile() ? 0.76 + i * 0.03 : 0.1 + i * 0.05, 2));
    $("#tetris-sticky").classList.toggle("is-cta-phase", p > 0.76);
  }

  /* ---- WORLD globe ---- */
  const world = { sec: $("#world"), c: cnv($("#world-canvas")), texts: $$("#world-text [data-scramble]"), pts: null };
  const land = (lon, lat) => Math.sin(lon * 2 + 0.6) * Math.cos(lat * 2.2) + 0.55 * Math.sin(lon * 5 + 1.3) * Math.sin(lat * 3.1 + 0.7) + 0.32 * Math.sin(lon * 9 + 2) * Math.cos(lat * 7) > 0.18;
  function sceneWorld(p, now) {
    const { c } = world; c.fit(); const { ctx } = c; ctx.clearRect(0, 0, c.w, c.h);
    const N = 26, s = Math.floor(Math.min(c.w, c.h) / N), ox = Math.round((c.w - N * s) / 2), oy = Math.round((c.h - N * s) / 2);
    if (!world.pts) { world.pts = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const nx = (x + 0.5) / N * 2 - 1, ny = (y + 0.5) / N * 2 - 1; if (nx * nx + ny * ny <= 1) world.pts.push({ x, y, nx, ny, sx: rand(-0.6, 1.6), sy: rand(-0.6, 1.6), d: Math.random() * 0.35 }); } }
    const rot = now * 0.00035, k0 = clamp(p / 0.45);
    for (const pt of world.pts) {
      const nz = Math.sqrt(Math.max(0, 1 - pt.nx * pt.nx - pt.ny * pt.ny)), lat = Math.asin(pt.ny), lon = Math.atan2(pt.nx, nz) + rot;
      const k = ease(clamp((k0 * 1.4 - pt.d) / 0.65));
      if (k <= 0 && p < 0.02) continue;
      const x = lerp(pt.sx * c.w, ox + pt.x * s, k), y = lerp(pt.sy * c.h, oy + pt.y * s, k);
      ctx.fillStyle = land(lon, lat) ? "#ceff00" : "#1e88e5";
      ctx.globalAlpha = k > 0 ? 1 : 0.0;
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
    ctx.globalAlpha = 1;
    world.texts.forEach((el, i) => textWin(el, p, 0.02 + i * 0.03, 2));
  }

  /* ---------------- frame loop ---------------- */
  const scenes = [
    [about, () => sceneAbout()], [pix.sec, scenePixels], [ideas.sec, sceneIdeas], [brain.sec, sceneBrain], [dna.sec, sceneDna],
    [emo.sec, sceneEmotion], [beauty.sec, sceneBeauty], [hands.sec, sceneHands], [desk.parentElement, sceneWindows], [T.sec, sceneTetris], [world.sec, sceneWorld],
  ];
  function frame(now) {
    updateNav();
    for (const [sec, fn] of scenes) if (visible(sec)) fn(progress(sec), now);
    requestAnimationFrame(frame);
  }
  addEventListener("resize", layoutWins);
  layoutWins();
  requestAnimationFrame(frame);
  addEventListener("keydown", (e) => { if (e.key === "Escape") return; });
})();
