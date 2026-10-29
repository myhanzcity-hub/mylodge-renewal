import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {renderExperience} from './render-experiences.mjs';

const signupUrl='https://hanzcity.com/auth/sign-in';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pageAliases={'concept.html':4,'parks.html':'free.html#page=1','jumunjin.html':'free.html#page=5','yangyang.html':'free.html#page=5','chiangmai.html':12,'sections.html':13,'services.html':14,'community.html':'free.html#page=1','owner.html':15,'faq.html':18,'sales.html':16,'product.html':1,'apply.html':17,'account.html':signupUrl,'mypage.html':19,'contract.html':17,'ownership.html':15,'booking.html':'free.html#page=4'};
function href(value){
  if(!/^(https:\/\/|#page=\d+$|[a-z][a-z0-9-]*\.html(?:[?#].*)?$)/.test(value))throw Error('Unsupported link: '+value);
  return escape(value);
}
const anchor=(link,cls='')=>`<a${cls?` class="${cls}"`:''} href="${href(link.href)}"${link.href.startsWith('https://')?' target="_blank" rel="noopener noreferrer"':''}>${escape(link.label)}<span aria-hidden="true">${link.href.startsWith('https://')?'↗':'→'}</span></a>`;

export async function renderPresentation(root,assets,{kind='mansion',dataFile='deck-data.js',output='index.html',aliases=true}={}){
  const context={window:{}};
  vm.runInNewContext(await readFile(path.join(root,dataFile),'utf8'),context);
  const slides=context.window.MYLODGE_SLIDES,isFree=kind==='free',count=isFree?6:20;
  if(slides.length!==count||new Set(slides.map(s=>s.id)).size!==count)throw Error(`Expected ${count} unique ${kind} slides`);
  const assetPaths=new Map(assets.flatMap(a=>a.variants.map(v=>[v.src,a]))),brand=isFree?'MyLodge Free':'MyLodge Private Mansion';
  const renderImage=(visual,index,frame=0)=>{
    const asset=assetPaths.get(visual.image),variants=asset?.variants.filter(v=>v.width>0&&v.src.endsWith('.webp'))||[];
    const sizes=index===0&&!isFree?'(max-width: 900px) 100vw, 92vw':'(max-width: 900px) calc(100vw - 36px), 56vw';
    return `<img src="${escape(encodeURI(visual.image))}"${variants.length?` srcset="${variants.map(v=>escape(encodeURI(v.src))+' '+v.width+'w').join(', ')}" sizes="${sizes}"`:''}${asset?.width?` width="${asset.width}" height="${asset.height}"`:''} alt="${escape(visual.imageAlt)}" loading="${index===0&&frame===0?'eager':'lazy'}"${index===0&&frame===0?' fetchpriority="high"':''} decoding="async">`;
  };
  const picture=(slide,index)=>{
    const frames=[slide,...(slide.heroGallery||[]),...(slide.gallery||[])];
    return `<div class="slide-visual photo-carousel" data-carousel${frames.length>1?' data-auto="true"':''} role="region" aria-label="${escape(slide.title)} 사진"><div class="photo-stage">${frames.map((v,i)=>`<figure class="photo-frame" data-photo-frame${i?' hidden':''}><div class="visual-main">${renderImage(v,index,i)}${isFree?'<i class="photo-brand" aria-hidden="true">MyLodge Free</i>':''}</div><figcaption class="visual-caption"><span>${escape(v.imageCaption||v.label||slide.imageCaption)}</span>${v.source?`<a data-photo-source href="${href(v.source.url)}" target="_blank" rel="noopener noreferrer">${escape(v.source.name)} 원문 ↗</a>`:''}</figcaption></figure>`).join('')}</div>${frames.length>1?`<div class="photo-controls" data-carousel-controls><button type="button" data-photo-previous aria-label="이전 사진">←</button><span data-photo-counter aria-live="polite">1 / ${frames.length}</span><button type="button" data-photo-next aria-label="다음 사진">→</button><button type="button" data-photo-pause aria-pressed="false">자동 넘김 멈춤</button></div>`:''}</div>`;
  };
  const details=slide=>(slide.details||[]).map(item=>`<details class="more-info"><summary>${escape(item.summary)}</summary><div>${(item.paragraphs||[]).map(p=>`<p>${escape(p)}</p>`).join('')}${item.items?.length?`<ul>${item.items.map(p=>`<li>${escape(p)}</li>`).join('')}</ul>`:''}</div></details>`).join('');
  const collection=(slide,index)=>slide.imageCollection?.length?`<details class="more-info"><summary>MyLodge Free 공간 사진 더 보기</summary><div><p>${escape(slide.imageCollectionNote||'기존 MyLodge 공간 분위기 참고용 AI 콘셉트입니다.')}</p><div class="concept-album">${slide.imageCollection.map(v=>`<figure>${renderImage(v,index,1)}<figcaption>${escape(v.label||v.imageAlt)}</figcaption></figure>`).join('')}</div></div></details>`:'';
  const renderSlide=(slide,index)=>{
    let experience=isFree?renderExperience(slide,assets,{free:true}):'';
    if(isFree&&slide.id==='pricing')experience+=renderExperience({id:'application'},assets,{free:true});
    if(isFree)experience=experience.replaceAll('#page=12','#page=3').replaceAll('#page=18','#page=3');
    const tag=index===0?'h1':'h2';
    const points=slide.points?.length?`<ul class="value-points">${slide.points.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`:'';
    const facts=slide.facts?.length?`<dl class="slide-facts${index===0?' hero-terms':''}">${slide.facts.map(f=>`<div><dt>${escape(f.label)}</dt><dd>${escape(f.value)}</dd></div>`).join('')}</dl>`:'';
    const copy=`<div class="slide-copy">${slide.productTitle?`<p class="product-title">${escape(slide.productTitle)}</p>`:''}${slide.globalNetwork?`<p class="network-line">${escape(slide.globalNetwork)}</p>`:''}<p class="kicker">${escape(slide.kicker)}</p><${tag} id="title-${index+1}">${escape(slide.title)}</${tag}>${slide.subtitle?`<p class="slide-subtitle">${escape(slide.subtitle)}</p>`:''}<p class="slide-body">${escape(slide.body)}</p>${facts}${slide.cta?anchor(slide.cta,'slide-cta'):''}${slide.secondaryCta?anchor(slide.secondaryCta,'secondary-cta'):''}${points}${slide.links?.length?`<div class="content-links">${slide.links.map(l=>anchor(l)).join('')}</div>`:''}${experience}${index===0&&isFree?'<button class="free-film-button" type="button" data-hero-play aria-haspopup="dialog" aria-controls="space-film-modal" aria-expanded="false">MyLodge Free 공간 영상 보기 · 소리와 함께 재생 ↗</button>':''}${slide.note?`<p class="slide-note">${escape(slide.note)}</p>`:''}${details(slide)}${collection(slide,index)}</div>`;
    return `<section class="slide layout-${index===0&&!isFree?'hero':'split'} theme-${slide.theme}${slide.reverse?' is-reversed':''}${experience?' has-experience':''} image-contain" data-slide="${index+1}" data-id="${escape(slide.id)}" data-title="${escape(slide.title)}" aria-labelledby="title-${index+1}"${index?' hidden':''}>${copy}${picture(slide,index)}</section>`;
  };
  const videoModal=isFree?`<dialog class="video-modal" id="space-film-modal" data-video-modal aria-labelledby="space-film-title"><div class="video-modal-panel"><header class="video-modal-header"><div><p>MYLODGE FREE / SPACE FILM</p><h2 id="space-film-title">MyLodge Free 공간 영상</h2></div><button class="video-modal-close" type="button" data-video-close autofocus aria-label="영상 닫기">닫기 ×</button></header><video class="modal-film" data-hero-video data-src="assets/video/mylodge-hero.mp4" controls playsinline preload="none" aria-label="MyLodge Free 공간 콘셉트 영상"></video><p class="video-modal-note">MyLodge Free 공간 콘셉트 영상 · 플레이어에서 음소거와 볼륨을 조절할 수 있습니다</p><p class="video-modal-status" data-video-status role="status" hidden></p></div></dialog>`:'';
  const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#10251e"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${brand}의 가치와 공간, 상품 조건을 한 장씩 살펴보세요."><title>${brand}</title><link rel="icon" href="assets/brand/mylodge-logo-green.png" type="image/png"><link rel="stylesheet" href="presentation.css"><link rel="stylesheet" href="mansion.css"><script defer src="presentation.js"></script><script defer src="mansion-media.js"></script><script type="module" src="presentation-extras.js"></script></head>
<body class="${kind}"><a class="skip-link" href="#story">본문으로 바로가기</a><header class="presentation-header"><a class="brand-home" href="index.html#page=1" aria-label="Private Mansion 첫 화면"><img class="brand-logo" src="assets/brand/mylodge-logo-green.png" width="1402" height="1122" alt="MyLodge 마이롯지"></a><span class="header-subtitle">${isFree?'MYLODGE FREE':'PRIVATE MANSION'}</span><a class="product-switch" href="${isFree?'index.html#page=1':'free.html#page=1'}">${isFree?'Private Mansion':'MyLodge Free'} ↗</a><span class="page-counter" data-counter aria-hidden="true">01 / ${count}</span><a class="signup-link" href="${signupUrl}" target="_blank" rel="noopener noreferrer" aria-label="HanzCity 회원가입·로그인 (새 탭)">회원가입</a></header><main class="presentation-deck" id="story" data-deck tabindex="-1" aria-label="${brand} ${count}페이지 소개">${slides.map(renderSlide).join('\n')}</main><nav class="presentation-controls" aria-label="소개 페이지 이동"><div class="progress-track" aria-hidden="true"><span data-progress></span></div><button class="page-button previous" type="button" data-previous disabled aria-label="이전 페이지"><b aria-hidden="true">←</b><span>이전</span></button><p class="current-title" data-current-title role="status" aria-live="polite" aria-atomic="true">1 / ${count} · ${escape(slides[0].title)}</p><button class="page-button next" type="button" data-next aria-label="2페이지 보기"><span>다음</span><b aria-hidden="true">→</b></button></nav>${videoModal}<noscript><style>body{height:auto;display:block;overflow:auto}.presentation-deck{overflow:visible}.slide,.slide[hidden]{position:relative;display:grid!important;min-height:90vh}.presentation-controls{display:none}</style></noscript></body></html>`;
  await writeFile(path.join(root,output),html);
  if(aliases)for(const[file,destination]of Object.entries(pageAliases)){
    const url=typeof destination==='number'?`index.html#page=${destination}`:destination;
    await writeFile(path.join(root,file),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=${href(url)}"><title>MyLodge 소개</title></head><body><a href="${href(url)}">MyLodge 소개로 이동</a></body></html>\n`);
  }
  console.log(`Prepared ${brand}: ${count} slides (${output}).`);
}
