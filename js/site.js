/**
 * MMHSG: site behaviour
 * Join links, header shadow, menu overlay, scroll reveal, events, footer year.
 */
(function () {
  'use strict';

  var content = window.SITE_CONTENT || {};
  var brand = content.brand || {};
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Join links: every [data-link="join"] points to the one config URL ----
  function setupJoinLinks() {
    var url = brand.JOIN_FORM_URL;
    var links = document.querySelectorAll('[data-link="join"]');
    if (!url) {
      if (links.length) console.warn('[MMHSG] JOIN_FORM_URL is missing in js/site-content.js');
      return;
    }
    links.forEach(function (a) {
      a.setAttribute('href', url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  // ---- Header shadow on scroll ----
  function setupHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Menu overlay ----
  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var overlay = document.getElementById('menu-overlay');
    var closeBtn = document.querySelector('.menu-close');
    if (!toggle || !overlay) return;

    var lastFocused = null;

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      var focusable = overlay.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function open() {
      lastFocused = document.activeElement;
      overlay.removeAttribute('inert');
      overlay.classList.add('is-open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      overlay.addEventListener('keydown', trapFocus);
      requestAnimationFrame(function () { if (closeBtn) closeBtn.focus(); });
    }

    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('inert', '');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.removeEventListener('keydown', trapFocus);
      if (lastFocused) { lastFocused.focus(); lastFocused = null; }
    }

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });

    overlay.querySelectorAll('.menu-nav a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  // ---- Scroll reveal ----
  function observeReveals(elements) {
    if (!elements.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(function (el) { observer.observe(el); });
  }

  // ---- Events (events page only) ----
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function icon(pathData) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('aria-hidden', 'true');
    pathData.forEach(function (d) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
    });
  }

  function isSafeUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
  }

  function isSafeImage(url) {
    return typeof url === 'string' && /^(https?:\/\/|images\/)/i.test(url);
  }

  var DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

  function endOf(evt) {
    var start = new Date(evt.startsAt);
    var end = evt.endsAt ? new Date(evt.endsAt) : null;
    return end && !isNaN(end.getTime()) ? end : new Date(start.getTime() + DEFAULT_DURATION_MS);
  }

  // Events that have not finished yet, soonest first
  function getUpcomingEvents() {
    var now = new Date();
    return (Array.isArray(content.events) ? content.events : [])
      .filter(function (evt) {
        var start = new Date(evt && evt.startsAt);
        return evt && evt.title && !isNaN(start.getTime()) && endOf(evt) >= now;
      })
      .sort(function (a, b) { return new Date(a.startsAt) - new Date(b.startsAt); });
  }

  // ---- Add to calendar ----
  function calStamp(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function calDescription(evt) {
    return evt.description || '';
  }

  function googleCalendarUrl(evt) {
    var start = new Date(evt.startsAt);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent((brand.abbr ? brand.abbr + ': ' : '') + evt.title) +
      '&dates=' + calStamp(start) + '/' + calStamp(endOf(evt)) +
      '&details=' + encodeURIComponent(calDescription(evt)) +
      '&location=' + encodeURIComponent(evt.isOnline ? 'Online' : (evt.location || ''));
  }

  function icsEscape(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function downloadIcs(evt) {
    var start = new Date(evt.startsAt);
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MMHSG//Events//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + (evt.id || calStamp(start)) + '@mmhsg',
      'DTSTAMP:' + calStamp(new Date()),
      'DTSTART:' + calStamp(start),
      'DTEND:' + calStamp(endOf(evt)),
      'SUMMARY:' + icsEscape((brand.abbr ? brand.abbr + ': ' : '') + evt.title),
      'DESCRIPTION:' + icsEscape(calDescription(evt)),
      'LOCATION:' + icsEscape(evt.isOnline ? 'Online' : (evt.location || '')),
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Starting in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (evt.id || 'event') + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderEvents() {
    var list = document.getElementById('events-list');
    var empty = document.getElementById('events-empty');
    if (!list || !empty) return;

    var upcoming = getUpcomingEvents();

    if (!upcoming.length) {
      empty.hidden = false;
      list.hidden = true;
      return;
    }

    empty.hidden = true;
    list.hidden = false;
    list.textContent = '';
    list.classList.toggle('events-single', upcoming.length === 1);

    upcoming.forEach(function (evt) {
      var card = el('article', 'event-card reveal');

      if (isSafeImage(evt.poster)) {
        var posterWrap = el('div', 'event-card-poster');
        var img = document.createElement('img');
        img.src = evt.poster;
        img.alt = evt.posterAlt || '';
        img.loading = 'lazy';
        posterWrap.appendChild(img);
        card.appendChild(posterWrap);
        card.classList.add('has-poster');
      }

      var body = el('div', 'event-card-body');
      body.appendChild(el('span', 'event-card-category', evt.category || 'event'));
      body.appendChild(el('h3', '', evt.title));

      var meta = el('div', 'event-card-meta');
      var when = el('span');
      when.appendChild(icon(['M3 6h18v15H3z', 'M16 2v4M8 2v4M3 10h18']));
      when.appendChild(document.createTextNode(formatDate(evt.startsAt)));
      var where = el('span');
      where.appendChild(icon(['M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z', 'M12 10h.01']));
      where.appendChild(document.createTextNode(evt.isOnline ? 'Online' : (evt.location || 'To be announced')));
      meta.appendChild(when);
      meta.appendChild(where);
      body.appendChild(meta);

      if (evt.description) body.appendChild(el('p', '', evt.description));

      if (isSafeUrl(evt.link)) {
        var a = el('a', 'btn btn-primary', 'Join this event');
        a.href = evt.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        body.appendChild(a);
      }

      body.appendChild(el('p', 'event-card-cal-label', 'Add to your calendar'));
      var actions = el('div', 'event-card-actions');
      var g = el('a', 'btn btn-secondary', 'Google Calendar');
      g.href = googleCalendarUrl(evt);
      g.target = '_blank';
      g.rel = 'noopener noreferrer';
      var ics = el('button', 'btn btn-secondary', 'Apple / Outlook (.ics)');
      ics.type = 'button';
      ics.addEventListener('click', function () { downloadIcs(evt); });
      actions.appendChild(g);
      actions.appendChild(ics);
      body.appendChild(actions);

      card.appendChild(body);
      list.appendChild(card);
    });

    observeReveals(list.querySelectorAll('.reveal'));
  }

  // ---- Homepage teaser: show the next event instead of "Nothing scheduled yet" ----
  function renderEventsTeaser() {
    var text = document.getElementById('events-teaser-text');
    if (!text) return;
    var next = getUpcomingEvents()[0];
    if (!next) return;
    text.textContent = 'Next up: ' + next.title + ', ' + formatDate(next.startsAt) +
      (next.isOnline ? ', online' : (next.location ? ', ' + next.location : '')) + '.';
  }

  // ---- Footer year ----
  function setYear() {
    document.querySelectorAll('[data-year]').forEach(function (n) {
      n.textContent = String(new Date().getFullYear());
    });
  }

  setupJoinLinks();
  setupHeader();
  setupMenu();
  renderEvents();
  renderEventsTeaser();
  setYear();
  observeReveals(document.querySelectorAll('.reveal:not(.event-card)'));
})();
