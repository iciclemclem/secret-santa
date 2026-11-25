'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DATA_FILE = path.join(DATA_DIR, 'events.json');
const PHOTO_DIR = path.join(DATA_DIR, 'photos');
const MAX_PHOTO_BYTES = 100_000;
const PUBLIC_DIR = path.join(__dirname, 'public');

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
fs.mkdirSync(PHOTO_DIR, { recursive: true, mode: 0o700 });
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
function readJSON(req, limit = 40_000) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0, tooLarge = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { tooLarge = true; chunks.length = 0; }
      else if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return reject(new Error('Requête trop volumineuse.'));
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('JSON invalide.')); }
    });
    req.on('error', reject);
    req.on('aborted', () => reject(new Error('Requête interrompue.')));
  });
}
// Le navigateur exporte uniquement le carré JPEG recadré. Pas de SVG ni de fichier original.
function decodePhoto(value) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 133_360 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw Error('Photo invalide.');
  const bytes = Buffer.from(value.slice(23), 'base64');
  if (bytes.length < 20 || bytes.length > MAX_PHOTO_BYTES || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length-2] !== 255 || bytes[bytes.length-1] !== 217) throw Error('Photo invalide.');
  // Vérification des dimensions JPEG dans le segment SOF.
  let i=2, square=false;
  while(i+4<bytes.length && bytes[i]===255){
    while(bytes[i]===255)i++;
    const marker=bytes[i++];
    if(marker===218||marker===217)break;
    const len=bytes.readUInt16BE(i);
    if(len<2||i+len>bytes.length)break;
    if([192,193,194].includes(marker)){
      if(len<8||bytes.readUInt16BE(i+3)!==512||bytes.readUInt16BE(i+5)!==512)throw Error('La photo doit être recadrée en 512 × 512.');
      square=true;break;
    }
    i+=len;
  }
  if(!square)throw Error('Photo JPEG invalide.');
  return bytes;
}
function recipientPhoto(p) {
  if (!p || typeof p.photoId !== 'string' || !/^[a-f0-9-]{36}$/.test(p.photoId)) return null;
  try { const bytes=fs.readFileSync(path.join(PHOTO_DIR,p.photoId+'.jpg')); return 'data:image/jpeg;base64,'+bytes.toString('base64'); }
  catch { return null; } // Une photo manquante ne bloque jamais la révélation du nom.
}
function randInt(max) { return crypto.randomInt(max); }
function assignment(n, exclusions = []) {
  const forbidden = new Set(exclusions.map(([from, to]) => `${from}:${to}`));
  const order = Array.from({ length: n }, (_, i) => i);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const candidates = order.map(i => shuffle(order.filter(j => j !== i && !forbidden.has(`${i}:${j}`))));
  if (candidates.some(a => a.length === 0)) return null;
  const recipients = Array(n).fill(-1);
  function augment(giver, seen) {
    for (const recipient of candidates[giver]) {
      if (seen.has(recipient)) continue;
      seen.add(recipient);
      if (recipients[recipient] === -1 || augment(recipients[recipient], seen)) {
        recipients[recipient] = giver;
        return true;
      }
    }
    return false;
  }
  const shuffledGivers = shuffle([...order]);
  if (!shuffledGivers.every(g => augment(g, new Set()))) return null;
  const result = Array(n);
  recipients.forEach((giver, recipient) => { result[giver] = recipient; });
  return result;
}

const THEMES = ['foret', 'rouge', 'nuit'];
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
const DEFAULT_MESSAGE = 'Coucou {prenom} {emoji} ! 🎄\n\nTu participes à « {evenement} » !\nBudget : {budget}\nDate : {date}\nThème des cadeaux : {theme}\n\nVoici ton lien personnel : {lien}\n\nTu peux déjà compléter ta liste de souhaits. Après le tirage, reviens sur ce même lien pour découvrir ton destinataire et gratter ton ticket. 🤫';
const MESSAGE_TAGS = new Set(['prenom', 'emoji', 'evenement', 'budget', 'date', 'lien', 'theme']);

