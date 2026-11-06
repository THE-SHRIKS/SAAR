import { ACC, type Scene } from "./pixel";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fract = (v: number) => v - Math.floor(v);
const hash = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Signed distance to a box (negative inside).
const box = (x: number, y: number, cx: number, cy: number, hw: number, hh: number) =>
  Math.max(Math.abs(x - cx) - hw, Math.abs(y - cy) - hh);
const dist = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const k = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(x - (x1 + k * dx), y - (y1 + k * dy));
};
const out = (l: number, ac: number) => (ac > 0 ? ACC + Math.max(ac, Math.min(1, l)) : Math.min(1, l));
const stars = (x: number, y: number) => (hash(Math.floor(x * 90) * 7 + Math.floor(y * 90) * 131) > 0.9965 ? 0.45 : 0);

/* 1. Documents drop into the workspace tray. */
const importScene: Scene = (x, y, t, a) => {
  const cx = a / 2;
  let l = stars(x, y);
  let ac = 0;
  const ty = 0.7;
  const tray = Math.abs(box(x, y, cx, ty + 0.09, 0.36, 0.09));
  if (tray < 0.008) ac = 1;
  if (y > ty && y < ty + 0.18 && Math.abs(x - cx) < 0.36) l = Math.max(l, 0.08);
  for (let k = 0; k < 4; k++) {
    const p = fract(t * 0.17 + k / 4);
    const sx = cx + (k - 1.5) * 0.19 + 0.012 * Math.sin(t * 0.8 + k * 2);
    const sy = -0.18 + p * 0.82;
    const hw = 0.082;
    const hh = 0.115;
    const d = box(x, y, sx, sy, hw, hh);
    if (d < 0 && y < ty + 0.015) {
      const ly = (y - (sy - hh)) / (2 * hh);
      const lx = (x - (sx - hw)) / (2 * hw);
      let v = 0.07;
      if (d > -0.006) v = 1;
      else if (ly < 0.2 && lx < 0.55) v = 0.9;
      else if (ly > 0.3 && ly < 0.93 && lx > 0.12 && lx < 0.88 && fract(ly * 9) < 0.45) v = 0.88;
      if (k === 2 && ly > 0.72 && ly < 0.88 && lx > 0.5 && lx < 0.88) ac = Math.max(ac, 0.9);
      l = Math.max(l, v);
    }
  }
  return out(l, ac);
};

/* 2. A lens reads one field of a source document. */
const inspect: Scene = (x, y, t, a) => {
  const cx = a / 2 - 0.1;
  const cy = 0.5;
  const hw = 0.24;
  const hh = 0.35;
  const docLum = (px: number, py: number) => {
    const ly = (py - (cy - hh)) / (2 * hh);
    const lx = (px - (cx - hw)) / (2 * hw);
    if (lx < 0 || lx > 1 || ly < 0 || ly > 1) return 0;
    if (ly < 0.12) return lx < 0.5 ? 0.95 : 0;
    const row = Math.floor(ly * 22);
    if (fract(ly * 22) > 0.5) return 0;
    const seg = Math.floor(lx * 9);
    return hash(row * 13 + seg * 7) > 0.28 ? 0.88 : 0;
  };
  let l = stars(x, y);
  let ac = 0;
  const d = box(x, y, cx, cy, hw, hh);
  if (d < 0) l = d > -0.006 ? 1 : docLum(x, y) + 0.07;
  const lx0 = cx + 0.09 * Math.sin(t * 0.5);
  const ly0 = cy - 0.03 + 0.17 * Math.sin(t * 0.37 + 1);
  const lr = 0.125;
  const dl = Math.hypot(x - lx0, y - ly0);
  if (dl < lr) {
    const mx = lx0 + (x - lx0) / 1.9;
    const my = ly0 + (y - ly0) / 1.9;
    l = Math.min(1, docLum(mx, my) * 1.1 + 0.05);
    if (Math.abs(y - ly0) < 0.012 && Math.abs(x - lx0) < lr * 0.8) ac = 0.95;
  }
  if (Math.abs(dl - lr) < 0.012) ac = 1;
  if (dist(x, y, lx0 + lr * 0.72, ly0 + lr * 0.72, lx0 + lr * 0.72 + 0.12, ly0 + lr * 0.72 + 0.12) < 0.013) ac = 1;
  const px0 = cx + hw + 0.16;
  for (let r = 0; r < 3; r++) {
    const ry = cy - 0.2 + r * 0.2;
    if (Math.abs(y - ry) < 0.008 && x > px0 - 0.07 && x < px0 + 0.07) l = Math.max(l, 0.4);
    const reveal = r === Math.floor(fract(t * 0.18) * 3) ? 1 : 0.7;
    if (Math.abs(y - (ry + 0.05)) < 0.014 && x > px0 - 0.07 && x < px0 - 0.07 + 0.14 * reveal) l = Math.max(l, 0.95);
  }
  if (dist(x, y, lx0 + lr, ly0, cx + hw + 0.075, cy - 0.15) < 0.0035 && fract((x + y) * 22) < 0.55) ac = 1;
  return out(l, ac);
};

