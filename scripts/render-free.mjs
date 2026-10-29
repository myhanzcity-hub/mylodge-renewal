import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {renderExperience} from './render-experiences.mjs';

export const freePhotos=[
  ['assets/reference-originals/57795.png','MyLodge Free 복층 모델 외관'],
  ['assets/reference-originals/57805.png','MyLodge Free 소형 별장 외관'],
  ['assets/reference-originals/57796.png','숲속의 MyLodge Free 복층 모델'],
  ['assets/reference-originals/57798.png','테라스가 있는 기존 모델'],
  ['assets/reference-originals/57808.png','독립된 층과 야외 테이블이 있는 기존 모델'],
  ['assets/reference-originals/57794.jpg','MyLodge Free 기존 27평 모델'],
  ['assets/feedback-v2/exterior-evening.png','저녁 조명의 기존 복층 모델'],
  ['assets/feedback-v2/forest-courtyard.png','기존 모델과 숲속 중정'],
  ['assets/feedback-v2/kitchen.png','기존 모델 주방'],
  ['assets/feedback-v2/bathroom.png','기존 모델 욕실']
].map(([image,imageAlt])=>({image,imageAlt}));

export async function renderFree(root,assets){
  const gallery=freePhotos.map(photo=>{
    const asset=assets.find(item=>item.src===photo.image);
    const srcset=asset.variants.filter(item=>item.width>0).map(item=>encodeURI(item.src)+' '+item.width+'w').join(', ');
    return `<figure><div class="branded-photo"><img src="${encodeURI(photo.image)}" srcset="${srcset}" sizes="(max-width:700px) 85vw, 480px" width="${asset.width}" height="${asset.height}" alt="${photo.imageAlt}" loading="lazy" decoding="async"><i class="photo-brand" aria-hidden="true">MyLodge</i></div><figcaption>${photo.imageAlt}</figcaption></figure>`;
  }).join('');
  const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>MyLodge Free · 기존 별장 모델</title><link rel="icon" href="assets/brand/mylodge-logo-green.png"><link rel="stylesheet" href="presentation.css"><link rel="stylesheet" href="free.css"><script type="module" src="presentation-extras.js"></script></head><body class="free-page"><header class="free-header"><a href="index.html#page=1">← Private Mansion 소개로</a><img src="assets/brand/mylodge-logo-green.png" alt="MyLodge"></header><main><p class="kicker">MYLODGE FREE</p><h1>가까운 곳에서 시작하는 별장 생활</h1><p class="free-lead">기존 소형·복층 모델과 관련 자료를 모았습니다 Private Mansion 디럭스 10평·프레스티지 20평과 구분해 살펴보세요</p><section aria-labelledby="free-gallery-title"><h2 id="free-gallery-title">MyLodge Free 공간 둘러보기</h2><div class="free-gallery" tabindex="0" role="region" aria-label="MyLodge Free 사진 · 좌우로 넘기기">${gallery}</div></section><section aria-labelledby="free-model-title"><h2 id="free-model-title">기존 27평 복층 모델</h2><p>1층 약 17평 · 2층 약 10평 · 합계 약 27평</p><a class="overview-link" href="villa.html">MyLodge Free 27평 모델 3D 보기 ↗</a></section><section aria-labelledby="free-video-title"><h2 id="free-video-title">MyLodge Free 공간 영상</h2><video controls playsinline preload="none" poster="assets/model/overview.png" src="assets/video/mylodge-hero.mp4" aria-label="기존 MyLodge Free 공간 영상"></video></section><section>${renderExperience({id:'free-pricing'},assets)}<details class="more-info"><summary>기존 기본형 1구좌 납입 내역</summary><div><p>1차 USD 100 · 2차 USD 1,000 · 3차 USD 1,000 · 4차 USD 1,000 · 5차 USD 899</p><p>럭셔리형은 기존 기본형에 옵션 USD 150을 더한 구성입니다</p></div></details></section><section>${renderExperience({id:'free-application'},assets)}</section><section><h2>구좌에서 공간으로</h2><iframe class="motion-frame" data-motion-frame data-src="assets/motion/ownership-story.html" title="기존 MyLodge Free 모델 조립 연출" loading="lazy"></iframe></section></main></body></html>`;
  await writeFile(path.join(root,'free.html'),html);
}
