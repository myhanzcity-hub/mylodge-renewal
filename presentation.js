(() => {
  'use strict';
  const deck = document.querySelector('[data-deck]');
  const slides = [...document.querySelectorAll('[data-slide]')];
  if (!deck || !slides.length) return;
  const previous = document.querySelector('[data-previous]');
  const next = document.querySelector('[data-next]');
  const counter = document.querySelector('[data-counter]');
  const title = document.querySelector('[data-current-title]');
  const progress = document.querySelector('[data-progress]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (pointer: fine)');
  const saveData = navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '');
  let current = 0;
  let lastNavigation = 0;

  function hashIndex() {
    const number = Number(location.hash.match(/^#page=(\d+)$/)?.[1] || 1);
    return Math.max(0, Math.min(slides.length - 1, number - 1));
  }
  function show(index, updateAddress = true) {
    const destination = Math.max(0, Math.min(slides.length - 1, index));
    const moveFocus=slides.some(slide=>slide!==slides[destination]&&slide.contains?.(document.activeElement));
    deck.dataset.direction = destination < current ? 'backward' : 'forward';
    current = destination;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.classList.remove('is-entering');
      if (i === current) {
        slide.scrollTop = 0;
        if (!reducedMotion.matches) slide.classList.add('is-entering');
        slide.querySelector('img')?.setAttribute('loading', 'eager');
      }
    });
    const active = slides[current];
    if(moveFocus)deck.focus?.({preventScroll:true});
    previous.disabled = current === 0;
    next.querySelector('span').textContent = current === slides.length - 1 ? '처음으로' : '다음';
    next.querySelector('b').textContent = current === slides.length - 1 ? '↺' : '→';
    next.setAttribute('aria-label', current === slides.length - 1 ? '첫 페이지로 돌아가기' : `${current + 2}페이지 보기`);
    previous.setAttribute('aria-label', `${Math.max(1, current)}페이지 보기`);
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
    title.textContent = `${current + 1} / ${slides.length} · ${active.dataset.title}`;
    progress.style.width = `${(current + 1) / slides.length * 100}%`;
    document.title = `${String(current + 1).padStart(2, '0')} ${active.dataset.title} | MYLODGE`;
    if(desktop.matches&&!saveData)slides[current + 1]?.querySelector('img')?.setAttribute('loading', 'eager');
    lastNavigation = performance.now();
    if (updateAddress) {
      try { history.replaceState(null, '', `#page=${current + 1}`); } catch { /* Direct local files can restrict history updates. */ }
    }
  }
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current === slides.length - 1 ? 0 : current + 1));
  addEventListener('hashchange', () => show(hashIndex(), false));
  addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); show(Math.min(slides.length - 1, current + 1)); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); show(current - 1); }
    if (event.key === 'Home') { event.preventDefault(); show(0); }
    if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
  });
  let touchStart;
  deck.addEventListener('pointerdown', event => {
    if(event.pointerType!=='touch')return;
    touchStart=null;
    if(!event.isPrimary||event.target.closest('a, button, input, textarea, select, summary, [contenteditable="true"]'))return;
    touchStart={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
  }, {passive: true});
  deck.addEventListener('pointermove',event=>{
    if(!touchStart||event.pointerId!==touchStart.id)return;
    const dx=Math.abs(event.clientX-touchStart.x),dy=Math.abs(event.clientY-touchStart.y);
    if(dy>12&&dy>dx)touchStart=null;
  },{passive:true});
  deck.addEventListener('pointerup', event => {
    if (!touchStart || event.pointerType !== 'touch' || event.pointerId!==touchStart.id) return;
    const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
    const elapsed=performance.now()-touchStart.time;
    touchStart = null;
    if (elapsed<1000&&Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) show(current + (dx < 0 ? 1 : -1));
  });
  deck.addEventListener('pointercancel', () => { touchStart = null; });
  let wheelTotal = 0, lastWheel = 0;
  deck.addEventListener('wheel', event => {
    if(event.target?.closest('select, input, textarea, [role="listbox"]'))return;
    if (!desktop.matches || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const slide = slides[current];
    const canScroll = slide.scrollHeight > slide.clientHeight + 4;
    const scrollInside = canScroll && ((event.deltaY > 0 && slide.scrollTop + slide.clientHeight < slide.scrollHeight - 3) || (event.deltaY < 0 && slide.scrollTop > 3));
    if (scrollInside) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastNavigation < 650) return;
    if (now - lastWheel > 160) wheelTotal = 0;
    lastWheel = now;
    wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : 1);
    if (Math.abs(wheelTotal) >= 75) {
      show(current + (wheelTotal > 0 ? 1 : -1));
      wheelTotal = 0;
    }
  }, {passive: false});
  show(hashIndex(), false);
})();
