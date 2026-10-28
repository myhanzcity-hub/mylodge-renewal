import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {transitionPhoto,settleMotion,animateAmount,setAmountText,mountPhotoBranding} from '../presentation-motion.js';

function globals(values){
  const previous=new Map(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  return ()=>{for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}
const photo=()=>({attributes:{src:'original.png'},setAttribute(key,value){this.attributes[key]=value;},getAttribute(key){return this.attributes[key];}});
const asset=src=>({src,srcset:src+' 480w',alt:src,width:480,height:320});

test('photo marks stay inside contained photos through loading, resize and card expansion',()=>{
  let resize;
  const restore=globals({
    ResizeObserver:class{constructor(callback){resize=callback;}observe(){}},
    getComputedStyle:element=>({objectFit:element.fit,aspectRatio:"1402 / 1122"})
  });
  try{
    const styles={},events={},image={clientWidth:600,clientHeight:600,offsetLeft:0,offsetTop:0,fit:'contain',source:[1500,1000],getAttribute(key){return this.source[key==='width'?0:1];},addEventListener(name,fn){events[name]=fn;}};
    const frame={clientWidth:600,clientHeight:600,card:false,hero:false,compact:false,querySelector(selector){return selector==='img'?image:this.hero?{}:null;},matches(){return this.card;},closest(){return this.compact?{}:null;}};
    const brand={parentElement:frame,style:{setProperty(key,value){styles[key]=value;}}};
    const mount=()=>mountPhotoBranding({querySelectorAll:()=>[brand]});
    const rectangle=()=>{
      const width=parseFloat(styles['--brand-width']),height=width*1122/1402,right=parseFloat(styles['--brand-right']);
      const top=styles['--brand-top']==='auto'?frame.clientHeight-parseFloat(styles['--brand-bottom'])-height:parseFloat(styles['--brand-top']);
      return {left:frame.clientWidth-right-width,right:frame.clientWidth-right,top,bottom:top+height,width};
    };
    mount();
    let mark=rectangle();
    assert.ok(mark.top>=100&&mark.bottom<500,'Landscape photo has 100px blank bands; logo belongs inside the photo');
    image.source=[1000,1500];events.load();mark=rectangle();
    assert.ok(mark.left>=100&&mark.right<500,'Portrait replacement has 100px side bands');
    image.clientWidth=frame.clientWidth=140;image.clientHeight=frame.clientHeight=100;frame.compact=true;mount();mark=rectangle();
    assert.ok(mark.left>=36&&mark.right<=104&&mark.bottom<100,'Small supporting photo keeps its own fitted bounds');
    assert.ok(mark.width<40,'Small photos receive a proportionate mark');
    frame.hero=true;mount();mark=rectangle();
    assert.ok(mark.top<10&&mark.bottom<50,'Hero mark stays above the bottom video control');
    frame.hero=false;frame.card=true;image.fit='cover';frame.compact=false;
    frame.clientWidth=image.clientWidth=44;frame.clientHeight=image.clientHeight=270;mount();mark=rectangle();
    assert.ok(mark.left>=0&&mark.right<=44&&mark.top<10,'Collapsed desktop card retains its original logo within its narrow photo');
    frame.clientWidth=image.clientWidth=300;frame.clientHeight=image.clientHeight=52;resize([{target:frame}]);mark=rectangle();
    assert.ok(mark.left>200&&mark.bottom<40,'Collapsed mobile card keeps the logo away from the title at the left');
    frame.clientHeight=image.clientHeight=215;resize([{target:frame}]);mark=rectangle();
    assert.ok(mark.top<16&&mark.bottom<50,'Expanded card keeps the logo clear of its bottom title');
  }finally{restore();}
});

test('rapid photo choices cannot display an older image after the latest has loaded',async()=>{
  const loads=[];
  const restore=globals({Image:class{decode(){return new Promise((resolve,reject)=>loads.push({resolve,reject}));}}});
  try{
    let caption='original';
    const image=photo(),first=transitionPhoto(image,asset('first.png'),()=>{caption='first';}),second=transitionPhoto(image,asset('second.png'),()=>{caption='second';});
    loads[1].resolve();await second;loads[0].resolve();await first;
    assert.equal(image.attributes.src,'second.png');assert.equal(image.attributes.alt,'second.png');
    assert.equal(caption,'second','Caption follows the successfully committed photo');
    const failure=transitionPhoto(image,asset('broken.png'),()=>{caption='broken';});loads[2].reject(new Error('image unavailable'));await failure;
    assert.equal(image.attributes.src,'second.png','Failed new image keeps a usable photo');
    assert.equal(caption,'second','Failed photos never publish a mismatched caption');
  }finally{settleMotion();restore();}
});

test('stopping motion during page hide or reduced motion still commits the selected photo',async()=>{
  let loaded;
  const restore=globals({Image:class{decode(){return new Promise(resolve=>loaded=resolve);}}});
  try{
    const image=photo(),job=transitionPhoto(image,asset('selected.png'));
    settleMotion();assert.equal(image.attributes.src,'selected.png');loaded();await job;
    assert.equal(image.attributes.src,'selected.png');
  }finally{settleMotion();restore();}
});

test('switching to an unpriced product cancels its number animation and exposes the new status immediately',()=>{
  const frames=new Map();let next=0;
  const classes=new Set(),children=[];
  const element={dataset:{},textContent:'USD 3,999',append(child){children.push(child);},classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}};
  const restore=globals({document:{hidden:false,createElement:()=>({setAttribute(){},remove(){children.splice(children.indexOf(this),1);},textContent:''})},requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id)});
  try{
    animateAmount(element,4149);assert.ok(classes.has('number-is-moving'));assert.equal(children.length,1);
    setAmountText(element,'상품별 금액 안내 예정');
    assert.equal(element.textContent,'상품별 금액 안내 예정');assert.equal(frames.size,0);assert.equal(children.length,0);assert.ok(!classes.has('number-is-moving'));
    animateAmount(element,3999);settleMotion();assert.equal(element.textContent,'USD 3,999');assert.equal(frames.size,0);
  }finally{settleMotion();restore();}
});

