import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {renderExperience} from './render-experiences.mjs';

const signupUrl='https://hanzcity.com/auth/sign-in';
const photoBrand='<i class="photo-brand" aria-hidden="true">MyLodge</i>';
export const pageAliases = {
  'concept.html':2, 'parks.html':10, 'jumunjin.html':10, 'yangyang.html':10, 'chiangmai.html':3,
  'sections.html':10, 'services.html':7, 'community.html':10, 'owner.html':11,
  'faq.html':20, 'sales.html':12, 'product.html':2, 'apply.html':18, 'account.html':signupUrl,
  'mypage.html':19, 'contract.html':18, 'ownership.html':11, 'booking.html':15
};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export async function renderPresentation(root,assets) {
  const context={window:{}};
  vm.runInNewContext(await readFile(path.join(root,'deck-data.js'),'utf8'),context);
  const slides=context.window.MYLODGE_SLIDES;
  if(slides.length!==20||new Set(slides.map(s=>s.id)).size!==20)throw new Error('Expected exactly 20 slides');
  const assetPaths=new Map(assets.flatMap(asset=>asset.variants.map(v=>[v.src,asset])));
  const renderImage=(visual,index,small=false)=>{
    const asset=assetPaths.get(visual.image);
    const variants=asset?.variants.filter(v=>v.width>0&&v.src.endsWith('.webp'))||[];
    const sizes=small?'(max-width: 900px) 40vw, 26vw':'(max-width: 900px) calc(100vw - 32px), 52vw';
    const srcset=variants.length?` srcset="${variants.map(v=>escape(encodeURI(v.src))+' '+v.width+'w').join(', ')}" sizes="${sizes}"`:'';
    const dimensions=asset?.width&&asset?.height?` width="${asset.width}" height="${asset.height}"`:'';
    return `<img src="${escape(encodeURI(asset?.src||visual.image))}"${srcset}${dimensions} alt="${escape(visual.imageAlt)}" loading="${index===0?'eager':'lazy'}"${index===0&&!small?' fetchpriority="high"':''} decoding="async">`;
  };
  const picture=(slide,index)=>{
    const gallery=slide.gallery||[];
    if(gallery.length>2)throw new Error(`At most two supporting images are allowed: ${slide.id}`);
    const supporting=gallery.length?`<div class="slide-gallery gallery-${gallery.length}">${gallery.map(visual=>`<figure class="gallery-item"><div class="branded-photo">${renderImage(visual,index,true)}${photoBrand}</div><figcaption>${escape(visual.label)}</figcaption></figure>`).join('')}</div>`:'';
    const hero=index===0?'<button class="hero-film-control" type="button" data-hero-play aria-haspopup="dialog" aria-controls="space-film-modal" aria-expanded="false">영상 재생 <span aria-hidden="true">↗</span></button>':'';
    return `<figure class="slide-visual${gallery.length?' has-gallery':''}"><div class="visual-main">${renderImage(slide,index)}${hero}${photoBrand}</div>${supporting}<figcaption class="visual-caption">${escape(slide.imageCaption||'AI 콘셉트 이미지 · 실제 설계·제공 품목은 달라질 수 있습니다')}${index===0?' · 영상은 MyLodge 공간 콘셉트':''}</figcaption></figure>`;
  };
  const quotation=quote=>quote?`<div class="featured-quote">${quote.qualification?`<p class="quote-context">${escape(quote.qualification)}</p>`:''}<blockquote>${escape(quote.text)}</blockquote></div>`:'';
  const panel=(slide,withQuote=true)=>{
    const data=slide.panel;
    if(!data)throw new Error('Slide needs an image or an information panel: '+slide.id);
    return `<aside class="editorial-panel panel-${escape(slide.id)}" aria-label="${escape(data.title)}"><p class="panel-eyebrow">${escape(data.eyebrow||'MYLODGE / THE COLLECTION')}</p><h3>${escape(data.title)}</h3>${data.metric?`<p class="panel-metric">${escape(data.metric)}</p>`:''}${withQuote?quotation(slide.featuredQuote):''}<dl class="panel-items">${(data.items||[]).map((item,index)=>`<div class="panel-item"><dt><span aria-hidden="true">${String(index+1).padStart(2,'0')}</span>${escape(item.label)}</dt><dd>${escape(item.value)}${item.detail?`<small>${escape(item.detail)}</small>`:''}</dd></div>`).join('')}</dl>${data.note?`<p class="panel-note">${escape(data.note)}</p>`:''}</aside>`;
  };
  const supplementary=slide=>(slide.panelInDetails?`<details class="more-info panel-details"><summary>${escape(slide.panel.title)} 자세히 보기</summary><div>${panel(slide,false)}</div></details>`:'')+(slide.details||[]).map(item=>`<details class="more-info"><summary>${escape(item.summary)}</summary><div>${(item.paragraphs||[]).map(text=>`<p>${escape(text)}</p>`).join('')}${item.items?.length?`<ul>${item.items.map(text=>`<li>${escape(text)}</li>`).join('')}</ul>`:''}</div></details>`).join('');
  const sourceExcerpts=slide=>slide.sourceExcerpts?.length?`<details class="more-info original-excerpts"><summary>자세한 안내 보기</summary><div>${slide.sourceExcerpts.map(item=>`<article class="source-excerpt"><h4>${escape(item.title)}</h4>${item.qualification?`<p class="quote-context">${escape(item.qualification)}</p>`:''}<div>${item.paragraphs.map(text=>`<p>${escape(text)}</p>`).join('')}</div></article>`).join('')}</div></details>`:'';
  const imageCollection=(slide,index)=>slide.imageCollection?.length?`<details class="more-info"><summary>기존 MyLodge 콘셉트 사진 더 보기</summary><div><p>기존 MyLodge 분위기 참고용 AI 콘셉트입니다 신규 태국 빌라·콘도의 실제 상품 사진이 아닙니다</p><div class="concept-album">${slide.imageCollection.map(visual=>`<figure><div class="branded-photo">${renderImage(visual,index,true)}${photoBrand}</div><figcaption>${escape(visual.label||visual.imageAlt)}</figcaption></figure>`).join('')}</div></div></details>`:'';
  const links=slide=>slide.links?.length?`<div class="content-links">${slide.links.map(link=>{
    if(!/^(https:\/\/|[a-z][a-z0-9-]*\.html(?:[#?].*)?$)/.test(link.href))throw new Error('Unsupported content link: '+link.href);
    const external=link.href.startsWith('https://');
    return `<a href="${escape(link.href)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escape(link.label)}<span aria-hidden="true">${external?'↗':'→'}</span>${external?'<span class="sr-only"> (새 창)</span>':''}</a>`;
  }).join('')}</div>`:'';
  const renderSlide=(slide,index)=>{
    const experience=renderExperience(slide,assets);
    const tag=index===0?'h1':'h2';
    const facts=slide.facts?.length?`<dl class="slide-facts facts-${slide.facts.length}">${slide.facts.map(f=>`<div><dt>${escape(f.label)}</dt><dd>${escape(f.value)}</dd></div>`).join('')}</dl>`:'';
    const payments=slide.payments?.length?`<ol class="payments" aria-label="기본형 1구좌의 5차 납입 일정">${slide.payments.map(p=>`<li class="payment-row"><span class="payment-stage">${escape(p.stage)}</span><div><strong>${escape(p.amount)}</strong><small>${escape(p.method)}</small></div><p>${escape(p.when)}</p></li>`).join('')}</ol>`:'';
    const overview=index===0?'<a href="villa.html" class="overview-link">조감도 확인하기 <span aria-hidden="true">↗</span></a><p class="overview-context">기존 MyLodge 27평 모델 · 신규 태국 대형 빌라와 별도</p>':'';
    const points=slide.points?.length?`<ul class="value-points">${slide.points.map(text=>`<li>${escape(text)}</li>`).join('')}</ul>`:'';
    return `<section class="slide layout-${slide.layout} theme-${slide.theme}${payments?' has-payments':''}${slide.image?' image-contain':' has-panel'}${experience?' has-experience':''}" data-slide="${index+1}" data-title="${escape(slide.title)}" aria-labelledby="title-${index+1}"${index>0?' hidden':''}><div class="slide-copy"><p class="kicker">${escape(slide.kicker)}</p><${tag} id="title-${index+1}">${escape(slide.title)}</${tag}>${slide.subtitle?`<p class="slide-subtitle">${escape(slide.subtitle)}</p>`:""}${slide.brandBridge?`<aside class="brand-bridge" aria-label="MyLodge와 HanzCity"><strong>${escape(slide.brandBridge.primary)}</strong><p>${escape(slide.brandBridge.next)}</p><small>${escape(slide.brandBridge.account)}</small></aside>`:""}<p class="slide-body">${escape(slide.body)}</p>${points}${overview}${payments}${facts}${links(slide)}${experience}${slide.note?`<p class="slide-note">${escape(slide.note)}</p>`:''}${slide.image?quotation(slide.featuredQuote):''}${supplementary(slide)}${sourceExcerpts(slide)}${imageCollection(slide,index)}</div>${slide.image?picture(slide,index):panel(slide)}</section>`;
  };
  const videoModal=`<dialog class="video-modal" id="space-film-modal" data-video-modal aria-labelledby="space-film-title"><div class="video-modal-panel"><header class="video-modal-header"><div><p>MYLODGE / SPACE FILM</p><h2 id="space-film-title">마이롯지 공간 영상</h2></div><button class="video-modal-close" type="button" data-video-close autofocus aria-label="영상 닫기">닫기 <span aria-hidden="true">×</span></button></header><video class="modal-film" data-hero-video data-src="assets/video/mylodge-hero.mp4" controls muted playsinline preload="none" aria-label="마이롯지 공간 콘셉트 영상"></video><p class="video-modal-note">공간 분위기를 소개하는 콘셉트 영상</p><p class="video-modal-status" data-video-status role="status" hidden></p></div></dialog>`;
  const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f0ede9"><meta name="robots" content="noindex,nofollow"><meta name="description" content="마이롯지를 20페이지로 소개합니다 사진과 짧은 설명을 이전·다음으로 편하게 둘러보세요"><title>마이롯지 20페이지 소개</title><link rel="icon" href="assets/brand/mylodge-logo-green.png" type="image/png"><script src="entry-route.js"></script><link rel="stylesheet" href="presentation.css"><script defer src="presentation.js"></script><script type="module" src="presentation-extras.js"></script></head>
<body><a class="skip-link" href="#story">본문으로 바로가기</a><header class="presentation-header"><img class="brand-logo" src="assets/brand/mylodge-logo-green.png" width="1402" height="1122" alt="MyLodge 마이롯지"><span class="header-subtitle">함께 소유하는 나의 별장</span><span class="page-counter" data-counter aria-hidden="true">01 / 20</span><div class="signup-entry"><span class="signup-hint" id="signup-hint">HanzCity 계정으로 시작</span><a class="signup-link" href="${signupUrl}" target="_blank" rel="noopener noreferrer" aria-label="HanzCity 회원가입 (새 탭)" aria-describedby="signup-hint">회원가입</a></div></header><main class="presentation-deck" id="story" data-deck tabindex="-1" aria-label="마이롯지 20페이지 소개">${slides.map(renderSlide).join('\n')}</main><nav class="presentation-controls" aria-label="소개 페이지 이동"><div class="progress-track" aria-hidden="true"><span data-progress></span></div><button class="page-button previous" type="button" data-previous disabled aria-label="이전 페이지"><b aria-hidden="true">←</b><span>이전</span></button><p class="current-title" data-current-title role="status" aria-live="polite" aria-atomic="true">1 / 20 · ${escape(slides[0].title)}</p><button class="page-button next" type="button" data-next aria-label="2페이지 보기"><span>다음</span><b aria-hidden="true">→</b></button></nav>${videoModal}<noscript><style>body{height:auto;display:block;overflow:auto}.presentation-deck{overflow:visible}.slide,.slide[hidden]{position:relative;display:grid!important;min-height:90vh}.presentation-controls{display:none}</style></noscript></body></html>`;
  await writeFile(path.join(root,'index.html'),html);
  for(const [file,destination] of Object.entries(pageAliases)){
    const external=destination===signupUrl;
    const href=external?signupUrl:`index.html#page=${destination}`;
    await writeFile(path.join(root,file),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=${href}"><title>${external?'HanzCity 회원가입':'마이롯지 소개'}</title></head><body><a href="${href}"${external?' target="_blank" rel="noopener noreferrer"':''}>${external?'HanzCity 회원가입 (새 탭)':`마이롯지 ${destination}페이지 보기`}</a></body></html>\n`);
  }
  console.log(`Prepared one continuous 20-page presentation and ${Object.keys(pageAliases).length} existing URL redirects.`);
}
