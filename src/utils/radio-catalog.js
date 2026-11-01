export const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
export const formatMode = radio => radio.digital ? 'Analog + DMR' : 'Analog';
const terms = r => [r.name,`${r.brand} ${r.name}`,...(r.aliases||[]),...(r.aliases||[]).map(a=>`${r.brand} ${a}`)].map(normalize);
const featured = ['uv32','dm32','uv5r_mini','tdh8','uv5r','ar152_pro'];
export function filterRadios(radios, {query='',brand='all',connection='all',mode='all',status='all',sort='featured'}={}) {
  const q=normalize(query);
  const result=radios.filter(r=>(!q||terms(r).some(t=>t.includes(q))) && (brand==='all'||r.brand===brand) && (connection==='all'||r[connection]===true) && (mode==='all'||(mode==='digital'&&r.digital)||(mode==='analog'&&!r.digital)||(mode==='gmrs'&&r.gmrs)) && (status==='all'||r.status===status));
  const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
  return result.sort((a,b)=>{
    if(sort==='name')return collator.compare(a.name,b.name)||collator.compare(a.brand,b.brand);
    if(sort==='brand')return collator.compare(a.brand,b.brand)||collator.compare(a.name,b.name);
    if(sort==='channels')return b.channels-a.channels||collator.compare(a.name,b.name);
    if(q){const exact=Number(terms(b).includes(q))-Number(terms(a).includes(q));if(exact)return exact;}
    const rank=r=>featured.includes(r.id)?featured.indexOf(r.id):(r.status==='development'?999:100);
    return rank(a)-rank(b)||collator.compare(a.brand,b.brand)||collator.compare(a.name,b.name);
  });
}
