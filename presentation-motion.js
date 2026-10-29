import {usd} from './presentation-options.js';

const media=query=>typeof matchMedia==='function'?matchMedia(query):{matches:false};
const reduce=media('(prefers-reduced-motion: reduce)');
const imageJobs=new WeakMap(),numberJobs=new WeakMap();
const pending=new Set();
const allowed=()=>typeof document!=='undefined'&&!document.hidden&&!reduce.matches;
export function settleMotion(){for(const finish of [...pending])finish();}
export function setAmountText(element,text){
  numberJobs.get(element)?.();delete element.dataset.amount;element.textContent=text;
}

export function animateAmount(element,value){
  if(!element)return;
  const previous=Number(element.dataset.amount??element.textContent.replace(/[^\d]/g,''));
  numberJobs.get(element)?.();
  element.dataset.amount=String(value);
  element.textContent=usd(value);
  if(!allowed()||typeof requestAnimationFrame!=='function'||previous===value||!Number.isFinite(previous))return;
  const ghost=document.createElement('span');ghost.className='number-ghost';ghost.setAttribute('aria-hidden','true');
  element.append(ghost);element.classList.add('number-is-moving');
  let frame=0,finished=false,start;
  const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);ghost.remove();element.classList.remove('number-is-moving');pending.delete(finish);numberJobs.delete(element);};
  numberJobs.set(element,finish);pending.add(finish);
  const tick=now=>{if(start===undefined)start=now;const progress=Math.min(1,(now-start)/700);ghost.textContent=usd(Math.round(previous+(value-previous)*(1-Math.pow(1-progress,3))));if(progress<1&&allowed())frame=requestAnimationFrame(tick);else finish();};
  ghost.textContent=usd(previous);frame=requestAnimationFrame(tick);
}

export async function transitionPhoto(image,asset,onCommit){
  if(!image)return;
  const previous=imageJobs.get(image);previous?.finish(false);
  let animations=[],cancelled=false;
  const job={finish(commit=true){if(cancelled)return;if(commit&&imageJobs.get(image)===job)apply();cancelled=true;animations.forEach(animation=>animation.cancel());pending.delete(job.finish);}};
  imageJobs.set(image,job);pending.add(job.finish);
  const apply=()=>{for(const [key,value] of Object.entries(asset))if(['src','srcset','width','height','alt'].includes(key))image.setAttribute(key,String(value));image.setAttribute('loading','eager');onCommit?.();};
  if(typeof Image==='undefined'){apply();job.finish();return;}
  const probe=new Image();probe.sizes=image.getAttribute('sizes')||'100vw';probe.srcset=asset.srcset||'';probe.src=asset.src;
  try {await probe.decode();}catch{job.finish(false);return;}
  if(cancelled||imageJobs.get(image)!==job)return;
  if(allowed()&&image.animate){
    const out=image.animate([{opacity:1,transform:'translateX(0) scale(1)'},{opacity:0,transform:'translateX(-8px) scale(1.015)'}],{duration:220,easing:'ease-in',fill:'forwards'});animations.push(out);
    await out.finished.catch(()=>{});
    if(cancelled)return;
    apply();out.cancel();
    const into=image.animate([{opacity:0,transform:'translateX(8px) scale(1.025)'},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});animations.push(into);
    await into.finished.catch(()=>{});
  }else apply();
  job.finish();
}

export function revealSelection(panel){
  if(!panel||!allowed()||!panel.animate)return;
  panel.getAnimations?.().forEach(animation=>animation.cancel());
  panel.animate([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,easing:'cubic-bezier(.16,1,.3,1)'});
}

// Place the mark inside the visible photo, excluding object-fit letterboxing.
export function mountPhotoBranding(root=document){
  const updates=new Map();
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
    for(const {target} of entries)updates.get(target)?.();
  }):null;
  root.querySelectorAll('.photo-brand').forEach(brand=>{
    const frame=brand.parentElement,image=frame.querySelector('img');
    if(!image)return;
    const card=frame.matches('.expanding-gallery button');
    const compact=Boolean(frame.closest('.gallery-item,.concept-album'));
    const top=card||Boolean(frame.querySelector('[data-hero-play]'));
    const [ratioWidth,ratioHeight=1]=getComputedStyle(brand).aspectRatio.split('/').map(Number);
    const ratio=ratioWidth/ratioHeight;
    const update=()=>{
      const boxWidth=image.clientWidth,boxHeight=image.clientHeight;
      const sourceWidth=Number(image.getAttribute('width'))||image.naturalWidth;
      const sourceHeight=Number(image.getAttribute('height'))||image.naturalHeight;
      if(!boxWidth||!boxHeight||!sourceWidth||!sourceHeight)return;
      let width=boxWidth,height=boxHeight;
      if(getComputedStyle(image).objectFit==='contain'){
        const scale=Math.min(boxWidth/sourceWidth,boxHeight/sourceHeight);
        width=sourceWidth*scale;height=sourceHeight*scale;
      }
      const x=image.offsetLeft+(boxWidth-width)/2,y=image.offsetTop+(boxHeight-height)/2;
      const inset=Math.max(4,Math.min(16,Math.min(width,height)*.045));
      const logoWidth=card?Math.min(38*ratio,width-inset*2,height*.38*ratio):Math.min((compact?30:54)*ratio,width*(compact ? .32 : .18),height*.24*ratio);
      brand.style.setProperty('--brand-width',`${Math.max(0,logoWidth)}px`);
      brand.style.setProperty('--brand-right',`${Math.max(0,frame.clientWidth-x-width)+inset}px`);
      brand.style.setProperty('--brand-top',top?`${y+inset}px`:'auto');
      brand.style.setProperty('--brand-bottom',top?'auto':`${Math.max(0,frame.clientHeight-y-height)+inset}px`);
    };
    updates.set(frame,update);observer?.observe(frame);
    image.addEventListener('load',update);update();
  });
  if(!observer)addEventListener('resize',()=>updates.forEach(update=>update()));
}

