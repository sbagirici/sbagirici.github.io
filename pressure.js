/* Adapted from the owner-supplied pressure-poster-preview, with explicit motion and visibility controls. */
(() => {
/* Paper, ink and a live pressure field. No dependencies. */

document.documentElement.classList.add("js");

const field = document.querySelector(".pressure-welcome");
if (field) initField(field);

function initField(section) {
  const canvas = section.querySelector(".pressure-welcome-canvas");
  const readout = null;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  section.classList.add("has-canvas");

  const styles = getComputedStyle(section);
  const INK = styles.getPropertyValue("--line").trim() || "#6f6c66";
  const RED = styles.getPropertyValue("--accent").trim() || "#d6392b";
  const PAPER = styles.getPropertyValue("--paper").trim() || "#f5f2ea";
  const MONO = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
  const CELL = 10; // css px per grid cell
  const BASE = 1013;

  let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, aspect = 1;
  let values = new Float32Array(0);

  // --- the field: a few drifting centres, soft noise, and the visitor's low ---
  const centres = [
    { amp: 9, sx: 0.30, sy: 0.22, ax: 0.28, ay: 0.30, fx: 0.031, fy: 0.023, px: 0.0, py: 1.2 },
    { amp: -7, sx: 0.26, sy: 0.30, ax: 0.70, ay: 0.72, fx: 0.027, fy: 0.019, px: 2.1, py: 0.4 },
    { amp: 6, sx: 0.22, sy: 0.24, ax: 0.78, ay: 0.20, fx: 0.021, fy: 0.029, px: 4.0, py: 2.6 },
  ];
  const cursor = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, strength: 0, target: 0 };
  let motionAllowed = !reduceMotion.matches;
  let inView = false;
  const pause = document.querySelector("#motion");
  const tr = document.documentElement.lang === "tr";
  pause.hidden = false;
  let time = 40; // start somewhere interesting

  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function pressure(nx, ny, t) {
    let p = BASE;
    for (const c of centres) {
      const cx = c.ax * aspect + Math.sin(t * c.fx + c.px) * 0.16;
      const cy = c.ay + Math.cos(t * c.fy + c.py) * 0.14;
      const dx = (nx - cx) / c.sx, dy = (ny - cy) / c.sy;
      p += c.amp * Math.exp(-(dx * dx + dy * dy));
    }
    p += (noise(nx * 3.1 + t * 0.012, ny * 3.1 - t * 0.009) - 0.5) * 3.2;
    p += (noise(nx * 7.3 - t * 0.02, ny * 7.3 + t * 0.015) - 0.5) * 1.1;
    if (cursor.strength > 0.001) {
      const dx = (nx - cursor.x) / 0.17, dy = (ny - cursor.y) / 0.17;
      p -= 9 * cursor.strength * Math.exp(-(dx * dx + dy * dy));
    }
    return p;
  }

  function resize() {
    const rect = section.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    aspect = w / h;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    values = new Float32Array(cols * rows);
  }

  function sample(t) {
    for (let j = 0; j < rows; j++) {
      const ny = (j * CELL) / h;
      for (let i = 0; i < cols; i++) {
        const nx = ((i * CELL) / w) * aspect; // keep circles round
        values[j * cols + i] = pressure(nx, ny, t);
      }
    }
  }

  // marching squares, linear interpolation along edges
  function contour(level, path) {
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = values[j * cols + i], b = values[j * cols + i + 1];
        const c = values[(j + 1) * cols + i + 1], d = values[(j + 1) * cols + i];
        const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = i * CELL, y0 = j * CELL;
        const top = [x0 + CELL * frac(a, b, level), y0];
        const right = [x0 + CELL, y0 + CELL * frac(b, c, level)];
        const bottom = [x0 + CELL * frac(d, c, level), y0 + CELL];
        const left = [x0, y0 + CELL * frac(a, d, level)];
        switch (idx) {
          case 1: case 14: seg(path, left, bottom); break;
          case 2: case 13: seg(path, bottom, right); break;
          case 3: case 12: seg(path, left, right); break;
          case 4: case 11: seg(path, top, right); break;
          case 5: seg(path, top, left); seg(path, bottom, right); break;
          case 6: case 9: seg(path, top, bottom); break;
          case 7: case 8: seg(path, top, left); break;
          case 10: seg(path, top, right); seg(path, left, bottom); break;
        }
      }
    }
  }
  function frac(a, b, level) {
    const d = b - a;
    return Math.abs(d) < 1e-6 ? 0.5 : Math.min(1, Math.max(0, (level - a) / d));
  }
  function seg(path, p, q) {
    path.moveTo(p[0], p[1]);
    path.lineTo(q[0], q[1]);
  }

  // a label where a labelled isobar crosses one of a few fixed rows
  function labelPositions(level, rowsAt) {
    const out = [];
    for (const r of rowsAt) {
      const j = Math.min(rows - 2, Math.max(0, Math.round((r * h) / CELL)));
      for (let i = 2; i < cols - 3; i++) {
        const a = values[j * cols + i], b = values[j * cols + i + 1];
        if ((a > level) !== (b > level)) {
          out.push([i * CELL + CELL * frac(a, b, level), j * CELL]);
          break;
        }
      }
    }
    return out;
  }

  function draw(t) {
    sample(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let min = Infinity, max = -Infinity;
    for (let k = 0; k < values.length; k++) {
      if (values[k] < min) min = values[k];
      if (values[k] > max) max = values[k];
    }
    const thin = new Path2D(), thick = new Path2D();
    const labels = [];
    for (let level = Math.ceil(min); level <= Math.floor(max); level++) {
      const major = level % 4 === 0;
      contour(level, major ? thick : thin);
      if (major) for (const pos of labelPositions(level, [0.22, 0.58, 0.86])) labels.push([level, pos]);
    }
    ctx.strokeStyle = INK;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 0.7;
    ctx.stroke(thin);
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 1.25;
    ctx.stroke(thick);
    ctx.globalAlpha = 1;
    // labels sit in a small paper gap
    ctx.font = MONO;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (const [level, [x, y]] of labels) {
      const text = String(level);
      const tw = ctx.measureText(text).width + 10;
      ctx.fillStyle = PAPER;
      ctx.fillRect(x - tw / 2, y - 8, tw, 16);
      ctx.fillStyle = INK;
      ctx.fillText(text, x, y + 0.5);
    }
    // the visitor's low
    if (cursor.strength > 0.02) {
      const x = (cursor.x / aspect) * w, y = cursor.y * h;
      ctx.globalAlpha = Math.min(1, cursor.strength);
      ctx.fillStyle = RED;
      ctx.font = "600 22px 'Bricolage Grotesque', system-ui, sans-serif";
      ctx.fillText("L", x, y - 1);
      ctx.beginPath();
      ctx.arc(x, y + 17, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (readout) {
      const value = String(Math.round(pressure(cursor.x, cursor.y, t)));
      if (readout.textContent !== value) readout.textContent = value;
    }
  }

  // --- loop ---------------------------------------------------------------
  let raf = 0, last = performance.now(), lastDraw = 0;
  function frame(now) {
    if (!motionAllowed || !inView || document.hidden) { raf = 0; return; }
    if (now - lastDraw < 33) { raf = requestAnimationFrame(frame); return; }
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    const k = 1 - Math.exp(-dt * 4.5);
    cursor.x += (cursor.tx - cursor.x) * k;
    cursor.y += (cursor.ty - cursor.y) * k;
    cursor.strength += (cursor.target - cursor.strength) * (1 - Math.exp(-dt * 3));
    draw(time);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf || document.hidden || !inView || !motionAllowed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function point(event) {
    if (!motionAllowed) return;
    const rect = section.getBoundingClientRect();
    cursor.tx = ((event.clientX - rect.left) / w) * aspect;
    cursor.ty = (event.clientY - rect.top) / h;
    cursor.target = 1;
  }
  section.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "touch") point(event);
  });
  section.addEventListener("pointerleave", () => { cursor.target = 0; });
  let touchFade = 0;
  section.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    point(event);
    clearTimeout(touchFade);
    touchFade = setTimeout(() => { cursor.target = 0; }, 2400);
  });

  // the field is only alive while it is on screen
  const observer = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    inView ? start() : stop();
  }, { threshold: 0.05 });
  observer.observe(section);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  addEventListener("resize", () => { resize(); draw(time); }, { passive: true });

  function syncMotion() {
    stop();
    pause.setAttribute("aria-pressed", String(!motionAllowed));
    pause.textContent = motionAllowed ? (tr ? "Hareketi durdur" : "Pause motion") : (tr ? "Hareketi başlat" : "Start motion");
    start();
  }
  pause.addEventListener("click", () => { motionAllowed = !motionAllowed; syncMotion(); });
  reduceMotion.addEventListener("change", () => { motionAllowed = !reduceMotion.matches; syncMotion(); });
  new ResizeObserver(() => { resize(); draw(time); }).observe(section);
  resize();
  draw(time);
  syncMotion();
}

})();
