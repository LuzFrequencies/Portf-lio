(() => {
  const base = window.LUZ_CONTENT;
  const storageKey = 'luz-frequencies-content-v5';
  const langKey = 'luz-frequencies-lang';
  let content = loadContent();
  let lang = localStorage.getItem(langKey) || 'en';
  let audio = null;
  let audioButton = null;

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  const assetDB = 'luz-frequencies-assets-v1';
  function openAssetDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(assetDB,1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async function putAsset(file){const db=await openAssetDB();const id='asset-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);await new Promise((res,rej)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({id,name:file.name,type:file.type,size:file.size,blob:file,lastModified:file.lastModified});tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});return 'idb://'+id;}
  async function getAsset(id){const db=await openAssetDB();return new Promise((res,rej)=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});}
  async function allAssets(){const db=await openAssetDB();return new Promise((res,rej)=>{const r=db.transaction('files').objectStore('files').getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)});}
  const objectUrls=new Map();
  async function resolveAsset(src){if(!src||!src.startsWith('idb://'))return src; if(objectUrls.has(src))return objectUrls.get(src); const a=await getAsset(src.slice(6)); if(!a)return ''; const u=URL.createObjectURL(a.blob);objectUrls.set(src,u);return u;}
  function assetKind(type,name){const ext=(name.split('.').pop()||'').toLowerCase();if(type.startsWith('image/')||['jpg','jpeg','png','webp','gif','svg'].includes(ext))return'image';if(type.startsWith('audio/')||['mp3','wav','m4a','aac','ogg','flac'].includes(ext))return'audio';if(type.startsWith('video/')||['mp4','webm','mov','m4v'].includes(ext))return'video';if(type==='application/pdf'||ext==='pdf')return'pdf';return'other';}
  async function refreshAssetPreviews(){
    const hero=$('.portrait-image img'); if(hero&&content.hero.image?.startsWith('idb://')) hero.src=await resolveAsset(content.hero.image);
    $$('.work-item').forEach(async (el,i)=>{const p=content.projects[i];if(p?.thumbImage?.startsWith('idb://')){const u=await resolveAsset(p.thumbImage);const th=el.querySelector('.work-thumb');th.style.backgroundImage=`url("${u}")`;th.querySelector('span')?.remove();}});
  }
  function merge(a, b) {
    if (Array.isArray(a)) return Array.isArray(b) ? b : a;
    if (a && typeof a === 'object') {
      const out = {...a};
      if (b && typeof b === 'object') Object.keys(b).forEach(k => out[k] = merge(a[k], b[k]));
      return out;
    }
    return b === undefined ? a : b;
  }
  function loadContent() {
    try { return merge(clone(base), JSON.parse(localStorage.getItem(storageKey) || 'null')); }
    catch { return clone(base); }
  }
  function t(key) { return content.translations[lang][key] || key; }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return [...document.querySelectorAll(s)]; }

  function render() {
    document.documentElement.lang = lang;
    document.title = content.site.title;
    const meta = $('meta[name="description"]'); if (meta) meta.content = content.site.description;

    $('.top-brand').innerHTML = '<span class="cross">+</span><span class="rec-dot"></span><span class="rec">REC</span><span class="slash">/</span><span>LÜZ FREQUENCIES</span>';
    const nav = $('.main-nav');
    nav.innerHTML = `<a class="active" href="#work">${t('work')}</a><a href="#sound">${t('sound')}</a><a href="#about">${t('about')}</a><a href="#contact">${t('contact')}</a>`;
    $('.lang').innerHTML = `<span class="${lang === 'en' ? 'active' : ''}">EN</span><span>/</span><span class="${lang === 'pt' ? 'active' : ''}">PT</span>`;

    $('.rail-block').innerHTML = `<span>ESTD</span>${content.site.established.map((x,i)=>`<b class="${i===2?'red':''}">${x}</b>`).join('')}`;
    $('.specs').innerHTML = content.site.specs.map(x=>`<b>${x}</b>`).join('');

    $('.hero-title-wrap h1').textContent = content.hero.name;
    $('.discipline').textContent = content.hero.discipline;
    const img = $('.portrait-image img'); img.src = content.hero.image; img.alt = content.hero.imageAlt;
    $('.hero-tags').innerHTML = content.hero.tags.map((x,i)=>`<span class="${i===content.hero.tags.length-1?'red':''}">${x}</span>`).join('');
    $('.hero-counter').innerHTML = `<span class="red">${content.hero.counter.split('/')[0].trim()}</span><span>/ ${content.hero.counter.split('/')[1]?.trim() || ''}</span>`;
    $('.showreel-label').textContent = t('playShowreel');
    $('.duration').textContent = content.hero.showreel.duration;

    $('.work-heading span').textContent = t('work');
    const work = $('.selected-work');
    const oldItems = $$('.work-item'); oldItems.forEach(x=>x.remove());
    content.projects.forEach((p,i)=>{
      const article = document.createElement('article'); article.className='work-item'; article.dataset.index=i;
      article.innerHTML = `<span class="work-number">${p.number}</span><div class="work-thumb ${p.thumbClass}" ${p.thumbImage ? `style="background-image:url('${p.thumbImage}')"` : ''}><span>${p.thumbLabel}</span></div><div class="work-copy"><h2>${p.title}</h2><p>${p.description.replace(/\n/g,'<br>')}<br>${p.year}</p><button class="play-project" type="button">${t('playProject')}&nbsp; →</button></div>`;
      work.appendChild(article);
    });

    $('#about h2').innerHTML = `${t('about')} <em>—</em>`;
    const aboutPs = $$('#about .panel-content p');
    content.about.paragraphs.forEach((p,i)=>{ if (aboutPs[i]) aboutPs[i].textContent=p; });
    $('.about-panel .text-link').textContent = `${t('downloadCv')} →`; $('.about-panel .text-link').href = content.about.cv || '#'; $('.about-panel .text-link').target = content.about.cv ? '_blank' : ''; 

    $('#sound h2').innerHTML = `${t('sound')} <em>—</em>`;
    const list = $('.sound-list'); list.innerHTML = content.sound.services.map((s,i)=>`<div><span class="sound-icon">${['⌁','◌','◎','◉'][i%4]}</span><strong>${s}</strong></div>`).join('');

    $('#contact h2').innerHTML = `${t('contact')} <em>—</em>`;
    $('.contact-list').innerHTML = `<p><span>✉</span><a href="mailto:${content.contact.email}">${content.contact.email}</a></p><p><span>◎</span>${contactLink(content.contact.instagram, content.contact.instagramUrl)}</p><p><span>☎</span>${content.contact.phone||''}</p><p><span>⌖</span>${content.contact.location}</p>`;
    $('.contact-cta').textContent = content.contact.cta;
    $('.contact-cta').href = `mailto:${content.contact.email}?subject=${encodeURIComponent('Portfolio enquiry — Lüz Frequencies')}`;
    $('.footer').innerHTML = `<span><strong>LÜZ</strong> FREQUENCIES © ${content.site.year}</span><span class="now-playing">NOW PLAYING&nbsp; — &nbsp;N0L4B3L&nbsp; — &nbsp; <span class="footer-wave">⌁⌁⌁⌁⌁</span>&nbsp; 01:02</span><button class="footer-edit" type="button" title="Edit content">+</button>`;
    bind();
  }

  function contactLink(label, url) { return url ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : `<span>${label}</span>`; }
  function stopAudio() { if(audio){audio.pause(); audio.currentTime=0; audio=null;} if(audioButton) audioButton.textContent='▷'; }
 async function playAudio(src, button) {
  if (!src) {
    openModal(
      '<h2>Audio</h2><p>' +
      t('noAudio') +
      '</p>'
    );
    return;
  }

  const resolved = await resolveAsset(src);

  // Se já existe áudio associado a este botão,
  // simplesmente alterna entre play e pause.
  if (audio && audioButton === button) {
    if (audio.paused) {
      try {
        await audio.play();
        button.textContent = 'Ⅱ';
      } catch (err) {
        console.error('Erro ao retomar áudio:', err);
      }
    } else {
      audio.pause();
      button.textContent = '▷';
    }

    return;
  }

  // Para qualquer áudio anterior
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  // Cria o novo áudio
  audio = new Audio();
  audio.src = resolved;
  audioButton = button;

  audio.addEventListener('ended', () => {
    button.textContent = '▷';
  });

  audio.addEventListener('error', (err) => {
    console.error('Erro no áudio:', err);
    button.textContent = '▷';
  });

  try {
    await audio.play();
    button.textContent = 'Ⅱ';
  } catch (err) {
    console.error('Não foi possível reproduzir o áudio:', err);
    button.textContent = '▷';
  }
}
  function bind(){
    $('#langToggle').onclick=()=>{lang=lang==='en'?'pt':'en'; localStorage.setItem(langKey,lang); render();};
    $('.play-square').onclick=()=>playAudio(content.hero.showreel.audio, $('.play-square'));
    $$('.play-project').forEach(btn=>btn.onclick=()=>{ const p=content.projects[+btn.closest('.work-item').dataset.index]; openProject(p); });
    $('.about-panel .text-link').onclick=(e)=>{ if(!content.about.cv){e.preventDefault();openModal('<h2>'+t('downloadCv')+'</h2><p>'+t('noAudio')+'</p>');} };
    $('.footer-edit').onclick=null;
    $('.footer-edit').disabled=true;
    $('.footer-edit').style.display='none';
  }
  async function openProject(p){
    if(p.video) p={...p,video:await resolveAsset(p.video)};
    const audioButtonHtml=p.audio?`<button class="modal-play" type="button">▷ ${t('playProject')}</button>`:'';
    const linkHtml=p.link?`<a class="modal-link" href="${p.link}" target="_blank" rel="noopener">${t('openProject')} →</a>`:''; const videoHtml=p.video?`<video class="modal-video" controls playsinline src="${p.video}"></video>`:'';
    openModal(`<div class="modal-kicker">${p.number}</div><h2>${p.title}</h2><p>${p.description.replace(/\n/g,'<br>')}<br>${p.year}</p><p>${p.details||''}</p>${videoHtml}${audioButtonHtml}${linkHtml}`);
    if(p.audio) $('.modal-play').onclick=(e)=>playAudio(p.audio,e.currentTarget);
  }
  function openModal(html){
    let m=$('.modal'); if(!m){m=document.createElement('div');m.className='modal';document.body.appendChild(m);}
    m.innerHTML=`<div class="modal-backdrop"></div><div class="modal-card"><button class="modal-close" type="button">×</button>${html}</div>`;m.classList.add('open');m.querySelector('.modal-close').onclick=()=>m.classList.remove('open');m.querySelector('.modal-backdrop').onclick=()=>m.classList.remove('open');
  }
  function openEditor(){
    const m=document.createElement('div');m.className='modal open editor-modal';
    m.innerHTML=`<div class="modal-backdrop"></div><div class="modal-card editor-card full-editor-card"><button class="modal-close" type="button">×</button><div class="modal-kicker">V5 / FULL CONTROL</div><h2>${t('editing')}</h2><p class="modal-note">${t('editHint')}</p><div class="editor-tabs"><button data-tab="site">SITE</button><button data-tab="hero">HERO</button><button data-tab="projects">PROJECTS</button><button data-tab="about">ABOUT</button><button data-tab="sound">SOUND</button><button data-tab="contact">CONTACT</button><button data-tab="footer">FOOTER</button></div><div class="editor-fields"></div><div class="editor-actions"><button id="savePreview">${t('save')}</button><button id="resetPreview">${t('reset')}</button><button id="exportContent">${t('export')}</button><button id="exportSite">EXPORT COMPLETE SITE ZIP</button></div></div></div>`;
    document.body.appendChild(m);
    const f=m.querySelector('.editor-fields');
    const groups={
      site:[['Site title','site.title'],['Meta description','site.description'],['Year','site.year'],['Established 1','site.established.0'],['Established 2','site.established.1'],['Established 3','site.established.2'],['Spec 1','site.specs.0'],['Spec 2','site.specs.1'],['Spec 3','site.specs.2'],['WORK label','translations.en.work'],['SOUND label','translations.en.sound'],['ABOUT label','translations.en.about'],['CONTACT label','translations.en.contact'],['PT WORK label','translations.pt.work'],['PT SOUND label','translations.pt.sound'],['PT ABOUT label','translations.pt.about'],['PT CONTACT label','translations.pt.contact']],
      hero:[['Hero name','hero.name'],['Discipline','hero.discipline'],['Hero image path / URL','hero.image'],['Image alt text','hero.imageAlt'],['Tag 1','hero.tags.0'],['Tag 2','hero.tags.1'],['Tag 3','hero.tags.2'],['Tag 4','hero.tags.3'],['Counter','hero.counter'],['Showreel label','hero.showreel.label'],['Showreel duration','hero.showreel.duration'],['Showreel audio path / URL','hero.showreel.audio']],
      about:[['About title','about.title'],['Paragraph 1','about.paragraphs.0'],['Paragraph 2','about.paragraphs.1'],['CV path / URL','about.cv']],
      sound:[['Sound title','sound.title'],['Service 1','sound.services.0'],['Service 2','sound.services.1'],['Service 3','sound.services.2'],['Service 4','sound.services.3']],
      contact:[['Contact title','contact.title'],['Email','contact.email'],['Phone number','contact.phone'],['Instagram label','contact.instagram'],['Instagram URL','contact.instagramUrl'],['Location','contact.location'],['Contact CTA','contact.cta']],
      footer:[['Copyright','footer.copyright'],['Now playing','footer.nowPlaying'],['Duration','footer.duration']]
    };
    function val(path){return path.split('.').reduce((o,k)=>o?.[k],content)??''}
    function makeField(label,path,area=false){const w=document.createElement('label');const isFile=/image|audio|video|pdf|cv|thumbnail|hero/i.test(label);const accept=/image/i.test(label)?'image/*':/audio/i.test(label)?'audio/*':/video/i.test(label)?'video/*':/pdf|cv/i.test(label)?'.pdf,application/pdf':'*/*';w.innerHTML=`<span>${label}</span>${area?`<textarea data-path="${path}">${escapeHtml(val(path))}</textarea>`:`<input data-path="${path}" value="${escapeHtml(val(path))}">`}${isFile?`<div class="upload-row"><input class="file-picker" type="file" accept="${accept}" data-file-path="${path}"><small class="upload-status"></small></div>`:''}`;if(isFile){const picker=w.querySelector('.file-picker');picker.onchange=async()=>{const file=picker.files[0];if(!file)return;const kind=assetKind(file.type,file.name);const expected=/image/i.test(label)?'image':/audio/i.test(label)?'audio':/video/i.test(label)?'video':/pdf|cv/i.test(label)?'pdf':kind;if(expected!==kind&&expected!=='other'){picker.value='';w.querySelector('.upload-status').textContent='Please choose a '+expected+' file.';return;}const ref=await putAsset(file);w.querySelector('[data-path]').value=ref;w.querySelector('.upload-status').textContent='✓ '+file.name;};}return w;}
    Object.entries(groups).forEach(([tab,fields])=>{const sec=document.createElement('section');sec.dataset.section=tab;fields.forEach(([label,path])=>sec.appendChild(makeField(label,path,/paragraph|description|CTA/i.test(label))));f.appendChild(sec)});
    const projSec=document.createElement('section');projSec.dataset.section='projects';
    content.projects.forEach((p,i)=>{const box=document.createElement('fieldset');box.innerHTML=`<legend>PROJECT ${p.number}</legend>`;[['Title',`projects.${i}.title`],['Thumbnail label',`projects.${i}.thumbLabel`],['Thumbnail image path / URL',`projects.${i}.thumbImage`],['Description',`projects.${i}.description`],['Year',`projects.${i}.year`],['Details',`projects.${i}.details`],['Audio path / URL',`projects.${i}.audio`],['Video path / URL',`projects.${i}.video`],['Project URL',`projects.${i}.link`]].forEach(([label,path])=>box.appendChild(makeField(label,path,/Description|Details/i.test(label))));projSec.appendChild(box)});f.appendChild(projSec);
    function activate(tab){m.querySelectorAll('.editor-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));m.querySelectorAll('[data-section]').forEach(s=>s.style.display=s.dataset.section===tab?'grid':'none')}
    m.querySelectorAll('.editor-tabs button').forEach(b=>b.onclick=()=>activate(b.dataset.tab));activate('site');
    m.querySelector('.modal-close').onclick=()=>m.remove();m.querySelector('.modal-backdrop').onclick=()=>m.remove();
    m.querySelector('#savePreview').onclick=()=>{readEditor(m);localStorage.setItem(storageKey,JSON.stringify(content));m.remove();render();refreshAssetPreviews();};
    m.querySelector('#resetPreview').onclick=()=>{if(confirm('Reset all editable content to the original V5?')){localStorage.removeItem(storageKey);content=clone(base);m.remove();render();}};
    m.querySelector('#exportContent').onclick=()=>{readEditor(m);const text='window.LUZ_CONTENT = '+JSON.stringify(content,null,2)+';\n';const blob=new Blob([text],{type:'text/javascript'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='content.js';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
    m.querySelector('#exportSite').onclick=async()=>{readEditor(m);await exportCompleteSite();};
  }
  async function exportCompleteSite(){
    if(!window.JSZip){const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';document.head.appendChild(sc);await new Promise((res,rej)=>{sc.onload=res;sc.onerror=rej});}
    const zip=new JSZip();
    const assets=await allAssets();
    const exported=clone(content);
    const map={};
    for(const a of assets){map['idb://'+a.id]='assets/'+a.name;zip.file('assets/'+a.name,a.blob);}
    const replace=(v)=>{if(typeof v==='string'&&map[v])return map[v];if(Array.isArray(v))return v.map(replace);if(v&&typeof v==='object'){const o={};for(const k in v)o[k]=replace(v[k]);return o;}return v;};
    const finalContent=replace(exported);
    zip.file('content.js','window.LUZ_CONTENT = '+JSON.stringify(finalContent,null,2)+';\n');
    const baseFiles=['index.html','styles.css','script.js','README.md','assets/hero.jpg'];
    for(const name of baseFiles){const res=await fetch(name);if(res.ok)zip.file(name,await res.blob());}
    const blob=await zip.generateAsync({type:'blob'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='luz-frequencies-site-ready.zip';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  }

  function readEditor(m){m.querySelectorAll('[data-path]').forEach(el=>{const path=el.dataset.path.split('.');let target=content;for(let i=0;i<path.length-1;i++){const key=path[i];if(target[key]===undefined)target[key]=/^\d+$/.test(path[i+1])?[]:{};target=target[key];}target[path[path.length-1]]=el.value;});}
  function escapeHtml(v){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  const editorStyle=document.createElement('style');editorStyle.textContent=`.footer-edit{display:none!important;pointer-events:none!important}.full-editor-card{width:min(1100px,94vw);max-height:90vh;overflow:hidden}.editor-tabs{display:flex;gap:4px;flex-wrap:wrap;margin:14px 0;border-bottom:1px solid #333;padding-bottom:10px}.editor-tabs button{background:#111;border:1px solid #333;color:#aaa;padding:8px 12px;font:9px "DM Mono";letter-spacing:.08em}.editor-tabs button.active{color:#fff;border-color:#ed0c16;background:#190507}.full-editor-card .editor-fields{max-height:55vh;overflow:auto;padding-right:8px}.full-editor-card .editor-fields>section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.full-editor-card .editor-fields label{display:block}.full-editor-card .editor-fields label span{display:block;color:#777;font-size:8px;text-transform:uppercase;margin-bottom:5px}.full-editor-card .editor-fields input,.full-editor-card .editor-fields textarea{width:100%;background:#0e0e10;border:1px solid #333;color:#eee;padding:9px;font:10px "DM Mono"}.full-editor-card .editor-fields textarea{min-height:78px;resize:vertical}.full-editor-card fieldset{grid-column:1/-1;border:1px solid #2b2b2e;padding:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.full-editor-card legend{color:#ed0c16;padding:0 8px;font:12px "Oswald"}.full-editor-card .editor-actions{display:flex;gap:10px;margin-top:14px}.full-editor-card .editor-actions button{border:1px solid #333;background:#111;color:#ddd;padding:10px 14px}.full-editor-card .editor-actions #savePreview{background:#ed0c16;border-color:#ed0c16;color:#fff}.full-editor-card .editor-actions #exportContent{border-color:#234a9a;color:#b7c9ef}.full-editor-card .editor-actions #exportSite{border-color:#ed0c16;color:#fff;background:#2a0709}.modal-video{width:100%;max-height:50vh;margin:15px 0;background:#000}.upload-row{display:flex;gap:8px;align-items:center;margin-top:7px}.upload-row .file-picker{font-size:9px}.upload-status{color:#234a9a;font-size:8px}@media(max-width:700px){.full-editor-card .editor-fields>section,.full-editor-card fieldset{grid-template-columns:1fr}.full-editor-card{max-height:96vh}.full-editor-card .editor-fields{max-height:62vh}}`;document.head.appendChild(editorStyle);
  render();
  refreshAssetPreviews();
})();

/* FINAL SIREN LABEL/TIME ONLY */
document.addEventListener('DOMContentLoaded', function () {
  const fixSiren = () => {
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0) {
        if (/play\s+showreel/i.test(el.textContent || '')) {
          el.textContent = 'PLAY SIREN';
        } else if ((el.textContent || '').trim() === '02:17') {
          el.textContent = '03:05';
        }
      }
    });
  };
  fixSiren();
  setTimeout(fixSiren, 100);
});
