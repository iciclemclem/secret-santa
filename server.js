'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DATA_FILE = path.join(DATA_DIR, 'events.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', { mode: 0o600, flag: 'wx' });
let events = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const token = () => crypto.randomBytes(32).toString('base64url');
const id = () => crypto.randomUUID();
function save() {
  const tmp = DATA_FILE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(events, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DATA_FILE);
}
function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function error(res, status, message) { send(res, status, { error: message }); }
function readJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 30_000) { reject(new Error('Requête trop volumineuse.')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('JSON invalide.')); } });
    req.on('error', reject);
  });
}
function randInt(max) { return crypto.randomInt(max); }
function assignment(n, exclusions = []) {
  // Randomized bipartite matching: every giver has a unique recipient.
  // Unlike retries of a simple shuffle, this detects impossible rules reliably.
  const forbidden = new Set(exclusions.map(([from, to]) => `${from}:${to}`));
  const order = Array.from({length:n}, (_,i)=>i);
  const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=randInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a; };
  const candidates=order.map(i=>shuffle(order.filter(j=>j!==i&&!forbidden.has(`${i}:${j}`))));
  if(candidates.some(a=>a.length===0)) return null;
  const recipients=Array(n).fill(-1);
  function augment(giver, seen){
    for(const recipient of candidates[giver]){
      if(seen.has(recipient))continue;
      seen.add(recipient);
      if(recipients[recipient]===-1||augment(recipients[recipient],seen)){
        recipients[recipient]=giver;return true;
      }
    }
    return false;
  }
  const shuffledGivers=shuffle([...order]);
  if(!shuffledGivers.every(g=>augment(g,new Set())))return null;
  const result=Array(n);
  recipients.forEach((giver,recipient)=>{result[giver]=recipient;});
  return result;
}
const THEMES = ['foret','rouge','nuit'];
// Identités de Noël uniques au sein d'un événement (50 participants maximum).
// Chaque identité détermine également sa palette et les particules décoratives.
const FESTIVE_ICONS = [
  ['🎅','fete'],['🤶','fete'],['🧑‍🎄','fete'],['🎄','foret'],['🌲','foret'],
  ['🎁','fete'],['🎀','fete'],['🔔','dore'],['🛎️','dore'],['🦌','foret'],
  ['🛷','hiver'],['❄️','hiver'],['☃️','hiver'],['⛄','hiver'],['🌨️','hiver'],
  ['🧊','hiver'],['🧣','hiver'],['🧤','hiver'],['🧦','fete'],['🕯️','dore'],
  ['⭐','dore'],['🌟','dore'],['✨','dore'],['💫','nuit'],['🌠','nuit'],
  ['🌙','nuit'],['🌌','nuit'],['🎇','nuit'],['🎆','nuit'],['🔥','dore'],
  ['🪵','foret'],['🏠','foret'],['🏡','foret'],['🐧','hiver'],['🐻‍❄️','hiver'],
  ['🦉','foret'],['🦊','foret'],['🐿️','foret'],['🐇','hiver'],['🕊️','hiver'],
  ['🍪','gourmand'],['🍬','gourmand'],['🍭','gourmand'],['🍫','gourmand'],['🍩','gourmand'],
  ['🧁','gourmand'],['🎂','gourmand'],['🥧','gourmand'],['☕','gourmand'],['🫖','gourmand'],
  ['🥛','gourmand'],['🍰','gourmand'],['🎉','fete'],['🎊','fete'],['🎶','fete'],
  ['🎵','fete'],['🎼','fete'],['🧸','fete'],['🧩','fete'],['🪁','fete']
];
const DEFAULT_MESSAGES = Object.freeze({
  before: 'Coucou {prenom} {emoji} ! 🎄\n\nTu participes à « {evenement} » !\nBudget : {budget}\nDate : {date}\n\nVoici ton lien personnel : {lien}\n\nTu peux déjà compléter ta liste de souhaits. Le tirage arrive bientôt ! 🤫',
  after: 'Coucou {prenom} {emoji} ! 🎁\n\nLe tirage de « {evenement} » a eu lieu !\nBudget : {budget}\nDate : {date}\n\nVoici ton lien personnel : {lien}\n\nGratte ton ticket pour découvrir à qui offrir un cadeau ! Garde ton lien secret. 🤫'
});
const MESSAGE_TAGS = new Set(['prenom','emoji','evenement','budget','date','lien']);
function eventMessages(e){
  return {
    before: typeof e.messages?.before === 'string' ? e.messages.before : DEFAULT_MESSAGES.before,
    after: typeof e.messages?.after === 'string' ? e.messages.after : DEFAULT_MESSAGES.after
  };
}
function validTemplate(t){
  if(typeof t !== 'string' || t.trim().length < 10 || t.length > 1800 || !t.includes('{lien}'))return false;
  const tags = t.match(/\{[^{}]*\}/g) || [];
  return tags.every(tag => MESSAGE_TAGS.has(tag.slice(1,-1)));
}
function participantIdentity(p,index){
  const matched = FESTIVE_ICONS.find(([emoji])=>emoji===p.emoji);
  const [emoji,style] = matched || FESTIVE_ICONS[index % FESTIVE_ICONS.length];
  return { emoji, emojiStyle:style };
}
function pickIdentities(n){
  const pool = [...FESTIVE_ICONS];
  for(let i=pool.length-1;i>0;i--){const j=randInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,n);
}
function eventTheme(e){return THEMES.includes(e.theme)?e.theme:'foret';}
function wishlistValue(p){return typeof p.wishlist==='string'?p.wishlist:'';}
function revelationDate(p){return typeof p.revealedAt === 'string' && !Number.isNaN(Date.parse(p.revealedAt)) ? p.revealedAt : null;}
function validDate(value) {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function organizerView(e) {
  return {
    title: e.title, budget: e.budget, date: e.date, drawn: e.drawn, theme: eventTheme(e), exclusions: e.exclusions || [],
    messages: eventMessages(e),
    participants: e.participants.map((p,i) => ({ name: p.name, path: '/gift/' + p.token,
      ...participantIdentity(p,i), revealedAt: revelationDate(p) }))
  };
}
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
function serveStatic(res, urlPath) {
  const filename = urlPath === '/app.js' ? 'app.js' : urlPath === '/style.css' ? 'style.css' : 'index.html';
  const contents = fs.readFileSync(path.join(PUBLIC_DIR, filename));
  res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filename)], 'Cache-Control': 'no-store' });
  res.end(contents);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    if (req.method === 'POST' && pathname === '/api/events') {
      const body = await readJSON(req);
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const budget = Number(body.budget);
      const date = typeof body.date === 'string' ? body.date : '';
      const names = Array.isArray(body.names) ? body.names.map(x => typeof x === 'string' ? x.trim() : '') : [];
      if (!title || title.length > 100) return error(res, 400, 'Donne un nom à ton événement (100 caractères maximum).');
      if (names.length < 2 || names.length > 50 || names.some(n => !n || n.length > 60)) return error(res, 400, 'Entre 2 et 50 prénoms valides sont nécessaires.');
      if (new Set(names.map(n => n.toLocaleLowerCase('fr'))).size !== names.length) return error(res, 400, 'Les prénoms doivent être distincts. Ajoute une initiale si nécessaire.');
      if (!Number.isFinite(budget) || budget < 0 || budget > 100000) return error(res, 400, 'Budget invalide.');
      if (!validDate(date)) return error(res, 400, 'Date invalide.');
      const theme = body.theme === undefined ? 'foret' : body.theme;
      if(!THEMES.includes(theme))return error(res,400,'Thème invalide.');
      const exclusions = body.exclusions === undefined ? [] : body.exclusions;
      if(!Array.isArray(exclusions)||exclusions.length>2500 || exclusions.some(p => !Array.isArray(p)||p.length!==2||p.some(v=>!Number.isInteger(v)||v<0||v>=names.length)))return error(res,400,'Exclusions invalides.');
      const uniqueExclusions=[...new Map(exclusions.map(p=>[p.join(':'),p])).values()];
      if(!assignment(names.length, uniqueExclusions))return error(res,400,'Ces exclusions rendent le tirage impossible. Assouplis certaines règles.');
      const key = id(), organizerToken = token(), identities = pickIdentities(names.length);
      events[key] = { title, budget, date, theme, exclusions: uniqueExclusions, organizerToken, drawn: false,
        messages: { ...DEFAULT_MESSAGES },
        participants: names.map((name,i) => ({ name, token: token(), recipient: null, wishlist: '', revealedAt: null, emoji: identities[i][0] })) };
      save();
      return send(res, 201, { organizerPath: '/organize/' + organizerToken });
    }
    const orgMatch = pathname.match(/^\/api\/organize\/([A-Za-z0-9_-]+)(\/draw|\/messages)?$/);
    if (orgMatch) {
      const e = Object.values(events).find(x => x.organizerToken === orgMatch[1]);
      if (!e) return error(res, 404, 'Événement introuvable.');
      if (req.method === 'GET' && !orgMatch[2]) return send(res, 200, organizerView(e));
      if (req.method === 'PATCH' && orgMatch[2] === '/messages') {
        const body = await readJSON(req);
        if (!body || typeof body !== 'object' || !validTemplate(body.before) || !validTemplate(body.after)) {
          return error(res,400,'Chaque message doit contenir {lien}, utiliser des variables reconnues et compter entre 10 et 1800 caractères.');
        }
        e.messages={before:body.before.trim(),after:body.after.trim()};
        save();
        return send(res,200,{messages:eventMessages(e)});
      }
      if (req.method === 'POST' && orgMatch[2]) {
        if (e.drawn) return error(res, 409, 'Le tirage a déjà été effectué.');
        const shuffled = assignment(e.participants.length, e.exclusions || []);
        if(!shuffled)return error(res,409,'Les exclusions empêchent le tirage.');
        e.participants.forEach((p, i) => { p.recipient = shuffled[i]; });
        e.drawn = true;
        save();
        return send(res, 200, organizerView(e));
      }
    }
    const giftMatch = pathname.match(/^\/api\/gift\/([A-Za-z0-9_-]+)(\/reveal)?$/);
    if (giftMatch && (req.method === 'GET' || req.method === 'PATCH' || req.method === 'POST')) {
      for (const e of Object.values(events)) {
        const participantIndex = e.participants.findIndex(p => p.token === giftMatch[1]);
        if (participantIndex < 0) continue;
        const p = e.participants[participantIndex];
        if (req.method === 'POST' && giftMatch[2] === '/reveal') {
          if (!e.drawn) return error(res, 409, 'Le tirage n’a pas encore eu lieu.');
          // Idempotent : une fois le ticket découvert, la date ne change jamais.
          if (!revelationDate(p)) { p.revealedAt = new Date().toISOString(); save(); }
          return send(res, 200, { revealedAt: revelationDate(p) });
        }
        if (giftMatch[2] || (req.method !== 'GET' && req.method !== 'PATCH')) return error(res, 405, 'Méthode non autorisée.');
        if (req.method === 'PATCH') {
          const body = await readJSON(req);
          if(typeof body.wishlist !== 'string' || body.wishlist.length>1500)return error(res,400,'Liste de souhaits limitée à 1500 caractères.');
          p.wishlist=body.wishlist.trim();save();
          return send(res,200,{wishlist:p.wishlist});
        }
        return send(res, 200, {
          title:e.title,budget:e.budget,date:e.date,theme:eventTheme(e),giver:p.name,
          ...participantIdentity(p,participantIndex),drawn:e.drawn,revealedAt:revelationDate(p),
          wishlist:wishlistValue(p),
          recipient:e.drawn?e.participants[p.recipient].name:null,
          recipientWishlist:e.drawn?wishlistValue(e.participants[p.recipient]):''
        });
      }
      return error(res,404,'Lien individuel introuvable.');
    }
    if (req.method === 'GET' && (pathname === '/' || pathname === '/app.js' || pathname === '/style.css' || /^\/(organize|gift)\/[A-Za-z0-9_-]+$/.test(pathname))) {
      return serveStatic(res, pathname);
    }
    return error(res, 404, 'Page introuvable.');
  } catch (err) {
    console.error(err);
    return error(res, err.message === 'JSON invalide.' ? 400 : 500, err.message === 'JSON invalide.' ? err.message : 'Une erreur est survenue.');
  }
});
server.listen(PORT, HOST, () => console.log(`Secret Santa disponible sur http://${HOST}:${PORT}`));