let modalFixtureId=0;
async function modalFixture({rejectPlay=false}={}){
  const observers=[],events={},documentEvents={};
  const target=(dataset={})=>({dataset,attributes:{},events:{},hidden:false,classList:{add(){},remove(){}},addEventListener(name,fn){this.events[name]=fn;},getAttribute(name){return this.attributes[name];},setAttribute(name,value){this.attributes[name]=value;},set src(value){this.attributes.src=value;},focus(){this.focused=true;}});
  const video=Object.assign(target({src:'assets/video/mylodge-hero.mp4'}),{paused:true,currentTime:0,error:null,play(){if(rejectPlay)return Promise.reject(new Error('Playback blocked'));this.paused=false;this.events.playing?.();return Promise.resolve();},pause(){this.paused=true;},load(){this.error=null;this.reloaded=true;}});
  const play=target(),close=target(),status=target(),slide={hidden:false},messages=[];
  play.closest=()=>slide;
  const modal=Object.assign(target(),{open:false,showModal(){this.open=true;},close(){this.open=false;this.events.close?.();}});
  const frame=target({src:'assets/motion/ownership-story.html'});frame.contentWindow={postMessage:(data,origin)=>messages.push({data,origin})};
  const nodes={'[data-hero-video]':video,'[data-hero-play]':play,'[data-video-modal]':modal,'[data-video-close]':close,'[data-video-status]':status};
  const root={querySelector:selector=>nodes[selector],querySelectorAll:selector=>selector==='[data-motion-frame]'?[frame]:[]};
  const doc={hidden:false,addEventListener:(name,fn)=>documentEvents[name]=fn};
  const preference={matches:false,addEventListener(_name,fn){this.change=fn;}};
  const restore=globals({document:doc,navigator:{connection:{saveData:false}},location:{origin:'http://127.0.0.1:4183'},addEventListener:(name,fn)=>events[name]=fn,matchMedia:()=>preference,IntersectionObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}unobserve(){}}});
  const {mountMotion}=await import('../presentation-motion.js?modal-fixture='+ ++modalFixtureId);mountMotion(root);
  return {video,play,close,status,modal,slide,frame,messages,doc,documentEvents,events,observers,preference,restore};
}

