'use strict';
const root = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const formatDate = s => s ? new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : 'À définir';
const money = x => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(x);
async function request(url, opts) {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers }, cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || 'Erreur réseau');
  return data;
}
function message(text) {
  const el = document.getElementById('message');
  if (el) { el.textContent = text; el.hidden = !text; }
}
function fail(err) { message(err.message || String(err)); }
function card(html) { root.innerHTML = '<section class="card">' + html + '</section>'; }
function applyTheme(theme) {
  document.body.dataset.theme = 'nuit';
  decorateScene(document.body.dataset.theme);
}
const themeEmoji = theme => ({ foret:'🎄', rouge:'🎁', nuit:'✨' }[theme] || '🎁');
function decorateScene(theme) {
  document.body.dataset.theme = 'nuit';
  const snow = document.querySelector('.snow');
  if (snow) snow.textContent = theme === 'nuit' ? '❄  ✦  ❄' : '❄  ✧  ❄';
}
// V6 : décor et effets locaux, sans dépendance ni requête externe.
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function preference(key, fallback) {
  try { const value=localStorage.getItem('santa-v6-'+key); return value===null?fallback:value==='1'; } catch { return fallback; }
}
function savePreference(key,value) { try { localStorage.setItem('santa-v6-'+key,value?'1':'0'); } catch {} }
let soundOn=preference('sound',false), vibrationOn=preference('vibration',true), audio=null, noise=null;
function unlockAudio() {
  if(!soundOn)return;
  try { const Audio=window.AudioContext||window.webkitAudioContext; if(!Audio)return; if(!audio)audio=new Audio(); if(audio.state==='suspended')audio.resume().catch(()=>{}); } catch {}
}
function scratchSound() {
  if(!soundOn||!audio||audio.state!=='running')return;
  try {
    if(!noise){noise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.055),audio.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);}
    const src=audio.createBufferSource(), filter=audio.createBiquadFilter(), gain=audio.createGain();src.buffer=noise;filter.type='bandpass';filter.frequency.value=1700;gain.gain.value=.055;src.connect(filter).connect(gain).connect(audio.destination);src.start();
  } catch {}
}
function chime() {
  if(!soundOn||!audio||audio.state!=='running')return;
  try { [523.25,659.25,783.99,1046.5].forEach((f,i)=>{const t=audio.currentTime+i*.12,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.085,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+.55);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.56);}); } catch {}
}
function vibrate(pattern) { if(vibrationOn&&!reducedMotion()&&typeof navigator.vibrate==='function')try{navigator.vibrate(pattern);}catch{} }
function effectControls(anchor) {
  const group=document.createElement('div');group.className='effect-controls';group.setAttribute('aria-label','Effets du ticket');
  function toggle(label,key,get,set){const b=document.createElement('button');b.type='button';const update=()=>{b.textContent=label+' : '+(get()?'activé':'désactivé');b.setAttribute('aria-pressed',String(get()));};b.onclick=()=>{set(!get());savePreference(key,get());update();if(key==='sound')unlockAudio();};update();group.appendChild(b);}
  if(window.AudioContext||window.webkitAudioContext)toggle('Son','sound',()=>soundOn,v=>soundOn=v);
  if(typeof navigator.vibrate==='function'&&!reducedMotion())toggle('Vibration','vibration',()=>vibrationOn,v=>vibrationOn=v);
  if(group.childElementCount)anchor.before(group);
}
function winterScene() {
  const canvas=document.createElement('canvas');canvas.className='winter-scene';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  function paint(){
    const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);
    let seed=2026;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    let sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#0a192f');sky.addColorStop(.55,'#243e59');sky.addColorStop(1,'#718c9a');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const moonX=w*.81,moonY=h*.13;let glow=ctx.createRadialGradient(moonX,moonY,0,moonX,moonY,Math.min(w*.36,180));glow.addColorStop(0,'rgba(225,234,247,.25)');glow.addColorStop(1,'rgba(225,234,247,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.fillStyle='#e8e8d6';ctx.beginPath();ctx.arc(moonX,moonY,Math.min(w*.025,19),0,Math.PI*2);ctx.fill();
    for(let i=0;i<100;i++){ctx.fillStyle='rgba(235,245,255,'+(.12+rnd()*.42)+')';ctx.beginPath();ctx.arc(rnd()*w,rnd()*h*.61,.3+rnd()*1.1,0,Math.PI*2);ctx.fill();}
    function tree(x,y,size,color,snow){
      const width=size*.43;ctx.fillStyle=color;ctx.fillRect(x-size*.018,y-size*.17,size*.036,size*.17);
      for(let k=0;k<4;k++){const top=y-size+k*size*.18,base=top+size*.39,half=width*(.44+k*.17);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x-half,base);ctx.lineTo(x,base-size*.035);ctx.lineTo(x+half,base);ctx.closePath();ctx.fill();ctx.fillStyle=snow;ctx.beginPath();ctx.moveTo(x,top+size*.025);ctx.lineTo(x-half*.84,base-size*.035);ctx.lineTo(x-half*.35,base-size*.1);ctx.lineTo(x,top+size*.14);ctx.lineTo(x+half*.62,base-size*.075);ctx.closePath();ctx.fill();}
    }
    for(let layer=0;layer<3;layer++){const base=h*(.69+layer*.14),step=Math.max(20,w/(layer===0?39:25));for(let x=-step;x<w+step;x+=step){let size=h*(.13+layer*.075)*(.7+rnd()*.65);tree(x+rnd()*step,base+rnd()*h*.065,size,['#38536a','#294558','#1c3848'][layer],['rgba(194,214,228,.20)','rgba(212,231,239,.28)','rgba(224,239,246,.42)'][layer]);}const mist=ctx.createLinearGradient(0,base-h*.08,0,base+h*.12);mist.addColorStop(0,'rgba(172,199,216,0)');mist.addColorStop(.7,'rgba(172,199,216,.19)');mist.addColorStop(1,'rgba(172,199,216,0)');ctx.fillStyle=mist;ctx.fillRect(0,base-h*.08,w,h*.2);}
    ctx.fillStyle='rgba(209,228,240,.18)';ctx.beginPath();ctx.moveTo(0,h*.94);ctx.quadraticCurveTo(w*.5,h*.88,w,h*.95);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
  }
  paint();let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(paint,120);},{passive:true});
}
let lastScratchEffect=-Infinity;
function scratchEffect(e) {
  const now=performance.now();if(now-lastScratchEffect<65)return;lastScratchEffect=now;scratchSound();
  if(reducedMotion()||document.querySelectorAll('.scratch-dust').length>=36)return;
  for(let i=0;i<3;i++){const p=document.createElement('i');p.className='scratch-dust';p.setAttribute('aria-hidden','true');p.style.left=e.clientX+'px';p.style.top=e.clientY+'px';p.style.setProperty('--dx',(Math.random()*42-21)+'px');p.style.setProperty('--dy',(8+Math.random()*28)+'px');document.body.appendChild(p);setTimeout(()=>p.remove(),550);}
}
function celebrate() {
  chime();vibrate([45,65,45,65,110]);if(reducedMotion())return;
  const c=document.createElement('canvas');c.className='v6-celebration';c.setAttribute('aria-hidden','true');document.body.appendChild(c);const ctx=c.getContext('2d');if(!ctx){c.remove();return;}
  const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,1.5);c.width=w*d;c.height=h*d;ctx.scale(d,d);
  const colors=['#f6d384','#fff4cc','#8ccaff','#e4a5a9','#b7ebd9'];const particles=[];const bursts=[[.18,.24,0],[.78,.30,350],[.48,.17,700],[.28,.45,1050],[.70,.43,1400]];let next=0,start=performance.now(),prev=start;
  function burst(x,y){for(let i=0;i<42;i++){const angle=i*Math.PI*2/42+Math.random()*.12,speed=65+Math.random()*125;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.2+Math.random()*.65,max:1.85,color:colors[i%colors.length],size:1+Math.random()*1.7,confetti:false});}}
  for(let i=0;i<42;i++)particles.push({x:Math.random()*w,y:-Math.random()*h*.55,vx:Math.random()*55-27,vy:45+Math.random()*70,life:3.2+Math.random()*1.2,max:4.4,color:colors[i%colors.length],size:3+Math.random()*3,confetti:true});
  function frame(t){if(t-start>4500||!c.isConnected){c.remove();return;}const dt=Math.min(.04,(t-prev)/1000);prev=t;ctx.clearRect(0,0,w,h);while(next<bursts.length&&t-start>=bursts[next][2]){burst(w*bursts[next][0],h*bursts[next][1]);next++;}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}const x=p.x,y=p.y;p.vy+=dt*(p.confetti?12:47);p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.min(1,p.life/p.max*1.7);ctx.strokeStyle=ctx.fillStyle=p.color;if(p.confetti){ctx.fillRect(p.x,p.y,p.size,p.size*.52);}else{ctx.lineWidth=p.size;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-p.vx*.035,y-p.vy*.035);ctx.lineTo(p.x,p.y);ctx.stroke();}}ctx.globalAlpha=1;requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);setTimeout(()=>c.remove(),4800);
}
function snowfall() {
  winterScene();if(reducedMotion())return;
  const layer=document.createElement('div');layer.className='snowfall';layer.setAttribute('aria-hidden','true');document.body.appendChild(layer);
  for(let i=0;i<56;i++){const f=document.createElement('span');const size=1.5+Math.random()*4;f.style.width=f.style.height=size+'px';f.style.left=Math.random()*100+'%';f.style.animationDelay=(-Math.random()*18)+'s';f.style.animationDuration=(8+Math.random()*14)+'s';f.style.opacity=(.25+Math.random()*.6).toFixed(2);f.style.setProperty('--drift',(Math.random()*100-50)+'px');if(i%6===0)f.className='near-flake';layer.appendChild(f);}
}
snowfall();

