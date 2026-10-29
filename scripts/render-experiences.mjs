import {pricePlans,destinations,communities,lifeScenes,spaces,selectionEstimate,usd} from '../presentation-options.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photoBrand='<i class="photo-brand" aria-hidden="true">MyLodge</i>';
export function renderQuickPlanner(assets){
  const regions=['phuket','chiangmai','bangkok','jumunjin','yangyang'].map(id=>destinations.find(item=>item.id===id));
  const image=(src,alt)=>{
    const file=src.startsWith('assets/')?src:'assets/reference-originals/'+src;
    const asset=assets.find(item=>item.src===file);
    if(!asset)throw new Error('Missing planner image: '+file);
    const srcset=asset.variants.filter(item=>item.width>0).map(item=>encodeURI(item.src)+' '+item.width+'w').join(', ');
    return `<div class="quick-photo branded-photo"><img src="${escape(encodeURI(file))}" srcset="${escape(srcset)}" sizes="(max-width:700px) 80vw, 540px" alt="${escape(alt)}" loading="lazy" decoding="async">${photoBrand}</div>`;
  };
  const galleries=regions.map(region=>{
    const photos=region.id==='phuket'?[
      [region.image,'푸켓 · 정원과 전용 수영장'],
      ['assets/mylodge-thailand-concepts/phuket-living.png','푸켓 · 거실과 다이닝'],
      ['assets/mylodge-thailand-concepts/phuket-bedroom.png','푸켓 · 풀사이드 침실']
    ]:[[region.image,region.title]];
    return `<div data-region-gallery="${region.id}"${region.id!=='phuket'?' hidden':''}><div class="quick-region-photos" tabindex="0" role="region" aria-label="${region.label} 사진 · 좌우로 넘기기">${photos.map(([src,alt])=>image(src,alt)).join('')}</div>${photos.length>1?'<p class="quick-photo-hint">사진을 좌우로 밀어보세요</p>':''}<h3>${escape(region.label)}</h3><p class="quick-region-mood">${escape(region.mood)}</p></div>`;
  }).join('');
  return `<section class="quick-planner" data-quick-view="places"><div class="quick-region-tabs" role="group" aria-label="머물 지역 선택">${regions.map(region=>`<button type="button" data-quick-region="${region.id}" aria-pressed="${region.id==='phuket'}">${region.label}</button>`).join('')}</div>${galleries}<button class="quick-primary" type="button" data-quick-estimate>이 지역으로 견적 맞추기 →</button></section><section class="quick-planner" data-quick-view="estimate" hidden><label class="quick-field">선택한 지역<select data-quote-region>${regions.map(region=>`<option value="${region.id}">${region.label}</option>`).join('')}</select></label><fieldset class="quick-plan-options"><legend>나에게 맞는 공간</legend><button type="button" data-quote-plan="deluxe" aria-pressed="true"><span>디럭스</span><strong>10평</strong></button><button type="button" data-quote-plan="prestige" aria-pressed="false"><span>프레스티지</span><strong>20평</strong></button></fieldset><label class="quick-field">구좌 수<select data-quote-shares>${[1,2,3,4,5].map(count=>`<option value="${count}">${count}구좌</option>`).join('')}</select></label><div class="quick-quote-summary" role="status" aria-live="polite" aria-atomic="true"><p data-quote-summary>푸켓 · 디럭스 10평 · 1구좌</p><dl><div><dt>상품 금액</dt><dd data-quote-base>—</dd></div><div class="quick-quote-total"><dt>합계</dt><dd data-quote-total>—</dd></div><div><dt>납입 내역</dt><dd data-quote-payment>—</dd></div></dl></div><button type="button" class="quick-secondary" data-quick-places>다른 지역 둘러보기</button></section>`;
}
export function renderExperience(slide,assets){
  const assetsByPath=new Map(assets.map(asset=>[asset.src,asset]));
  const imageObject=item=>{
    const src=item.image.startsWith('assets/')?item.image:'assets/reference-originals/'+item.image,asset=assetsByPath.get(src);
    if(!asset)throw new Error('Missing gallery asset: '+src);
    return {src:encodeURI(src),srcset:asset.variants.filter(v=>v.width>0).map(v=>encodeURI(v.src)+' '+v.width+'w').join(', '),width:asset.width,height:asset.height,alt:item.imageAlt||item.title+' · 공간 참고 이미지',caption:item.caption||''};
  };
  const imageData=item=>escape(JSON.stringify(imageObject(item)));
  const preview=(items,selected)=>{
    const image=imageObject(items.find(item=>item.id===selected));
    return `<figure class="choice-preview"><div class="branded-photo"><img src="${escape(image.src)}" srcset="${escape(image.srcset)}" sizes="(max-width: 900px) calc(100vw - 40px), 40vw" width="${image.width}" height="${image.height}" alt="${escape(image.alt)}" loading="lazy" decoding="async">${photoBrand}</div><figcaption data-choice-caption>${escape(image.caption)}</figcaption></figure>`;
  };
  const block=(label,title,content)=>`<div class="experience-block"><p class="experience-label">${label}</p><h3 class="experience-heading">${title}</h3>${content}</div>`;
  const motionFrame=kind=>`<iframe class="motion-frame motion-frame-${kind}" data-motion-frame data-src="assets/motion/${kind==='ownership'?'ownership-story':'luxury-preview'}.html" title="${kind==='ownership'?'공유 참여에서 별장으로 이어지는 조립 연출':'럭셔리 인테리어 조립 연출'}" loading="lazy"></iframe>`;
  const choiceButton=(item,selected,kind)=>{
    const expanding=kind==='communities'||kind==='life',image=expanding?imageObject(item):null;
    return `<button type="button" data-choice="${item.id}" aria-pressed="${item.id===selected}" aria-controls="${slide.id}-${item.id}">${image?`<img src="${escape(image.src)}" srcset="${escape(image.srcset)}" sizes="(max-width: 900px) 80vw, 24vw" alt="" aria-hidden="true" width="${image.width}" height="${image.height}" loading="lazy">${photoBrand}<span>${escape(item.label)}</span>`:escape(item.label)}</button>`;
  };
  const choices=(items,selected,kind)=>{
    const tabs=kind==='regions'?`<div class="destination-groups">${[['태국',items.filter(item=>item.product==='thailand')],['국내',items.filter(item=>item.product==='original')]].map(([label,regions])=>`<div class="destination-group"><p>${label}</p><div class="choice-tabs" role="group" aria-label="${label} 관심 지역">${regions.map(item=>choiceButton(item,selected,kind)).join('')}</div></div>`).join('')}</div>`:`<div class="choice-tabs${kind==='communities'||kind==='life'?' expanding-gallery':''}" role="group" aria-label="${kind==='communities'?'관심 커뮤니티':'사진 주제'}">${items.map(item=>choiceButton(item,selected,kind)).join('')}</div>`;
    return `<div data-choices="${kind}">${tabs}${preview(items,selected)}${items.map(item=>`<div class="choice-panel" id="${slide.id}-${item.id}" data-choice-panel="${item.id}" data-choice-image="${imageData(item)}"${item.id!==selected?' hidden':''}><h4>${escape(item.title)}</h4><p>${escape(item.body)}</p>${item.mood?`<dl class="region-summary"><div><dt>이런 휴식에</dt><dd>${escape(item.mood)}</dd></div>${item.product==='original'?`<div><dt>참여 금액</dt><dd>기존 기본형 1구좌 ${usd(pricePlans.basic.base)}부터</dd></div>`:''}</dl>`:''}</div>`).join('')}</div>`;
  };
  const destinationOptions=[['국내','original'],['태국','thailand']].map(([label,product])=>`<optgroup label="${label}">${destinations.filter(item=>item.product===product).map(item=>`<option value="${item.id}"${item.id==='jumunjin'?' selected':''}>${escape(item.label)}</option>`).join('')}</optgroup>`).join('');
  switch(slide.id){
    case 'opening':return `<div class="hero-shortcuts" aria-label="관심 내용 바로가기"><a href="#page=3" data-quick-page="3" aria-haspopup="dialog" aria-controls="quick-page-dialog" aria-expanded="false">머물 곳 둘러보기 <span aria-hidden="true">↗</span></a><a href="#page=12" data-quick-page="12" aria-haspopup="dialog" aria-controls="quick-page-dialog" aria-expanded="false">견적 맞추기 <span aria-hidden="true">↗</span></a></div>`;
    case 'destinations':return block('THREE PLACES IN THAILAND','태국의 세 가지 라이프',choices(destinations,'phuket','regions'));
    case 'lifestyle':return block('MOMENTS TO KEEP','그곳에서 보내게 될 하루',choices(lifeScenes,'evening','life'));
    case 'community':return block('FIND YOUR PEOPLE','나와 닮은 취향을 골라보세요',choices(communities,'family','communities')+'<p class="experience-footnote">관심 취향을 살펴보는 화면입니다 커뮤니티 운영과 배정은 상품별로 안내합니다</p>');
    case 'ownership':return block('A SHARE OF YOUR OWN','별장 라이프에 가까워지는 세 걸음',`${motionFrame('ownership')}<ol class="ownership-path"><li><span>01</span><strong>나의 공간 찾기</strong><p>머물고 싶은 지역과 생활 방식을 고릅니다</p></li><li><span>02</span><strong>참여 규모 정하기</strong><p>구좌와 이용 범위를 나의 계획에 맞춥니다</p></li><li><span>03</span><strong>함께 누리는 별장</strong><p>상품별 권리와 이용 조건을 확인하고 시작합니다</p></li></ol><p class="experience-footnote">구좌별 권리와 이용일은 최종 계약에 따릅니다</p><div class="space-links"><a href="#page=12">참여 금액 살펴보기 →</a></div>`);
    case 'pricing':return block('CHOOSE YOUR PLAN','기존 MyLodge 기본형·럭셔리형 금액',`<div data-price-picker><div class="price-options" role="group" aria-label="기존 MyLodge 상품 선택">${Object.entries(pricePlans).map(([id,plan])=>`<button type="button" data-plan="${id}" aria-pressed="${id==='basic'}"><small>${plan.label}</small><strong>${usd(plan.base+plan.option)}</strong><span>${plan.option?'기본형 + 럭셔리 옵션 USD 150':'기본 구성 · 1구좌'}</span></button>`).join('')}</div><dl class="price-breakdown"><div><dt>기본 금액</dt><dd>${usd(pricePlans.basic.base)}</dd></div><div><dt>럭셔리 옵션</dt><dd data-price-option>${usd(0)}</dd></div><div><dt>합계에 포함된 1차 납입금</dt><dd>${usd(pricePlans.basic.first)}</dd></div></dl><div class="price-total" role="status" aria-live="polite" aria-atomic="true"><span data-price-label>기본형 · 1구좌 합계</span><strong data-price-total>${usd(pricePlans.basic.base)}</strong></div><div data-luxury-preview hidden>${motionFrame('luxury')}</div><p class="experience-footnote">기존 MyLodge 기획 기준 · 태국 신규 상품은 별도 안내</p><div class="space-links"><a href="#page=18">나의 참여 계획 만들어보기 →</a></div></div>`);
    case 'application':{
      const initial=selectionEstimate();
      return block('MAKE IT YOURS','나의 별장 계획을 골라보세요',`<div data-selection><div class="selection-fields"><label>관심 지역<select name="destination">${destinationOptions}</select></label><label>함께할 취향<select name="community">${communities.map(item=>`<option value="${item.id}">${item.label}</option>`).join('')}</select></label><label>상품 구성<select name="plan"><option value="basic">기본형</option><option value="luxury">럭셔리형</option></select></label><label>참여 구좌 예시<select name="shares">${[1,2,3,4,5].map(n=>`<option value="${n}">${n}구좌</option>`).join('')}</select></label></div><div class="selection-summary" role="status" aria-live="polite" aria-atomic="true"><p data-selection-label>주문진 · 패밀리 · 기본형 · 1구좌</p><strong data-selection-total>${usd(initial.total)}</strong><p data-selection-first>합계에 포함된 1차 납입금 ${usd(initial.first)}</p><p data-selection-state>기존 MyLodge 기획 기준으로 살펴보는 참여 예시</p></div><p class="experience-footnote">선택 내용은 이 화면에서만 확인됩니다 신청·예약·결제는 진행되지 않으며, 참여를 시작하려면 상단 회원가입 버튼을 이용해 주세요</p></div>`);
    }
    case 'platform-guide':return block('MYLODGE → HANZCITY','별장 라이프에서 더 넓은 일상으로','<dl class="platform-connection"><div><dt>지금 시작</dt><dd>HanzCity 회원가입·로그인<small>상단 회원가입 버튼으로 연결</small></dd></div><div><dt>준비 중</dt><dd>더 다양한 라이프스타일 서비스<small>새로운 서비스와 계정 연계는 순차 안내</small></dd></div></dl><p class="experience-footnote">MyLodge를 출발점으로 HanzCity의 더 넓은 생활 서비스를 준비합니다 상품 신청·계약과 서비스별 이용은 별도 안내에 따릅니다</p>')+block('EXPLORE THE SPACE','마음에 드는 공간부터 둘러보세요',choices(spaces,'interior','spaces')+'<div class="space-links"><a href="villa.html">1층·2층 구조를 3D로 보기 ↗</a></div>');
    default:return '';
  }
}
