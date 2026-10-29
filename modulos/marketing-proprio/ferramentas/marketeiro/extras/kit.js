(function () {
  'use strict';
  var toast = document.querySelector('.toast');
  function show(text) {
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(show.t);
    show.t = setTimeout(function () { toast.classList.remove('on'); }, 1600);
  }
  document.querySelectorAll('.swatch').forEach(function (b) {
    b.addEventListener('click', function () {
      var hex = b.dataset.hex;
      var done = function () { show('Copiado ' + hex); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(hex).then(done, function () { show(hex); });
      else show(hex);
    });
  });
  var links = [].slice.call(document.querySelectorAll('.toc a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('main section').forEach(function (s) { io.observe(s); });
  }
})();
