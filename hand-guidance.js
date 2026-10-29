export function mountHandGuidance(root=document){
  if(!root.querySelector('[data-deck]'))return;
  const doc=root.ownerDocument||root;
  const win=doc.defaultView;
  const hint=doc.createElement('div');
  hint.className='hand-guidance';
  hint.hidden=true;
  hint.setAttribute('aria-hidden','true');
  hint.innerHTML='<svg viewBox="0 0 44 54" width="44" height="54" focusable="false" aria-hidden="true"><circle class="hand-guidance-ring" cx="14" cy="8" r="7" fill="none" stroke="#ead6a5" stroke-width="2"/><path d="M10 29V9c0-5 7-5 7 0v13-3c0-4 7-4 7 0v5-2c0-4 7-4 7 0v5-1c0-4 7-4 7 0v12c0 7-4 12-6 13H17c-2-5-4-7-7-11l-5-7c-3-5 2-9 5-4Z" fill="#fffaf0" stroke="#0c1e2d" stroke-width="2.5" stroke-linejoin="round"/></svg>';
  doc.body.append(hint);
  let timer,hovered,target,pressed=false,focused=true;
  const events=[];
  const selector='button,a[href],summary,select';
  function hide(){
    clearTimeout(timer);
    hint.hidden=true;
    target?.classList.remove('hand-guidance-target');
    target=null;
  }
  function visible(element){
    if(!element||!element.isConnected||element.disabled||element.getAttribute('aria-disabled')==='true'||element.closest('[hidden]'))return false;
    const rect=element.getBoundingClientRect();
    const style=win.getComputedStyle(element);
    if(rect.width<1||rect.height<1||style.visibility==='hidden'||style.display==='none')return false;
    const x=Math.max(1,Math.min(win.innerWidth-1,rect.left+rect.width/2));
    const y=Math.max(1,Math.min(win.innerHeight-1,rect.top+rect.height/2));
    if(rect.right<1||rect.left>=win.innerWidth||rect.bottom<1||rect.top>=win.innerHeight)return false;
    return element.contains(doc.elementFromPoint(x,y));
  }
  function show(){
    if(doc.hidden||!focused||pressed||doc.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))return;
    const modal=doc.querySelector('dialog[open]');
    if(modal?.matches('[data-video-modal]'))return;
    const scope=modal||doc;
    const candidates=[];
    if(hovered&&(!modal||modal.contains(hovered)))candidates.push(hovered);
    if(modal){
      candidates.push(...scope.querySelectorAll('[data-quick-estimate], [data-quote-region], [data-quick-view="models"] a, [data-toc-page]:not([aria-current="page"]), button:not([aria-pressed="true"]), select, a[href], summary'));
    }else candidates.push(doc.querySelector('[data-next]'));
    const candidate=candidates.find(visible);
    if(!candidate)return;
    target=candidate;
    (modal||doc.body).append(hint);
    const rect=target.getBoundingClientRect();
    // Keep the fingertip on the button's edge and leave its label readable.
    hint.style.left=`${Math.max(8,Math.min(win.innerWidth-48,rect.right-22))}px`;
    hint.style.top=`${Math.max(8,Math.min(win.innerHeight-58,rect.top+rect.height/2-8))}px`;
    target.classList.add('hand-guidance-target');
    hint.hidden=false;
  }
  function schedule(){
    hide();
    if(!doc.hidden&&focused&&!pressed)timer=setTimeout(show,500);
  }
  function listen(surface,name,callback,options){
    surface.addEventListener(name,callback,options);
    events.push(()=>surface.removeEventListener(name,callback,options));
  }
  listen(doc,'pointermove',event=>{hovered=event.pointerType==='touch'?null:event.target.closest?.(selector);schedule();},{passive:true,capture:true});
  listen(doc,'pointerdown',()=>{pressed=true;hide();},{passive:true,capture:true});
  const release=event=>{pressed=false;if(event.pointerType==='touch')hovered=null;schedule();};
  listen(doc,'pointerup',release,{passive:true,capture:true});
  listen(doc,'pointercancel',release,{passive:true,capture:true});
  for(const event of ['click','keydown','focusin','focusout','scroll','wheel','toggle','close'])listen(doc,event,schedule,{passive:true,capture:true});
  listen(win,'resize',schedule,{passive:true});
  listen(win,'hashchange',schedule);
  listen(win,'blur',()=>{focused=false;hide();});
  listen(win,'focus',()=>{focused=true;schedule();});
  listen(doc,'visibilitychange',schedule);
  listen(win,'pagehide',hide);
  schedule();
  return {destroy(){hide();events.forEach(remove=>remove());hint.remove();}};
}
