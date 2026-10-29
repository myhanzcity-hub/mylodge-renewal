import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {pricePlans,destinations,communities,lifeScenes,spaces,selectionEstimate} from '../presentation-options.js';
import {mountExperiences} from '../presentation-extras.js';

test('the existing proposal, price picker and selection share the same amounts',async()=>{
  const context={window:{}};
  vm.runInNewContext(await readFile(new URL('../deck-data.js',import.meta.url),'utf8'),context);
  const price=context.window.MYLODGE_SLIDES.find(slide=>slide.id==='pricing');
  assert.equal(price.facts[0].value,'10평');
  assert.equal(price.facts[1].value,'20평');
  assert.equal(pricePlans.basic.base,3999);
  assert.equal(pricePlans.luxury.option,150);
  assert.equal(pricePlans.basic.first,100);
  assert.equal(pricePlans.luxury.first,100);
});

test('Mansion prices and model choices are separated from the existing Free product',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const free=await readFile(new URL('../free.html',import.meta.url),'utf8');
  const viewer=await readFile(new URL('../villa.html',import.meta.url),'utf8');
  assert.ok(!/USD 3,999|USD 4,149|data-price-picker|data-selection\b/.test(html));
  assert.ok(free.includes('USD 3,999')&&free.includes('USD 4,149'));
  assert.ok(free.includes('기존 27평')&&viewer.includes('MYLODGE FREE'));
  assert.ok(html.includes('data-quick-page="models"')&&html.includes('data-quick-view="models"'));
  assert.ok(!/57810(?:-|\.)/.test(html+free),'Exclude the image with the embedded supplier logo');
  assert.ok(html.includes('mylodge-user-film.mp4')&&!html.includes('data-src="assets/video/mylodge-hero.mp4"'));
  assert.ok(free.includes('src="assets/video/mylodge-hero.mp4"'));
  assert.ok(html.includes('data-quote-legacy')&&html.includes('data-quote-mansion'));
});

test('all eight supplied photos remain preserved and their AI refinements are displayed; video bytes stay unchanged',async()=>{
  const base=new URL('../',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('assets/user-media/manifest.json',base),'utf8'));
  const refined=JSON.parse(await readFile(new URL('assets/ai-refined/manifest.json',base),'utf8'));
  const html=await readFile(new URL('index.html',base),'utf8');
  assert.equal(Object.keys(manifest.images).length,8);
  for(let index=0;index<8;index++){
    const file=`assets/user-media/image-${index}.png`,record=manifest.images[file];
    assert.ok(record&&html.includes(refined.mappings[file]),`Refined image ${index} must be placed in the presentation`);
    assert.equal(createHash('sha256').update(await readFile(new URL(file,base))).digest('hex'),record.sourceSha256);
    assert.equal(record.originalName,index===0?'image.png':`image (${index}).png`);
    assert.deepEqual(record.variants.map(item=>item.width),[480,960,1440]);
    for(const variant of record.variants)await access(new URL(variant.src,base));
  }
  assert.equal(manifest.video.originalName,'download (8).mp4');
  assert.equal(createHash('sha256').update(await readFile(new URL(manifest.video.src,base))).digest('hex'),manifest.video.sha256);
  assert.match(html,/<button[^>]*data-hero-play/);
  assert.ok(html.includes(`data-src="${manifest.video.src}?v=${manifest.video.sha256.slice(0,12)}"`),'Keep the new film in the existing player');
});

