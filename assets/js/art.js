/* RAKA'8 — original pixel-art library.
   Every drawing here is a hand-made grid (one character = one pixel).
   px(grid, palette) turns a grid into an inline <svg> made of merged <rect> runs. */
(function () {
  const C = {
    ink: "#121212", lime: "#ceff00", limeD: "#6b8400", white: "#ffffff", cream: "#efe6d0",
    yellow: "#f6c53a", pink: "#ff4fa3", blue: "#1e88e5", cyan: "#00d4ff", orange: "#ff8a00", violet: "#9b5cff", red: "#e53935",
  };

  /* grid → svg string. pal maps char → colour ('.' and ' ' are transparent). */
  function px(grid, pal, opt = {}) {
    const h = grid.length, w = Math.max(...grid.map((r) => r.length));
    let rects = "";
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      let x = 0;
      while (x < w) {
        const ch = row[x] || ".";
        if (ch === "." || ch === " " || !pal[ch]) { x++; continue; }
        let run = 1;
        while (x + run < w && (row[x + run] || ".") === ch) run++;
        rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${pal[ch]}"${opt.cls ? ` class="${opt.cls}"` : ""}/>`;
        x += run;
      }
    }
    const attrs = opt.attrs || "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" ${attrs}>${rects}</svg>`;
  }
  const mirror = (g) => g.map((r) => r.split("").reverse().join(""));
  const size = (g) => ({ w: Math.max(...g.map((r) => r.length)), h: g.length });

  /* ---------- HERO AVATAR (32 x 36) — Raka with headphones ---------- */
  const avatar = [
    "...........YYYYYYYYYY...........",
    ".........YY..........YY.........",
    "........Y...HHHHHHHH...Y........",
    ".......Y..HHHHhHHHHHHH..Y.......",
    ".......Y.HHHhHHHHHhHHHHH.Y......",
    "......Y.HHHHHHHHHHHHHhHHH.Y.....",
    "......Y.HHhHHHHhHHHHHHHHHHY.....",
    "......YHHHHHHHHHHHHHHHHHHHY.....",
    "....YYYHHHSSSHHHHSSSSHHHHHYYY...",
    "...YyyYHHSSSSSSSSSSSSSSSHHYyyY..",
    "...YyyYHSSSSSSSSSSSSSSSSSHYyyY..",
    "...YyyYSSKKKKSSSSSSKKKKSSSYyyY..",
    "...YyyYSSSSSSSSSSSSSSSSSSSYyyY..",
    "...YyyYSSWKKSSSSSSSSWKKSSSYyyY..",
    "....YYYSSWKKSSSSSSSSWKKSSSYYY...",
    ".......sSSSSSSSSsSSSSSSSSs......",
    ".......sSSSSSSSSssSSSSSSSs......",
    "........SSSSSSSssssSSSSSS.......",
    "........SSSSSSSSSSSSSSSSS.......",
    "........SSSSSMMMMMMMMSSSS.......",
    "........SSSSSMTTTTTTMSSSS.......",
    ".........SSSSSMMMMMMSSSS........",
    ".........SSSSSSSSSSSSSSS........",
    "..........sSSSSSSSSSSSs.........",
    "...........ssSSSSSSSss..........",
    ".............sSSSSSs............",
    ".............sSSSSSs............",
    ".........CCCCcSSSSScCCCC........",
    ".......CCCCCCCcSSScCCCCCCC......",
    "......CCCCCCCCCcSScCCCCCCCC.....",
    ".....CCCCCCCCCCCccCCCCCCCCCC....",
    "....CCCCcCCCCCCCCCCCCCCCcCCCC...",
    "...CCCCCcCCCCCCZZCCCCCCCcCCCCC..",
    "...CCCCCcCCCCCZZZZCCCCCCcCCCCC..",
    "..CCCCCCcCCCCCCZZCCCCCCCcCCCCCC.",
    "..CCCCCCcCCCCCCCCCCCCCCCcCCCCCC.",
  ];
  const avatarPal = {
    dev: { Y: C.lime, y: "#a6cc00", H: "#3a2a22", h: "#5b4334", S: "#c98a5e", s: "#a86e47", K: "#2a1a14", W: "#ffffff", M: "#6e2a2a", T: "#ffffff", C: "#2d3240", c: "#20242f", Z: C.lime },
    creative: { Y: C.pink, y: "#c2357c", H: "#3a2a22", h: "#5b4334", S: "#c98a5e", s: "#a86e47", K: "#2a1a14", W: "#ffffff", M: "#6e2a2a", T: "#ffffff", C: "#f2f2f2", c: "#cfcfcf", Z: C.red },
  };

  /* ---------- MINI SPRITE (14 x 28) ---------- */
  const mini = [
    "....HHHHHH....",
    "...HHhHHHHH...",
    "..HHHHHHhHHH..",
    "..HHSSSSSSHH..",
    ".YYSKSSSSKSYY.",
    ".YySWSSSSWSyY.",
    "..YSSSSSSSSY..",
    "...SSMMMMSS...",
    "....SSSSSS....",
    ".....ssss.....",
    "...CCCCCCCC...",
    "..CCCCZZCCCC..",
    ".CCCCZZZZCCCC.",
    ".CC.CCZZCC.CC.",
    ".CC.CCCCCC.CC.",
    ".CC.CCCCCC.CC.",
    ".SS.CCCCCC.SS.",
    ".SS.cccccc.SS.",
    "....PPPPPP....",
    "....PPPPPP....",
    "....PPP.PPP...",
    "....PPP.PPP...",
    "....PPP.PPP...",
    "....ppp.ppp...",
    "....PPP.PPP...",
    "....PPP.PPP...",
    "...WWWW.WWWW..",
    "...KKKK.KKKK..",
  ];
  const miniPal = {
    dev: { ...avatarPal.dev, P: "#3b4a6b", p: "#2c3850" },
    creative: { ...avatarPal.creative, P: "#2b6fd6", p: "#1f55a8" },
  };

  /* ---------- BRAIN half (13 x 16), right half = mirror ---------- */
  const brainL = [
    ".....KKKKKK..",
    "...KKpppPppK.",
    "..KpPPpppPPK.",
    ".KppppPPpppK.",
    "KppPPpppppPK.",
    "KpppppPPppPK.",
    "KPPpppppPPpK.",
    "KpppPPpppppK.",
    "KpppppPPPppK.",
    "KpPPppppppPK.",
    "KppppPPpppPK.",
    ".KpPpppPPppK.",
    ".KppPPpppPK..",
    "..KKpppPpK...",
    "....KKpppK...",
    "......KKK....",
  ];
  const brainPal = { K: "#000000", p: "#f59ac0", P: "#d24a83" };

  /* ---------- PLAYING CARD (20 x 28) ---------- */
  const card = [
    "KKKKKKKKKKKKKKKKKKKK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWRWWWWWWWWWWWWWWWK",
    "KWRWRWWWWWWWWWWWWWWK",
    "KWRRRWWWWWWWWWWWWWWK",
    "KWRWRWWWWWWWWWWWWWWK",
    "KWRWRWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWWWWRRWWWWRRWWWWWK",
    "KWWWWRRRRWWRRRRWWWWK",
    "KWWWWRRRRRRRRRRWWWWK",
    "KWWWWRRRRRRRRRRWWWWK",
    "KWWWWWRRRRRRRRWWWWWK",
    "KWWWWWWRRRRRRWWWWWWK",
    "KWWWWWWWRRRRWWWWWWWK",
    "KWWWWWWWWRRWWWWWWWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KWWWWWWWWWWWWWWRWRWK",
    "KWWWWWWWWWWWWWWRWRWK",
    "KWWWWWWWWWWWWWWRRRWK",
    "KWWWWWWWWWWWWWWRWRWK",
    "KWWWWWWWWWWWWWWWRWWK",
    "KWWWWWWWWWWWWWWWWWWK",
    "KKKKKKKKKKKKKKKKKKKK",
  ];
  const cardPal = { K: "#000000", W: "#ffffff", R: C.red };

  /* ---------- HEART (9 x 8) ---------- */
  const heart = [
    ".RR...RR.",
    "RWRR.RRRR",
    "RRRRRRRRR",
    "RRRRRRRRR",
    ".RRRRRRR.",
    "..RRRRR..",
    "...RRR...",
    "....R....",
  ];
  const heartPal = { R: C.red, W: "#ffb3b3" };

  /* ---------- GLASSES (48 x 15) — round-ish frames, eyes drawn separately ---------- */
  const glasses = [
    "...WWWWWWWWWWWWW............WWWWWWWWWWWWW...",
    "WWWWWWWWWWWWWWWWWW........WWWWWWWWWWWWWWWWWW",
    "WW.WW...........WW........WW...........WW.WW",
    "W..WW...........WWWWWWWWWWWW...........WW..W",
    "...WW...........WWWWWWWWWWWW...........WW...",
    "...WW...........WW........WW...........WW...",
    "...WW...........WW........WW...........WW...",
    "...WW...........WW........WW...........WW...",
    "...WW...........WW........WW...........WW...",
    "....WW.........WW..........WW.........WW....",
    "....WW.........WW..........WW.........WW....",
    ".....WWWWWWWWWWW............WWWWWWWWWWW.....",
    "......WWWWWWWWW..............WWWWWWWWW......",
  ];
  const glassesPal = { W: C.cream };

  /* ---------- HANDS (left = lime sleeve + hand, pointing right) ---------- */
  const handL = [
    "BBBBBBBBBBBB....................",
    "BBBBBBBBBBBBhhhhhh..............",
    "BBBBBBBBBBBBhhhhhhhhhhhhhhhhhh..",
    "BBBBBBBBBBBBhhhhhhhhhhhhhhhhhhh.",
    "BBBBBBBBBBBBhhhhhhhhhhssssssss..",
    "BBBBBBBBBBBBhhhhhhhhhh..........",
    "BBBBBBBBBBBBhhhhhhhshhh.........",
    "BBBBBBBBBBBBhhhhhhhhhhh.........",
    "BBBBBBBBBBBBhhhhhhshhhh.........",
    "BBBBBBBBBBBBhhhhhhhhhh..........",
    "BBBBBBBBBBBB.hhhhhhhh...........",
    "BBBBBBBBBBBB....................",
  ];
  const handLPal = { B: C.lime, h: "#e7f99a", s: "#a6cc00" };
  const handR = mirror([
    "BBBBBBBBBBBB....................",
    "BBBBBBBBBBBB....................",
    "BBBBBBBBBBBBhhhhhhhhh...........",
    "BBBBBBBBBBBBhhhhhhhhhhhhhhhhhh..",
    "BBBBBBBBBBBBhhhhhhhhhhhhhhhhhhh.",
    "BBBBBBBBBBBBhhhhhhhhhhssssssss..",
    "BBBBBBBBBBBBhhhhhhhhhhhh........",
    "BBBBBBBBBBBBhhhhhhhshhhh........",
    "BBBBBBBBBBBBhhhhhhhhhhhh........",
    "BBBBBBBBBBBBhhhhhhshhhh.........",
    "BBBBBBBBBBBB.hhhhhhhhh..........",
    "BBBBBBBBBBBB....................",
  ]);
  const handRPal = { B: "#3a3f4b", h: C.cream, s: "#c9bfa6" };

  /* ---------- PROFILE HEAD (24 x 25) facing left ---------- */
  const head = [
    "........QQQQQQQQ........",
    "......QQQQQQQQQQQQ......",
    ".....QQQQQQQQQQQQQQ.....",
    "....QQQQQQQQQQQQQQQQ....",
    "...QQQQQQQQQQQQQQQQQQ...",
    "...QQQQQQQQQQQQQQQQQQQ..",
    "..QQQQQQQQQQQQQQQQQQQQ..",
    "..QQQQQQQQQQQQQQQQQQQQQ.",
    ".QQQQQQQQQQQQQQQQQQQQQQ.",
    ".QQQQQQQQQQQQQQQQQQQQQQ.",
    "QQQQQQQQQQQQQQQQQQQQQQQ.",
    ".QQQKQQQQQQQQQQQQQQQQQQ.",
    "QQQQQQQQQQQQQQQQQQQQQQ..",
    "..QQQQQQQQQQQQQQQQQQQQ..",
    "QQQQQQQQQQQQQQQQQQQQQ...",
    ".QQQQQQQQQQQQQQQQQQQQ...",
    "..QQQQQQQQQQQQQQQQQQQ...",
    "...QQQQQQQQQQQQQQQQQ....",
    "..QQQQQQQQQQQQQQQQQ.....",
    "...QQQQQQQQQQQQQQQ......",
    ".....QQQQQQQQQQQQ.......",
    ".........QQQQQQQ........",
    ".........QQQQQQQ........",
    ".........QQQQQQQQ.......",
    "........QQQQQQQQQQ......",
  ];

  /* ---------- UI ICONS (12 x 12) ---------- */
  const icons = {
    soundOff: ["............", ".....X......", "....XX......", "...XXX......", "XXXXXX.X...X", "XXXXXX..X.X.", "XXXXXX...X..", "XXXXXX..X.X.", "...XXX.X...X", "....XX......", ".....X......", "............"],
    soundOn: ["............", ".....X......", "....XX...X..", "...XXX.X..X.", "XXXXXX..X..X", "XXXXXX..X..X", "XXXXXX..X..X", "XXXXXX..X..X", "...XXX.X..X.", "....XX...X..", ".....X......", "............"],
    phone: ["..XXXXXXXX..", "..X......X..", "..X.XXXX.X..", "..X.XXXX.X..", "..X.XXXX.X..", "..X.XXXX.X..", "..X.XXXX.X..", "..X.XXXX.X..", "..X......X..", "..X..XX..X..", "..X......X..", "..XXXXXXXX.."],
    pad: ["............", "..XX....XX..", ".XXXXXXXXXX.", "XX.XXXXXX.XX", "X...XXXX.X.X", "XX.XXXXXX.XX", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XXXX....XXXX", "XXX......XXX", ".X........X.", "............"],
    folder: ["............", "XXXXX.......", "X...XXXXXXX.", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "............", "............"],
    close: ["X.....X", ".X...X.", "..X.X..", "...X...", "..X.X..", ".X...X.", "X.....X"],
    up: ["...X...", "..XXX..", ".XXXXX.", "XXXXXXX"],
    down: ["XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
    arrow: ["X...", "XX..", "XXX.", "XXXX", "XXX.", "XX..", "X..."],
    list: ["............", "XX.XXXXXXXXX", "XX.XXXXXXXXX", "............", "XX.XXXXXXXXX", "XX.XXXXXXXXX", "............", "XX.XXXXXXXXX", "XX.XXXXXXXXX", "............", "XX.XXXXXXXXX", "XX.XXXXXXXXX"],
    claw: ["XXXXXXXXXXXX", "X..........X", "X....XX....X", "X....XX....X", "X...XXXX...X", "X...X..X...X", "X..........X", "X.XX.XX.XX.X", "X.XXXXXXXXXX", "XXXXXXXXXXXX", "XX...XX...XX", "XXXXXXXXXXXX"],
    ok: ["......X", ".....XX", "X...XX.", "XX.XX..", ".XXX...", "..X...."],
    err: ["XX...XX", ".XX.XX.", "..XXX..", ".XX.XX.", "XX...XX"],
  };
  const icon = (name, color = "currentColor", attrs = "") => px(icons[name], { X: color }, { attrs });

  /* ---------- CHOMPER (section nav) ---------- */
  const chomp = {
    open: ["...XXXXX...", ".XXXXXXXXX.", "XXXXXXXXX..", "XXXXXXX....", "XXXXX......", "XXXXXXX....", "XXXXXXXXX..", ".XXXXXXXXX.", "...XXXXX..."],
    closed: ["...XXXXX...", ".XXXXXXXXX.", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "...XXXXX..."],
    food: ["XX", "XX"],
  };

  /* ---------- LOADER GLYPHS (7 x 7) ---------- */
  const glyphs = [
    [".X...X.", "XXX.XXX", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
    ["...X...", "...X...", ".XXXXX.", "XXXXXXX", ".XXXXX.", ".X...X.", "X.....X"],
    ["XXXXXXX", "X.....X", "X.....X", "XXXXXXX", "...X...", ".XXXXX.", "......."],
    ["..XXX..", ".X...X.", "X.X.X.X", "X.....X", "X.XXX.X", ".X...X.", "..XXX.."],
    ["....XX.", "...XX..", "..XXX..", ".XXXXX.", "..XXX..", "..XX...", ".XX...."],
    [".XXXXX.", "X.....X", "X.XXX.X", "X.....X", ".XXXXX.", "...X...", "..XXX.."],
    ["X.....X", ".X...X.", "..X.X..", "...X...", "..X.X..", ".X...X.", "X.....X"],
    [".XXXX..", "X....X.", "X....XX", "X....XX", "X....X.", ".XXXX..", "XXXXXX."],
    ["..X.X..", ".XXXXX.", "XX.X.XX", "XXXXXXX", ".X...X.", "X.X.X.X", "......."],
  ];

  /* ---------- PIXEL FONT for the logo (5x7) ---------- */
  const font = {
    R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "'": ["#", "#", ".", ".", ".", ".", "."],
    8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  };
  function logo(text = "RAKA'8", color = C.lime, shadow = C.limeD) {
    const rows = Array.from({ length: 7 }, () => "");
    for (const ch of text) { const g = font[ch]; for (let y = 0; y < 7; y++) rows[y] += g[y] + "."; }
    const w = rows[0].length + 1, h = 8;
    const grid = Array.from({ length: h }, () => Array(w).fill("."));
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") { if (grid[y + 1][x + 1] === ".") grid[y + 1][x + 1] = "s"; grid[y][x] = "#"; } }));
    return px(grid.map((r) => r.join("")), { "#": color, s: shadow }, { attrs: 'class="logo-svg" aria-hidden="true"' });
  }

  window.ART = { C, px, mirror, size, avatar, avatarPal, mini, miniPal, brainL, brainPal, card, cardPal, heart, heartPal, glasses, glassesPal, handL, handLPal, handR, handRPal, head, icons, icon, chomp, glyphs, logo };
})();
