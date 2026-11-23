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
function eventTheme(e){return THEMES.includes(e.theme)?e.theme:'foret';}
function wishlistValue(p){return typeof p.wishlist==='string'?p.wishlist:'';}
function validDate(value) {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function organizerView(e) {
  return {
    title: e.title, budget: e.budget, date: e.date, drawn: e.drawn, theme: eventTheme(e), exclusions: e.exclusions || [],
    participants: e.participants.map(p => ({ name: p.name, path: '/gift/' + p.token }))
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
      const key = id(), organizerToken = token();
      events[key] = { title, budget, date, theme, exclusions: uniqueExclusions, organizerToken, drawn: false, participants: names.map(name => ({ name, token: token(), recipient: null, wishlist: '' })) };
      save();
      return send(res, 201, { organizerPath: '/organize/' + organizerToken });
    }
    const orgMatch = pathname.match(/^\/api\/organize\/([A-Za-z0-9_-]+)(\/draw)?$/);
    if (orgMatch) {
      const e = Object.values(events).find(x => x.organizerToken === orgMatch[1]);
      if (!e) return error(res, 404, 'Événement introuvable.');
      if (req.method === 'GET' && !orgMatch[2]) return send(res, 200, organizerView(e));
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
    const giftMatch = pathname.match(/^\/api\/gift\/([A-Za-z0-9_-]+)$/);
    if (giftMatch && (req.method === 'GET' || req.method === 'PATCH')) {
      for (const e of Object.values(events)) {
        const p = e.participants.find(p => p.token === giftMatch[1]);
        if (!p) continue;
        if (req.method === 'PATCH') {
          const body = await readJSON(req);
          if(typeof body.wishlist !== 'string' || body.wishlist.length>1500)return error(res,400,'Liste de souhaits limitée à 1500 caractères.');
          p.wishlist=body.wishlist.trim();save();
          return send(res,200,{wishlist:p.wishlist});
        }
        return send(res, 200, {
          title:e.title,budget:e.budget,date:e.date,theme:eventTheme(e),giver:p.name,drawn:e.drawn,
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
