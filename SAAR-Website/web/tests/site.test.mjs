import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { test } from "node:test";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

async function walk(dir) {
  const out = [];
  for (const e of await readdir(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

test("hero video and poster ship with the site", async () => {
  assert.ok((await stat(new URL("../public/assets/video/hero.mp4", import.meta.url))).size > 100_000);
  assert.ok((await stat(new URL("../public/assets/video/hero-poster.webp", import.meta.url))).size > 1_000);
  const home = await read("src/pages/index.astro");
  assert.match(home, /hero__video/);
  assert.match(home, /muted/);
});

test("typography is the chosen families, not generic defaults", async () => {
  const tokens = await read("src/styles/tokens.css");
  for (const f of ["DotGothic16", "Hanken Grotesk", "JetBrains Mono", "Tiny5"]) assert.ok(tokens.includes(f), f);
  const css = (await Promise.all((await walk("src/styles")).map(read))).join("\n");
  assert.doesNotMatch(css, /\b(Inter|Geist|Roboto|Poppins)\b/);
});

test("no AI-template patterns: glass, glow, neon gradients", async () => {
  const css = (await Promise.all((await walk("src/styles")).map(read))).join("\n");
  assert.doesNotMatch(css, /backdrop-filter|blur\(|text-shadow|drop-shadow/);
  assert.doesNotMatch(css, /(purple|violet|magenta|neon)/i);
});

test("copy has no banned vocabulary or em dashes", async () => {
  const files = [...(await walk("src/pages")), ...(await walk("src/components")), "src/data/site.ts"];
  const banned = /revolutionary|seamless|next-generation|cutting-edge|unlock|empower|AI-powered|leverage|game-?chang|supercharge|—/i;
  const hits = [];
  for (const f of files) if (banned.test(await read(f))) hits.push(f);
  assert.deepEqual(hits, []);
});

test("no invented customers, testimonials or metrics", async () => {
  const files = [...(await walk("src/pages")), ...(await walk("src/components"))];
  for (const f of files) {
    const text = await read(f);
    assert.doesNotMatch(text, /testimonial|trusted by|customers?\b.*logo|\d+\+ (users|customers|downloads)/i, f);
  }
});

test("every page sets a title and description through the layout", async () => {
  for (const f of await walk("src/pages")) {
    const text = await read(f);
    assert.match(text, /title="[^"]+"/, f);
    assert.match(text, /description="[^"]{40,}"/, f);
  }
});

test("reduced motion is respected in scripts and CSS", async () => {
  assert.match(await read("src/scripts/motion.ts"), /prefers-reduced-motion/);
  assert.match(await read("src/styles/base.css"), /prefers-reduced-motion/);
  assert.match(await read("src/scripts/pixel.ts"), /prefers-reduced-motion/);
});

test("source links are built from the repository constants", async () => {
  const site = await read("src/data/site.ts");
  assert.match(site, /github\.com\/THE-SHRIKS\/SAAR-LokiXPiyush/);
});