function eventMessage(e) {
  if (typeof e.message === 'string') return e.message;
  if (typeof e.messages?.text === 'string') return e.messages.text;
  if (typeof e.messages?.after === 'string') return e.messages.after;
  if (typeof e.messages?.before === 'string') return e.messages.before;
  return DEFAULT_MESSAGE;
}
function validTemplate(t) {
  if (typeof t !== 'string' || t.trim().length < 10 || t.length > 1800 || !t.includes('{lien}')) return false;
  const tags = t.match(/\{[^{}]*\}/g) || [];
  return tags.every(tag => MESSAGE_TAGS.has(tag.slice(1, -1)));
}
function participantIdentity(p, index) {
  const matched = FESTIVE_ICONS.find(([emoji]) => emoji === p.emoji);
  const [emoji, style] = matched || FESTIVE_ICONS[index % FESTIVE_ICONS.length];
  return { emoji, emojiStyle: style };
}
function pickIdentities(n) {
  const pool = [...FESTIVE_ICONS];
  for (let i = pool.length - 1; i > 0; i--) { const j = randInt(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
}
function eventTheme(e) { return 'nuit'; }
function giftTheme(e) { return typeof e.giftTheme === 'string' ? e.giftTheme : ''; }
function wishlistValue(p) { return typeof p.wishlist === 'string' ? p.wishlist : ''; }
function revelationDate(p) { return typeof p.revealedAt === 'string' && !Number.isNaN(Date.parse(p.revealedAt)) ? p.revealedAt : null; }
function validDate(value) {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function organizerView(e) {
  return {
    title: e.title,
    budget: e.budget,
    date: e.date,
    drawn: e.drawn,
    theme: eventTheme(e),
    giftTheme: giftTheme(e),
    exclusions: e.exclusions || [],
    message: eventMessage(e),
    participants: e.participants.map((p, i) => ({
      name: p.name,
      path: '/gift/' + p.token,
      ...participantIdentity(p, i),
      revealedAt: revelationDate(p)
    }))
  };
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png'
};
function serveStatic(res, urlPath) {
  const map = {
    '/app.js': 'app.js',
    '/style.css': 'style.css',
    '/ticket-avant-decouverte.png': 'ticket-avant-decouverte.png'
  };
  const filename = map[urlPath] || 'index.html';
  const filePath = path.join(PUBLIC_DIR, filename);
  const contents = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
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
      const body = await readJSON(req, 7_000_000);
      if (!body || typeof body !== 'object') return error(res, 400, 'Requête invalide.');
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const budget = Number(body.budget);
      const date = typeof body.date === 'string' ? body.date : '';
      const names = Array.isArray(body.names) ? body.names.map(x => typeof x === 'string' ? x.trim() : '') : [];
      if (!title || title.length > 100) return error(res, 400, 'Donne un nom à ton événement (100 caractères maximum).');
      if (names.length < 2 || names.length > 50 || names.some(n => !n || n.length > 60)) return error(res, 400, 'Entre 2 et 50 prénoms valides sont nécessaires.');
      if (new Set(names.map(n => n.toLocaleLowerCase('fr'))).size !== names.length) return error(res, 400, 'Les prénoms doivent être distincts. Ajoute une initiale si nécessaire.');
      if (!Number.isFinite(budget) || budget < 0 || budget > 100000) return error(res, 400, 'Budget invalide.');
      if (!validDate(date)) return error(res, 400, 'Date invalide.');
      const theme = 'nuit';
      if (body.giftTheme !== undefined && (typeof body.giftTheme !== 'string' || body.giftTheme.length > 200)) return error(res, 400, 'Thème des cadeaux : 200 caractères maximum.');
      const giftTheme = (body.giftTheme || '').trim();
      const exclusions = body.exclusions === undefined ? [] : body.exclusions;
      if (!Array.isArray(exclusions) || exclusions.length > 2500 || exclusions.some(p => !Array.isArray(p) || p.length !== 2 || p.some(v => !Number.isInteger(v) || v < 0 || v >= names.length))) return error(res, 400, 'Exclusions invalides.');
      const uniqueExclusions = [...new Map(exclusions.map(p => [p.join(':'), p])).values()];
      if (!assignment(names.length, uniqueExclusions)) return error(res, 400, 'Ces exclusions rendent le tirage impossible. Assouplis certaines règles.');
      let photos;
      try {
        if (body.photos !== undefined && (!Array.isArray(body.photos) || body.photos.length !== names.length)) throw Error('Liste des photos invalide.');
        photos = (body.photos || names.map(() => null)).map(decodePhoto);
      } catch (err) { return error(res, 400, err.message); }
      const key = id();
      const organizerToken = token();
      const identities = pickIdentities(names.length);
      const storedPhotos = [];
      try {
      const photoIds = photos.map(bytes => {
        if (!bytes) return null;
        const photoId = id(), filename = path.join(PHOTO_DIR, photoId + '.jpg');
        storedPhotos.push(filename);
        fs.writeFileSync(filename, bytes, { mode: 0o600, flag: 'wx' });
        return photoId;
      });
      events[key] = {
        title,
        budget,
        date,
        theme,
        giftTheme,
        exclusions: uniqueExclusions,
        organizerToken,
        drawn: false,
        message: DEFAULT_MESSAGE,
        participants: names.map((name, i) => ({ name, token: token(), recipient: null, wishlist: '', revealedAt: null, emoji: identities[i][0], ...(photoIds[i] ? {photoId:photoIds[i]} : {}) }))
      };
      save();
      } catch (err) {
        delete events[key];
        for (const filename of storedPhotos) try { fs.unlinkSync(filename); } catch {}
        throw err;
      }
      return send(res, 201, { organizerPath: '/organize/' + organizerToken });
    }

    const orgMatch = pathname.match(/^\/api\/organize\/([A-Za-z0-9_-]+)(\/draw|\/messages)?$/);
    if (orgMatch) {
      const e = Object.values(events).find(x => x.organizerToken === orgMatch[1]);
      if (!e) return error(res, 404, 'Événement introuvable.');
      if (req.method === 'GET' && !orgMatch[2]) return send(res, 200, organizerView(e));
      if (req.method === 'PATCH' && orgMatch[2] === '/messages') {
        const body = await readJSON(req);
        if (!body || typeof body !== 'object' || !validTemplate(body.message)) {
          return error(res, 400, 'Le message doit contenir {lien}, utiliser des variables reconnues et compter entre 10 et 1800 caractères.');
        }
        e.message = body.message.trim();
        save();
        return send(res, 200, { message: eventMessage(e) });
      }
      if (req.method === 'POST' && orgMatch[2] === '/draw') {
        if (e.drawn) return error(res, 409, 'Le tirage a déjà été effectué.');
        const shuffled = assignment(e.participants.length, e.exclusions || []);
        if (!shuffled) return error(res, 409, 'Les exclusions empêchent le tirage.');
        e.participants.forEach((p, i) => { p.recipient = shuffled[i]; });
        e.drawn = true;
        save();
        return send(res, 200, organizerView(e));
      }
    }

    const giftMatch = pathname.match(/^\/api\/gift\/([A-Za-z0-9_-]+)(\/reveal|\/recipient)?$/);
    if (giftMatch && (req.method === 'GET' || req.method === 'PATCH' || req.method === 'POST')) {
      for (const e of Object.values(events)) {
        const participantIndex = e.participants.findIndex(p => p.token === giftMatch[1]);
        if (participantIndex < 0) continue;
        const p = e.participants[participantIndex];
        // Le premier geste charge uniquement le prénom, sans enregistrer la découverte.
        if (req.method === 'GET' && giftMatch[2] === '/recipient') {
          if (!e.drawn) return error(res, 409, 'Le tirage n’a pas encore eu lieu.');
          const recipient = e.participants[p.recipient];
          return send(res, 200, { recipient: recipient.name, recipientPhoto: recipientPhoto(recipient) });
        }
        if (req.method === 'POST' && giftMatch[2] === '/reveal') {
          if (!e.drawn) return error(res, 409, 'Le tirage n’a pas encore eu lieu.');
          if (!revelationDate(p)) { p.revealedAt = new Date().toISOString(); save(); }
          const recipient = e.participants[p.recipient];
          return send(res, 200, { revealedAt: revelationDate(p), recipient: recipient.name, recipientPhoto: recipientPhoto(recipient), recipientWishlist: wishlistValue(recipient) });
        }
        if (giftMatch[2] || (req.method !== 'GET' && req.method !== 'PATCH')) return error(res, 405, 'Méthode non autorisée.');
        if (req.method === 'PATCH') {
          const body = await readJSON(req);
          if (typeof body.wishlist !== 'string' || body.wishlist.length > 1500) return error(res, 400, 'Liste de souhaits limitée à 1500 caractères.');
          p.wishlist = body.wishlist.trim();
          save();
          return send(res, 200, { wishlist: p.wishlist });
        }
        const recipientIndex = e.drawn && revelationDate(p) ? p.recipient : null;
        const recipientParticipant = recipientIndex !== null ? e.participants[recipientIndex] : null;
        return send(res, 200, {
          title: e.title,
          budget: e.budget,
          date: e.date,
          theme: eventTheme(e),
    giftTheme: giftTheme(e),
          giver: p.name,
          ...participantIdentity(p, participantIndex),
          drawn: e.drawn,
          revealedAt: revelationDate(p),
          wishlist: wishlistValue(p),
          recipient: recipientParticipant ? recipientParticipant.name : null,
          recipientPhoto: recipientPhoto(recipientParticipant),
          recipientWishlist: recipientParticipant ? wishlistValue(recipientParticipant) : '',
          recipientEmoji: recipientParticipant ? participantIdentity(recipientParticipant, recipientIndex).emoji : null,
          recipientEmojiStyle: recipientParticipant ? participantIdentity(recipientParticipant, recipientIndex).emojiStyle : null
        });
      }
      return error(res, 404, 'Lien individuel introuvable.');
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/app.js' || pathname === '/style.css' || pathname === '/ticket-avant-decouverte.png' || /^\/(organize|gift)\/[A-Za-z0-9_-]+$/.test(pathname))) {
      return serveStatic(res, pathname);
    }
    return error(res, 404, 'Page introuvable.');
  } catch (err) {
    console.error(err);
    const status = err.message === 'Requête trop volumineuse.' ? 413 : err.message === 'JSON invalide.' ? 400 : 500;
    return error(res, status, status === 500 ? 'Une erreur est survenue.' : err.message);
  }
});

server.listen(PORT, HOST, () => console.log(`Secret Santa disponible sur http://${HOST}:${PORT}`));
