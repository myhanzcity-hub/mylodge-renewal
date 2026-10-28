// Lazy-mounted Anatomy figures for conceptual optional-package previews.
import { mountLuxuryFireplace } from './luxury-fireplace-anatomy.js';

const sceneCopy = {
  tv: {
    title: ['대형 TV', 'Premium Television'],
    sequence: ['벽 패널', '마운트 구조', '플로팅 콘솔', 'TV 프레임과 디스플레이', '간접 조명'],
    sequenceEn: ['Wall panel', 'Concealed mount', 'Floating console', 'TV frame and display', 'Ambient light'],
  },
  fireplace: {
    title: ['벽난로', 'Luxury Fireplace'],
    sequence: ['벽체와 매립 공간', '금속 화실 설치', '석재 프레임 조립', '유리 전면 설치', '하스 정렬', '점화와 마감'],
    sequenceEn: ['Wall and recessed cavity', 'Firebox installation', 'Stone surround assembly', 'Glass front installation', 'Hearth alignment', 'Ignition and finish'],
  },
};

const room = `
  <g class="an-room" aria-hidden="true">
    <path class="an-wall-back" d="M165 95 408 48 408 258 165 303Z"/>
    <path class="an-wall-side" d="M408 48 565 122 565 316 408 258Z"/>
    <path class="an-floor" d="M165 303 408 258 565 316 325 373Z"/>
    <path class="an-room-edge" d="M165 95 408 48 565 122M165 303 408 258 565 316 325 373Z"/>
    <path class="an-floor-seam" d="m270 283 156 76m-33-96 157 74m-262-30 157-29"/>
    <path class="an-room-seam" d="m180 112 216-42m-216 54 216-42m-216 54 216-42m-216 54 216-42m144-42v164m14-157v165m14-158v165"/>
  </g>`;

