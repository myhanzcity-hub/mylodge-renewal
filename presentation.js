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
  const quickDialog = document.querySelector('[data-quick-dialog]');
  let quickSource;
  function showQuickView(view) {
    quickDialog.querySelector('[data-quick-title]').textContent = view === 'places' ? '머물 곳 둘러보기' : '견적 맞추기';
    for (const panel of quickDialog.querySelectorAll('[data-quick-view]')) panel.hidden = panel.dataset.quickView !== view;
    quickDialog.querySelector('[data-quick-body]').scrollTop = 0;
  }
  for (const source of deck.querySelectorAll?.('[data-quick-page]') || []) {
    source.addEventListener('click', event => {
      event.preventDefault();
      quickSource = source;
      showQuickView(source.dataset.quickPage === '3' ? 'places' : 'estimate');
      source.setAttribute('aria-expanded', 'true');
      quickDialog.showModal();
      quickDialog.querySelector('[data-quick-body]').scrollTop = 0;
    });
  }
  quickDialog?.querySelector('[data-quick-estimate]').addEventListener('click', () => {
    showQuickView('estimate');
    quickDialog.querySelector('[data-quote-region]').focus({preventScroll: true});
  });
  quickDialog?.querySelector('[data-quick-places]').addEventListener('click', () => {
    showQuickView('places');
    quickDialog.querySelector('[data-quick-region][aria-pressed="true"]').focus({preventScroll: true});
  });
  quickDialog?.querySelector('[data-quick-close]').addEventListener('click', () => quickDialog.close());
  quickDialog?.addEventListener('click', event => {
    if (event.target.closest('a[href^="#page="]')) quickDialog.close();
    if (event.target === quickDialog) {
      const rect = quickDialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) quickDialog.close();
    }
  });
  quickDialog?.addEventListener('close', () => {
    if (!quickSource) return;
    quickSource.setAttribute('aria-expanded', 'false');
    if (!quickSource.closest('[data-slide]').hidden) quickSource.focus({preventScroll: true});
  });
  const contents = document.querySelector('[data-contents-dialog]');
  const contentsButton = document.querySelector('[data-contents-open]');
  contentsButton?.addEventListener('click', () => {
    for (const link of contents.querySelectorAll('[data-toc-page]')) {
      if (Number(link.dataset.tocPage) === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    contents.showModal();
    contentsButton.setAttribute('aria-expanded', 'true');
    const activeLink = contents.querySelector('[aria-current="page"]');
    activeLink?.focus({preventScroll: true});
    activeLink?.scrollIntoView({block: 'nearest'});
  });
  contents?.querySelector('[data-contents-close]').addEventListener('click', () => contents.close());
  contents?.addEventListener('click', event => {
    const link = event.target.closest('[data-toc-page]');
    if (link) {
      event.preventDefault();
      contents.close();
      show(Number(link.dataset.tocPage));
    } else if (event.target === contents) {
      const rect = contents.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) contents.close();
    }
  });
  contents?.addEventListener('close', () => {
    contentsButton.setAttribute('aria-expanded', 'false');
    contentsButton.focus({preventScroll: true});
  });

  for (const visual of deck.querySelectorAll?.('.slide-visual.has-gallery') || []) {
    const track = document.createElement('div');
    track.className = 'photo-track';
    track.tabIndex = 0;
    track.setAttribute('role', 'region');
    track.setAttribute('aria-label', '사진 모음 · 좌우로 밀어 보세요');
    visual.prepend(track);
    track.append(visual.querySelector('.visual-main'), visual.querySelector('.slide-gallery'));
    const photos = [track.querySelector('.visual-main'), ...track.querySelectorAll('.gallery-item')];
    const controls = document.createElement('div');
    controls.className = 'photo-controls';
    controls.innerHTML = '<button type="button" aria-label="이전 사진">←</button><p>좌우로 밀어보세요 <span aria-live="polite" aria-atomic="true"></span></p><button type="button" aria-label="다음 사진">→</button>';
    track.after(controls);
    const [back, forward] = controls.querySelectorAll('button');
    let photoIndex = 0;
    const updatePhoto = () => {
      const left = track.getBoundingClientRect().left;
      photoIndex = photos.reduce((closest, photo, index) => Math.abs(photo.getBoundingClientRect().left - left) < Math.abs(photos[closest].getBoundingClientRect().left - left) ? index : closest, 0);
      controls.querySelector('span').textContent = `${photoIndex + 1} / ${photos.length}`;
      back.disabled = photoIndex === 0;
      forward.disabled = photoIndex === photos.length - 1;
    };
    const movePhoto = direction => {
      const photo = photos[Math.max(0, Math.min(photos.length - 1, photoIndex + direction))];
      track.scrollBy({left: photo.getBoundingClientRect().left - track.getBoundingClientRect().left, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    };
    back.addEventListener('click', () => movePhoto(-1));
    forward.addEventListener('click', () => movePhoto(1));
    track.addEventListener('scroll', updatePhoto, {passive: true});
    updatePhoto();
  }

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
    if (contents?.open || quickDialog?.open) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) return;
    if (event.target.closest('.photo-track') && !desktop.matches) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); show(Math.min(slides.length - 1, current + 1)); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); show(current - 1); }
    if (event.key === 'Home') { event.preventDefault(); show(0); }
    if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
  });
  let touchStart;
  deck.addEventListener('pointerdown', event => {
    if(event.pointerType!=='touch')return;
    touchStart=null;
    if(!event.isPrimary||event.target.closest('a, button, input, textarea, select, summary, [contenteditable="true"]')||(!desktop.matches&&event.target.closest('.photo-track')))return;
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
