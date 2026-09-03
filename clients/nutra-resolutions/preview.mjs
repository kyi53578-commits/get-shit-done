#!/usr/bin/env node
/**
 * Wraps the two built pages in a review shell and writes preview.html.
 * Each page renders in its own iframe, so the real markup, CSS, and JS run
 * untouched — what you review is what deploys. Links between the two pages
 * are intercepted and switch the view instead of 404ing.
 *
 * Usage: node build.mjs && node preview.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/* --client drops the internal review panel and writes preview-client.html —
   the version that is safe to send to the client. The default build keeps the
   panel and is for us. */
const CLIENT = process.argv.includes('--client');

/* Injected into each page so in-page links drive the shell's view switcher. */
const BRIDGE = `
<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var m = /^(index|intake-form)\\.html(#.*)?$/.exec(a.getAttribute('href') || '');
  if (!m) return;
  e.preventDefault();
  parent.postMessage({ nrNav: m[1], hash: m[2] || '' }, '*');
});
<\/script>
`;

/** Embed page source in a <script type="text/plain"> without ending it early. */
function embed(file) {
  let html = readFileSync(join(root, 'dist', file), 'utf8');

  // The markup carries our working notes as HTML comments — the UNCONFIRMED
  // flags, the FTC point about the "Dr." title, which claims came from data
  // brokers. Invisible on screen, but one View Source away, so the client
  // build drops them. Never strip these from dist/ itself: they are how the
  // flags survive to whoever deploys the page.
  if (CLIENT) html = html.replace(/<!--[\s\S]*?-->/g, '');

  html = html.replace('</body>', BRIDGE + '</body>');
  return html.replace(/<\/script/gi, '<\\/script');
}

const REVIEW_ITEMS = [
  {
    level: 'blocker',
    where: 'Team section',
    what: 'No job title on the page, on purpose',
    why: 'Sources said General Manager, the brief said owner. Rather than pick one, the section runs without a title — it reads fine. Ask Bruce in the last phase and drop the right one in. The “Based: Las Vegas” line came out too; he is not in Nevada.'
  },
  {
    level: 'blocker',
    where: 'Team section',
    what: 'The “Dr.” title is not on the page, deliberately',
    why: 'The credential I found is an M.D. (A.M.) in Alternative Medicine from the International University for Complementary Medicine — not a medical degree. “Dr.” sitting next to supplement quality claims is exactly what the FTC looks at. His call, but make it knowingly.'
  },
  {
    level: 'blocker',
    where: 'Team section',
    what: 'Career history is scraped data, unverified',
    why: 'Pure Essence Labs, Natural Alternatives International, Robinson Pharma, Aqueous Labs — all from data brokers, which are routinely stale or wrong. Strong credibility if true. An embarrassment if not.'
  },
  {
    level: 'blocker',
    where: 'Team section',
    what: 'No headshot yet',
    why: 'The portrait slot is a marked placeholder. Needs a real 4:5 photo, 800×1000px or better. I can’t take one from LinkedIn.'
  },
  {
    level: 'open',
    where: 'Hero card',
    what: 'Formats and MOQ unconfirmed',
    why: 'The six formats are drafted from what turnkey manufacturers typically offer. MOQ deliberately states no number rather than guess one.'
  },
  {
    level: 'open',
    where: 'Intake form',
    what: 'Not wired to a mailbox yet',
    why: 'Submitting shows the “not connected” message on purpose — it refuses rather than faking a success. Needs a Formspree ID once Bruce says where submissions should land.'
  },
  {
    level: 'open',
    where: 'Landing page',
    what: 'No phone number anywhere',
    why: 'Per the spec’s intent: the form plus info@nutraresolutions.com replace the first call. Reversible if he wants one listed.'
  }
];

const rows = REVIEW_ITEMS.map(i => `
      <li class="ri ri--${i.level}">
        <div class="ri__top">
          <span class="ri__tag">${i.level === 'blocker' ? 'Confirm first' : 'Open'}</span>
          <span class="ri__where">${i.where}</span>
        </div>
        <p class="ri__what">${i.what}</p>
        <p class="ri__why">${i.why}</p>
      </li>`).join('');

const blockers = REVIEW_ITEMS.filter(i => i.level === 'blocker').length;

