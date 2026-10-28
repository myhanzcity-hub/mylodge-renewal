import { mount } from './luxury-package-anatomy.js';

const host=document.querySelector('[data-luxury-host]');
const embedded=window.parent!==window;
let active=!embedded;
const preview=mount(host,{active,gsap:window.gsap});
function sync(){preview?.setActive(active&&!document.hidden);}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='mylodge-motion'||typeof event.data.active!=='boolean')return;
  active=event.data.active;
  sync();
});
document.addEventListener('visibilitychange',sync);
window.addEventListener('pagehide',()=>preview?.setActive(false));
window.addEventListener('pageshow',sync);
sync();
if(embedded)window.parent.postMessage({type:'mylodge-motion-ready'},location.origin);
