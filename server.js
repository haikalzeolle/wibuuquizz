const express = require('express'), http = require('http'), path = require('path'), fs = require('fs');
const { Server } = require('socket.io');
const app = express(), server = http.createServer(app), io = new Server(server);
const MAX = 30, TIME = 30, REVEAL = 6;
const HOST_KEY = process.env.HOST_KEY || 'changeme'; // set HOST_KEY on Render

// Flat layout: only these files are served, so questions.json (the answers) stays private.
const F = (f) => path.join(__dirname, f);
app.get('/js/:f', (q, r) => (['app.js', 'avatar.js', 'host.js'].includes(q.params.f) ? r.sendFile(F(q.params.f)) : r.sendStatus(404)));
app.get('/css/style.css', (_, r) => r.sendFile(F('style.css')));
app.get('/host', (_, r) => r.sendFile(F('host.html')));
app.get('/', (_, r) => r.sendFile(F('index.html')));

const loadQ = () => JSON.parse(fs.readFileSync(F('questions.json'), 'utf8'));
let G = { phase: 'lobby', players: {}, host: null, qi: -1, qs: [], answers: {}, timer: null, endsAt: 0 };

const hex = (s, d) => (/^#[0-9a-f]{6}$/i.test(s) ? s : d);
const pick = (s, list, d) => (list.includes(s) ? s : d);
const cleanAv = (a = {}) => ({
  key: String(a.key || 'gojo').slice(0, 12),
  hair: hex(a.hair, '#ffffff'), outfit: hex(a.outfit, '#14172b'), aura: hex(a.aura, '#60a5fa'),
  style: pick(a.style, ['spiky', 'short', 'bob', 'long'], 'spiky'),
  acc: pick(a.acc, ['none', 'blindfold', 'glasses', 'marks', 'mask'], 'none'),
});
const pub = () => Object.entries(G.players).map(([id, p]) => ({ id, name: p.name, av: p.av, score: p.score, host: false }));
const ranking = () => pub().sort((a, b) => b.score - a.score);
const lobby = () => io.emit('lobby', { players: pub(), max: MAX, phase: G.phase });
const online = () => Object.entries(G.players).filter(([, p]) => p.on);

function nextQ() {
  G.qi++;
  if (G.qi >= G.qs.length) { G.phase = 'end'; return io.emit('final', ranking()); }
  const q = G.qs[G.qi];
  G.phase = 'q'; G.answers = {}; G.endsAt = Date.now() + TIME * 1000;
  io.emit('question', { i: G.qi, total: G.qs.length, q: q.q, options: q.options, time: TIME });
  G.timer = setTimeout(reveal, TIME * 1000 + 300);
}
function reveal() {
  if (G.phase !== 'q') return;
  clearTimeout(G.timer); G.phase = 'r';
  const q = G.qs[G.qi], counts = q.options.map(() => 0);
  for (const [id, a] of Object.entries(G.answers)) {
    counts[a.c]++;
    if (a.c === q.answer && G.players[id]) G.players[id].score += Math.round(500 + 500 * Math.max(0, (G.endsAt - a.t) / 1000) / TIME);
  }
  io.emit('reveal', { answer: q.answer, counts, explain: q.explain || '', ranking: ranking(), last: G.qi === G.qs.length - 1 });
  G.timer = setTimeout(nextQ, REVEAL * 1000);
}

io.on('connection', (s) => {
  s.on('join', ({ name, av }) => {
    if (G.phase !== 'lobby') return s.emit('err', 'Game already started. Wait for the next round.');
    if (Object.keys(G.players).length >= MAX) return s.emit('err', 'Lobby is full (30/30).');
    G.players[s.id] = { name: String(name || 'Sorcerer').trim().slice(0, 14) || 'Sorcerer', av: cleanAv(av), score: 0, on: true };
    s.emit('joined'); lobby();
  });
  s.on('update', ({ name, av }) => {
    const p = G.players[s.id]; if (!p || G.phase !== 'lobby') return;
    p.name = String(name || p.name).trim().slice(0, 14) || p.name; p.av = cleanAv(av); lobby();
  });
  s.on('start', () => {
    if (s.id !== G.host || G.phase !== 'lobby' || !online().length) return;
    G.qs = loadQ(); G.qi = -1; nextQ();
  });
  s.on('hostLogin', (k) => {
    if (k !== HOST_KEY) return s.emit('hostFail');
    G.host = s.id; s.emit('hostOk', { phase: G.phase }); lobby();
  });
  s.on('skip', () => { if (s.id === G.host) reveal(); });
  s.on('answer', (c) => {
    if (G.phase !== 'q' || !G.players[s.id] || G.answers[s.id] || !Number.isInteger(c) || c < 0 || c > 3) return;
    G.answers[s.id] = { c, t: Date.now() };
    io.emit('answered', { n: Object.keys(G.answers).length, total: online().length });
    if (online().every(([id]) => G.answers[id])) reveal();
  });
  s.on('reset', () => {
    if (s.id !== G.host || G.phase !== 'end') return;
    for (const [id, p] of Object.entries(G.players)) p.on ? (p.score = 0) : delete G.players[id];
    G.phase = 'lobby'; io.emit('reset'); lobby();
  });
  s.on('disconnect', () => {
    if (G.host === s.id) { G.host = null; return; }
    const p = G.players[s.id]; if (!p) return;
    if (G.phase === 'lobby') delete G.players[s.id]; else p.on = false;
    if (!online().length && G.phase !== 'lobby') { clearTimeout(G.timer); G.phase = 'lobby'; G.players = {}; G.qi = -1; io.emit('reset'); }
    lobby();
    if (G.phase === 'q' && online().every(([id]) => G.answers[id])) reveal();
  });
});

server.listen(process.env.PORT || 3000, () => console.log('Cursed Quiz running'));
