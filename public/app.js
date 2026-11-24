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
function applyTheme(theme) { document.body.dataset.theme = ['foret','rouge','nuit'].includes(theme) ? theme : 'foret'; }

const MOTIF_AMBIENCE = {
  foret:['🌲','🍃','✨'], hiver:['❄️','🧊','✨'], dore:['⭐','✨','💫'],
  nuit:['✨','🌟','🌙'], gourmand:['🍬','✨','🍪'], fete:['🎉','🎊','✨']
};
function personalizedDecor(emoji, style) {
  const family = Object.hasOwn(MOTIF_AMBIENCE, style) ? style : 'fete';
  document.body.dataset.emojiStyle = family;
  document.querySelector('.emblem').textContent = emoji;
  document.querySelector('.snow').textContent = emoji + '  ✧  ' + emoji + '  ✧  ' + emoji;
  document.querySelector('.emoji-sky')?.remove();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sky = document.createElement('div');
  sky.className = 'emoji-sky';
  sky.dataset.style = family;
  sky.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sky);
  const motifs = [emoji, emoji, ...MOTIF_AMBIENCE[family]];
  for (let i = 0; i < 18; i++) {
    const item = document.createElement('span');
    item.textContent = motifs[i % motifs.length];
    item.style.left = (Math.random() * 100) + '%';
    item.style.animationDelay = (-Math.random() * 18) + 's';
    item.style.animationDuration = (11 + Math.random() * 12) + 's';
    item.style.fontSize = (14 + Math.random() * 14) + 'px';
    sky.appendChild(item);
  }
}
function celebrate(emoji='🎁', style='fete') {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const colors = ['#d3ad4d','#b53949','#237654','#f5e8c3','#8cbfda'];
  for (let i = 0; i < 80; i++) {
    const bit = document.createElement('i');
    bit.style.left = (Math.random() * 100) + '%';
    bit.style.animationDelay = (Math.random() * .7) + 's';
    bit.style.animationDuration = (2 + Math.random() * 2) + 's';
    if (i % 4 === 0) {
      bit.className = 'motif-confetti';
      bit.textContent = i % 8 === 0 ? emoji : (MOTIF_AMBIENCE[style]?.[i % 3] || '✨');
    } else {
      bit.style.background = colors[i % colors.length];
    }
    layer.appendChild(bit);
  }
  setTimeout(() => layer.remove(), 5000);
}
function snowfall() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'snowfall';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  for (let i = 0; i < 24; i++) {
    const flake = document.createElement('span');
    flake.textContent = '❄';
    flake.style.left = (Math.random() * 100) + '%';
    flake.style.animationDelay = (-Math.random() * 12) + 's';
    flake.style.animationDuration = (8 + Math.random() * 8) + 's';
    flake.style.fontSize = (9 + Math.random() * 13) + 'px';
    layer.appendChild(flake);
  }
}
snowfall();