// Les exclusions sont stockées sous forme de couples orientés [donneur, destinataire].
function exclusionGroups(pairs) {
  const keys = new Set(pairs.map(([a,b]) => a + ':' + b));
  const groups = [];
  for (const key of keys) {
    const [a,b] = key.split(':').map(Number);
    const reverse = b + ':' + a;
    const both = keys.has(reverse);
    if (both && a > b) continue;
    groups.push({a,b,both});
  }
  return groups;
}
function home() {
  let names = [];
  let exclusions = new Set();
  card(`<h2>Organise ton échange 🎄</h2>
    <p class="hint">Crée ton événement, puis invite les amis avant le tirage. Chaque personne aura son lien privé pour renseigner ses souhaits puis découvrir son destinataire.</p>
    <form id="eventForm">
      <label for="title">Nom de l'événement</label><input id="title" maxlength="100" placeholder="Ex. Noël entre amis" required>
      <div class="row"><div><label for="budget">Budget maximum (€)</label><input id="budget" type="number" min="0" max="100000" step="0.01" value="25" required></div><div><label for="date">Date de remise (facultatif)</label><input id="date" type="date"></div></div>
      <label for="giftTheme">Thème des cadeaux (facultatif)</label><input id="giftTheme" maxlength="200" placeholder="Ex. Fait main, cocooning, gourmandises…"><p class="small">Une idée commune pour guider les participants.</p>
      <label for="name">Participants</label><div id="names"></div>
      <div class="add"><input id="name" maxlength="60" placeholder="Prénom d'un ami" autocomplete="off"><button id="add" class="secondary" type="button">+ Ajouter</button></div>
      <p class="small">2 à 50 personnes. Les liens privés seront créés dès la validation.</p>
      <section id="exclusionSettings" class="exclusion-settings"><h3>Exclusions entre participants</h3><p class="small">Choisis deux personnes et le sens de l’exclusion. Dans un seul sens, le participant 1 ne peut pas tirer le participant 2, mais l’inverse reste possible.</p>
        <div class="exclusion-picker"><div><label for="exclusionA">Participant 1</label><select id="exclusionA"></select></div><div><label for="exclusionB">Participant 2</label><select id="exclusionB"></select></div></div>
        <label for="exclusionDirection">Sens de l’exclusion</label><select id="exclusionDirection"><option value="both">Dans les deux sens (1 ↔ 2)</option><option value="one">Un seul sens (1 → 2)</option></select>
        <button type="button" class="secondary add-exclusion" id="addExclusion">+ Ajouter l'exclusion</button>
        <div id="exclusionPairs" class="exclusion-list" aria-live="polite"></div>
      </section>
      <p id="message" class="error" hidden role="alert"></p>
      <button class="primary" type="submit">Créer mon Secret Santa →</button>
    </form>`);
  const list = document.getElementById('names');
  function renderNames() {
    list.replaceChildren();
    names.forEach((n, i) => {
      const el = document.createElement('div'); el.className = 'person';
      const span = document.createElement('span'); span.textContent = String(i + 1).padStart(2, '0') + ' · ' + n;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'danger'; b.textContent = 'Retirer';
      b.onclick = () => {
        names.splice(i, 1);
        exclusions = new Set([...exclusions].flatMap(pair => {
          const [a, b] = pair.split(':').map(Number);
          if (a === i || b === i) return [];
          return [`${a > i ? a - 1 : a}:${b > i ? b - 1 : b}`];
        }));
        renderNames();
      };
      el.append(span, b); list.appendChild(el);
    });
    renderExclusions();
  }
  function renderExclusions() {
    const pickerA = document.getElementById('exclusionA'), pickerB = document.getElementById('exclusionB');
    const options = '<option value="">Choisir une personne</option>' + names.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join('');
    const selectedA = pickerA.value, selectedB = pickerB.value;
    pickerA.innerHTML = options; pickerB.innerHTML = options;
    if (selectedA !== '' && Number(selectedA) < names.length) pickerA.value = selectedA;
    if (selectedB !== '' && Number(selectedB) < names.length) pickerB.value = selectedB;
    document.getElementById('addExclusion').disabled = names.length < 2;
    const wrap = document.getElementById('exclusionPairs'); wrap.replaceChildren();
    if (!exclusions.size) {
      const hint = document.createElement('p'); hint.className = 'small'; hint.textContent = 'Aucune exclusion définie.'; wrap.appendChild(hint); return;
    }
    exclusionGroups([...exclusions].map(pair => pair.split(':').map(Number))).forEach(({a,b,both}) => {
      const row = document.createElement('div'); row.className = 'exclusion-item';
      const label = document.createElement('span'); label.textContent = names[a] + (both ? ' ↔ ' : ' → ') + names[b] + (both ? ' (réciproque)' : ' (sens unique)');
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Retirer';
      remove.onclick = () => { exclusions.delete(a + ':' + b); if (both) exclusions.delete(b + ':' + a); renderExclusions(); };
      row.append(label, remove); wrap.appendChild(row);
    });
  }
  document.getElementById('addExclusion').onclick = () => {
    const a = document.getElementById('exclusionA').value, b = document.getElementById('exclusionB').value;
    if (a === '' || b === '') return message('Sélectionne deux participants pour créer une exclusion.');
    if (a === b) return message('Choisis deux participants différents.');
    const pair = a + ':' + b, reverse = b + ':' + a;
    const both = document.getElementById('exclusionDirection').value === 'both';
    if (exclusions.has(pair) && (!both || exclusions.has(reverse))) return message('Cette exclusion existe déjà.');
    exclusions.add(pair); if (both) exclusions.add(reverse);
    message(''); renderExclusions();
    document.getElementById('exclusionA').value = ''; document.getElementById('exclusionB').value = '';
  };
  function add() {
    const input = document.getElementById('name'), n = input.value.trim(); if (!n) return;
    if (names.some(x => x.toLocaleLowerCase('fr') === n.toLocaleLowerCase('fr'))) return message('Ce prénom est déjà présent.');
    if (names.length >= 50) return message('Maximum 50 participants.');
    names.push(n); input.value = ''; message(''); renderNames(); input.focus();
  }
  document.getElementById('add').onclick = add;
  document.getElementById('name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  document.getElementById('eventForm').onsubmit = async e => {
    e.preventDefault(); if (document.getElementById('name').value.trim()) add();
    if (names.length < 2) return message('Ajoute au moins 2 personnes.');
    const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true;
    try {
      const data = await request('/api/events', { method:'POST', body:JSON.stringify({
        title:document.getElementById('title').value,
        budget:document.getElementById('budget').value,
        date:document.getElementById('date').value,
        names,
        giftTheme:document.getElementById('giftTheme').value,
        exclusions:[...exclusions].map(k => k.split(':').map(Number))
      })});
      location.assign(data.organizerPath);
    } catch (err) { fail(err); btn.disabled = false; }
  };
  renderNames();
}

