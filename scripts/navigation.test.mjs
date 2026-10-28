import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const script=await readFile(new URL('../presentation.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const titles=[...html.matchAll(/data-slide="\d+" data-title="([^"]+)"/g)].map(match=>match[1]);
function controller(hash='',{mobile=false,saveData=false}={}){
  const element=()=>({events:{},style:{},dataset:{},attributes:{},textContent:'',disabled:false,hidden:false,addEventListener(name,fn){this.events[name]=fn;},setAttribute(name,value){this.attributes[name]=value;},classList:{add(){},remove(){}}});
  const slides=titles.map(title=>{const slide=element(),img=element();slide.image=img;slide.dataset.title=title;slide.scrollHeight=800;slide.clientHeight=800;slide.scrollTop=0;slide.querySelector=()=>img;return slide;});
  const targets={};
  for(const selector of ['[data-deck]','[data-previous]','[data-next]','[data-counter]','[data-current-title]','[data-progress]'])targets[selector]=element();
  const label=element(),arrow=element();targets['[data-next]'].querySelector=selector=>selector==='span'?label:arrow;
  const events={},location={hash};
  const context={document:{querySelector:selector=>targets[selector],querySelectorAll:()=>slides},navigator:{connection:{saveData}},matchMedia:query=>({matches:!mobile&&query.includes('min-width')}),location,history:{replaceState(_state,_title,value){location.hash=value;}},performance:{now:()=>1000},addEventListener:(name,fn)=>{events[name]=fn;}};
  vm.runInNewContext(script,context);
  return {slides,targets,label,events,location,click(which){const button=targets[`[data-${which}]`];if(!button.disabled)button.events.click();},visible(){return slides.map((slide,i)=>slide.hidden?null:i+1).filter(Boolean);}};
}
test('previous and next visit exactly 20 pages and restart from page one',()=>{
  const app=controller();assert.deepEqual(app.visible(),[1]);assert.equal(app.targets['[data-previous]'].disabled,true);
  for(let expected=2;expected<=20;expected++){app.click('next');assert.deepEqual(app.visible(),[expected]);assert.equal(app.targets['[data-counter]'].textContent,`${String(expected).padStart(2,'0')} / 20`);}
  assert.equal(app.label.textContent,'처음으로');app.click('next');assert.deepEqual(app.visible(),[1]);app.click('previous');assert.deepEqual(app.visible(),[1]);
});
test('deep links and keyboard stay within pages one through twenty',()=>{
  const app=controller('#page=17');assert.deepEqual(app.visible(),[17]);
  const press=key=>app.events.keydown({key,preventDefault(){},target:{closest:()=>null}});
  press('End');assert.deepEqual(app.visible(),[20]);press('ArrowRight');assert.deepEqual(app.visible(),[20]);press('Home');assert.deepEqual(app.visible(),[1]);press('ArrowLeft');assert.deepEqual(app.visible(),[1]);press('PageDown');assert.deepEqual(app.visible(),[2]);
  assert.deepEqual(controller('#page=999').visible(),[20]);assert.deepEqual(controller('#bad-link').visible(),[1]);
});
test('horizontal touch moves one page and vertical reading does not',()=>{
  const app=controller(),events=app.targets['[data-deck]'].events;
  events.pointerdown(touch(250,100));events.pointerup(touch(100,115));assert.deepEqual(app.visible(),[2]);
  events.pointerdown(touch(200,300));events.pointerup(touch(190,100));assert.deepEqual(app.visible(),[2]);
});
const touch=(x,y,extra={})=>({pointerType:'touch',pointerId:1,isPrimary:true,clientX:x,clientY:y,target:{closest:()=>null},...extra});
test('reading, pinch zoom, interactive controls and cancelled gestures never turn a page',()=>{
  const app=controller('',{mobile:true}),events=app.targets['[data-deck]'].events;
  events.pointerdown(touch(250,200));events.pointermove(touch(245,160));events.pointerup(touch(100,190));
  assert.deepEqual(app.visible(),[1],'A vertical gesture stays reading even if its endpoint becomes horizontal');
  events.pointerdown(touch(250,100));events.pointerdown(touch(100,100,{pointerId:2,isPrimary:false}));events.pointerup(touch(100,115));
  assert.deepEqual(app.visible(),[1],'Pinch does not swipe');
  events.pointerdown(touch(250,100,{target:{closest:()=>({})}}));events.pointerup(touch(100,115));
  assert.deepEqual(app.visible(),[1],'Control interaction does not swipe');
  events.pointerdown(touch(250,100));events.pointercancel();events.pointerup(touch(100,115));
  assert.deepEqual(app.visible(),[1]);
  events.pointerdown(touch(250,100));events.pointerup(touch(100,115));assert.deepEqual(app.visible(),[2],'Next valid swipe still works');
});
test('mobile and data-saver visits load the active photo without forcing the next page',()=>{
  for(const options of [{mobile:true},{saveData:true}]){
    const app=controller('',options);assert.equal(app.slides[0].image.attributes.loading,'eager');
    assert.equal(app.slides[1].image.attributes.loading,undefined);
    app.click('next');assert.equal(app.slides[1].image.attributes.loading,'eager');assert.equal(app.slides[2].image.attributes.loading,undefined);
  }
  assert.equal(controller().slides[1].image.attributes.loading,'eager','Desktop keeps next-page preloading');
});