function televisionSvg(english) {
  return `<svg class="luxury-anatomy-svg" viewBox="120 25 480 365" role="img" aria-labelledby="an-title an-description">
    <title id="an-title">${english ? 'Premium Television conceptual architectural assembly' : '대형 TV 콘셉트 건축 조립 장면'}</title>
    <desc id="an-description">${english ? 'Layered wall panel, concealed supports, floating console and television assemble into a villa interior scene.' : '빌라 실내 공간에서 벽 패널, 매립형 지지 구조, 플로팅 콘솔과 TV가 조립되는 콘셉트 장면입니다'}</desc>
    ${room}
    <g class="an-tv-panel" data-build="panel">
      <path class="an-panel-side" d="m238 109 13-3v145l-13 3Z"/><path class="an-panel-face" d="m251 106 166-33v145l-166 33Z"/>
      <path class="an-panel-edge" d="m251 106 166-33v145l-166 33Z"/>
      ${Array.from({ length: 9 }, (_, i) => `<path class="an-panel-slat" d="m${262 + i * 17} ${104 - i * 3.37}v145"/>`).join('')}
      <path class="an-panel-trim" d="m245 113 167-33m-167 166 167-33"/>
      <path class="an-panel-inlay" d="m255 119 158-31m-158 9 158-31"/>
    </g>
    <g class="an-tv-mount" data-build="mount">
      <path class="an-mount-rail" d="m279 115 5-1v112l-5 1zm93-19 5-1v111l-5 1z"/>
      <path class="an-mount-crossbar" d="m282 131 94-19v7l-94 19zm0 73 94-19v7l-94 19z"/>
      <path class="an-mount-arm" d="m286 143 19 7v9l-19-7zm74-15 18 1v9l-18-1z"/>
      <path class="an-mount-fastener" d="m280 124 3-1v3l-3 1zm0 83 3-1v3l-3 1zm94-102 3-1v3l-3 1zm0 82 3-1v3l-3 1z"/>
      <path class="an-mount-detail" d="m289 151 8 3m-8 4 8 3m64-34 8 1m-8 5 8 1"/>
    </g>
    <g class="an-tv-console" data-build="console">
      <path class="an-console-top" d="m236 249 147-29 29 13-148 31Z"/>
      <path class="an-console-front" d="m264 264 148-31v21l-148 32Z"/>
      <path class="an-console-side" d="m412 233 8 4v20l-8-3Z"/>
      <path class="an-console-edge" d="m236 249 147-29 29 13-148 31Z m28 15 148-31m-148 52 148-32"/>
      <path class="an-console-seam" d="m296 257v21m53-32v21m42-30v21"/>
      <path class="an-console-pull" d="m306 267 12-2m42-8 12-3m-66 15 12-3m42-8 12-2"/>
      <path class="an-console-support" d="m281 284 5-1v12l-5 1zm117-25 5-1v11l-5 1z"/>
      <path class="an-console-shadow" d="m276 300 132-28"/>
    </g>
    <g class="an-tv-frame" data-build="frame">
      <path class="an-tv-depth" d="m263 125 12-2v99l-12 2Z"/>
      <path class="an-tv-bezel" d="m275 123 127-25v99l-127 25Z"/>
      <path class="an-tv-glass" d="m280 129 117-23v87l-117 23Z"/>
      <path class="an-tv-sheen" d="m285 132 8-2v84l-8 2zm15-3 2-1v84l-2 1"/>
      <path class="an-tv-bezel-line" d="m275 123 127-25v99l-127 25Z"/>
      <path class="an-tv-camera" d="m336 214 5-1m8-2 2-.5"/>
      <path class="an-tv-foot" d="m291 224 6-1v9l-6 1m86-18 6-1v9l-6 1"/>
      <path class="an-screen-detail" d="m293 139 91-18m-91 8 67-13"/>
    </g>
    <g class="an-tv-display" data-build="display">
      <path d="m288 148 84-17v39l-84 17Z"/>
      <path d="m294 178 28-20 17 6 24-22"/>
      <path d="m305 174 18-11 14 5 16-14"/>
      <circle cx="371" cy="137" r="3"/><path d="m288 185 84-17"/>
    </g>
    <g class="an-tv-light" data-build="light">
      <path class="an-light-halo" d="m259 229 155-31m-150 39 155-31"/>
      <path class="an-light-strip" d="m261 231 151-30"/>
      <path class="an-light-point" d="m273 230 4-.8m11-2 4-.8m11-2 4-.8m11-2 4-.8m11-2 4-.8m11-2 4-.8m11-2 4-.8m11-2 4-.8m11-2 4-.8"/>
    </g>
  </svg>`;
}

