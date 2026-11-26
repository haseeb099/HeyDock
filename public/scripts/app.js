(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('site-header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');

  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-compact', window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('open', open);
    });
  }

  document.querySelectorAll('[data-mega]').forEach(function (item) {
    var btn = item.querySelector('.nav-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('open');
      document.querySelectorAll('[data-mega].open').forEach(function (el) {
        if (el !== item) {
          el.classList.remove('open');
          var b = el.querySelector('.nav-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-mega].open').forEach(function (el) {
      el.classList.remove('open');
      var b = el.querySelector('.nav-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    if (nav && nav.classList.contains('open') && toggle) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-mega], .nav-toggle, #main-nav')) return;
    document.querySelectorAll('[data-mega].open').forEach(function (el) {
      el.classList.remove('open');
      var b = el.querySelector('.nav-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  var reveals = document.querySelectorAll('.reveal');
  if (reduce) {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) {
      io.observe(el);
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 0) && r.bottom > 0) el.classList.add('in-view');
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var statusEl = document.getElementById('enquiry-status');
  var successEl = document.getElementById('enquiry-success');
  var submitBtn = form.querySelector('[type="submit"]');
  var defaultLabel = submitBtn ? submitBtn.innerHTML : 'Send enquiry';

  var params = new URLSearchParams(window.location.search);
  var preService = params.get('service');
  if (preService && form.elements.namedItem('service')) {
    form.elements.namedItem('service').value = preService;
  }

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    statusEl.textContent = message || '';
    statusEl.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  }

  function setSending(on) {
    if (!submitBtn) return;
    form.dataset.sending = on ? '1' : '0';
    submitBtn.disabled = on;
    submitBtn.innerHTML = on ? 'Sending…' : defaultLabel;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');
    setSending(true);
    var data = Object.fromEntries(new FormData(form).entries());
    data.consent = form.querySelector('[name="consent"]') && form.querySelector('[name="consent"]').checked;
    fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body && result.body.ok) {
          form.hidden = true;
          if (successEl) {
            successEl.hidden = false;
            successEl.focus && successEl.focus();
          }
          setStatus('ok', 'Thank you. Your enquiry has been sent.');
          return;
        }
        var msg = (result.body && result.body.error) || 'We could not send your enquiry. Please try again.';
        setStatus('error', msg);
      })
      .catch(function () {
        setStatus('error', 'We could not send your enquiry. Check your connection and try again.');
      })
      .finally(function () { setSending(false); });
  });
})();
