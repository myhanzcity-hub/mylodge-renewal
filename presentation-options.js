// Prices belong to the current MyLodge proposal, not the reference site's products.
export const pricePlans = Object.freeze({
  basic: Object.freeze({label:'기본형', base:3999, option:0, first:100}),
  luxury: Object.freeze({label:'럭셔리형', base:3999, option:150, first:100})
});
export const destinations = [
  {id:'jumunjin',label:'주문진',product:'original',title:'파도 소리로 시작하는 하루',body:'바다를 바라보며 천천히 걷고, 좋아하는 사람과 느긋한 저녁을 보내세요',mood:'바다 · 가족 · 휴식',image:'57794.jpg'},
  {id:'yangyang',label:'양양',product:'original',title:'낮에는 활기차게, 저녁에는 여유롭게',body:'새로운 취미와 만남으로 채우는 하루 활동적인 휴가를 좋아하는 당신에게 어울리는 제안입니다',mood:'활동 · 만남 · 주말',image:'57808.png'},
  {id:'phuket',label:'푸켓',product:'thailand',title:'푸켓 · 프라이빗 휴양',body:'수영장 옆에서 책을 읽고, 따뜻한 바람을 즐기는 오후 우리만의 속도로 쉬어 가는 풀빌라 라이프를 그려보세요',mood:'해변 · 풀빌라 · 휴양',image:'assets/mylodge-thailand-concepts/phuket-pool.png',imageAlt:'열대 정원과 전용 수영장이 어우러진 푸켓 풀빌라 AI 콘셉트',caption:'MyLodge 푸켓 공간 AI 콘셉트 · 실제 제공 시설은 확정 후 안내'},
  {id:'chiangmai',label:'치앙마이',product:'thailand',title:'치앙마이 · 자연 속 체류',body:'초록을 바라보며 보내는 느긋한 아침 일과 휴식 사이의 균형을 찾고, 조금 더 오래 머무는 일상을 그려보세요',mood:'자연 · 장기 체류 · 여유',image:'assets/feedback-v2/forest-courtyard.png',imageAlt:'자연 속 체류 분위기를 표현한 기존 MyLodge 모델의 AI 콘셉트',caption:'치앙마이 체류 분위기 · 기존 모델을 활용한 AI 콘셉트 · 실제 제공 시설은 확정 후 안내'},
  {id:'bangkok',label:'방콕',product:'thailand',title:'방콕 · 편리한 도시 생활',body:'카페와 맛집을 발견하고, 새로운 문화를 만나는 하루 도시를 즐긴 뒤 돌아올 편안한 콘도 생활을 그려보세요',mood:'도심 · 콘도 · 생활',image:'assets/mylodge-edited/condo-retreat.png',imageAlt:'방콕 도심 체류의 실내 분위기를 제안하는 AI 편집 콘셉트',caption:'방콕 실내 분위기 · AI 콘셉트 · 실제 제공 시설은 확정 후 안내'}
];
export const communities = [
  {id:'family',label:'패밀리',title:'함께 자라는 가족의 추억',body:'아이와 보내는 느긋한 아침, 온 가족이 모이는 저녁 세대가 함께 즐길 별장 생활을 그려보세요',image:'57798.png'},
  {id:'couples',label:'커플·라이프',title:'둘만의 리듬으로 보내는 시간',body:'함께 요리하고 산책하며 바쁜 일상에서 놓쳤던 대화를 이어가세요',image:'57821.png'},
  {id:'social',label:'소셜·액티브',title:'좋아하는 일로 가까워지는 사이',body:'취미와 활동이 만남으로 이어지는 휴가 새로운 사람과 함께할 즐거움을 발견해 보세요',image:'57808.png'},
  {id:'business',label:'비즈니스',title:'좋은 대화가 새로운 가능성으로',body:'편안한 라운지에서 나누는 생각과 경험 일과 만남이 자연스럽게 이어지는 시간을 제안합니다',image:'57800.png'},
  {id:'wellness',label:'웰니스',title:'나를 위한 여백을 채우는 하루',body:'아무것도 서두르지 않는 아침 조용한 공간에서 몸과 마음의 속도를 되찾아 보세요',image:'57802.png'}
];
export const lifeScenes = [
  {id:'evening',label:'함께하는 저녁',title:'오늘의 메뉴는 함께 만드는 추억',body:'좋아하는 음식을 준비하고 테이블에 둘러앉는 시간 평범한 저녁도 별장에서는 특별해집니다',image:'57821.png'},
  {id:'family',label:'가족의 아침',title:'서두르지 않아도 좋은 아침',body:'창가에서 책을 읽고 아이의 이야기를 듣는 하루 함께 보내는 시간이 휴가의 중심이 됩니다',image:'57822.png'},
  {id:'invitation',label:'친구 초대',title:'오랜만이라는 말 대신, 자주 만나자는 약속',body:'넓은 거실에 모여 못다 한 이야기를 나눠보세요 다음 만남을 기다리게 하는 공간을 꿈꿉니다',image:'57800.png'}
];
export const spaces = [
  {id:'interior',label:'실내',title:'함께 머물고 싶은 거실과 주방',body:'식탁에서 시작해 거실로 이어지는 대화 우리만의 시간을 채우는 공간을 둘러보세요',image:'57821.png'},
  {id:'exterior',label:'외관',title:'문을 열기 전부터 시작되는 설렘',body:'밝은 외관과 탁 트인 창으로 만나는 별장의 첫인상 나의 휴식에 어울리는 집을 그려보세요',image:'57794.jpg'},
  {id:'terrace',label:'테라스',title:'실내의 편안함을 바깥까지',body:'커피 한 잔과 함께하는 아침, 바람을 느끼는 저녁 테라스에서 휴식의 폭을 넓혀보세요',image:'57798.png'},
  {id:'upper',label:'복층 공간',title:'함께하는 공간과 나만의 쉼을 한 집에',body:'기존 27평 모델의 1층 약 17평과 2층 약 10평 구성을 3D 조감도에서 직접 둘러보세요',image:'57810.png'}
];
export function selectionEstimate({destination='jumunjin',plan='basic',shares=1}={}){
  const region=destinations.find(item=>item.id===destination);
  const price=pricePlans[plan];
  const count=Number(shares);
  if(!region||!price||!Number.isInteger(count)||count<1||count>5)throw new RangeError('Invalid selection');
  if(region.product!=='original')return {priced:false,region:region.label,shares:count,plan:null,unit:null,total:null,first:null};
  return {priced:true,region:region.label,shares:count,plan:price.label,unit:price.base+price.option,total:(price.base+price.option)*count,first:price.first*count};
}
export const usd=number=>'USD '+new Intl.NumberFormat('en-US').format(number);
