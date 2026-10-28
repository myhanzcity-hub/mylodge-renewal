// The intro precedes a fresh visit; chapter links also serve as the return route.
(() => {
  if (/^#page=\d+$/.test(location.hash)) return;
  const destination = new URL('intro.html', location.href);
  destination.search = location.search;
  location.replace(destination.href);
})();
