// Site animations: scroll reveals, header shrink, photo viewer, draggable project row, device tilt.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var ICON = {
    prev: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5"/></svg>',
    next: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5"/></svg>',
    close: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15"/></svg>'
  };
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* 1, 7, 10: fade-up on scroll, staggered for items that appear together */
  var revealSel = [
    '.page-intro > *', '.section-cards .card', '.photo-grid .tile', '.project-row', '.g-tile', '.cs-head', '.cs-pillar', '.cs-split',
    '.cs-screens-head', '.feature', '.pair figure', '.phones figure', '.sitemap', '.site-card', '.cs-rule', '.folder'
  ].join(',');
  var targets = $$(revealSel).filter(function (el) { return !el.closest('.cs-head') || el.classList.contains('cs-head'); });
  if (!reduce && 'IntersectionObserver' in window) {
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) {
          var ra = a.boundingClientRect, rb = b.boundingClientRect;
          return Math.abs(ra.top - rb.top) > 20 ? ra.top - rb.top : ra.left - rb.left;
        });
      batch.forEach(function (e, i) {
        e.target.style.setProperty('--d', Math.min(i * 90, 450) + 'ms');
        e.target.classList.add('in');
        io.unobserve(e.target);
        e.target.addEventListener('transitionend', function done() {
          e.target.style.removeProperty('--d');
          e.target.removeEventListener('transitionend', done);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* 3: header shrinks once you scroll */
  var header = document.querySelector('.site-header');
  if (header) {
    var ticking = false;
    var update = function () { header.classList.toggle('scrolled', window.scrollY > 40); ticking = false; };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* 8: full-size photo viewer for the galleries */
  var tiles = $$('.gallery .g-tile');
  if (tiles.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<img alt="">' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close">' + ICON.close + '</button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous photo">' + ICON.prev + '</button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next photo">' + ICON.next + '</button>' +
      '<p class="lb-count" aria-live="polite"></p>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), count = lb.querySelector('.lb-count');
    var index = 0, opener = null;

    var show = function (i) {
      index = (i + tiles.length) % tiles.length;
      var src = tiles[index].querySelector('img');
      var apply = function () {
        lbImg.src = src.currentSrc || src.src;
        lbImg.alt = src.alt;
        lbImg.style.transform = /scaleX\(-1\)/.test(src.getAttribute('style') || '') ? 'scaleX(-1)' : '';
        count.textContent = (index + 1) + ' / ' + tiles.length;
        lbImg.classList.remove('swap');
      };
      if (lb.classList.contains('open') && !reduce) {
        lbImg.classList.add('swap');
        setTimeout(apply, 150);
      } else { apply(); }
      // preload neighbours
      [index + 1, index - 1].forEach(function (n) {
        var t = tiles[(n + tiles.length) % tiles.length].querySelector('img');
        var im = new Image(); im.src = t.currentSrc || t.src;
      });
    };
    var open = function (i) {
      opener = document.activeElement;
      show(i);
      lb.classList.add('open');
      document.body.classList.add('lb-lock');
      lb.querySelector('.lb-close').focus();
    };
    var close = function () {
      lb.classList.remove('open');
      document.body.classList.remove('lb-lock');
      if (opener && opener.focus) opener.focus();
    };

    tiles.forEach(function (tile, i) {
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', 'View ' + tile.querySelector('img').alt + ' full size');
      tile.addEventListener('click', function () { open(i); });
      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'Tab') { // keep focus inside the viewer
        var f = $$('button', lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    // swipe left / right on touch screens
    var sx = null, sy = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
      sx = sy = null;
    });
  }

  /* 9: the project row scrolls sideways (trackpad, touch, shift+wheel) and can be dragged with a mouse */
  var row = document.querySelector('.project-row');
  if (row) {
    var step = function () { var t = row.querySelector('.tile'); return t ? t.getBoundingClientRect().width + 20 : 300; };
    row.classList.add('draggable');
    var down = false, moved = false, startX = 0, startLeft = 0;
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; row.classList.add('dragging'); }
      if (moved) row.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        row.classList.remove('dragging');
        // snap to the nearest card after letting go
        var s = step();
        row.scrollTo({ left: Math.round(row.scrollLeft / s) * s, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
    // a drag should not count as a click on a card
    row.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  }

  /* 10: device mockups tilt slightly toward the mouse */
  if (canHover && !reduce) {
    $$('.feature .shot.device img, .phones figure img').forEach(function (img) {
      var box = img.parentElement;
      box.classList.add('tilt-wrap');
      img.classList.add('tilt');
      box.addEventListener('pointermove', function (e) {
        var r = img.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg)';
      });
      box.addEventListener('pointerleave', function () { img.style.transform = ''; });
    });
  }
})();
