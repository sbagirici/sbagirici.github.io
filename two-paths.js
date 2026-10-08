(() => {
 const area=document.querySelector('.two-paths');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const motion=document.querySelector('#motion');
 const allowed=()=>!reduce.matches&&motion?.getAttribute('aria-pressed')!=='true';
 area.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'||!allowed())return;
   const box=area.getBoundingClientRect();
   area.style.setProperty('--light-x',((event.clientX-box.left)/box.width*100)+'%');
   area.style.setProperty('--light-y',((event.clientY-box.top)/box.height*100)+'%');
 });
 area.querySelectorAll('.path').forEach(path=>{
   path.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||!allowed())return;
    const box=path.getBoundingClientRect();
    path.style.setProperty('--art-x',((event.clientX-box.left)/box.width-.5)*8+'px');
    path.style.setProperty('--art-y',((event.clientY-box.top)/box.height-.5)*6+'px');
   });
   path.addEventListener('pointerleave',()=>{path.style.setProperty('--art-x','0px');path.style.setProperty('--art-y','0px');});
 });
})();