/* 3. Invoices on one side, payments on the other, links proposed between them. */
const reconcile: Scene = (x, y, t, a) => {
  const cx = a / 2;
  let l = stars(x, y);
  let ac = 0;
  const left = cx - 0.3;
  const right = cx + 0.3;
  const perm = [2, 0, 4, 1, 3];
  const shown = Math.floor(fract(t * 0.11) * 7);
  for (let i = 0; i < 5; i++) {
    const yy = 0.2 + i * 0.15;
    const dl = box(x, y, left, yy, 0.12, 0.035);
    const dr = box(x, y, right, yy, 0.12, 0.035);
    if (dl < 0) l = Math.max(l, dl > -0.006 ? 1 : fract((x - left) * 14) < 0.4 ? 0.9 : 0.06);
    if (dr < 0) l = Math.max(l, dr > -0.006 ? 1 : fract((x - right) * 14) < 0.4 ? 0.9 : 0.06);
    const j = perm[i] ?? i;
    if (i < shown) {
      const yj = 0.2 + j * 0.15;
      const d = dist(x, y, left + 0.12, yy, right - 0.12, yj);
      const flagged = i === 3;
      if (d < 0.005 && (!flagged || fract((x + y) * 26) < 0.5)) ac = flagged ? 0.55 : 1;
      if (flagged && Math.abs(x - cx) < 0.03 && Math.abs(y - (yy + yj) / 2) < 0.04) ac = Math.abs(x - cx) < 0.008 || (Math.abs(y - (yy + yj) / 2 - 0.022) < 0.007 && Math.abs(x - cx) < 0.008) ? 1 : ac;
    }
  }
  return out(l, ac);
};

/* 4. A question, an answer typed out, and its evidence chips. */
const ask: Scene = (x, y, t, a) => {
  const cx = a / 2;
  let l = stars(x, y);
  let ac = 0;
  const cycle = fract(t * 0.09);
  const row = (rx: number, ry: number, len: number, prog: number, lum: number) => {
    if (Math.abs(y - ry) < 0.012 && x > rx && x < rx + len * clamp(prog)) l = Math.max(l, lum);
  };
  // user bubble, right
  const ub = box(x, y, cx + 0.17, 0.22, 0.2, 0.075);
  if (ub < 0 && ub > -0.006) l = 1;
  row(cx + 0.0, 0.2, 0.3, sm(0, 0.12, cycle) * 1.2, 0.9);
  row(cx + 0.0, 0.245, 0.18, sm(0.05, 0.16, cycle), 0.9);
  // answer, left
  const rows = [0.42, 0.47, 0.52, 0.57];
  const lens = [0.62, 0.55, 0.6, 0.3];
  rows.forEach((ry, i) => row(cx - 0.32, ry, lens[i] ?? 0.4, sm(0.2 + i * 0.08, 0.3 + i * 0.08, cycle), 0.9));
  // evidence chips
  for (let c = 0; c < 4; c++) {
    const chip = box(x, y, cx - 0.27 + c * 0.17, 0.67, 0.07, 0.022);
    if (chip < 0 && chip > -0.006 && cycle > 0.55 + c * 0.03) ac = 1;
  }
  // verified tick
  const tx = cx - 0.32;
  const ty = 0.77;
  if (cycle > 0.7) {
    if (dist(x, y, tx, ty, tx + 0.025, ty + 0.025) < 0.008 || dist(x, y, tx + 0.025, ty + 0.025, tx + 0.07, ty - 0.03) < 0.008) ac = 1;
    if (Math.abs(y - ty) < 0.008 && x > tx + 0.11 && x < tx + 0.52) l = Math.max(l, 0.4);
  }
  // input bar and cursor
  const ib = box(x, y, cx, 0.9, 0.36, 0.04);
  if (ib < 0 && ib > -0.005) l = Math.max(l, 0.7);
  if (Math.abs(y - 0.9) < 0.022 && Math.abs(x - (cx - 0.3)) < 0.008 && fract(t * 1.1) < 0.55) ac = 1;
  return out(l, ac);
};

