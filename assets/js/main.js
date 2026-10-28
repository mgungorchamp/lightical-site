/* Lightical: mobile menu + contact form. No other JavaScript on the site. */
(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) setOpen(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- Contact form -> Google Forms ---------- */
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.noValidate = true; // our own friendly messages replace the browser bubbles when JS runs

  var ENDPOINT = form.getAttribute('action');
  var VIEWFORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdd-3sJUOmBPT5BagEqw4-WrahPjcqdedrp0uwc-gM8zDx_Fg/viewform';
  var ENTRY = { name: 'entry.2005620554', email: 'entry.1045781291', message: 'entry.839337160' };

  var nameEl = document.getElementById('cf-name');
  var emailEl = document.getElementById('cf-email');
  var orgEl = document.getElementById('cf-org');
  var msgEl = document.getElementById('cf-message');
  var hpEl = document.getElementById('cf-website');
  var status = document.getElementById('form-status');
  var submitBtn = form.querySelector('.btn-submit');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = [
    { el: nameEl, check: function (v) { return v ? '' : 'Please tell us your name.'; } },
    { el: emailEl, check: function (v) {
        if (!v) return 'Please enter your email so we can reply.';
        return EMAIL_RE.test(v) ? '' : 'That email address doesn\u2019t look quite right. Please check it.';
      } },
    { el: msgEl, check: function (v) {
        if (!v) return 'Please write a short message.';
        return v.length < 10 ? 'Could you add a little more detail? (at least 10 characters)' : '';
      } }
  ];

  function showError(el, msg) {
    var err = document.getElementById(el.id + '-err');
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      err.textContent = msg;
      err.hidden = false;
    } else {
      el.removeAttribute('aria-invalid');
      err.textContent = '';
      err.hidden = true;
    }
  }

  function validate() {
    var firstBad = null;
    rules.forEach(function (r) {
      var msg = r.check(r.el.value.trim());
      showError(r.el, msg);
      if (msg && !firstBad) firstBad = r.el;
    });
    return firstBad;
  }

  // Re-check a field once the user has been told about it.
  rules.forEach(function (r) {
    r.el.addEventListener('input', function () {
      if (r.el.getAttribute('aria-invalid') === 'true') showError(r.el, r.check(r.el.value.trim()));
    });
  });

  function setStatus(kind, html) {
    status.className = 'form-status is-' + kind;
    status.innerHTML = html;
    status.hidden = false;
    if (kind !== 'pending') status.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) { bad.focus(); return; }

    // Honeypot: silently ignore bots.
    if (hpEl && hpEl.value) {
      setStatus('success', '<p><strong>Thanks, your message was sent.</strong></p>');
      form.reset();
      return;
    }

    var org = orgEl.value.trim();
    var message = msgEl.value.trim();
    var body = new URLSearchParams();
    body.append(ENTRY.name, nameEl.value.trim());
    body.append(ENTRY.email, emailEl.value.trim());
    body.append(ENTRY.message, org ? 'Organization: ' + org + '\n\n' + message : message);
    body.append('fvv', '1');
    body.append('pageHistory', '0');

    submitBtn.disabled = true;
    setStatus('pending', '<p>Sending your message\u2026</p>');

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

    // Google Forms does not send CORS headers, so the response is opaque.
    // fetch() only rejects on a network failure (or our timeout), which is what we report.
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: body,
      signal: controller ? controller.signal : undefined
    }).then(function () {
      setStatus('success', '<p><strong>Thanks, your message was sent.</strong></p><p>We\u2019ll get back to you by email.</p>');
      form.reset();
    }).catch(function () {
      setStatus('error', '<p><strong>Sorry, your message couldn\u2019t be sent.</strong></p>' +
        '<p>Please check your connection and try again, or <a href="' + VIEWFORM + '" target="_blank" rel="noopener">open the contact form</a> directly.</p>');
    }).then(function () {
      if (timer) clearTimeout(timer);
      submitBtn.disabled = false;
    });
  });
})();

/* Screen example lightbox (native <dialog>; without JS the links simply open the image) */
(function () {
  var dialog = document.getElementById('ex-dialog');
  var links = document.querySelectorAll('.ex-link');
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;
  var img = document.getElementById('ex-dialog-img');
  var cap = document.getElementById('ex-dialog-caption');
  var opener = null;

  function supportsWebp() {
    try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; }
    catch (e) { return false; }
  }
  var webp = supportsWebp();

  Array.prototype.forEach.call(links, function (link) {
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
      e.preventDefault();
      opener = link;
      img.src = (webp && link.getAttribute('data-webp')) || link.getAttribute('href');
      img.width = +link.getAttribute('data-w') || 1600;
      img.height = +link.getAttribute('data-h') || 900;
      img.alt = link.getAttribute('data-alt') || '';
      cap.textContent = link.getAttribute('data-caption') || '';
      dialog.showModal();
      document.body.classList.add('lightbox-open');
      var btn = dialog.querySelector('.lightbox-close');
      if (btn) btn.focus();
    });
  });

  // Click on the backdrop (outside the figure and close button) closes the dialog
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });

  // Keep Tab focus inside the dialog (only one focusable control: the close button)
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var btn = dialog.querySelector('.lightbox-close');
      if (btn) btn.focus();
    }
  });

  dialog.addEventListener('close', function () {
    document.body.classList.remove('lightbox-open');
    if (opener) opener.focus();
  });
})();
