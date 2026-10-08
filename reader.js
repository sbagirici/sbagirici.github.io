(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced)document.body.classList.add('is-motion-enabled');
 const motion=document.querySelector('#motion');
 motion.textContent=reduced?'Hareketi aç':'Hareketi durdur';
 motion.setAttribute('aria-pressed',String(!reduced));
 motion.addEventListener('click',()=>{const enabled=document.body.classList.toggle('is-motion-enabled');motion.textContent=enabled?'Hareketi durdur':'Hareketi aç';motion.setAttribute('aria-pressed',String(enabled));dispatchEvent(new Event('reader-motion'));});
 const figures=[...document.querySelectorAll('.interactive-study')];
 document.querySelectorAll('.response-demo').forEach(f=>{
   f.querySelector('.response-actions').hidden=false;
   f.querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',()=>{
     const accepted=b.dataset.result==='accept';
     f.querySelector('.block-result').textContent=accepted?'Ok':'In operation, SET not possible';
     f.querySelector('.response-status').textContent=accepted?'İlgili işlem için olumlu blok yanıtı var. Cihazın sonraki ad bildirimi ayrıca doğrulanmalı.':'Bu örnekte ilgili yazma reddedilmiş.';
     f.querySelectorAll('[data-result]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
   }));
 });
 figures.forEach(f=>{
  f.querySelector('.study-controls').hidden=false;
  let manual=false;
  const set=i=>{f.dataset.state=String(i);f.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===i)));const p=f.querySelector('.study-status');p.textContent=i?p.dataset.second:p.dataset.first;};
  f.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{manual=true;set(Number(b.dataset.step));}));
  const update=()=>{if(!manual){const box=f.getBoundingClientRect();set(box.top<innerHeight*.18?1:0);}};
  f.querySelector('.resume').addEventListener('click',()=>{manual=false;update();});
  addEventListener('scroll',update,{passive:true});update();
 });
 const details=document.querySelector('aside details');if(innerWidth>800)details.open=true;
 const headings=[...document.querySelectorAll('.article h2,.article h3')];
 const links=[...document.querySelectorAll('aside nav a')];
 let ticking=false;
 addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;const current=headings.filter(h=>h.getBoundingClientRect().top<innerHeight*.4).at(-1);links.forEach(a=>a.setAttribute('aria-current',String(a.hash==='#'+current?.id)));});},{passive:true});
})();
