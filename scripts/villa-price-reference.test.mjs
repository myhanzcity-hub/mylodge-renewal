import test from 'node:test';
import assert from 'node:assert/strict';
import {villaPriceReference as source} from '../villa-price-reference.js';
import {renderVillaPriceReference} from './render-price-reference.mjs';
import {readFile} from 'node:fs/promises';

test('photo prices reconcile with their stated discounts without pricing sold lots',()=>{
  assert.equal(source.currency,'THB');
  assert.equal(source.basis,'whole-villa');
  assert.equal(source.effectiveFrom,'2026-09-01');
  assert.equal(source.lots.length,9);
  assert.deepEqual(source.lots.filter(lot=>lot.sold).map(lot=>lot.id),['Grand 2','Grand 3','Grand 4','Grand 8']);
  assert.deepEqual(source.lots.filter(lot=>!lot.sold).map(lot=>lot.promotion),[49500000,55897125,61959275,70605075,68905075]);
  for(const lot of source.lots){
    if(lot.sold)assert.equal(lot.promotion,null);
    if(lot.price!==null)assert.equal(lot.price-lot.discount,lot.promotion,lot.id);
  }
  assert.equal(source.conditions.commonAreaMonthlyMin*12,132000);
  assert.equal(source.conditions.commonAreaMonthlyMax*12,144000);
  assert.equal(source.conditions.sinkingFundPerPlot,150000);
  assert.equal(source.conditions.transferBuyerShare+source.conditions.transferDeveloperShare,1);
});

test('whole-villa reference has explicit source scope and never populates MyLodge share totals',async()=>{
  const html=renderVillaPriceReference();
  assert.ok(html.includes('빌라 1채 전체 가격')&&html.includes('MyLodge 구좌 견적과 별도'));
  assert.ok(html.includes('2026.09.01')&&html.includes('가격표상 판매완료'));
  assert.equal([...html.matchAll(/<tr>/g)].length,10);
  const module=await readFile(new URL('../presentation-extras.js',import.meta.url),'utf8');
  assert.ok(module.includes("for(const key of ['base','total','payment'])planner.querySelector(`[data-quote-${key}]`).textContent='—'"));
  assert.ok(!module.includes('villaPriceReference'),'Reference prices cannot feed the share calculator');
});
