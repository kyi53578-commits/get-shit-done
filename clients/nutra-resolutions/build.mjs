#!/usr/bin/env node
/**
 * Inlines assets/nutra.css and assets/nutra.js into each page and writes the
 * result to dist/. The dist files are single, self-contained HTML documents —
 * paste one into a Shopify page using a custom "page.html" template (or a page
 * builder's raw-HTML block) and it renders without uploading any assets.
 *
 * Usage: node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

const css = readFileSync(join(root, 'assets/nutra.css'), 'utf8');
const js = readFileSync(join(root, 'assets/nutra.js'), 'utf8');

for (const page of ['index.html', 'intake-form.html']) {
  const out = readFileSync(join(root, page), 'utf8')
    .replace(
      '<link rel="stylesheet" href="assets/nutra.css">',
      `<style>\n${css}\n</style>`
    )
    .replace(
      '<script src="assets/nutra.js"></script>',
      `<script>\n${js}\n</script>`
    );

  if (out.includes('assets/nutra.')) {
    throw new Error(`${page}: asset tags did not match — inlining incomplete`);
  }

  writeFileSync(join(dist, page), out);
  console.log(`dist/${page}  ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB`);
}