async function copy(url, button) {
  try {
    await navigator.clipboard.writeText(url);
    const previous = button.textContent;
    button.textContent = '✓ Copié';
    window.setTimeout(() => { if (button.isConnected) button.textContent = previous; }, 1800);
  } catch {
    window.prompt('Copie ce lien :', url);
  }
}
const themeNames = { foret:'Forêt', rouge:'Rouge & or', nuit:'Nuit étoilée' };
const revealTime = s => new Date(s).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
function invitationText(event, person, template) {
  const values = {
    prenom: person.name,
    emoji: themeEmoji(event.theme),
    evenement: event.title,
    budget: money(event.budget),
    date: formatDate(event.date),
    theme: event.giftTheme || 'Libre',
    lien: location.origin + person.path
  };
  return template.replace(/\{(prenom|emoji|evenement|budget|date|lien|theme)\}/g, (_, key) => values[key]);
}
let organizerRefreshTimer = null;
let organizerFocusListener = null;
async function organize(key) {
  if (organizerRefreshTimer) { window.clearInterval(organizerRefreshTimer); organizerRefreshTimer = null; }
  if (organizerFocusListener) { window.removeEventListener('focus', organizerFocusListener); organizerFocusListener = null; }
  try {
    const url = '/api/organize/' + encodeURIComponent(key);
    const data = await request(url);
    applyTheme(data.theme);
    const groups = exclusionGroups(data.exclusions || []);
    card(`<h2>${esc(data.title)}</h2>
      <p class="hint">Espace organisateur · ${data.participants.length} participants</p>
      <div class="detail"><span>Budget</span><strong>${money(data.budget)}</strong></div>
      <div class="detail"><span>Remise des cadeaux</span><strong>${esc(formatDate(data.date))}</strong></div>
      <div class="detail"><span>Thème des cadeaux</span><strong>${esc(data.giftTheme || 'Libre')}</strong></div>
      <div class="notice">Exclusions : ${groups.filter(g => !g.both).length} à sens unique · ${groups.filter(g => g.both).length} réciproque(s).</div>
      <div class="notice">🔐 <b>Conserve cette adresse organisateur en privé.</b> Elle donne accès aux liens individuels. Tu peux partager les liens avant ou après le tirage, avec le même message WhatsApp personnalisé.</div>
      ${data.drawn ? `<section class="progress-panel" aria-label="Suivi des découvertes">
        <div class="progress-head"><div><div class="progress-label">Suivi des découvertes</div><div class="progress-numbers"><strong id="revealedCount">0</strong><span> / ${data.participants.length} tickets découverts</span></div></div><button id="refresh" type="button" class="outline small-button">↻ Actualiser</button></div>
        <progress id="revealProgress" max="${data.participants.length}" value="0" aria-label="Participants ayant découvert leur destinataire"></progress>
        <p class="small" id="updatedNotice" role="status">Actualisation automatique toutes les 15 secondes.</p>
      </section><div class="notice">✅ Tirage effectué. Les liens WhatsApp peuvent toujours être renvoyés avec le même message.</div>`
      : `<div class="notice">✉️ Les liens privés fonctionnent déjà : les amis peuvent compléter leurs souhaits avant le tirage.</div><p class="hint">Vérifie les prénoms avant de lancer le tirage : il sera définitif.</p><button id="draw" class="primary" type="button">🎲 Lancer le tirage</button>`}
      <section class="message-editor" aria-labelledby="messagesTitle">
        <h3 id="messagesTitle">✉️ Personnaliser le message WhatsApp</h3>
        <p class="small">Le même message sera utilisé avant et après le tirage.</p>
        <p class="small">Variables disponibles : <code>{prenom}</code> <code>{emoji}</code> <code>{evenement}</code> <code>{budget}</code> <code>{date}</code> <code>{lien}</code> <code>{theme}</code>. Garde impérativement <code>{lien}</code> dans le texte.</p>
        <label for="messageTemplate">Message personnalisé</label><textarea id="messageTemplate" rows="8" maxlength="1800">${esc(data.message)}</textarea>
        <button id="saveMessages" type="button" class="secondary message-save">Enregistrer le message</button>
        <p id="messageSaveStatus" class="small" role="status">Le message actuel est enregistré.</p>
        <div class="preview-panel"><div class="section-heading"><h3>Prévisualisation</h3><span class="small">Message tel qu'il sera envoyé</span></div>
          <div class="preview-controls one-col"><div><label for="previewPerson">Destinataire</label><select id="previewPerson">${data.participants.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('')}</select></div></div>
          <pre id="invitationPreview" class="invite-preview"></pre>
        </div>
      </section>
      <div class="section-heading"><h3>Participants et invitations</h3><span class="small">${data.participants.length} liens privés</span></div>
      <div id="links" class="linklist"></div>
      <p id="message" class="error" role="alert" hidden></p>`);

    const templateInput = document.getElementById('messageTemplate');
    const shareAnchors = [];
    const list = document.getElementById('links');
    data.participants.forEach((p, i) => {
      const row = document.createElement('div'); row.className = 'invite-row';
      const info = document.createElement('div'); info.className = 'invite-info';
      const name = document.createElement('strong'); name.textContent = p.name;
      const badge = document.createElement('span'); badge.className = 'status-chip status-pending'; badge.id = 'revealStatus-' + i;
      badge.textContent = data.drawn ? '◷ Pas encore découvert' : '⏳ Tirage à venir';
      info.append(name, badge);
      const actions = document.createElement('div'); actions.className = 'invite-actions';
      const copyButton = document.createElement('button'); copyButton.type = 'button'; copyButton.className = 'outline'; copyButton.textContent = 'Copier le lien';
      copyButton.onclick = () => copy(location.origin + p.path, copyButton); actions.append(copyButton);
      const wa = document.createElement('a'); wa.className = 'whatsapp-button'; wa.target = '_blank'; wa.rel = 'noopener noreferrer'; wa.textContent = 'WhatsApp';
      wa.setAttribute('aria-label', 'Partager le lien privé de ' + p.name + ' sur WhatsApp');
      shareAnchors.push({ wa, person:p }); actions.append(wa);
      row.append(info, actions); list.append(row);
    });

    function validateClient(t) {
      return t.includes('{lien}') && t.trim().length >= 10 && t.length <= 1800 &&
        (t.match(/\{[^{}]*\}/g) || []).every(tag => ['{prenom}','{emoji}','{evenement}','{budget}','{date}','{lien}','{theme}'].includes(tag));
    }
    function updateMessageUi() {
      const draft = templateInput.value;
      const p = data.participants[Number(document.getElementById('previewPerson').value)] || data.participants[0];
      document.getElementById('invitationPreview').textContent = invitationText(data, p, draft);
      for (const { wa, person } of shareAnchors) {
        if (validateClient(draft)) {
          wa.href = 'https://wa.me/?text=' + encodeURIComponent(invitationText(data, person, draft));
          wa.removeAttribute('aria-disabled'); wa.removeAttribute('tabindex');
        } else {
          wa.removeAttribute('href'); wa.setAttribute('aria-disabled', 'true'); wa.setAttribute('tabindex', '-1');
        }
      }
      const notice = document.getElementById('messageSaveStatus');
      if (draft !== data.message) {
        notice.textContent = '● Modifications non enregistrées. Tu peux prévisualiser et partager le texte, mais enregistre-le pour le retrouver plus tard.';
        notice.className = 'small save-unsaved';
      } else {
        notice.textContent = '✓ Le message est enregistré.';
        notice.className = 'small save-ok';
      }
    }
    templateInput.addEventListener('input', updateMessageUi);
    document.getElementById('previewPerson').onchange = updateMessageUi;
    updateMessageUi();
    document.getElementById('saveMessages').onclick = async () => {
      const btn = document.getElementById('saveMessages'); btn.disabled = true;
      const notice = document.getElementById('messageSaveStatus'); notice.textContent = 'Enregistrement…';
      try {
        const result = await request(url + '/messages', { method:'PATCH', body:JSON.stringify({ message: templateInput.value }) });
        data.message = result.message;
        templateInput.value = result.message;
        updateMessageUi();
        message('');
      } catch (err) {
        notice.textContent = '⚠️ ' + err.message; notice.className = 'small save-error';
      } finally {
        btn.disabled = false;
      }
    };

    function updateStatuses(latest) {
      if (!latest.drawn) return;
      const revealed = latest.participants.filter(p => Boolean(p.revealedAt)).length;
      document.getElementById('revealedCount').textContent = String(revealed);
      document.getElementById('revealProgress').value = revealed;
      latest.participants.forEach((p, i) => {
        const status = document.getElementById('revealStatus-' + i);
        if (!status) return;
        status.className = 'status-chip ' + (p.revealedAt ? 'status-done' : 'status-pending');
        status.textContent = p.revealedAt ? '✓ Découvert · ' + revealTime(p.revealedAt) : '◷ Pas encore découvert';
      });
    }
    if (data.drawn) {
      updateStatuses(data);
      async function refresh(manual = false) {
        const button = document.getElementById('refresh'); if (!button) return;
        if (manual) button.disabled = true;
        try {
          const latest = await request(url);
          updateStatuses(latest);
          document.getElementById('updatedNotice').textContent = 'Dernière vérification : ' + new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) + ' · actualisation automatique toutes les 15 s.';
          if (manual) message('');
        } catch (err) { if (manual) fail(err); }
        finally { if (manual && button.isConnected) button.disabled = false; }
      }
      document.getElementById('refresh').onclick = () => refresh(true);
      organizerRefreshTimer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
      organizerFocusListener = () => { if (document.getElementById('refresh')) refresh(); };
      window.addEventListener('focus', organizerFocusListener, { passive:true });
    }
    const draw = document.getElementById('draw');
    if (draw) draw.onclick = async () => {
      if (!confirm('Lancer le tirage définitif pour ' + data.participants.length + ' personnes ?')) return;
      draw.disabled = true;
      try {
        if (templateInput.value !== data.message) {
          const saved = await request(url + '/messages', { method:'PATCH', body:JSON.stringify({ message: templateInput.value }) });
          data.message = saved.message;
        }
        await request(url + '/draw', { method:'POST' });
        await organize(key);
      } catch (err) { fail(err); draw.disabled = false; }
    };
  } catch (err) {
    card('<h2>Lien organisateur indisponible</h2><p class="error">' + esc(err.message) + '</p><a href="/">Créer un événement</a>');
  }
}

