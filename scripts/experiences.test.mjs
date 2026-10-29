import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {pricePlans,destinations,communities,lifeScenes,spaces,selectionEstimate} from '../presentation-options.js';
import {mountExperiences} from '../presentation-extras.js';

test('the existing proposal, price picker and selection share the same amounts',async()=>{
  const context={window:{}};
  vm.runInNewContext(await readFile(new URL('../free-deck-data.js',import.meta.url),'utf8'),context);
  const price=context.window.MYLODGE_SLIDES.find(slide=>slide.id==='pricing');
  assert.equal(price.facts[0].value,'USD 3,999');
  assert.equal(price.facts[1].value,'USD 4,149');
  assert.equal(pricePlans.basic.base,3999);
  assert.equal(pricePlans.luxury.option,150);
  assert.equal(pricePlans.basic.first,100);
  assert.equal(pricePlans.luxury.first,100);
});

test('all regions, plans and share counts keep Thai prices unconfigured',()=>{
  for(const destination of destinations)for(const plan of Object.keys(pricePlans))for(const shares of [1,2,3,4,5]){
    const result=selectionEstimate({destination:destination.id,plan,shares});
    if(destination.product==='original'){
      assert.equal(result.total,(plan==='basic'?3999:4149)*shares);
      assert.equal(result.first,100*shares);
      assert.ok(result.first<result.total,'First payment is part of the total');
    }else{
      assert.equal(result.priced,false);
      for(const key of ['unit','total','first','plan'])assert.equal(result[key],null);
    }
  }
  for(const shares of [0,-1,1.5,6,'bad',Infinity])assert.throws(()=>selectionEstimate({shares}),RangeError);
  assert.throws(()=>selectionEstimate({plan:'prestige'}),RangeError);
  assert.throws(()=>selectionEstimate({destination:'unknown'}),RangeError);
});

function fixture(){
  const node=(dataset={})=>({dataset,attributes:{},events:{},textContent:'',hidden:false,disabled:false,value:'',addEventListener(name,fn){this.events[name]=fn;},setAttribute(name,value){this.attributes[name]=String(value);},click(){this.events.click?.();}});
  const fields=Object.fromEntries(['destination','community','plan','shares'].map(name=>[name,Object.assign(node(),{name})]));
  Object.assign(fields.destination,{value:'jumunjin'});Object.assign(fields.community,{value:'family'});Object.assign(fields.plan,{value:'basic'});Object.assign(fields.shares,{value:'1'});
  Object.defineProperty(fields.community,'selectedOptions',{get(){return [{text:communities.find(c=>c.id===this.value).label}];}});
  const summary=Object.fromEntries(['label','total','first','state'].map(key=>[key,node()]));
  const selection=node();selection.querySelector=selector=>selector.startsWith('[name=')?fields[selector.match(/"([^"]+)"/)[1]]:summary[selector.match(/data-selection-(\w+)/)?.[1]];selection.querySelectorAll=()=>Object.values(fields);
  const priceOutput=Object.fromEntries(['option','label','total'].map(key=>[key,node()]));
  const priceButtons=['basic','luxury'].map(plan=>node({plan}));
  const picker=node();picker.querySelector=selector=>priceOutput[selector.match(/data-price-(\w+)/)?.[1]];picker.querySelectorAll=()=>priceButtons;
  const groups=[['regions',destinations],['communities',communities],['life',lifeScenes],['spaces',spaces]].map(([kind,items])=>{
    const group=node({choices:kind}),mainImage=node(),previewImage=node(),mainCaption=node(),previewCaption=node();
    mainImage.closest=()=>({querySelector:()=>mainCaption});previewImage.closest=()=>({querySelector:()=>previewCaption});
    const buttons=items.map(item=>node({choice:item.id}));
    const panels=items.map(item=>node({choicePanel:item.id,choiceImage:JSON.stringify({src:item.image,srcset:item.image+' 480w',alt:item.title,width:480,height:320,caption:item.caption||'공간 참고 이미지'})}));
    group.buttons=buttons;group.panels=panels;group.mainImage=mainImage;group.previewImage=previewImage;group.mainCaption=mainCaption;group.previewCaption=previewCaption;
    group.querySelectorAll=selector=>selector==='[data-choice]'?buttons:panels;
    group.querySelector=()=>previewImage;
    group.closest=()=>({querySelector:()=>mainImage});
    return group;
  });
  const root={querySelector:selector=>selector==='[data-selection]'?selection:picker,querySelectorAll:()=>groups};
  mountExperiences(root);
  return {fields,summary,priceOutput,priceButtons,groups,change(name,value){fields[name].value=value;fields[name].events.change();}};
}

