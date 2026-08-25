/* ==========================================================================
   Nutra Resolutions — site behaviour
   Shared by index.html and intake-form.html.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     FORM DELIVERY ENDPOINT  —  ⚠️ REPLACE BEFORE LAUNCH
     ------------------------------------------------------------------------
     Build spec §9: submissions must land somewhere real. Until Dr. Bruce
     confirms the destination (email inbox / CRM / Shopify form app), point
     this at a Formspree form created on info@nutraresolutions.com:

       1. Create the form at https://formspree.io  →  copy the form ID
       2. Replace REPLACE_ME below with that ID, e.g. 'https://formspree.io/f/xdkoqwer'
       3. Submit the live form once to confirm delivery

     While the placeholder is still in place the form deliberately refuses to
     submit and tells the visitor to email instead — it never fakes a success.
     ---------------------------------------------------------------------- */
  var FORM_ENDPOINT = 'https://formspree.io/f/REPLACE_ME';
  var FALLBACK_EMAIL = 'info@nutraresolutions.com';

  var isConfigured = FORM_ENDPOINT.indexOf('REPLACE_ME') === -1;

  /* --- Current year in the footer --------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --- Mobile nav -------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
    });
    // Close after tapping a link so in-page anchors are visible
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Intake form ------------------------------------------------------- */
  var form = document.getElementById('intake-form');
  if (!form) return;

  var statusEl = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');
  var receipt = document.getElementById('receipt');

  function setStatus(kind, html) {
    statusEl.className = 'form-status form-status--' + kind;
    statusEl.innerHTML = html;
    statusEl.hidden = false;
  }

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.innerHTML = '';
  }

  // At least one "format" checkbox must be ticked — the browser can't express
  // "required" across a checkbox group on its own.
  function validateFormatGroup() {
    var boxes = form.querySelectorAll('input[name="format"]');
    var anyChecked = Array.prototype.some.call(boxes, function (b) { return b.checked; });
    boxes[0].setCustomValidity(anyChecked ? '' : 'Select at least one product format.');
    return anyChecked;
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'format') validateFormatGroup();
  });

  function focusFirstInvalid() {
    var invalid = form.querySelector(':invalid');
    if (!invalid) return;
    // A checkbox/radio in a group scrolls better by its fieldset
    var target = invalid.closest('.qgroup') || invalid.closest('.field') || invalid;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof invalid.focus === 'function') invalid.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();
    validateFormatGroup();

    if (!form.checkValidity()) {
      setStatus('error', 'Some required fields still need an answer. We&rsquo;ve jumped you to the first one.');
      focusFirstInvalid();
      return;
    }

    // Honeypot: a bot filled the hidden field. Silently stop.
    if (form.elements.company_fax && form.elements.company_fax.value !== '') return;

    if (!isConfigured) {
      setStatus('error',
        'This form isn&rsquo;t connected to a mailbox yet. Please email your project details to ' +
        '<a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a> and we&rsquo;ll pick it up from there.');
      return;
    }

    var data = new FormData(form);
    data.delete('company_fax');
    // Multi-selects arrive as repeated keys; collapse them for readable email
    ['format', 'label_claims'].forEach(function (key) {
      var values = data.getAll(key);
      data.delete(key);
      if (values.length) data.append(key, values.join(', '));
    });
    data.append('_subject', 'Project intake — ' + (data.get('company') || 'new enquiry'));

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending&hellip;';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed with status ' + res.status);
        form.hidden = true;
        receipt.hidden = false;
        receipt.focus();
        receipt.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function () {
        setStatus('error',
          'Something went wrong sending your details. Please try again, or email them to ' +
          '<a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit project details';
      });
  });
})();