function setupScratch(key, onRevealed) {
  const canvas = document.getElementById('scratchCanvas');
  const surface = document.getElementById('scratchTicket');
  const img = surface.querySelector('.scratch-poster');
  const status = document.getElementById('scratchStatus');
  const skip = document.getElementById('revealWithoutScratch');
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  // Coordonnées intrinsèques, identiques aux pourcentages CSS de la zone centrale.
  const W=414,H=224;
  canvas.width=W; canvas.height=H;
  let ready=false, finished=false, pointer=null, last=null;
  let nameLoaded=false, nameRequest=null, lastMilestone=0;
  effectControls(skip);
  const giftUrl='/api/gift/'+encodeURIComponent(key);
  function loadRecipient() {
    if (!ready || finished || nameLoaded || nameRequest) return;
    nameRequest=request(giftUrl+'/recipient').then(result=>{
      if(!finished){document.getElementById('recipientName').textContent=result.recipient;nameLoaded=true;}
    }).catch(()=>{}).finally(()=>{nameRequest=null;});
  }
  async function reveal() {
    if (finished) return;
    finished=true; pointer=null; skip.disabled=true;
    status.textContent='Découverte en cours…';
    try {
      const result=await request(giftUrl+'/reveal',{method:'POST'});
      onRevealed(result);
      surface.classList.add('is-revealed');
      status.hidden=true; skip.hidden=true; celebrate();
      setTimeout(()=>{canvas.hidden=true;},750);
    } catch(err) {
      finished=false; skip.disabled=false; status.textContent='La découverte n’a pas été enregistrée. Réessaie : '+err.message;
      skip.textContent='Réessayer la révélation';
    }
  }
  skip.addEventListener('click',()=>{unlockAudio();reveal();});
  function activate() {
    if(ready||finished||!ctx||!img.naturalWidth)return;
    // L’image est intégralement chargée avant d’afficher le cadre et d’activer le grattage.
    ctx.fillStyle='#d9d7d0';ctx.fillRect(0,0,W,H);
    ctx.drawImage(img,img.naturalWidth*.12,img.naturalHeight*.31,img.naturalWidth*.76,img.naturalHeight*.31,0,0,W,H);
    ready=true;surface.classList.add('scratch-ready');
    status.textContent='Zone grattée : 0 %';
  }
  function failed(){if(!ready&&!finished)status.textContent='Image indisponible. Tu peux révéler sans gratter ou actualiser la page.';}
  img.addEventListener('load',activate,{once:true});img.addEventListener('error',failed,{once:true});
  if(img.complete){if(img.naturalWidth)activate();else failed();}
  if(!ctx)failed();
  function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  function scratch(a,b){
    ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=58;ctx.strokeStyle='#000';ctx.fillStyle='#000';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,29,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';
  }
  function check(){
    if(!ready||finished)return;
    const rgba=ctx.getImageData(0,0,W,H).data;let remaining=0;
    // Tous les pixels sont contrôlés, pas un échantillon ni un pourcentage arrondi.
    for(let i=3;i<rgba.length;i+=4)if(rgba[i]>0)remaining++;
    const percent=Math.floor(100*(W*H-remaining)/(W*H));
    status.textContent='Zone grattée : '+percent+' %';
    if(percent>=95)reveal();
    else if(Math.floor(percent/25)>lastMilestone){lastMilestone=Math.floor(percent/25);vibrate(18);}
  }
  canvas.addEventListener('pointerdown',e=>{if(!ready||finished||pointer!==null)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);last=point(e);unlockAudio();loadRecipient();scratch(last,last);scratchEffect(e);check();});
  canvas.addEventListener('pointermove',e=>{if(finished||pointer!==e.pointerId)return;e.preventDefault();const p=point(e);loadRecipient();scratch(last,p);scratchEffect(e);last=p;check();});
  function stop(e){if(pointer===e.pointerId){pointer=null;last=null;check();}}
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
}