function fireplaceSvg(english) {
  return `<svg class="luxury-anatomy-svg" viewBox="0 0 680 400" role="img" aria-labelledby="an-title an-description">
    <title id="an-title">${english ? 'Luxury Fireplace conceptual architectural assembly' : '벽난로 콘셉트 건축 조립 장면'}</title>
    <desc id="an-description">${english ? 'A minimal architectural surround, recessed firebox, glass front and layered wall panels assemble in a villa interior.' : '빌라 실내 공간에서 건축 프레임, 매립형 파이어박스, 유리 전면과 벽 패널이 조립되는 콘셉트 장면입니다'}</desc>
    ${room}
    <g class="an-fireplace-base" data-build="base">
      <path class="an-hearth-side" d="m230 274 16-4v16l-16 4Z"/><path class="an-hearth-top" d="m230 274 148-29 37 16-149 32Z"/>
      <path class="an-hearth-front" d="m266 293 149-32v12l-149 33Z"/><path class="an-hearth-edge" d="m230 274 148-29 37 16-149 32Z m37 19 149-32"/>
      <path class="an-hearth-seam" d="m260 280 31-6m-28 10 31-6m71-21 29-6"/>
      <path class="an-hearth-foot" d="m277 305 5-1v6l-5 1m112-25 5-1v6l-5 1"/>
    </g>
    <g class="an-fireplace-surround" data-build="surround">
      <path class="an-surround-side" d="m257 165 11-2v105l-11 3Z"/><path class="an-surround-face" d="m268 163 119-24v105l-119 25Z"/>
      <path class="an-surround-top" d="m268 163 119-24 18 8-120 24Z"/>
      <path class="an-surround-edge" d="m268 163 119-24 18 8v105l-119 25Z"/>
      <path class="an-surround-inlay" d="m278 174 99-20m-99 8 99-20m-99 97 99-20"/>
      <path class="an-surround-rib" d="m282 178v87m15-90v84m15-87v84m15-87v84m15-87v84m15-87v84"/>
      <path class="an-surround-corner" d="m265 171 5-1m-5 89 5-1m113-112 5-1m-5 91 5-1"/>
    </g>
    <g class="an-fireplace-box" data-build="firebox">
      <path class="an-box-depth" d="m282 195 9-2v57l-9 2Z"/><path class="an-box-cavity" d="m291 193 74-15v57l-74 15Z"/>
      <path class="an-box-liner" d="m297 201 62-12v44l-62 13Z"/><path class="an-box-floor" d="m297 239 62-13v8l-62 13Z"/>
      <path class="an-box-grate" d="m309 241 38-8m-35 5 2-6m9 4 2-7m9 5 2-7m9 5 2-7m9 5 2-7"/>
      <path class="an-box-edge" d="m291 193 74-15v57l-74 15Z"/>
      <path class="an-box-vent" d="m300 260 54-11m-52 15 54-11m-52 15 54-11"/>
    </g>
    <g class="an-fireplace-glass" data-build="glass">
      <path class="an-glass-pane" d="m292 196 72-14v54l-72 15Z"/>
      <path class="an-glass-edge" d="m292 196 72-14v54l-72 15Z"/>
      <path class="an-glass-hinge" d="m294 202 3-1v5l-3 1m64-14 3-1v5l-3 1m-64 43 3-.6v4.5l-3 .6m64-13 3-.6v4.5l-3 .6"/>
      <path class="an-glass-reflection" d="m302 198 8-1.5v46l-8 1.5m47-55 3-.6v20"/>
      <circle class="an-glass-fastener" cx="299" cy="211" r="1.2"/><circle class="an-glass-fastener" cx="360" cy="199" r="1.2"/>
    </g>
    <g class="an-fireplace-panels" data-build="panels">
      <path class="an-panel-strip" d="m241 145 3-1v125l-3 1zm158-32 3-1v136l-3 1zm14 7 3 1v129l-3-1z"/>
      <path class="an-panel-joint" d="m248 147 155-31m-155 11 155-31m-155 149 155-31"/>
      <path class="an-panel-fastener" d="m244 157 2-.5m0 96 2-.5m158-133 2-.5m0 99 2-.5"/>
      <path class="an-panel-cap" d="m238 143 10-2m149-30 10-2m-169 161 10-2m149-30 10-2"/>
      <path class="an-panel-reveal" d="m252 151 141-28m-141 9 141-28m-141 132 141-29"/>
    </g>
    <g class="an-fireplace-flame" data-build="flames">
      <path class="an-fire-ember" d="m305 243 46-9"/>
      <path class="an-flame-back" d="M314 238c-5-8 6-13 3-22 9 6 9 13 8 17 9-8 8-15 13-20 9 13 6 22 1 27Z"/>
      <path class="an-flame-front" d="M324 237c-4-6 4-9 3-15 6 5 5 9 4 12 5-4 5-8 8-11 5 8 2 12-1 15Z"/>
      <path class="an-flame-core" d="M333 235c-2-3 2-5 2-8 3 3 2 5 1 7l4-5c2 4 0 6-1 7Z"/>
      <path class="an-fire-reflection" d="m305 246 47-10m-42 14 38-8"/>
    </g>
  </svg>`;
}