test('price and community choices reach the plan; Thai selection clears monetary UI and restores domestic choices',()=>{
  const app=fixture();
  assert.equal(app.summary.total.textContent,'USD 3,999');
  app.priceButtons[1].click();
  app.change('shares','3');
  app.groups[1].buttons.find(b=>b.dataset.choice==='wellness').click();
  assert.equal(app.fields.plan.value,'luxury');
  assert.equal(app.fields.community.value,'wellness');
  assert.equal(app.summary.total.textContent,'USD 12,447');
  assert.equal(app.summary.first.textContent,'합계에 포함된 1차 납입금 USD 300');
  app.groups[0].buttons.find(b=>b.dataset.choice==='phuket').click();
  assert.equal(app.fields.destination.value,'phuket');
  assert.equal(app.fields.plan.disabled,true);assert.equal(app.fields.shares.disabled,true);
  assert.ok(!app.summary.total.textContent.includes('USD'));
  assert.ok(!app.summary.first.textContent.includes('USD'));
  app.change('destination','yangyang');
  assert.equal(app.fields.plan.disabled,false);assert.equal(app.fields.shares.disabled,false);
  assert.equal(app.summary.total.textContent,'USD 12,447');
  app.change('plan','basic');
  assert.equal(app.priceOutput.total.textContent,'USD 3,999');
  assert.equal(app.summary.total.textContent,'USD 11,997');
});

test('each gallery updates desktop and nearby mobile previews with accessible selection state',()=>{
  const app=fixture();
  for(const group of app.groups)for(const button of group.buttons){
    button.click();
    assert.equal(group.buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);
    assert.equal(group.panels.filter(p=>!p.hidden).length,1);
    const panel=group.panels.find(p=>!p.hidden),asset=JSON.parse(panel.dataset.choiceImage);
    assert.equal(panel.dataset.choicePanel,button.dataset.choice);
    for(const image of [group.mainImage,group.previewImage]){
      assert.equal(image.attributes.src,asset.src);assert.equal(image.attributes.srcset,asset.srcset);assert.equal(image.attributes.alt,asset.alt);
    }
    for(const caption of [group.mainCaption,group.previewCaption])assert.equal(caption.textContent,asset.caption);
  }
});

test('legacy Thai concepts retain their provenance without becoming Mansion prices or inventory',async()=>{
  const thai=destinations.filter(item=>item.product==='thailand');
  assert.deepEqual(thai.map(item=>item.label),['푸켓','치앙마이','방콕']);
  assert.deepEqual(thai.map(item=>item.id),['phuket','chiangmai','bangkok']);
  assert.ok(thai[0].image.startsWith('assets/mylodge-thailand-concepts/'));
  for(const item of thai){
    assert.ok(!item.image.startsWith('assets/thailand-reference/'));
    assert.ok(item.caption.includes('AI 콘셉트'));
  }
  const html=await readFile(new URL('../free.html',import.meta.url),'utf8');
  const mansion=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(!html.includes('<optgroup label="태국">'),'Free selection stays with its domestic product');
  const options=html.match(/<optgroup label="국내">([\s\S]*?)<\/optgroup>/)?.[1];
  assert.deepEqual([...options.matchAll(/value="([^"]+)"/g)].map(m=>m[1]),['jumunjin','yangyang']);
  assert.ok(!mansion.includes('data-selection')&&!mansion.includes('data-price-picker'),'Legacy controls stay in Free');
  const audit=JSON.parse(await readFile(new URL('../review/mylodge-thailand-concepts.json',import.meta.url),'utf8'));
  assert.equal(audit.sourceMode,'new-generation-no-image-input');
  assert.equal(audit.images.length,3);
  for(const record of audit.images){
    assert.ok(record.path.startsWith('assets/mylodge-thailand-concepts/'));
    const bytes=await readFile(new URL('../'+record.path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Use the inspected generated asset');
    assert.ok(record.prompt.trim());
    assert.ok(!mansion.includes(record.path),'Mansion uses the requested official reference photos');
  }
});

test('Mansion separates product conditions and account entry from purchase completion',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const opening=html.match(/data-slide="1"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(opening.includes('href="#page=16"'),'Owner CTA reaches mansion conditions instead of a legacy price');
  assert.ok(html.includes('https://hanzcity.com/auth/sign-in'));
  const context={window:{}};vm.runInNewContext(await readFile(new URL('../deck-data.js',import.meta.url),'utf8'),context);
  const application=JSON.stringify(context.window.MYLODGE_SLIDES.find(slide=>slide.id==='application'));
  assert.ok(/HanzCity/.test(application)&&/계약/.test(application)&&/별도|확정|구분/.test(application));
  const free=await readFile(new URL('../free.html',import.meta.url),'utf8');
  assert.ok(free.includes('data-choices="spaces"')&&/href="villa\.html(?:\?[^\"]*)?"/.test(free),'Keep the legacy space gallery in Free');
});

test('Free controls resolve to unique panels and responsive photos without importing Mansion conditions',async()=>{
  const html=await readFile(new URL('../free.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const [,id] of html.matchAll(/aria-controls="([^"]+)"/g))assert.ok(ids.includes(id));
  assert.equal([...html.matchAll(/data-choices="/g)].length,2);
  assert.equal([...html.matchAll(/class="choice-preview"/g)].length,2);
  assert.equal([...html.matchAll(/data-plan="/g)].length,2);
  assert.ok(html.includes('type="module" src="presentation-extras.js"'));
  assert.ok(!/USD 5,999|USD 199|USD 390|디럭스|프레스티지|대표|녹취/.test(html));
  for(const [,json] of html.matchAll(/data-choice-image="([^"]+)"/g)){
    const asset=JSON.parse(json.replaceAll('&quot;','"').replaceAll('&amp;','&'));
    await access(new URL('../'+asset.src,import.meta.url));
    assert.ok(asset.srcset.includes('480w'));
  }
});