async function gift(key) {
  try {
    const d = await request('/api/gift/' + encodeURIComponent(key));
    applyTheme(d.theme);
    const alreadyRevealed = Boolean(d.drawn && d.revealedAt);
    card(`<h2 class="center">Bonjour ${esc(d.giver)} !</h2>
      <p class="center muted">${esc(d.title)}</p>
      <div class="wishlist-panel gift-theme-panel"><h3>Thème des cadeaux</h3><p class="wish-text">${esc(d.giftTheme || 'Libre – laisse parler ton imagination !')}</p></div>
      ${d.drawn ? `<p class="center muted ticket-intro">${alreadyRevealed ? 'Tu as déjà découvert ton destinataire.' : 'Gratte la zone centrale du ticket pour découvrir ton destinataire.'}</p>
        <div class="scratch-ticket poster-ticket ${alreadyRevealed ? 'is-revealed' : ''}" id="scratchTicket">
          <img src="/ticket-avant-decouverte.png" alt="Ticket à gratter de Noël" class="scratch-poster">
          <div class="scratch-prize scratch-prize-balloon-zone"><span>TON DESTINATAIRE SECRET</span><strong id="recipientName">${alreadyRevealed?esc(d.recipient):''}</strong><span class="scratch-sparkles" aria-hidden="true">✦ ✦ ✦</span></div>
          ${alreadyRevealed ? '' : '<canvas id="scratchCanvas" class="scratch-cover" aria-label="Ticket à gratter : glisse ton doigt ou ta souris pour révéler le prénom"></canvas>'}
        </div>
        ${alreadyRevealed ? '' : '<p class="small center" id="scratchStatus" role="status">Chargement du ticket…</p>'}
        ${alreadyRevealed ? '' : '<button type="button" class="scratch-access" id="revealWithoutScratch">Révéler sans gratter</button>'}
        <div id="recipientWishes" class="wishlist-panel" ${alreadyRevealed ? '' : 'hidden'}><h3 id="recipientWishTitle">🎁 Les envies${alreadyRevealed?' de '+esc(d.recipient):''}</h3><p id="recipientWishText" class="wish-text">${esc(d.recipientWishlist || 'Aucune idée de cadeau renseignée pour le moment.')}</p></div>`
      : '<div class="notice center waiting-notice"><div class="waiting-icon" aria-hidden="true">⏳</div><div>Le tirage n’a pas encore eu lieu.<br>Reviens bientôt avec ce même lien.</div></div>'}
      <div class="detail"><span>Budget maximum</span><strong>${money(d.budget)}</strong></div>
      <div class="detail"><span>Date de remise</span><strong>${esc(formatDate(d.date))}</strong></div>
      <div class="wishlist-panel"><h3>✏️ Ma liste de souhaits</h3><p class="small">Note des idées de cadeaux. La personne qui doit t’offrir un cadeau pourra les consulter avec son propre lien.</p>
        <label for="wishlist">Mes envies (1500 caractères maximum)</label><textarea id="wishlist" maxlength="1500" rows="4" placeholder="Livres, jeux, gourmandises, surprises…">${esc(d.wishlist)}</textarea>
        <button id="saveWishlist" class="secondary" type="button">Enregistrer mes souhaits</button><p id="wishMessage" class="small" role="status"></p>
      </div><p class="small center">🤫 Garde ton destinataire secret jusqu’à l’échange !</p>`);
    if (d.drawn && !alreadyRevealed) setupScratch(key, result => {
      document.getElementById('recipientName').textContent=result.recipient;
      document.getElementById('recipientWishTitle').textContent='🎁 Les envies de '+result.recipient;
      document.getElementById('recipientWishText').textContent=result.recipientWishlist||'Aucune idée de cadeau renseignée pour le moment.';
      document.getElementById('recipientWishes').hidden=false;
    });
    document.getElementById('saveWishlist').onclick = async () => {
      const btn = document.getElementById('saveWishlist'); btn.disabled = true;
      const status = document.getElementById('wishMessage'); status.textContent = 'Enregistrement…';
      try {
        await request('/api/gift/' + encodeURIComponent(key), { method:'PATCH', body:JSON.stringify({ wishlist:document.getElementById('wishlist').value }) });
        status.textContent = '✓ Souhaits enregistrés !';
      } catch (e) { status.textContent = e.message; }
      finally { btn.disabled = false; }
    };
  } catch (err) {
    card('<h2>Lien privé indisponible</h2><p class="error">' + esc(err.message) + '</p>');
  }
}

const parts = location.pathname.split('/').filter(Boolean);
if (parts[0] === 'organize' && parts[1]) organize(parts[1]);
else if (parts[0] === 'gift' && parts[1]) gift(parts[1]);
else home();