function labelsMarkup(english) {
  const sequence = (id, label) => `<span class="luxury-sequence-step" data-sequence-step="${id}"><i aria-hidden="true"></i>${label}</span>`;
  const tvSteps = (english ? sceneCopy.tv.sequenceEn : sceneCopy.tv.sequence).map((label, i) => sequence(i, label)).join('');
  const fireSteps = (english ? sceneCopy.fireplace.sequenceEn : sceneCopy.fireplace.sequence).map((label, i) => sequence(i, label)).join('');
  return `<div class="luxury-anatomy-head">
      <div><p class="luxury-anatomy-kicker">${english ? 'SPACE DETAILS' : '공간을 이루는 디테일'}</p><h3 data-anatomy-title>${english ? sceneCopy.tv.title[1] : sceneCopy.tv.title[0]}</h3></div>
      <button type="button" class="luxury-anatomy-replay" data-anatomy-replay>${english ? 'Replay assembly' : '다시 재생'}</button>
    </div>
    <div class="luxury-anatomy-tabs" role="group" aria-label="${english ? 'Select a conceptual preview' : '콘셉트 프리뷰 선택'}">
      <button type="button" data-anatomy-tab="tv" aria-pressed="true"><span>01</span>${english ? sceneCopy.tv.title[1] : sceneCopy.tv.title[0]}</button>
      <button type="button" data-anatomy-tab="fireplace" aria-pressed="false"><span>02</span>${english ? sceneCopy.fireplace.title[1] : sceneCopy.fireplace.title[0]}</button>
    </div>
    <div class="luxury-anatomy-stage" data-anatomy-stage aria-live="off"></div>
    <div class="luxury-anatomy-sequence" data-anatomy-sequence>${tvSteps}</div>
    <p class="luxury-anatomy-disclaimer">${english ? 'Interior concept preview · actual inclusions depend on the product' : '인테리어 콘셉트 예시 · 실제 포함 품목은 상품별 안내'}</p>
    <span class="luxury-anatomy-live" data-anatomy-live aria-live="polite"></span>`;
}

