// Header dropdowns: hover opens on desktop (CSS); the chevron button toggles for touch and keyboard.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));
  function close(item) {
    item.classList.remove('open');
    item.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
  }
  items.forEach(function (item) {
    var btn = item.querySelector('.nav-toggle');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !item.classList.contains('open');
      items.forEach(close);
      if (opening) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && item.classList.contains('open')) { close(item); btn.focus(); }
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) close(item);
    });
  });
  document.addEventListener('click', function (e) {
    items.forEach(function (item) { if (!item.contains(e.target)) close(item); });
  });
})();