test('video loads only on modal open; close button, Escape and backdrop stop it and restore focus',async()=>{
  const app=await modalFixture();
  const {video,play,modal,close,status}=app;
  try{
    assert.equal(video.attributes.src,undefined);assert.equal(modal.open,false);
    const dismissals=[()=>close.events.click(),()=>modal.events.cancel({preventDefault(){}}),()=>modal.events.click({target:modal})];
    for(const dismiss of dismissals){
      play.events.click();await Promise.resolve();
      assert.equal(modal.open,true);assert.equal(video.paused,false);assert.equal(play.attributes['aria-expanded'],'true');
      assert.equal(video.attributes.src,video.dataset.src);assert.equal(status.hidden,true);
      modal.events.click({target:video});assert.equal(modal.open,true,'Player controls are not backdrop clicks');
      let stopped=false;modal.events.keydown({stopPropagation(){stopped=true;}});assert.equal(stopped,true,'Video keys cannot navigate the deck');
      video.currentTime=35;play.focused=false;dismiss();
      assert.equal(modal.open,false);assert.equal(video.paused,true);assert.equal(video.currentTime,0);assert.equal(play.focused,true);assert.equal(play.attributes['aria-expanded'],'false');
    }
    video.error={code:2};play.events.click();assert.equal(video.reloaded,true,'A failed load can be retried');
    app.events.hashchange();assert.equal(modal.open,false);assert.equal(video.paused,true);
  }finally{app.restore();}
});

test('hidden tabs pause video, page exits close it and assembly messages remain origin-checked',async()=>{
  const app=await modalFixture();
  const {video,play,modal,frame,messages,events,doc,documentEvents,observers}=app;
  try{
    observers[0].callback([{target:frame,isIntersecting:true}]);
    assert.equal(frame.attributes.src,frame.dataset.src);assert.equal(messages.at(-1).data.active,true);
    assert.equal(video.attributes.src,undefined,'Scrolling never starts the video');
    const count=messages.length;events.message({origin:'https://unrelated.example',source:frame.contentWindow,data:{type:'mylodge-motion-ready'}});assert.equal(messages.length,count);
    play.events.click();await Promise.resolve();
    doc.hidden=true;documentEvents.visibilitychange();assert.equal(video.paused,true);assert.equal(messages.at(-1).data.active,false);
    doc.hidden=false;documentEvents.visibilitychange();assert.equal(video.paused,true,'Returning to a tab does not unexpectedly resume audio');
    app.slide.hidden=true;play.focused=false;events.pagehide();
    assert.equal(modal.open,false);assert.equal(video.currentTime,0);assert.equal(play.focused,false,'Do not focus the trigger on a hidden chapter');
    app.preference.matches=true;app.preference.change();
    observers[0].callback([{target:frame,isIntersecting:false}]);assert.equal(messages.at(-1).data.active,false);
  }finally{app.restore();}
});

test('blocked playback leaves an accessible modal and working close control',async()=>{
  const app=await modalFixture({rejectPlay:true});
  try{
    app.play.events.click();await Promise.resolve();await Promise.resolve();
    assert.equal(app.modal.open,true);assert.equal(app.status.hidden,false);assert.ok(app.status.textContent);
    app.close.events.click();assert.equal(app.modal.open,false);assert.equal(app.video.paused,true);
  }finally{app.restore();}
});

test('motion pages are local, retain licenses and contain no transplanted prices or share promises',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(html.includes('data-hero-video'));assert.ok(html.includes('preload="none"'));
  assert.match(html,/<dialog\b[^>]*data-video-modal[\s\S]*<video\b[^>]*controls[^>]*><\/video>[\s\S]*<\/dialog>/);
  assert.ok(html.indexOf('<dialog')>html.indexOf('</main>'),'Video dialog sits outside the slide scroller');
  assert.ok(!/<video[^>]*aria-hidden="true"/.test(html),'Player controls remain accessible');
  assert.equal([...html.matchAll(/data-motion-frame/g)].length,2);
  assert.equal([...html.matchAll(/expanding-gallery/g)].length,2);
  for(const name of ['ownership-story.html','luxury-preview.html']){
    const source=await readFile(new URL('../assets/motion/'+name,import.meta.url),'utf8');
    await access(new URL('../assets/motion/'+name,import.meta.url));
    const text=source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,'');
    assert.ok(!/120구좌|129구좌|1\/120|USD|대표|녹취/.test(text));
  }
  const gsap=await readFile(new URL('../assets/vendor/gsap.min.js',import.meta.url),'utf8');
  assert.ok(gsap.includes('@license')&&gsap.includes('GreenSock'));
});
