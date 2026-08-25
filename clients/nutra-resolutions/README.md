# Nutra Resolutions — landing page + client intake form

Build against Kayla's spec (`Nutra Resolutions — Build Spec`, client: Dr. Bruce).
Two pages, one shared design system, no build dependencies.

```
index.html            Landing page          (spec §5 section map)
intake-form.html      Client intake form    (spec §7 field map)
assets/nutra.css      Shared design system  (spec §4 palette / type / motif)
assets/nutra.js       Nav + form submission
build.mjs             Inlines CSS/JS -> dist/ for pasting into Shopify
dist/                 Generated, git-ignored. Single-file versions of both pages.
```

Preview locally: `python3 -m http.server -d . 8000` then open `localhost:8000`.
Regenerate the pasteable versions after any edit: `node build.mjs`.

---

## ⚠️ Two things must happen before this goes live

**1. Wire the form to a real mailbox.** `assets/nutra.js` line ~22 holds
`FORM_ENDPOINT`, currently `https://formspree.io/f/REPLACE_ME`. Until that ID is
replaced the form validates normally but **refuses to submit**, telling the
visitor to email `info@nutraresolutions.com` instead. It never shows a fake
success. To activate: create a Formspree form on `info@nutraresolutions.com`,
paste the ID in, run `node build.mjs`, redeploy, and submit once to confirm
delivery lands.

**2. Confirm the two unconfirmed claims.** Both are marked with `⚠️ UNCONFIRMED`
comments in `index.html`, in the Certificate of Capability card:
- **Formats** — the six listed (capsule, softgel, tablet, powder, gummy, liquid)
  are drafted from what turnkey manufacturers typically offer, not confirmed.
- **Minimum order** — deliberately states no number. It reads "Quoted per project"
  rather than publishing a guessed MOQ.

Compliance credentials (FDA-registered, cGMP-compliant) are confirmed per spec
§11 and are safe as written. Site copy in the hero, Services, and Compliance
sections is adapted from the live-site copy in spec §12.

---

## Platform approach

**Option B from spec §9 — standalone HTML, structured to convert to Liquid later.**

The markup is split into commented section blocks:

```html
<!-- ===== SECTION: hero =================================================== -->
```

Each block is self-contained, so converting to Option A later means moving one
block into `sections/nutra-hero.liquid`, wrapping the copy in `{{ section.settings.* }}`,
and appending a `{% schema %}` — no re-architecting. That work is additive
whenever theme access and timeline allow.

### Deploying to Shopify

1. `node build.mjs` — produces `dist/index.html` and `dist/intake-form.html`,
   each fully self-contained (CSS and JS inlined, ~36–40 KB). `dist/` is
   git-ignored by repo convention, so generate it fresh before each deploy.
2. In the theme, add a `page.custom-html` template that renders `{{ page.content }}`
   without the theme's own header and footer wrapper.
3. Create two pages — suggested handles `/pages/request-a-quote` (intake form)
   and the homepage — and paste the matching `dist/` file into each page's HTML
   source view, assigning the custom template.
4. **Update the cross-page links.** The files link to each other as
   `index.html` / `intake-form.html`. Once Shopify handles are set, swap these
   for the real paths (e.g. `/` and `/pages/request-a-quote`). There are 9 in
   `index.html` (7 to the form, 2 home) and 7 in `intake-form.html` (all home,
   4 of them anchored to landing-page sections).

Fonts load from Google Fonts. If Dr. Bruce prefers self-hosting, upload the
three families to theme assets and swap the `<link>` for an `@font-face` block;
the fallback stacks in `nutra.css` already degrade cleanly either way.

---

## What was verified

Both pages driven in headless Chromium at 1280×900 and 390×844:

- No horizontal overflow on either page at either width
- All 7 "Request a Quote" / "Start the form" CTAs route to the intake form
- No `tel:` link anywhere — the form is the first-contact path (spec §9)
- Real contact email present on the landing page
- All 6 process steps render; all 4 nav anchors resolve to real sections
- Mobile nav toggle opens, and closes again after tapping a link
- All 5 intake sections render; every form control has an accessible label
- Empty submit is blocked with a visible error and focus jumps to the first gap
- The format checkbox group enforces "at least one" (browsers can't do this natively)
- With no endpoint configured, submit refuses and surfaces the email — it does
  not fake a success receipt
- No script errors

Google Fonts is blocked in the build sandbox, so screenshots rendered in
fallback faces. Font *loading* is unverified; layout, behaviour, and the
fallback stacks are.

---

## Open questions for Dr. Bruce (spec §10)

1. **Formats** — which of capsule / softgel / tablet / powder / gummy / liquid
   do you actually run? (Blocks the hero card.)
2. **MOQ** — what is the real minimum order quantity? The card currently avoids
   stating one.
3. **Where should submissions land** — inbox, CRM, Slack? Formspree to
   `info@nutraresolutions.com` is the day-one default; anything else changes the
   integration.
4. **Phone number** — list one anywhere, or does the form plus
   `info@nutraresolutions.com` fully replace first-contact calls? Nothing is
   listed today, per the spec's intent.

## Not built (deliberately)

The printable/PDF version of the intake questions — spec §6 flags it as an
optional bonus to build after the web version ships.
