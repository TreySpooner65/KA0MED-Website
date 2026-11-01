import { filterRadios, formatMode } from '../utils/radio-catalog.js';

export function initRadioCatalog() {
  const root=document.querySelector('.fp-radio-catalog');
  if(!root)return;
  const $=selector=>root.querySelector(selector);
  const $$=selector=>[...root.querySelectorAll(selector)];
  const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const {radios}=JSON.parse($('#radio-catalog-data').textContent);
  const search=$('#radio-search');
  const controls={brand:$('#brand-filter'),connection:$('#connection-filter'),mode:$('#mode-filter'),status:$('#status-filter'),sort:$('#sort-order')};
  const dialog=$('#radio-detail-dialog');
  const selected=new Set();
  let limit=12,toastTimer;
  const status=r=>`<span class="rc-status ${r.status==='development'?'development':''}">${r.status==='supported'?'Supported':'In development'}</span>`;
  function notify(message){$('#radio-toast').textContent=message;$('#radio-toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#radio-toast').hidden=true,4000);}
  function urlState(){
    const params=new URLSearchParams(location.search);
    search.value=params.get('q')||'';
    for(const [key,control] of Object.entries(controls)){
      const value=params.get(key);
      control.value=[...control.options].some(option=>option.value===value)?value:(key==='sort'?'featured':'all');
    }
  }
  function updateURL(){
    const url=new URL(location.href);
    for(const key of ['q',...Object.keys(controls)])url.searchParams.delete(key);
    if(search.value.trim())url.searchParams.set('q',search.value.trim());
    for(const [key,control] of Object.entries(controls))if(control.value!==(key==='sort'?'featured':'all'))url.searchParams.set(key,control.value);
    history.replaceState(null,'',url);
  }
  function syncCompare(){
    $('#compare-tray').hidden=selected.size===0;
    $('#compare-count').textContent=`${selected.size} ${selected.size===1?'radio':'radios'} selected`;
    $('#compare-button').disabled=selected.size<2;
    $('#compare-button').title=selected.size<2?'Select at least two radios':'Compare selected radios';
    $$('[data-compare]').forEach(input=>input.checked=selected.has(input.dataset.compare));
  }
  function toggleCompare(id,checked){
    if(checked&&selected.size>=3&&!selected.has(id)){notify('Compare up to 3 radios. Remove one to add another.');syncCompare();return false;}
    checked?selected.add(id):selected.delete(id);syncCompare();return true;
  }
  function renderCard(r){return `<article class="rc-card" aria-label="${escapeHTML(r.brand+' '+r.name)}"><div class="rc-card-main"><div class="rc-card-top"><span class="rc-brand">${escapeHTML(r.brand)}</span>${status(r)}</div><h3>${escapeHTML(r.name)}</h3><p class="rc-meta">${formatMode(r)} · ${r.channels.toLocaleString()} channels</p><div class="rc-connections">${r.usb?'<span>USB</span>':''}${r.bluetooth?'<span>Bluetooth</span>':''}${r.gmrs?'<span>GMRS profile</span>':''}</div></div><div class="rc-card-footer"><label><input type="checkbox" data-compare="${r.id}" aria-label="Compare ${escapeHTML(r.brand+' '+r.name)}" ${selected.has(r.id)?'checked':''}> Compare</label><button class="rc-text" data-radio="${r.id}" aria-label="Details for ${escapeHTML(r.brand+' '+r.name)}">Details ↗</button></div></article>`;}
  function render(){
    const filters=Object.fromEntries(Object.entries(controls).map(([key,control])=>[key,control.value]));
    const result=filterRadios(radios,{...filters,query:search.value});
    const supported=result.filter(r=>r.status==='supported').length;
    $('#result-count').textContent=`${result.length} ${result.length===1?'radio':'radios'} found · ${supported} supported${result.length>supported?`, ${result.length-supported} in development`:''}`;
    $('#radio-grid').innerHTML=result.length?result.slice(0,limit).map(renderCard).join(''):'<div class="rc-empty"><h3>No matching radios.</h3><p>Try another model or remove a filter.</p><button class="rc-outline" id="empty-reset">Clear search & filters</button></div>';
    $('#shown-count').textContent=result.length?`Showing ${Math.min(limit,result.length)} of ${result.length} radios`:'';
    $('#load-more').hidden=limit>=result.length;
    $('#load-more').textContent=`Show ${Math.min(12,result.length-limit)} more radios ↓`;
    $('#active-filters').innerHTML=Object.entries(controls).filter(([key,control])=>key!=='sort'&&control.value!=='all').map(([key,control])=>`<button data-remove-filter="${key}" aria-label="Remove ${escapeHTML(control.selectedOptions[0].textContent)} filter">${escapeHTML(control.selectedOptions[0].textContent)} ×</button>`).join('');
    syncCompare();
  }
  function reset(){search.value='';for(const [key,control] of Object.entries(controls))control.value=key==='sort'?'featured':'all';limit=12;updateURL();render();}
  function showDialog(content,wide=false){$('#radio-dialog-content').innerHTML=content;dialog.classList.toggle('rc-wide',wide);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
  function showRadio(id,update=true){
    const r=radios.find(r=>r.id===id);if(!r)return;
    if(update){const url=new URL(location.href);url.searchParams.set('radio',id);history.replaceState(null,'',url);}
    const note=r.notes||(r.bluetooth?'USB and native Bluetooth are listed for this model. Use the exact model profile.':'USB programming is listed. Native Bluetooth is not listed; external adapters require their own compatibility check.');
    showDialog(`<p class="rc-eyebrow">${escapeHTML(r.brand)} / RADIO DETAILS</p><h2 id="radio-dialog-title">${escapeHTML(r.name)}</h2>${status(r)}<p>${r.status==='supported'?'Listed in the Field Programmer model registry.':'Experimental driver work; not yet part of the supported-model list.'}</p><dl class="rc-specs"><div><dt>Connection</dt><dd>${r.usb?'USB':''}${r.bluetooth?' + Native Bluetooth':''}</dd></div><div><dt>Modes</dt><dd>${formatMode(r)}</dd></div><div><dt>Channel capacity</dt><dd>${r.channels.toLocaleString()} channels</dd></div><div><dt>Channel name limit</dt><dd>${r.nameLength?r.nameLength+' characters':'Not verified'}</dd></div></dl><p class="rc-note">${escapeHTML(note)}</p><p>Confirm your model and firmware, read the radio, and save the original codeplug before editing. Firmware and regional variants can differ.</p><div class="rc-dialog-actions"><button class="rc-solid" data-detail-compare="${id}">${selected.has(id)?'Remove from comparison':'Add to comparison'}</button><button class="rc-text" data-copy-radio="${id}">Copy radio link ↗</button></div>`);
  }
  function compare(){
    const list=[...selected].map(id=>radios.find(r=>r.id===id));if(list.length<2)return;
    const rows=[['Status',r=>r.status==='supported'?'Supported':'In development'],['USB',r=>r.usb?'Yes':'Not listed'],['Native Bluetooth',r=>r.bluetooth?'Yes':'Not listed'],['Modes',formatMode],['Channels',r=>r.channels.toLocaleString()],['Channel name limit',r=>r.nameLength?r.nameLength+' characters':'Not verified']];
    showDialog(`<p class="rc-eyebrow">SIDE BY SIDE</p><h2 id="radio-dialog-title">Compare your radios.</h2><p>Capabilities reflect the app profiles. Firmware and regional versions can differ.</p><div class="rc-table-wrap" role="region" aria-label="Radio comparison" tabindex="0"><table><thead><tr><th scope="col">Capability</th>${list.map(r=>`<th scope="col">${escapeHTML(r.brand)}<br>${escapeHTML(r.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,value])=>`<tr><th scope="row">${label}</th>${list.map(r=>`<td>${value(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>Native Bluetooth is separate from external adapter support. Check the exact generation before selecting your model in the app.</p>`,true);
  }
  root.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.id==='reset-filters'||button.id==='empty-reset'){reset();if(button.id==='empty-reset')search.focus();}
    if(button.id==='load-more'){const previous=limit;limit+=12;render();$$('[data-radio]')[previous]?.focus({preventScroll:true});}
    if(button.dataset.radio)showRadio(button.dataset.radio);
    if(button.dataset.removeFilter){controls[button.dataset.removeFilter].value='all';limit=12;updateURL();render();}
    if(button.dataset.detailCompare){const id=button.dataset.detailCompare;if(toggleCompare(id,!selected.has(id)))showRadio(id,false);}
    if(button.id==='clear-compare'){selected.clear();syncCompare();}
    if(button.id==='compare-button')compare();
    if(button.classList.contains('rc-close'))dialog.close();
    if(button.dataset.open==='status')showDialog('<p class="rc-eyebrow">UNDERSTANDING SUPPORT</p><h2 id="radio-dialog-title">What the statuses mean.</h2><h3>Supported</h3><p>The exact model is in the app registry. This does not mean every firmware version, regional variant, or setting has been independently verified.</p><h3>In development</h3><p>A driver is under active investigation or testing and is not yet in the supported-model list. It may only be available in development builds.</p><h3>Connection details</h3><p>Bluetooth describes native Bluetooth for the listed model. It does not promise support for every external programming adapter. The GMRS-only filter reflects the app’s explicit profile flag, not a complete regulatory classification.</p><p>This catalog is a dated snapshot maintained with the project; it does not query your radio or update automatically.</p>');
    if(button.dataset.copyRadio){
      const url=new URL(location.href);url.search='';url.searchParams.set('radio',button.dataset.copyRadio);url.hash='radios';
      try{await navigator.clipboard.writeText(url.href);notify('Radio link copied.');}
      catch{showDialog(`<h2 id="radio-dialog-title">Copy this radio link.</h2><label for="radio-copy-link">Radio link</label><input id="radio-copy-link" readonly value="${escapeHTML(url.href)}">`);$('#radio-copy-link').select();}
    }
  });
  $('#radio-grid').addEventListener('change',event=>{if(event.target.dataset.compare)toggleCompare(event.target.dataset.compare,event.target.checked);});
  search.addEventListener('input',()=>{limit=12;updateURL();render();});
  for(const control of Object.values(controls))control.addEventListener('change',()=>{limit=12;updateURL();render();});
  dialog.addEventListener('close',()=>{const url=new URL(location.href);url.searchParams.delete('radio');history.replaceState(null,'',url);});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();search.focus();search.scrollIntoView({block:'center'});}});
  window.addEventListener('popstate',()=>{urlState();limit=12;render();const id=new URLSearchParams(location.search).get('radio');if(id)showRadio(id,false);else if(dialog.open)dialog.close();});
  $$('[data-enhanced]').forEach(element=>element.hidden=false);
  urlState();render();
  const id=new URLSearchParams(location.search).get('radio');if(id)showRadio(id,false);
}
