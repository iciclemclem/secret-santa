'use strict';
const root = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const formatDate = s => s ? new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : 'À définir';
const money = x => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(x);
async function request(url, opts) { const res = await fetch(url, { ...opts, headers: { 'Content-Type':'application/json', ...opts?.headers }, cache:'no-store' }); const data = await res.json(); if (!res.ok) throw Error(data.error || 'Erreur réseau'); return data; }
function message(text) { const el = document.getElementById('message'); if(el){el.textContent=text;el.hidden=!text;} }
function fail(err) {message(err.message || String(err));}
function card(html){root.innerHTML='<section class="card">'+html+'</section>';}
function home(){
  let names=[];
  card(`<h2>Organise ton échange 🎄</h2><p class="hint">Crée ton événement, puis partage un lien secret avec chaque ami.</p><form id="eventForm"><label for="title">Nom de l'événement</label><input id="title" maxlength="100" value="Le Noël des copains" required><div class="row"><div><label for="budget">Budget maximum (€)</label><input id="budget" type="number" min="0" max="100000" step="0.01" value="25" required></div><div><label for="date">Date de remise (facultatif)</label><input id="date" type="date"></div></div><label for="name">Participants</label><div id="names"></div><div class="add"><input id="name" maxlength="60" placeholder="Prénom d'un ami" autocomplete="off"><button id="add" class="secondary" type="button">+ Ajouter</button></div><p class="small">Minimum 2 participants. Utilise une initiale pour distinguer les homonymes.</p><p id="message" class="error" hidden></p><button class="primary" type="submit">Créer mon Secret Santa →</button></form>`);
  const list=document.getElementById('names');
  function renderNames(){list.replaceChildren();names.forEach((n,i)=>{const el=document.createElement('div');el.className='person';const span=document.createElement('span');span.textContent='🎅  '+n;const b=document.createElement('button');b.type='button';b.className='danger';b.textContent='Retirer';b.onclick=()=>{names.splice(i,1);renderNames();};el.append(span,b);list.appendChild(el);});}
  function add(){const input=document.getElementById('name');const n=input.value.trim();if(!n)return;if(names.some(x=>x.toLocaleLowerCase('fr')===n.toLocaleLowerCase('fr')))return message('Ce prénom est déjà présent.');if(names.length>=50)return message('Maximum 50 participants.');names.push(n);input.value='';message('');renderNames();input.focus();}
  document.getElementById('add').onclick=add;
  document.getElementById('name').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add();}});
  document.getElementById('eventForm').onsubmit=async e=>{e.preventDefault();if(document.getElementById('name').value.trim())add();if(names.length<2)return message('Ajoute au moins 2 personnes.');const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;try{const data=await request('/api/events',{method:'POST',body:JSON.stringify({title:document.getElementById('title').value,budget:document.getElementById('budget').value,date:document.getElementById('date').value,names})});location.assign(data.organizerPath);}catch(err){fail(err);btn.disabled=false;}};
}
async function copy(url, button){try{await navigator.clipboard.writeText(url);button.textContent='✓ Copié';setTimeout(()=>button.textContent='Copier le lien',1800);}catch{window.prompt('Copie ce lien :',url);}}
async function organize(key){
  try{const data=await request('/api/organize/'+encodeURIComponent(key));
    card(`<h2>${esc(data.title)}</h2><p class="hint">Espace organisateur · ${data.participants.length} participants</p><div class="detail"><span>Budget</span><strong>${money(data.budget)}</strong></div><div class="detail"><span>Remise des cadeaux</span><strong>${esc(formatDate(data.date))}</strong></div><div class="notice">🔐 <b>Garde ce lien organisateur privé.</b> Il permet d'accéder à tous les liens individuels. Sauvegarde-le pour revenir ici.</div>${data.drawn?'<div class="notice">✅ Le tirage est effectué et définitif. Tu peux partager les liens individuels ci-dessous.</div>':'<p class="hint">Vérifie les prénoms avant de lancer : le tirage ne pourra pas être modifié ensuite.</p><button id="draw" class="primary">🎲 Lancer le tirage</button>'}<div id="links" class="linklist"></div><p id="message" class="error" hidden></p>`);
    const list=document.getElementById('links');data.participants.forEach(p=>{const item=document.createElement('div');item.className='linkitem';const name=document.createElement('div');const title=document.createElement('b');title.textContent='🎁 '+p.name;const small=document.createElement('small');small.textContent='Lien confidentiel personnel';name.append(title,small);const btn=document.createElement('button');btn.className='outline';btn.textContent='Copier le lien';btn.onclick=()=>copy(location.origin+p.path,btn);item.append(name,btn);list.appendChild(item);});
    const draw=document.getElementById('draw');if(draw)draw.onclick=async()=>{if(!confirm('Lancer le tirage définitif pour '+data.participants.length+' personnes ?'))return;draw.disabled=true;try{await request('/api/organize/'+encodeURIComponent(key)+'/draw',{method:'POST'});organize(key);}catch(err){fail(err);draw.disabled=false;}};
  }catch(err){card('<h2>Lien organisateur indisponible</h2><p class="error">'+esc(err.message)+'</p><a href="/">Créer un événement</a>');}
}
function setupScratch(){
  const canvas=document.getElementById('scratchCanvas');
  const surface=document.getElementById('scratchTicket');
  const status=document.getElementById('scratchStatus');
  const skip=document.getElementById('revealWithoutScratch');
  if(!canvas || !surface)return;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx){canvas.hidden=true;status.textContent='Ton destinataire est révélé !';skip.hidden=true;return;}
  let finished=false, active=false, last=null, moves=0;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=surface.clientWidth, h=surface.clientHeight;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const scaleX=canvas.width/w, scaleY=canvas.height/h;
  ctx.setTransform(scaleX,0,0,scaleY,0,0);
  const metallic=ctx.createLinearGradient(0,0,w,h);
  metallic.addColorStop(0,'#a8b6b2');metallic.addColorStop(.23,'#e5ebe4');
  metallic.addColorStop(.49,'#a1aaa7');metallic.addColorStop(.74,'#d6dfd9');metallic.addColorStop(1,'#a8b5ae');
  ctx.fillStyle=metallic;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.33)';
  for(let x=-h;x<w+h;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.24)';ctx.stroke();}
  ctx.fillStyle='#244d40';ctx.textAlign='center';ctx.font='700 15px system-ui,sans-serif';
  ctx.fillText('✦ GRATTE ICI ✦',w/2,h/2-6);
  ctx.font='12px system-ui,sans-serif';ctx.fillText('avec ton doigt ou ta souris',w/2,h/2+18);
  const reveal=()=>{if(finished)return;finished=true;active=false;surface.classList.add('is-revealed');status.textContent='Surprise ! Voici ton destinataire 🎉';skip.hidden=true;canvas.style.pointerEvents='none';window.setTimeout(()=>{canvas.hidden=true;},850);};
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height};}
  function scratch(a,b){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.lineWidth=40;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,20,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
  function check(){if(finished)return;const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0,total=0;const step=12;for(let y=0;y<canvas.height;y+=step){for(let x=0;x<canvas.width;x+=step){total++;if(pixels[(y*canvas.width+x)*4+3]<110)transparent++;}}if(transparent/total>=.42)reveal();else status.textContent='Continue de gratter pour découvrir le prénom…';}
  canvas.addEventListener('pointerdown',e=>{if(finished)return;e.preventDefault();active=true;last=point(e);canvas.setPointerCapture(e.pointerId);scratch(last,last);});
  canvas.addEventListener('pointermove',e=>{if(!active||finished)return;e.preventDefault();const p=point(e);scratch(last,p);last=p;moves++;if(moves%12===0)check();});
  const stop=()=>{if(active){active=false;last=null;check();}};
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
  skip.addEventListener('click',reveal);
}
async function gift(key){
  try{const d=await request('/api/gift/'+encodeURIComponent(key));card(`<div class="celebrate">${d.drawn?'🎁':'⏳'}</div><h2 class="center">Bonjour ${esc(d.giver)} !</h2><p class="center muted">${esc(d.title)}</p>${d.drawn?`<p class="center">Ton destinataire se cache sous ce ticket. Gratte pour le découvrir !</p><div class="scratch-ticket" id="scratchTicket"><div class="scratch-prize"><span>TON DESTINATAIRE SECRET</span><strong>${esc(d.recipient)}</strong><span class="scratch-sparkles">🎄 ✨ 🎁</span></div><canvas id="scratchCanvas" class="scratch-cover" aria-label="Ticket à gratter : glisse ton doigt ou ta souris pour révéler le prénom"></canvas></div><p class="small center" id="scratchStatus" role="status">Glisse ton doigt ou ta souris sur le ticket argenté.</p><button type="button" class="scratch-access" id="revealWithoutScratch">Révéler sans gratter</button>`:'<div class="notice center">Le tirage n’a pas encore eu lieu. Reviens bientôt avec ce même lien.</div>'}<div class="detail"><span>Budget maximum</span><strong>${money(d.budget)}</strong></div><div class="detail"><span>Date de remise</span><strong>${esc(formatDate(d.date))}</strong></div><p class="small center">🤫 Ne révèle pas le nom de ton destinataire avant l’échange !</p>`);if(d.drawn)setupScratch();
  }catch(err){card('<h2>Lien privé indisponible</h2><p class="error">'+esc(err.message)+'</p>');}
}
const parts=location.pathname.split('/').filter(Boolean);
if(parts[0]==='organize'&&parts[1])organize(parts[1]);else if(parts[0]==='gift'&&parts[1])gift(parts[1]);else home();
