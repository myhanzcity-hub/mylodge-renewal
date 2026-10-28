import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as calendarRules from '../schedule-data.js';

const html=await readFile(new URL('../schedule.html',import.meta.url),'utf8');
const source=(await readFile(new URL('../schedule.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
function app(search=''){
  const ids={},doc={};
  const matches=(node,selector)=>{
    if(selector.startsWith('#'))return node.id===selector.slice(1);
    if(selector.startsWith('.'))return node.className.split(' ').includes(selector.slice(1));
    const date=selector.match(/^\[data-date(?:="([^"]+)")?\]$/);
    return !!date&&node.dataset.date!==undefined&&(!date[1]||node.dataset.date===date[1]);
  };
  function element(tag='div'){
    return {tag,id:'',className:'',dataset:{},attributes:{},children:[],events:{},textContent:'',value:'',hidden:false,checked:false,disabled:false,parent:null,
      append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}},
      replaceChildren(...nodes){this.children.forEach(node=>node.parent=null);this.children=[];this.append(...nodes);},
      setAttribute(key,value){this.attributes[key]=String(value);},
      addEventListener(name,fn){this.events[name]=fn;},
      querySelectorAll(selector){return this.children.flatMap(child=>[...(matches(child,selector)?[child]:[]),...child.querySelectorAll(selector)]);},
      querySelector(selector){return this.querySelectorAll(selector)[0]||null;},
      closest(selector){return matches(this,selector)?this:this.parent?.closest(selector)||null;},
      contains(node){return node===this||this.children.some(child=>child.contains(node));},
      get isConnected(){return !!this.parent;},
      focus(){doc.activeElement=this;},scrollIntoView(options){this.scrolled=options;}
    };
  }
  const body=element('body');doc.body=body;doc.activeElement=body;
  for(const [,id] of html.matchAll(/\bid="([^"]+)"/g)){assert.ok(!ids[id]);const node=element();node.id=id;ids[id]=node;body.append(node);}
  const products=['domestic','thailand'].map(value=>Object.assign(element('input'),{value}));
  const modes=['single','three'].map(value=>Object.assign(element('input'),{value}));
  body.append(...products,...modes);ids['hold-example'].checked=true;ids.year.value='2027';
  doc.createElement=element;doc.querySelector=selector=>ids[selector.slice(1)]||body.querySelector(selector);
  doc.querySelectorAll=selector=>selector==='[name="product"]'?products:modes;
  vm.runInNewContext(source,{...calendarRules,document:doc,location:{search},URLSearchParams});
  return {doc,ids,products,modes,change(node,value){if(value!==undefined)node.value=value;doc.activeElement=node;node.events.change({target:node});},clickDay(iso){const node=ids.calendar.querySelector(`[data-date="${iso}"]`);doc.activeElement=node;ids.calendar.events.click({target:node});return node;}};
}

test('Thai entry keeps the matching product and group-selection state after redesign',()=>{
  const view=app('?product=thailand');
  assert.equal(view.products.find(input=>input.checked).value,'thailand');
  assert.equal(view.modes.find(input=>input.checked).value,'three');
  assert.equal(view.modes.find(input=>input.value==='single').disabled,true);
  assert.equal(view.ids['hold-control'].hidden,true);
  assert.ok(view.ids['policy-copy'].textContent.includes('푸켓·치앙마이·방콕'));
  assert.equal(view.ids.calendar.querySelectorAll('[data-date]').length,365);
  view.clickDay('2027-01-02');assert.equal(view.ids['selection-count'].textContent,'3일');
  assert.equal(view.ids['hold-days'].textContent,'0일');
});

test('month shortcut focuses the selected month and feedback close returns focus to the selected day',()=>{
  const view=app();view.change(view.ids['month-jump'],'8');
  assert.equal(view.doc.activeElement.id,'month-8');assert.equal(view.doc.activeElement.scrolled.block,'start');
  const button=view.clickDay('2027-08-02');
  assert.equal(button.attributes['aria-pressed'],'true');assert.equal(view.ids['selection-count'].textContent,'1일');
  view.ids['hide-feedback'].events.click();assert.equal(view.ids['selection-feedback'].hidden,true);assert.equal(view.doc.activeElement,button);
  const held=view.clickDay('2027-07-16');assert.equal(held.attributes['aria-disabled'],'true');assert.equal(view.ids['selection-count'].textContent,'1일');assert.equal(view.ids['selection-feedback'].dataset.error,'true');
});

test('year switching resets selections and preserves the complete leap-year calendar',()=>{
  const view=app();view.clickDay('2027-02-01');view.change(view.ids.year,'2028');
  assert.equal(view.ids['selection-count'].textContent,'0일');assert.equal(view.ids['clear-selection'].disabled,true);
  assert.equal(view.ids.calendar.querySelectorAll('[data-date]').length,366);
  assert.ok(view.ids.calendar.querySelector('[data-date="2028-02-29"]'));
});

test('settings, disclosure and feedback retain labels and are not presented as a real booking',()=>{
  assert.ok(html.includes('role="switch"'));
  assert.ok(html.includes('<details class="policy-note">'));
  assert.ok(html.includes('id="selection-feedback" hidden'));
  assert.ok(html.includes('href="#selected-dates"'));
  assert.ok(html.includes('실제 예약이 아닙니다'));
  assert.ok(!/<form\b/.test(html));
});