/* 5. Monthly income and expenses, growing in turn, with the net line over them. */
const report: Scene = (x, y, t, a) => {
  const cx = a / 2;
  let l = stars(x, y);
  let ac = 0;
  const base = 0.82;
  const ph = fract(t * 0.1);
  const x0 = cx - 0.38;
  if (Math.abs(y - base) < 0.005 && x > x0 - 0.03 && x < cx + 0.4) l = 1;
  for (let g = 0; g <= 3; g++) if (Math.abs(y - (base - g * 0.18)) < 0.002 && fract(x * 40) < 0.4 && x > x0 - 0.03 && x < cx + 0.4) l = Math.max(l, 0.35);
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const gx = x0 + i * 0.135;
    const inc = 0.2 + hash(i * 3 + 1) * 0.36;
    const exp = 0.14 + hash(i * 3 + 2) * 0.32;
    const grow = clamp((ph * 1.7 - i * 0.1) * 3.2);
    const hi = inc * grow;
    const he = exp * grow;
    if (x > gx && x < gx + 0.048 && y > base - hi && y < base - 0.006) l = Math.max(l, (y - (base - hi)) < 0.01 ? 1 : 0.9);
    if (x > gx + 0.054 && x < gx + 0.102 && y > base - he && y < base - 0.006) l = Math.max(l, ((y - (base - he)) < 0.01 ? 1 : fract(y * 60) < 0.5 ? 0.85 : 0.2));
    pts.push([gx + 0.051, base - (hi - he) * 0.9 - 0.02]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const q = pts[i + 1]!;
    if (dist(x, y, p[0], p[1], q[0], q[1]) < 0.007) ac = 1;
  }
  pts.forEach((p) => {
    if (Math.abs(x - p[0]) < 0.014 && Math.abs(y - p[1]) < 0.014) ac = 1;
  });
  return out(l, ac);
};

/* 6. A vault: shackle, body, keyhole, encrypted bytes circling it. */
const vault: Scene = (x, y, t, a) => {
  const cx = a / 2;
  const cy = 0.55;
  let l = stars(x, y);
  let ac = 0;
  const body = box(x, y, cx, cy + 0.06, 0.2, 0.15);
  if (body < 0) l = body > -0.012 ? 1 : fract((x + y) * 24) < 0.5 ? 0.4 : 0.08;
  const sr = Math.hypot(x - cx, y - (cy - 0.09));
  if (Math.abs(sr - 0.12) < 0.018 && y < cy - 0.085) l = Math.max(l, 0.95);
  if (Math.abs(x - (cx - 0.12)) < 0.018 && y >= cy - 0.09 && y < cy - 0.06) l = Math.max(l, 0.95);
  if (Math.abs(x - (cx + 0.12)) < 0.018 && y >= cy - 0.09 && y < cy - 0.06) l = Math.max(l, 0.95);
  const kh = Math.hypot(x - cx, y - (cy + 0.04));
  if (kh < 0.032 || (Math.abs(x - cx) < 0.014 && y > cy + 0.04 && y < cy + 0.125)) ac = 1;
  // bytes orbiting
  for (let k = 0; k < 14; k++) {
    const ang = t * 0.45 + (k / 14) * Math.PI * 2;
    const r = 0.36 + 0.02 * Math.sin(t + k);
    const px = cx + Math.cos(ang) * r * 1.25;
    const py = cy + 0.02 + Math.sin(ang) * r * 0.62;
    if (Math.abs(x - px) < 0.011 && Math.abs(y - py) < 0.011) {
      if (k % 4 === 0) ac = Math.max(ac, 0.9);
      else l = Math.max(l, 0.85);
    }
  }
  return out(l, ac);
};

/* 7. The architecture: interface, bridge, core and four local workers, with pulses on the links. */
const graph: Scene = (x, y, t, a) => {
  const cx = a / 2;
  let l = stars(x, y);
  let ac = 0;
  const nodes: [number, number, number, number, boolean][] = [
    [cx - 0.5, 0.5, 0.07, 0.06, false],
    [cx - 0.3, 0.5, 0.07, 0.06, false],
    [cx - 0.04, 0.5, 0.09, 0.27, true],
  ];
  const ys = [0.2, 0.4, 0.6, 0.8];
  ys.forEach((yy) => nodes.push([cx + 0.4, yy, 0.09, 0.055, false]));
  nodes.forEach(([nx, ny, hw, hh, core]) => {
    const d = box(x, y, nx, ny, hw, hh);
    if (d < 0) {
      if (d > -0.007) {
        if (core) ac = 1;
        else l = 1;
      } else if (core) l = Math.max(l, fract((x - y) * 22) < 0.5 ? 0.4 : 0.18);
      else l = Math.max(l, 0.12);
    }
  });
  const paths: [number, number][][] = [
    [[cx - 0.43, 0.5], [cx - 0.37, 0.5]],
    [[cx - 0.23, 0.5], [cx - 0.13, 0.5]],
    ...ys.map((yy): [number, number][] => [[cx + 0.05, 0.5], [cx + 0.18, 0.5], [cx + 0.18, yy], [cx + 0.31, yy]]),
  ];
  paths.forEach((p, pi) => {
    let total = 0;
    const lens: number[] = [];
    for (let i = 0; i < p.length - 1; i++) {
      const s = p[i]!;
      const e = p[i + 1]!;
      const len = Math.hypot(e[0] - s[0], e[1] - s[1]);
      lens.push(len);
      total += len;
      if (dist(x, y, s[0], s[1], e[0], e[1]) < 0.0042 && fract((x + y) * 34) < 0.6) l = Math.max(l, 0.55);
    }
    const pos = fract(t * 0.35 + pi * 0.23) * total;
    let acc = 0;
    for (let i = 0; i < lens.length; i++) {
      const len = lens[i]!;
      if (pos <= acc + len) {
        const s = p[i]!;
        const e = p[i + 1]!;
        const k = (pos - acc) / len;
        if (Math.abs(x - (s[0] + (e[0] - s[0]) * k)) < 0.012 && Math.abs(y - (s[1] + (e[1] - s[1]) * k)) < 0.012) ac = 1;
        break;
      }
      acc += len;
    }
  });
  return out(l, ac);
};