function home() {
  let names = [];
  let exclusions = new Set();
  card(`<h2>Organise ton échange 🎄</h2>
    <p class="hint">Crée ton événement, puis invite les amis avant le tirage. Chacun recevra une décoration personnalisée, discrète et festive.</p>
    <form id="eventForm">
      <label for="title">Nom de l'événement</label><input id="title" maxlength="100" value="Le Noël des copains" required>
      <div class="row"><div><label for="budget">Budget maximum (€)</label><input id="budget" type="number" min="0" max="100000" step="0.01" value="25" required></div><div><label for="date">Date de remise (facultatif)</label><input id="date" type="date"></div></div>
      <label for="theme">Ambiance de Noël</label><select id="theme"><option value="foret">🌲 Forêt traditionnelle</option><option value="rouge">🎄 Rouge & or</option><option value="nuit">🌙 Nuit étoilée</option></select>
      <label for="name">Participants</label><div id="names"></div>
      <div class="add"><input id="name" maxlength="60" placeholder="Prénom d'un ami" autocomplete="off"><button id="add" class="secondary" type="button">+ Ajouter</button></div>
      <p class="small">2 à 50 personnes. Chaque participant recevra un emoji de Noël différent après la création.</p>
      <section id="exclusionSettings" class="exclusion-settings"><h3>❤️ Exclusions entre participants</h3><p class="small">Choisis deux personnes : elles ne pourront pas se tirer l'une l'autre.</p>
        <div class="exclusion-picker"><div><label for="exclusionA">Participant 1</label><select id="exclusionA"></select></div><div><label for="exclusionB">Participant 2</label><select id="exclusionB"></select></div></div>
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
    [...exclusions].forEach(pair => {
      const [a, b] = pair.split(':').map(Number);
      const row = document.createElement('div'); row.className = 'exclusion-item';
      const label = document.createElement('span'); label.textContent = '🚫 ' + names[a] + ' ↔ ' + names[b];
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Retirer';
      remove.onclick = () => { exclusions.delete(pair); renderExclusions(); };
      row.append(label, remove); wrap.appendChild(row);
    });
  }
  document.getElementById('addExclusion').onclick = () => {
    const a = document.getElementById('exclusionA').value, b = document.getElementById('exclusionB').value;
    if (a === '' || b === '') return message('Sélectionne deux participants pour créer une exclusion.');
    if (a === b) return message('Choisis deux participants différents.');
    const [i, j] = [Number(a), Number(b)].sort((x, y) => x - y), pair = i + ':' + j;
    if (exclusions.has(pair)) return message('Cette exclusion existe déjà.');
    exclusions.add(pair); message(''); renderExclusions();
    document.getElementById('exclusionA').value = ''; document.getElementById('exclusionB').value = '';
  };
  document.getElementById('theme').onchange = e => applyTheme(e.target.value);
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
        theme:document.getElementById('theme').value,
        exclusions:[...exclusions].flatMap(k => { const [i, j] = k.split(':').map(Number); return [[i, j], [j, i]]; })
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
    emoji: person.emoji || '🎁',
    evenement: event.title,
    budget: money(event.budget),
    date: formatDate(event.date),
    lien: location.origin + person.path
  };
  return template.replace(/\{(prenom|emoji|evenement|budget|date|lien)\}/g, (_, key) => values[key]);
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
    card(`<h2>${esc(data.title)}</h2>
      <p class="hint">Espace organisateur · ${data.participants.length} participants</p>
      <div class="detail"><span>Budget</span><strong>${money(data.budget)}</strong></div>
      <div class="detail"><span>Remise des cadeaux</span><strong>${esc(formatDate(data.date))}</strong></div>
      <div class="notice">🎨 Thème : ${esc(themeNames[data.theme] || 'Forêt')} · Exclusions : ${Math.floor((data.exclusions || []).length / 2)} paire(s).</div>
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
        <p class="small">Variables disponibles : <code>{prenom}</code> <code>{emoji}</code> <code>{evenement}</code> <code>{budget}</code> <code>{date}</code> <code>{lien}</code>. Garde impérativement <code>{lien}</code> dans le texte.</p>
        <label for="messageTemplate">Message personnalisé</label><textarea id="messageTemplate" rows="8" maxlength="1800">${esc(data.message)}</textarea>
        <button id="saveMessages" type="button" class="secondary message-save">Enregistrer le message</button>
        <p id="messageSaveStatus" class="small" role="status">Le message actuel est enregistré.</p>
        <div class="preview-panel"><div class="section-heading"><h3>Prévisualisation</h3><span class="small">Message tel qu'il sera envoyé</span></div>
          <div class="preview-controls one-col"><div><label for="previewPerson">Destinataire</label><select id="previewPerson">${data.participants.map((p, i) => `<option value="${i}">${esc(p.emoji)} ${esc(p.name)}</option>`).join('')}</select></div></div>
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
      const name = document.createElement('strong'); name.textContent = p.emoji + '  ' + p.name;
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
        (t.match(/\{[^{}]*\}/g) || []).every(tag => ['{prenom}','{emoji}','{evenement}','{budget}','{date}','{lien}'].includes(tag));
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

function setupScratch(key, onRevealed, revealEmoji, revealStyle) {
  const canvas = document.getElementById('scratchCanvas');
  const surface = document.getElementById('scratchTicket');
  const status = document.getElementById('scratchStatus');
  const skip = document.getElementById('revealWithoutScratch');
  if (!canvas || !surface) return;
  const ctx = canvas.getContext('2d', { willReadFrequently:true });
  let finished = false, active = false, last = null, moves = 0;
  async function reveal() {
    if (finished) return;
    finished = true; active = false;
    status.textContent = 'Enregistrement de ta découverte…';
    skip.disabled = true; canvas.style.pointerEvents = 'none';
    try {
      await request('/api/gift/' + encodeURIComponent(key) + '/reveal', { method:'POST' });
      surface.classList.add('is-revealed');
      status.textContent = '🎉 Ton ticket est découvert et le restera à ta prochaine visite !';
      skip.hidden = true; celebrate(revealEmoji, revealStyle); onRevealed();
      window.setTimeout(() => { if (canvas.isConnected) canvas.hidden = true; }, 850);
    } catch (err) {
      finished = false; skip.disabled = false; skip.hidden = false;
      skip.textContent = 'Réessayer l’enregistrement'; canvas.style.pointerEvents = 'auto';
      status.textContent = '⚠️ Ta découverte n’a pas été enregistrée. Réessaie pour la conserver : ' + err.message;
    }
  }
  skip.addEventListener('click', reveal);
  if (!ctx) {
    canvas.hidden = true; status.textContent = 'Utilise le bouton pour révéler ton destinataire.'; skip.textContent = 'Révéler mon destinataire'; return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = surface.clientWidth, h = surface.clientHeight;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);

  function drawFallback() {
    const metallic = ctx.createLinearGradient(0, 0, w, h);
    metallic.addColorStop(0, '#a8b6b2'); metallic.addColorStop(.23, '#e5ebe4');
    metallic.addColorStop(.49, '#a1aaa7'); metallic.addColorStop(.74, '#d6dfd9'); metallic.addColorStop(1, '#a8b5ae');
    ctx.fillStyle = metallic; ctx.fillRect(0, 0, w, h);
    for (let x = -h; x < w + h; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.24)'; ctx.stroke(); }
  }
  const scratchZone = {
    x: w * 0.065,
    y: h * 0.285,
    width: w * 0.83,
    height: h * 0.445,
    radius: 20
  };
  function drawCoverVisual() {
    ctx.clearRect(0, 0, w, h);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(w / img.width, h / img.height);
      const sw = img.width * scale, sh = img.height * scale;
      const dx = (w - sw) / 2, dy = (h - sh) / 2;
      ctx.drawImage(img, dx, dy, sw, sh);
    };
    img.onerror = drawFallback;
    img.src = '/ticket-avant-decouverte.png';
  }
  drawCoverVisual();

  function point(e) { const r = canvas.getBoundingClientRect(); return { x:(e.clientX - r.left) * w / r.width, y:(e.clientY - r.top) * h / r.height }; }
  function isInScratchZone(p) {
    return p.x >= scratchZone.x && p.x <= scratchZone.x + scratchZone.width && p.y >= scratchZone.y && p.y <= scratchZone.y + scratchZone.height;
  }
  function scratch(a, b) {
    ctx.save();
    roundRect(ctx, scratchZone.x, scratchZone.y, scratchZone.width, scratchZone.height, scratchZone.radius);
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = '#000'; ctx.lineWidth = 42;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x, b.y, 21, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  }
  function check() {
    if (finished) return;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let transparent = 0, total = 0;
    const step = 14;
    const startX = Math.round(scratchZone.x * canvas.width / w);
    const endX = Math.round((scratchZone.x + scratchZone.width) * canvas.width / w);
    const startY = Math.round(scratchZone.y * canvas.height / h);
    const endY = Math.round((scratchZone.y + scratchZone.height) * canvas.height / h);
    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        total++;
        if (pixels[(y * canvas.width + x) * 4 + 3] < 110) transparent++;
      }
    }
    if (transparent / total >= .38) reveal(); else status.textContent = 'Continue de gratter pour découvrir le prénom…';
  }
  canvas.addEventListener('pointerdown', e => {
    if (finished) return;
    const p = point(e);
    if (!isInScratchZone(p)) return;
    e.preventDefault(); active = true; last = p; canvas.setPointerCapture(e.pointerId); scratch(last, last);
  });
  canvas.addEventListener('pointermove', e => {
    if (!active || finished) return;
    e.preventDefault(); const p = point(e); scratch(last, p); last = p; moves++; if (moves % 12 === 0) check();
  });
  const stop = () => { if (active) { active = false; last = null; check(); } };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop); canvas.addEventListener('lostpointercapture', stop);
}
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