const out = `<title>Nutra Resolutions ${CLIENT ? 'Draft' : 'Preview'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* The shell is deliberately not the brand palette — it must read as
   scaffolding around the deliverable, never as part of it. Single committed
   theme: it is a workbench, and it paints every surface explicitly. */
:root {
  --sh-bg:     #16181c;
  --sh-panel:  #1e2126;
  --sh-line:   #2f343b;
  --sh-text:   #e6e8ea;
  --sh-dim:    #9aa1ab;
  --sh-accent: #7fb3a8;
  --sh-flag:   #d98b6a;
  --sh-mono:   "IBM Plex Mono", ui-monospace, Menlo, monospace;
  --sh-ui:     "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
  --sh-bar:    48px;
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--sh-bg);
  color: var(--sh-text);
  font-family: var(--sh-ui);
  overflow: hidden;
}
:where(button, a):focus-visible { outline: 2px solid var(--sh-accent); outline-offset: 2px; }

/* --- top bar --- */
.bar {
  height: var(--sh-bar);
  display: flex; align-items: center; gap: .75rem;
  padding: 0 .85rem;
  background: var(--sh-panel);
  border-bottom: 1px solid var(--sh-line);
}
.bar__label {
  font-family: var(--sh-mono); font-size: .625rem;
  letter-spacing: .16em; text-transform: uppercase; color: var(--sh-dim);
  white-space: nowrap;
}
.seg { display: flex; border: 1px solid var(--sh-line); border-radius: 3px; overflow: hidden; }
.seg button {
  font-family: var(--sh-ui); font-size: .8125rem;
  background: transparent; color: var(--sh-dim);
  border: 0; padding: .45rem .8rem; cursor: pointer; white-space: nowrap;
}
.seg button + button { border-left: 1px solid var(--sh-line); }
.seg button[aria-pressed="true"] { background: var(--sh-accent); color: #10221e; font-weight: 500; }
.bar__gap { margin-left: auto; }
.flagbtn {
  display: inline-flex; align-items: center; gap: .5rem;
  font-family: var(--sh-ui); font-size: .8125rem;
  background: transparent; color: var(--sh-flag);
  border: 1px solid var(--sh-flag); border-radius: 3px;
  padding: .45rem .8rem; cursor: pointer; white-space: nowrap;
}
.flagbtn[aria-expanded="true"] { background: var(--sh-flag); color: #23150e; }

/* --- stage --- */
.stage {
  height: calc(100% - var(--sh-bar));
  display: grid; place-items: start center;
  background: #0d0f12;
  overflow: auto;
}
.frame {
  width: 100%; height: 100%;
  border: 0; background: #fff;
  display: block;
}
.stage[data-w="mobile"] { padding: 1.25rem 0; }
.stage[data-w="mobile"] .frame {
  width: 390px; height: 844px;
  max-width: 100%;
  border-radius: 6px;
  box-shadow: 0 10px 40px -12px rgba(0,0,0,.8);
}
.frame[hidden] { display: none; }

/* --- review panel --- */
.panel {
  position: fixed; inset: var(--sh-bar) 0 0 auto;
  width: min(30rem, 100%);
  background: var(--sh-panel);
  border-left: 1px solid var(--sh-line);
  overflow-y: auto;
  padding: 1.25rem;
  transform: translateX(100%);
  transition: transform .18s ease;
}
.panel[data-open="true"] { transform: none; }
@media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
.panel h2 { font-size: 1rem; font-weight: 600; margin: 0 0 .4rem; letter-spacing: -0.01em; }
.panel__note { font-size: .8125rem; color: var(--sh-dim); line-height: 1.55; margin: 0 0 1.25rem; }
.panel ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
.ri {
  border: 1px solid var(--sh-line);
  border-left: 3px solid var(--sh-dim);
  border-radius: 3px;
  padding: .8rem .9rem;
  background: #1a1d22;
}
.ri--blocker { border-left-color: var(--sh-flag); }
.ri--open { border-left-color: var(--sh-accent); }
.ri__top { display: flex; flex-wrap: wrap; gap: .3rem .6rem; align-items: baseline; margin-bottom: .45rem; }
.ri__tag {
  font-family: var(--sh-mono); font-size: .5625rem;
  letter-spacing: .14em; text-transform: uppercase;
}
.ri--blocker .ri__tag { color: var(--sh-flag); }
.ri--open .ri__tag { color: var(--sh-accent); }
.ri__where {
  font-family: var(--sh-mono); font-size: .5625rem;
  letter-spacing: .14em; text-transform: uppercase; color: var(--sh-dim);
}
.ri__what { font-size: .875rem; font-weight: 500; margin: 0 0 .35rem; line-height: 1.4; }
.ri__why { font-size: .8125rem; color: var(--sh-dim); margin: 0; line-height: 1.55; }

@media (max-width: 700px) {
  .bar { gap: .5rem; padding: 0 .6rem; }
  .bar__label { display: none; }
  .seg button { padding: .45rem .6rem; font-size: .75rem; }
}
</style>

<div class="bar">
  <span class="bar__label">${CLIENT ? 'Draft' : 'Preview'}</span>
  <div class="seg" role="group" aria-label="Page">
    <button type="button" data-page="index" aria-pressed="true">Landing page</button>
    <button type="button" data-page="intake-form" aria-pressed="false">Intake form</button>
  </div>
  <div class="seg bar__gap" role="group" aria-label="Viewport width">
    <button type="button" data-w="desktop" aria-pressed="true">Desktop</button>
    <button type="button" data-w="mobile" aria-pressed="false">Mobile</button>
  </div>
  ${CLIENT ? '' : `<button class="flagbtn" type="button" id="flagbtn" aria-expanded="false" aria-controls="panel">
    ${blockers} to confirm
  </button>`}
</div>

<div class="stage" id="stage" data-w="desktop">
  <iframe class="frame" id="f-index" title="Landing page"></iframe>
  <iframe class="frame" id="f-intake-form" title="Intake form" hidden></iframe>
</div>

${CLIENT ? '' : `<aside class="panel" id="panel" data-open="false" aria-label="Review notes">
  <h2>Before this goes near Dr. Bruce</h2>
  <p class="panel__note">
    Nothing below is a bug. These are places where I had no confirmed source, so
    the page either says nothing or is flagged in the markup rather than guessing.
  </p>
  <ul>${rows}
  </ul>