/* 8. A terminal typing out the build commands. */
const terminal: Scene = (x, y, t, a) => {
  const cx = a / 2;
  let l = stars(x, y);
  let ac = 0;
  const win = box(x, y, cx, 0.5, 0.38, 0.33);
  if (win < 0 && win > -0.007) l = 1;
  if (win < -0.007 && y < 0.5 - 0.33 + 0.07) l = Math.max(l, 0.14);
  for (let k = 0; k < 3; k++) if (Math.abs(x - (cx - 0.35 + k * 0.045)) < 0.012 && Math.abs(y - 0.2) < 0.012) ac = k === 0 ? 1 : 0.6;
  const T = fract(t * 0.06) * 9;
  const lens = [0.46, 0.34, 0.5, 0.4, 0.3];
  for (let i = 0; i < 5; i++) {
    const ry = 0.32 + i * 0.1;
    const prog = clamp(T - i * 1.4, 0, 1);
    if (Math.abs(y - ry) < 0.012) {
      if (x > cx - 0.34 && x < cx - 0.31 && prog > 0) ac = 1;
      if (x > cx - 0.27 && x < cx - 0.27 + (lens[i] ?? 0.3) * prog) l = Math.max(l, fract((x - cx) * 30) < 0.78 ? 0.75 : 0.35);
    }
    if (prog > 0 && prog < 1 && fract(t * 2) < 0.6 && Math.abs(y - ry) < 0.02 && Math.abs(x - (cx - 0.27 + (lens[i] ?? 0.3) * prog)) < 0.012) ac = 1;
  }
  return out(l, ac);
};

/* 9. A pile of pages crossed by a scan beam while ledger rows resolve. */
const trail: Scene = (x, y, t, a) => {
  let l = stars(x, y);
  let ac = 0;
  const u = x / a;
  const beam = ((t * 0.085) % 1.3) - 0.15;
  for (let k = 0; k < 4; k++) {
    const left = 0.05 + k * 0.065;
    const top = 0.14 + k * 0.035 + 0.012 * Math.sin(t * 0.7 + k * 1.3);
    const w = 0.07 * (a / 1.6) * 0.8 + 0.0;
    const wu = 0.16;
    const h = 0.6;
    const lx = (u - left) / wu;
    const ly = (y - top) / h;
    if (lx > 0 && lx < 1 && ly > 0 && ly < 1) {
      l = 0.07;
      if (lx < 0.03 || lx > 0.97 || ly < 0.02 || ly > 0.98) l = 0.9;
      else if (ly > 0.14 && lx > 0.1 && lx < 0.9 && fract(ly * 15) < 0.42) l = 0.88 - 0.08 * k;
      if (ly < 0.1 && lx > 0.1 && lx < 0.5) l = 0.8;
    }
    void w;
  }
  const d = u - beam;
  ac = Math.max(ac, 0.55 * Math.exp(-(d * d) / 0.0002));
  if (d < 0 && d > -0.12) l += 0.07 * (1 + d / 0.12);
  if (u > 0.6 && u < 0.96) {
    for (let r = 0; r < 11; r++) {
      const yy = 0.12 + r * 0.075;
      if (y > yy && y < yy + 0.032) {
        const resolved = beam > 0.6 + r * 0.018;
        const len = 0.1 + (((r * 37) % 10) / 10) * 0.18;
        if (u < 0.6 + len) l = Math.max(l, resolved ? 0.62 : 0.1);
        if (u > 0.86 && u < 0.94 && resolved) ac = Math.max(ac, 0.88);
      }
    }
  }
  return out(l, ac);
};

export const SCENES: Record<string, Scene> = {
  import: importScene,
  inspect,
  reconcile,
  ask,
  report,
  vault,
  graph,
  terminal,
  trail,
};

export const WALK_ORDER = ["import", "inspect", "reconcile", "ask", "report", "vault"] as const;
