// Folder version: folders open with a short zoom, and on desktop they can be dragged around like icons on a Mac.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var folders = Array.prototype.slice.call(document.querySelectorAll('.folder, .pfolder-link'));

  /* ---------- open with a zoom ---------- */
  folders.forEach(function (folder) {
    folder.addEventListener('click', function (e) {
      if (folder.dataset.justDragged) { e.preventDefault(); delete folder.dataset.justDragged; return; }
      if (reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let new-tab clicks work normally
      e.preventDefault();
      folder.classList.add('opening');
      setTimeout(function () { window.location.href = folder.href; }, 260);
    });
  });
  // coming back with the browser's Back button: show the folder again
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('.opening').forEach(function (f) { f.classList.remove('opening'); });
  });

  /* ---------- drag folders like desktop icons ---------- */
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable: positions just reset next visit */ } }
  };
  var page = location.pathname.split('/').pop() || 'index.html';
  var topZ = 5;
  var isFloating = function (el) { return getComputedStyle(el).position === 'absolute'; };
  var keyFor = function (el) { return 'folder-pos:' + page + ':' + el.getAttribute('href'); };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  // put a folder at a saved spot (x is stored as a share of the area's width so it survives window resizes)
  var place = function (el, pos) {
    var area = el.offsetParent; if (!area) return;
    var maxX = area.clientWidth - el.offsetWidth, maxY = Math.max(0, area.clientHeight - el.offsetHeight);
    el.style.left = clamp(pos.fx * area.clientWidth, 0, maxX) + 'px';
    el.style.top = clamp(pos.y, -40, maxY) + 'px';
  };
  var restore = function () {
    folders.forEach(function (el) {
      if (!isFloating(el)) { el.style.left = el.style.top = ''; return; }
      var pos = store.get(keyFor(el)); if (pos) place(el, pos);
    });
  };
  restore();
  window.addEventListener('resize', restore);

  folders.forEach(function (el) {
    el.setAttribute('draggable', 'false');
    var startX, startY, originL, originT, dragging = false, pointerId = null;

    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.pointerType === 'touch' || !isFloating(el)) return; // touch keeps normal tap-to-open
      pointerId = e.pointerId; startX = e.clientX; startY = e.clientY;
      originL = el.offsetLeft; originT = el.offsetTop; dragging = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (pointerId !== e.pointerId) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return; // small wobble still counts as a click
        dragging = true;
        try { el.setPointerCapture(pointerId); } catch (err) { /* keep dragging even if capture is unavailable */ }
        el.classList.add('dragging');
        el.style.zIndex = ++topZ;
      }
      var area = el.offsetParent;
      el.style.left = clamp(originL + dx, 0, area.clientWidth - el.offsetWidth) + 'px';
      el.style.top = clamp(originT + dy, -40, Math.max(0, area.clientHeight - el.offsetHeight)) + 'px';
    });
    var end = function (e) {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      el.dataset.justDragged = '1'; // the click that follows a drag should not open the folder
      setTimeout(function () { delete el.dataset.justDragged; }, 0);
      store.set(keyFor(el), { fx: el.offsetLeft / el.offsetParent.clientWidth, y: el.offsetTop });
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  });

  // double-click empty desktop space to tidy the folders back to where they started (like Clean Up on a Mac)
  document.querySelectorAll('.v2-home, .sec-desktop').forEach(function (area) {
    area.addEventListener('dblclick', function (e) {
      if (e.target.closest('.folder, a, p, h1, h2, nav.pathbar')) return;
      folders.forEach(function (el) {
        if (area.contains(el)) { el.style.left = el.style.top = ''; try { localStorage.removeItem(keyFor(el)); } catch (err) {} }
      });
    });
  });
})();