</aside>`}

<script type="text/plain" id="src-index">${embed('index.html')}</script>
<script type="text/plain" id="src-intake-form">${embed('intake-form.html')}</script>

<script>
(function () {
  var stage = document.getElementById('stage');
  var frames = { 'index': document.getElementById('f-index'),
                 'intake-form': document.getElementById('f-intake-form') };
  var current = 'index';

  function source(name) {
    return document.getElementById('src-' + name).textContent.replace(/<\\\\\\/script/g, '<\\/script');
  }

  Object.keys(frames).forEach(function (name) {
    frames[name].srcdoc = source(name);
  });

  function show(name, hash) {
    current = name;
    Object.keys(frames).forEach(function (n) { frames[n].hidden = n !== name; });
    document.querySelectorAll('[data-page]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.page === name));
    });
    var f = frames[name];
    if (hash) {
      // Reload so the anchor lands even if the page is already showing.
      f.srcdoc = source(name).replace('</head>',
        '<script>addEventListener("load",function(){var t=document.querySelector("' + hash + '");if(t)t.scrollIntoView();});<\\/script></head>');
    }
  }

  document.querySelectorAll('[data-page]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.page, ''); });
  });

  document.querySelectorAll('[data-w]').forEach(function (b) {
    if (!b.dataset.w) return;
    b.addEventListener('click', function () {
      stage.dataset.w = b.dataset.w;
      document.querySelectorAll('.seg [data-w]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.w === b.dataset.w));
      });
    });
  });

  var flagbtn = document.getElementById('flagbtn');
  var panel = document.getElementById('panel');
  if (flagbtn && panel) {
    flagbtn.addEventListener('click', function () {
      var open = panel.dataset.open === 'true';
      panel.dataset.open = String(!open);
      flagbtn.setAttribute('aria-expanded', String(!open));
    });
  }

  addEventListener('message', function (e) {
    if (e.data && e.data.nrNav) show(e.data.nrNav, e.data.hash || '');
  });
})();
<\/script>
`;

const outFile = CLIENT ? 'preview-client.html' : 'preview.html';
writeFileSync(join(root, outFile), out);
console.log(`${outFile}  ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB`);