test('sixteen AI edits preserve their originals, framing and prompts and cover most main pages',async()=>{
  const base=new URL('../',import.meta.url);
  const refined=JSON.parse(await readFile(new URL('assets/ai-refined/manifest.json',base),'utf8'));
  const html=await readFile(new URL('index.html',base),'utf8');
  assert.equal(refined.generator,'built-in image_gen');
  assert.equal(refined.edits.length,16);
  for(const edit of refined.edits){
    const original=await readFile(new URL(edit.source,base)),output=await readFile(new URL(edit.output,base));
    assert.equal(createHash('sha256').update(original).digest('hex'),edit.sourceSha256);
    assert.equal(createHash('sha256').update(output).digest('hex'),edit.outputSha256);
    assert.notEqual(edit.sourceSha256,edit.outputSha256);
    assert.ok(edit.prompt.trim()&&html.includes(edit.output));
    const originalRatio=original.readUInt32BE(16)/original.readUInt32BE(20);
    const outputRatio=output.readUInt32BE(16)/output.readUInt32BE(20);
    assert.ok(Math.abs(originalRatio-outputRatio)<0.02,'Keep source framing aspect ratio');
  }
  const context={window:{}};
  vm.runInNewContext(await readFile(new URL('deck-data.js',base),'utf8'),context);
  assert.ok(context.window.MYLODGE_SLIDES.filter(slide=>slide.image.startsWith('assets/ai-refined/')).length>=14);
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

test('Thai locations keep the requested order and preserve photos without repetitive disclaimer captions',async()=>{
  const refined=JSON.parse(await readFile(new URL('../assets/ai-refined/manifest.json',import.meta.url),'utf8'));
  const thai=destinations.filter(item=>item.product==='thailand');
  assert.deepEqual(thai.map(item=>item.label),['푸켓','치앙마이','방콕']);
  assert.deepEqual(thai.map(item=>item.id),['phuket','chiangmai','bangkok']);
  assert.equal(thai[0].image,refined.mappings['assets/mylodge-thailand-concepts/phuket-pool.png']);
  for(const item of thai){
    assert.ok(!item.image.startsWith('assets/thailand-reference/'));
    assert.equal(item.caption,'');
  }
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const group=html.match(/aria-label="태국 관심 지역">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(group);
  assert.deepEqual([...group.matchAll(/data-choice="([^"]+)"/g)].map(m=>m[1]),['phuket','chiangmai','bangkok']);
  assert.match(group,/data-choice="phuket" aria-pressed="true"/);
  const quote=html.match(/<select data-quote-region>([\s\S]*?)<\/select>/)?.[1];
  assert.ok(quote);
  assert.deepEqual([...quote.matchAll(/<option value="([^"]+)"/g)].slice(0,3).map(m=>m[1]),['phuket','chiangmai','bangkok']);
  assert.ok(!/푸껫|Erawana|Erawan-Grand|Seacon/i.test(group));
  assert.ok(!html.includes('thailand-reference/'),'Original website photos are no longer used in the presentation');
  const audit=JSON.parse(await readFile(new URL('../review/mylodge-thailand-concepts.json',import.meta.url),'utf8'));
  assert.equal(audit.sourceMode,'new-generation-no-image-input');
  assert.equal(audit.images.length,3);
  for(const record of audit.images){
    assert.ok(record.path.startsWith('assets/mylodge-thailand-concepts/'));
    const bytes=await readFile(new URL('../'+record.path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Use the inspected generated asset');
    assert.ok(record.prompt.trim());
    assert.ok((html+await readFile(new URL('../free.html',import.meta.url),'utf8')).includes(refined.mappings[record.path]||record.path),'Each original concept or its refined version is used in the presentation');
  }
});

test('the first chapter explains the HanzCity connection before actions and keeps signup separate from purchase',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const opening=html.match(/data-slide="1"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  for(const text of ['MyLodge에서 시작하는 별장 라이프','HanzCity로 이어지는 더 넓은 가능성','회원가입·로그인은 HanzCity에서 진행됩니다'])assert.ok(opening.includes(text));
  assert.ok(opening.indexOf('class="brand-bridge"')<opening.indexOf('class="overview-link"'),'Show the relationship prominently before the first-page action');
  assert.equal([...html.matchAll(/href="https:\/\/hanzcity\.com\/auth\/sign-in"/g)].length,1);
  assert.match(html,/<span class="signup-hint" id="signup-hint">HanzCity 계정으로 시작<\/span>/);
  assert.match(html,/aria-describedby="signup-hint"/);
  const application=html.match(/data-slide="18"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(application.includes('상품 신청·계약은 별도'));
  assert.ok(application.includes('가입만으로 구좌나 예약이 확정되지는 않습니다'));
  const platform=html.match(/data-slide="19"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(platform.includes('준비 중')&&platform.includes('새로운 서비스와 계정 연계는 순차 안내'));
  assert.ok(platform.includes('data-choices="spaces"'),'Keep the existing space gallery');
});

test('generated controls resolve to unique panels and local responsive photos without reference-site pricing or attribution',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const [,id] of html.matchAll(/aria-controls="([^"]+)"/g))assert.ok(ids.includes(id));
  assert.equal([...html.matchAll(/data-choices="/g)].length,4);
  assert.equal([...html.matchAll(/class="choice-preview"/g)].length,4);
  assert.equal([...html.matchAll(/data-plan="/g)].length,0);
  assert.ok(html.includes('type="module" src="presentation-extras.js"'));
  assert.ok(!/USD 5,999|USD 199|USD 390|Botanica|Sansiri|대표|녹취/.test(html));
  for(const [,json] of html.matchAll(/data-choice-image="([^"]+)"/g)){
    const asset=JSON.parse(json.replaceAll('&quot;','"').replaceAll('&amp;','&'));
    await access(new URL('../'+asset.src,import.meta.url));
    assert.ok(asset.srcset.includes('480w'));
  }
  const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,'');
  assert.ok(!/[가-힣]\.(?=\s|$)/.test(visible),'Promotional copy has no sentence-ending dots');
});
