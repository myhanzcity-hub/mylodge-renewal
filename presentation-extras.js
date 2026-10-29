import {pricePlans,destinations,selectionEstimate,usd} from './presentation-options.js';
import {animateAmount,setAmountText,transitionPhoto,revealSelection,mountMotion,mountPhotoBranding} from './presentation-motion.js';

export function mountExperiences(root=document){
  const selection=root.querySelector('[data-selection]');
  const picker=root.querySelector('[data-price-picker]');
  const input=name=>selection?.querySelector(`[name="${name}"]`);
  function updateSelection(){
    if(!selection)return;
    const result=selectionEstimate({destination:input('destination').value,plan:input('plan').value,shares:input('shares').value});
    input('plan').disabled=!result.priced;
    input('shares').disabled=!result.priced;
    const community=input('community').selectedOptions[0].text;
    selection.querySelector('[data-selection-label]').textContent=result.priced?`${result.region} · ${community} · ${result.plan} · ${result.shares}구좌`:`${result.region} · ${community}`;
    if(result.priced)animateAmount(selection.querySelector('[data-selection-total]'),result.total);
    else setAmountText(selection.querySelector('[data-selection-total]'),'—');
    selection.querySelector('[data-selection-first]').textContent=result.priced?`합계에 포함된 1차 납입금 ${usd(result.first)}`:'';
    selection.querySelector('[data-selection-state]').textContent=result.priced?'기존 MyLodge 기획 기준으로 살펴보는 참여 예시':'관심 지역과 취향을 먼저 골라보세요';
    revealSelection(selection.querySelector('.selection-summary'));
  }
  function choosePlan(id){
    if(!picker||!pricePlans[id])return;
    const plan=pricePlans[id];
    picker.querySelectorAll('[data-plan]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.plan===id)));
    animateAmount(picker.querySelector('[data-price-option]'),plan.option);
    picker.querySelector('[data-price-label]').textContent=plan.label+' · 1구좌 합계';
    animateAmount(picker.querySelector('[data-price-total]'),plan.base+plan.option);
    const luxury=picker.querySelector('[data-luxury-preview]');if(luxury)luxury.hidden=id!=='luxury';
    if(input('plan'))input('plan').value=id;
    updateSelection();
  }
  picker?.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>choosePlan(button.dataset.plan)));
  selection?.querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>{
    if(select.name==='plan')choosePlan(select.value);else updateSelection();
  }));
  root.querySelectorAll('[data-choices]').forEach(group=>{
    group.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.choice;
      group.querySelectorAll('[data-choice]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      let selected;
      group.querySelectorAll('[data-choice-panel]').forEach(panel=>{panel.hidden=panel.dataset.choicePanel!==id;if(!panel.hidden)selected=panel;});
      const images=[group.closest('[data-slide]')?.querySelector('.visual-main img'),group.querySelector('.choice-preview img')].filter(Boolean);
      if(selected){
        const asset=JSON.parse(selected.dataset.choiceImage);
        for(const image of images){
          const caption=image.closest?.('.slide-visual,.choice-preview')?.querySelector('.visual-caption,[data-choice-caption]');
          transitionPhoto(image,asset,()=>{if(caption&&asset.caption)caption.textContent=asset.caption;});
        }
        revealSelection(selected);
      }
      if(group.dataset.choices==='regions'&&input('destination')){input('destination').value=id;updateSelection();}
      if(group.dataset.choices==='communities'&&input('community')){input('community').value=id;updateSelection();}
    }));
  });
  updateSelection();
}
export function mountQuickPlanner(root=document){
  const planner=root.querySelector('[data-quick-dialog]');
  if(!planner)return;
  const regionSelect=planner.querySelector('[data-quote-region]');
  const sharesSelect=planner.querySelector('[data-quote-shares]');
  let plan='deluxe';
  function updateQuote(){
    const region=destinations.find(item=>item.id===regionSelect.value);
    const label=plan==='deluxe'?'디럭스 10평':'프레스티지 20평';
    planner.querySelector('[data-quote-summary]').textContent=`${region.label} · ${label} · ${sharesSelect.value}구좌`;
    // Deluxe/Prestige have no configured prices. Never reuse the legacy plan amounts.
    for(const key of ['base','total','payment'])planner.querySelector(`[data-quote-${key}]`).textContent='—';
  }
  function chooseRegion(id){
    regionSelect.value=id;
    planner.querySelectorAll('[data-quick-region]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.quickRegion===id)));
    planner.querySelectorAll('[data-region-gallery]').forEach(gallery=>{
      gallery.hidden=gallery.dataset.regionGallery!==id;
      if(!gallery.hidden)gallery.querySelector('img')?.setAttribute('loading','eager');
    });
    updateQuote();
  }
  planner.querySelectorAll('[data-quick-region]').forEach(button=>button.addEventListener('click',()=>chooseRegion(button.dataset.quickRegion)));
  planner.querySelectorAll('[data-quote-plan]').forEach(button=>button.addEventListener('click',()=>{
    plan=button.dataset.quotePlan;
    planner.querySelectorAll('[data-quote-plan]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    updateQuote();
  }));
  regionSelect.addEventListener('change',()=>chooseRegion(regionSelect.value));
  sharesSelect.addEventListener('change',updateQuote);
  updateQuote();
}
if(typeof document!=='undefined'){mountExperiences();mountQuickPlanner();mountMotion();mountPhotoBranding();}
