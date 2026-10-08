(() => {
const topics={sea:{title:'Deniz ve yelken',text:'Rüzgârı ve dalgayı okumak, rota ve zaman hesabı yapmak, çalışmayanı eldeki imkânla onarmak.'},road:{title:'Yollar, motosiklet ve karavan',text:'Yeni bir yere varmak kadar yolun kendisinden keyif almak. Özgürlük: bir yere ait olup hiçbir yere mecbur kalmamak.'},bench:{title:'Elektronik ve 3D baskı',text:'Devreler, mikrodenetleyiciler, ara sıra kendi kartı. Aklındakini tasarlayıp birkaç saat sonra elinde tutmak.'}};
const buttons=[...document.querySelectorAll('[data-topic]')].filter(e=>e.tagName==='BUTTON'),art=document.querySelector('.experience-art'),copy=document.querySelector('.experience-copy');
buttons.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.topic;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));art.dataset.topic=key;copy.querySelector('h3').textContent=topics[key].title;copy.querySelector('p').textContent=topics[key].text;}));
})();