export function mount(host, { english = false, gsap = window.gsap, active = true } = {}) {
  if (!host || host.dataset.mounted === 'true') return;
  host.dataset.mounted = 'true';
  host.innerHTML = labelsMarkup(english);
  const stage = host.querySelector('[data-anatomy-stage]');
  const sequence = host.querySelector('[data-anatomy-sequence]');
  const title = host.querySelector('[data-anatomy-title]');
  const replay = host.querySelector('[data-anatomy-replay]');
  const live = host.querySelector('[data-anatomy-live]');
  const tabs = [...host.querySelectorAll('[data-anatomy-tab]')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 'tv';
  let timeline = null;
  let flameLoop = null;
  let fireplace = null;

  const renderSequence = kind => {
    const steps = english ? sceneCopy[kind].sequenceEn : sceneCopy[kind].sequence;
    sequence.innerHTML = steps.map((label, i) => `<span class="luxury-sequence-step" data-sequence-step="${i}"><i aria-hidden="true"></i>${label}</span>`).join('');
  };
  const assembled = () => {
    timeline?.kill(); timeline = null;
    flameLoop?.kill(); flameLoop = null;
    fireplace?.dispose(); fireplace = null;
    if (current === 'tv') stage.innerHTML = televisionSvg(english);
    else fireplace = mountLuxuryFireplace(stage, { english, gsap, active, reducedMotion: reduceMotion, onStatus: status => {
      live.textContent = status;
      if (/complete|조립 완료/.test(status)) sequence.querySelectorAll('.luxury-sequence-step').forEach(step => step.classList.add('is-complete'));
      if (/Assembling|조립하고/.test(status)) sequence.querySelectorAll('.luxury-sequence-step').forEach(step => step.classList.remove('is-complete'));
    } });
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.anatomyTab === current)));
    title.textContent = english ? sceneCopy[current].title[1] : sceneCopy[current].title[0];
    replay.hidden = current === 'fireplace';
    renderSequence(current);
    if(reduceMotion.matches) sequence.querySelectorAll('.luxury-sequence-step').forEach(step => step.classList.add('is-complete'));
  };
  const play = () => {
    assembled();
    live.textContent = english ? `${sceneCopy[current].title[1]} assembly preview` : `${sceneCopy[current].title[0]} 조립 프리뷰`;
    if (current === 'fireplace') return;
    if (!gsap || reduceMotion.matches) {
      sequence.querySelectorAll('.luxury-sequence-step').forEach(step => step.classList.add('is-complete'));
      return;
    }
    const groups = [...stage.querySelectorAll('[data-build]')];
    const get = name => stage.querySelector(`[data-build="${name}"]`);
    const gs = gsap;
    const incoming = {
      panel: { y: -18 }, mount: { y: -16 }, console: { x: -24, y: 9 }, frame: { y: -36 }, display: { scaleY: .05, transformOrigin: '50% 100%' }, light: { scaleX: .72, transformOrigin: '50% 50%' },
      base: { y: -12 }, surround: { y: -20, transformOrigin: '50% 100%' }, firebox: { x: -20 }, glass: { x: 15 }, panels: { x: 22 }, flames: { scaleY: .16, transformOrigin: '50% 100%' },
    };
    groups.forEach(group => gs.set([...group.children], { autoAlpha: 0, ...(incoming[group.dataset.build] || { y: -16 }) }));
    const reveal = (tl, group, at, opts = {}) => {
      if (!group) return;
      tl.to([...group.children], { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: opts.duration || 0.48, ease: 'power2.out', stagger: opts.stagger || 0.035,
        onComplete: () => sequence.querySelector(`[data-sequence-step="${opts.step}"]`)?.classList.add('is-complete') }, at);
    };
    timeline = gs.timeline();
    if (current === 'tv') {
      reveal(timeline, get('panel'), 0, { duration: 0.46, step: 0 });
      reveal(timeline, get('mount'), '>-0.02', { duration: 0.42, stagger: 0.045, step: 1 });
      reveal(timeline, get('console'), '>-0.02', { duration: 0.55, step: 2 });
      reveal(timeline, get('frame'), '>-0.03', { duration: 0.55, step: 3 });
      reveal(timeline, get('display'), '>-0.02', { duration: 0.42, step: 3 });
      reveal(timeline, get('light'), '>-0.03', { duration: 0.48, step: 4 });
    } else {
      reveal(timeline, get('base'), 0, { duration: 0.42, step: 0 });
      reveal(timeline, get('surround'), '>-0.02', { duration: 0.48, step: 1 });
      reveal(timeline, get('box'), '>-0.02', { duration: 0.45, step: 2 });
      reveal(timeline, get('glass'), '>-0.02', { duration: 0.42, step: 3 });
      reveal(timeline, get('panels'), '>-0.02', { duration: 0.46, step: 4 });
      reveal(timeline, get('flames'), '>-0.01', { duration: 0.55, step: 5 });
      timeline.call(() => startFlameLoop());
    }
    timeline.eventCallback('onComplete', () => {
      sequence.querySelectorAll('.luxury-sequence-step').forEach(step => step.classList.add('is-complete'));
      live.textContent = english ? `${sceneCopy[current].title[1]} assembly complete` : `${sceneCopy[current].title[0]} 조립 완료`;
    });
    timeline.play(0);
    if (!active) timeline.pause();
  };
  const startFlameLoop = () => {
    if (!gsap || reduceMotion.matches || current !== 'fireplace') return;
    const flame = stage.querySelector('.an-fireplace-flame');
    if (flame) flameLoop = gsap.to(flame, { scaleY: 1.045, scaleX: 0.985, transformOrigin: '50% 100%', duration: 1.15, ease: 'sine.inOut', repeat: -1, yoyo: true });
  };
  const select = kind => {
    if (!sceneCopy[kind]) return;
    current = kind;
    play();
  };
  tabs.forEach(tab => tab.addEventListener('click', () => select(tab.dataset.anatomyTab)));
  replay.addEventListener('click', play);
  reduceMotion.addEventListener?.('change', play);
  play();
  return {
    setActive(value){
      active=Boolean(value);
      host.dataset.motionPaused=String(!active);
      if(active){timeline?.resume();flameLoop?.resume();}
      else {timeline?.pause();flameLoop?.pause();}
      fireplace?.setActive(active);
    }
  };
}