async function gift(key) {
  try {
    const d = await request('/api/gift/' + encodeURIComponent(key));
    applyTheme(d.theme);
    personalizedDecor(d.emoji, d.emojiStyle);
    const alreadyRevealed = Boolean(d.drawn && d.revealedAt);
    const revealEmoji = d.recipientEmoji || d.emoji;
    const revealStyle = d.recipientEmojiStyle || d.emojiStyle;
    card(`<div class="identity-banner"><div class="identity-orb" aria-hidden="true">${esc(d.emoji)}</div><div class="identity-label">Décoration personnalisée <strong>${esc(d.giver)}</strong></div></div><h2 class="center">Bonjour ${esc(d.giver)} !</h2>
      <p class="center muted">${esc(d.title)}</p>
      ${d.drawn ? `<p class="center">${alreadyRevealed ? 'Tu as déjà découvert ton destinataire !' : 'Ton destinataire se cache dans les ballons. Gratte pour le découvrir !'}</p>
        <div class="scratch-ticket poster-ticket ${alreadyRevealed ? 'is-revealed' : ''}" id="scratchTicket">
          <img src="/ticket-avant-decouverte.png" alt="Ticket à gratter avant découverte" class="scratch-poster">
          <div class="scratch-prize scratch-prize-balloon-zone"><span>TON DESTINATAIRE SECRET</span><strong>${esc(d.recipient)}</strong><span class="scratch-sparkles" aria-hidden="true">${esc(revealEmoji)} ✨ ${esc(revealEmoji)}</span></div>
          ${alreadyRevealed ? '' : '<canvas id="scratchCanvas" class="scratch-cover" aria-label="Ticket à gratter : glisse ton doigt ou ta souris pour révéler le prénom"></canvas>'}
        </div>
        <p class="small center" id="scratchStatus" role="status">${alreadyRevealed ? '✓ Ticket déjà découvert : aucun nouveau grattage nécessaire.' : 'Glisse ton doigt ou ta souris sur les ballons.'}</p>
        ${alreadyRevealed ? '' : '<button type="button" class="scratch-access" id="revealWithoutScratch">Révéler sans gratter</button>'}
        <div id="recipientWishes" class="wishlist-panel" ${alreadyRevealed ? '' : 'hidden'}><h3>🎁 Les envies de ${esc(revealEmoji)} ${esc(d.recipient)}</h3><p id="recipientWishText" class="wish-text">${esc(d.recipientWishlist || 'Aucune idée de cadeau renseignée pour le moment.')}</p></div>`
      : '<div class="notice center">Le tirage n’a pas encore eu lieu. Reviens bientôt avec ce même lien.</div>'}
      <div class="detail"><span>Budget maximum</span><strong>${money(d.budget)}</strong></div>
      <div class="detail"><span>Date de remise</span><strong>${esc(formatDate(d.date))}</strong></div>
      <div class="wishlist-panel"><h3>✏️ Ma liste de souhaits</h3><p class="small">Note des idées de cadeaux. La personne qui doit t’offrir un cadeau pourra les consulter avec son propre lien.</p>
        <label for="wishlist">Mes envies (1500 caractères maximum)</label><textarea id="wishlist" maxlength="1500" rows="4" placeholder="Livres, jeux, gourmandises, surprises…">${esc(d.wishlist)}</textarea>
        <button id="saveWishlist" class="secondary" type="button">Enregistrer mes souhaits</button><p id="wishMessage" class="small" role="status"></p>
      </div><p class="small center">🤫 Garde ton destinataire secret jusqu’à l’échange !</p>`);
    if (d.drawn && !alreadyRevealed) setupScratch(key, () => { document.getElementById('recipientWishes').hidden = false; }, revealEmoji, revealStyle);
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