export function mountMotion(root=document){
  const video=root.querySelector('[data-hero-video]'),play=root.querySelector('[data-hero-play]');
  const modal=root.querySelector('[data-video-modal]'),close=root.querySelector('[data-video-close]'),status=root.querySelector('[data-video-status]');
  const frames=[...root.querySelectorAll('[data-motion-frame]')];
  function stopVideo(){
    video?.pause();
    if(video)try{video.currentTime=0;}catch{/* The first frame may not have loaded yet. */}
  }
  function closeVideo(){stopVideo();if(modal?.open)modal.close();}
  function showStatus(message){if(status&&modal?.open){status.textContent=message;status.hidden=false;}}
  play?.addEventListener('click',()=>{
    if(!video||!modal||modal.open)return;
    if(status)status.hidden=true;
    modal.showModal();
    play.setAttribute('aria-expanded','true');
    if(!video.getAttribute('src'))video.src=video.dataset.src;
    else if(video.error)video.load();
    video.muted=false;
    video.volume=1;
    video.play().then(()=>{if(!modal.open||document.hidden)video.pause();}).catch(()=>{
      showStatus('영상의 재생 버튼을 눌러 시작해 주세요');
    });
  });
  video?.addEventListener('playing',()=>{if(status)status.hidden=true;});
  video?.addEventListener('error',()=>showStatus('영상을 불러오지 못했습니다 잠시 후 다시 열어 주세요'));
  close?.addEventListener('click',closeVideo);
  modal?.addEventListener('cancel',event=>{event.preventDefault();closeVideo();});
  modal?.addEventListener('click',event=>{if(event.target===modal)closeVideo();});
  modal?.addEventListener('keydown',event=>event.stopPropagation());
  modal?.addEventListener('close',()=>{
    stopVideo();play?.setAttribute('aria-expanded','false');
    if(!document.hidden&&!play?.closest('[data-slide]')?.hidden)play?.focus({preventScroll:true});
  });
  addEventListener('hashchange',closeVideo);
  const visibleFrames=new Set();
  const syncFrame=frame=>frame.contentWindow?.postMessage({type:'mylodge-motion',active:visibleFrames.has(frame)&&!document.hidden},location.origin);
  frames.forEach(frame=>frame.addEventListener('load',()=>syncFrame(frame)));
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const frame=entry.target;
      if(entry.isIntersecting){visibleFrames.add(frame);if(!frame.getAttribute('src'))frame.src=frame.dataset.src;}else visibleFrames.delete(frame);
      syncFrame(frame);
    }
  },{threshold:.05});
  frames.forEach(frame=>observer.observe(frame));
  addEventListener('message',event=>{
    if(event.origin!==location.origin||event.data?.type!=='mylodge-motion-ready')return;
    const frame=frames.find(frame=>frame.contentWindow===event.source);if(frame)syncFrame(frame);
  });
  const syncAll=()=>{if(document.hidden){video?.pause();settleMotion();}frames.forEach(syncFrame);};
  document.addEventListener('visibilitychange',syncAll);
  reduce.addEventListener?.('change',()=>{settleMotion();syncAll();});
  addEventListener('pagehide',()=>{closeVideo();settleMotion();frames.forEach(frame=>frame.contentWindow?.postMessage({type:'mylodge-motion',active:false},location.origin));});
  addEventListener('pageshow',syncAll);
  // Long chapters reveal their visual groups as they enter the reading area.
  const revealObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){
      entry.target.classList.add('motion-visible');revealObserver.unobserve(entry.target);
    }
  },{threshold:.08});
  root.querySelectorAll('.experience-block,.ownership-path li,.price-options,.selection-fields,.selection-summary').forEach((node,index)=>{
    node.style.setProperty('--reveal-delay',`${Math.min(index%3,2)*90}ms`);node.classList.add('motion-reveal');revealObserver.observe(node);
  });
}
