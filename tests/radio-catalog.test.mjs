import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterRadios } from '../src/utils/radio-catalog.js';
const { radios, checked } = JSON.parse(readFileSync(new URL('../src/data/radio-catalog.json',import.meta.url)));

test('catalog entries have stable unique IDs and valid support metadata',()=>{
  assert.match(checked,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Set(radios.map(r=>r.id)).size,radios.length);
  assert.equal(new Set(radios.map(r=>`${r.brand}:${r.name}`)).size,radios.length);
  for(const r of radios){
    assert.match(r.id,/^[a-z0-9_]+$/);
    assert.ok(r.brand&&r.name);
    assert.ok(['supported','development'].includes(r.status));
    assert.ok(Number.isInteger(r.channels)&&r.channels>0);
    assert.ok(r.nameLength==null||(Number.isInteger(r.nameLength)&&r.nameLength>0));
    for(const flag of ['usb','bluetooth','digital','gmrs'])assert.equal(typeof r[flag],'boolean');
  }
});
test('model searches ignore punctuation and rank an exact alias first',()=>{
  assert.equal(filterRadios(radios,{query:'DM32'})[0].id,'dm32');
  assert.equal(filterRadios(radios,{query:'Baofeng UV5RM'})[0].id,'baofeng_5rm');
  assert.equal(filterRadios(radios,{query:'uv 32'})[0].id,'uv32');
  assert.equal(filterRadios(radios,{query:'UV-32 Pro'}).length,0);
});
test('brand and native Bluetooth filters return exact TD-H8 generations',()=>{
  const result=filterRadios(radios,{brand:'TIDRadio',connection:'bluetooth'});
  assert.deepEqual(new Set(result.map(r=>r.id)),new Set(['tdh8','tdh8_third_gen','tdh8_fourth_gen']));
  assert.ok(result.every(r=>r.bluetooth&&r.brand==='TIDRadio'));
});
test('incompatible filters yield no matches and reset restores all entries',()=>{
  assert.equal(filterRadios(radios,{brand:'TIDRadio',connection:'bluetooth',mode:'digital'}).length,0);
  assert.equal(filterRadios(radios).length,radios.length);
});
test('development models are separated from supported counts',()=>{
  const supported=filterRadios(radios,{status:'supported'});
  const development=filterRadios(radios,{status:'development'});
  assert.ok(supported.every(r=>r.status==='supported'));
  assert.ok(development.every(r=>r.status==='development'));
  assert.ok(development.some(r=>r.id==='rt950pro'));
  assert.ok(!supported.some(r=>r.id==='rt950pro'));
  assert.equal(supported.length+development.length,radios.length);
});
test('DM-32 capability and capacity results reflect its app profile',()=>{
  const result=filterRadios(radios,{mode:'digital'});
  const dm32=result.find(r=>r.id==='dm32');
  assert.ok(dm32);assert.equal(dm32.bluetooth,false);assert.equal(dm32.usb,true);
  assert.equal(dm32.channels,4000);assert.equal(dm32.nameLength,16);
  const sorted=filterRadios(radios,{sort:'channels'});
  assert.ok(sorted.every((r,i)=>i===0||sorted[i-1].channels>=r.channels));
});
