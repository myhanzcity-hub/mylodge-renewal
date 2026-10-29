(() => {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-carousel]').forEach(carousel=>{
    const frames=[...carousel.querySelectorAll('[data-photo-frame]')];
    if(frames.length<2)return;
    const previous=carousel.querySelector('[data-photo-previous]'),next=carousel.querySelector('[data-photo-next]'),pause=carousel.querySelector('[data-photo-pause]'),counter=carousel.querySelector('[data-photo-counter]');
    let current=0,paused=reduce.matches,timer;
    function show(index){
      current=(index+frames.length)%frames.length;
      frames.forEach((frame,i)=>{frame.hidden=i!==current;if(i===current)frame.querySelector('img').loading='eager';});
      counter.textContent=`${current+1} / ${frames.length}`;
    }
    function sync(){
      clearInterval(timer);
      pause.setAttribute('aria-pressed',String(paused));
      pause.textContent=paused?'자동 넘김 시작':'자동 넘김 멈춤';
      if(!paused&&!document.hidden&&!carousel.closest('[data-slide]').hidden)timer=setInterval(()=>show(current+1),6500);
    }
    previous.addEventListener('click',()=>{paused=true;show(current-1);sync();});
    next.addEventListener('click',()=>{paused=true;show(current+1);sync();});
    pause.addEventListener('click',()=>{paused=!paused;sync();});
    carousel.addEventListener('pointerdown',event=>event.stopPropagation());
    carousel.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();paused=true;show(current+(event.key==='ArrowRight'?1:-1));sync();
    });
    new MutationObserver(sync).observe(carousel.closest('[data-slide]'),{attributes:true,attributeFilter:['hidden']});
    document.addEventListener('visibilitychange',sync);
    addEventListener('pagehide',()=>clearInterval(timer));
    reduce.addEventListener('change',()=>{if(reduce.matches)paused=true;sync();});
    sync();
  });
})();
