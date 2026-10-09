const $ = (s) => document.querySelector(s), socket = io();
let av = { key: 'gojo', ...CHARS.gojo }, joined = false, myId = null, choice = null, timer = null, prevScore = 0, myScore = 0;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const show = (id) => { document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id)); document.body.classList.toggle('ingame', id === 'game'); };
const renderRoam = () => { $('#roam').innerHTML = `<div class="walker"><div class="bob">${avatarSVG(av)}</div></div>`; };
const payload = () => ({ name: $('#name').value, av: { key: av.key, hair: av.hair, style: av.style, outfit: av.outfit, acc: av.acc, aura: av.aura } });

function renderCust() {
  $('#preview').innerHTML = avatarSVG(av); renderRoam();
  $('#chars').innerHTML = Object.entries(CHARS).map(([k, c]) => `<div class="chip ${av.key === k ? 'on' : ''}" data-k="${k}">${avatarSVG(c)}<small>${c.n}</small></div>`).join('');
  $('#styles').innerHTML = STYLES.map((s) => `<button class="tag ${av.style === s ? 'on' : ''}" data-s="${s}">${s}</button>`).join('');
  $('#accs').innerHTML = ACCS.map((s) => `<button class="tag ${av.acc === s ? 'on' : ''}" data-a="${s}">${s}</button>`).join('');
  ['hair', 'outfit', 'aura'].forEach((k) => ($('#' + k).value = av[k]));
  if (joined) socket.emit('update', payload());
}
$('#chars').onclick = (e) => { const c = e.target.closest('.chip'); if (c) { av = { key: c.dataset.k, ...CHARS[c.dataset.k] }; renderCust(); } };
$('#styles').onclick = (e) => { if (e.target.dataset.s) { av.style = e.target.dataset.s; renderCust(); } };
$('#accs').onclick = (e) => { if (e.target.dataset.a) { av.acc = e.target.dataset.a; renderCust(); } };
['hair', 'outfit', 'aura'].forEach((k) => ($('#' + k).oninput = (e) => { av[k] = e.target.value; $('#preview').innerHTML = avatarSVG(av); renderRoam(); }));
['hair', 'outfit', 'aura'].forEach((k) => ($('#' + k).onchange = () => renderCust()));
$('#name').onchange = () => joined && socket.emit('update', payload());
$('#join').onclick = () => { if (!$('#name').value.trim()) { $('#err').textContent = 'Type a name first.'; return; } socket.emit('join', payload()); };
$('#start').onclick = () => socket.emit('start');
$('#again').onclick = () => socket.emit('reset');
$('#back').onclick = () => { $('#wait').textContent = 'Back in the waiting room. Wait for the host to start the next round.'; show('lobby'); };

socket.on('connect', () => (myId = socket.id));
socket.on('err', (m) => ($('#err').textContent = m));
socket.on('joined', () => {
  joined = true; $('#err').textContent = ''; $('#join').textContent = 'Joined: customize anytime'; $('#join').disabled = true;
  $('#wait').textContent = 'You are in. Wait for the host to start. Your look updates live.';
});
socket.on('lobby', ({ players, max, phase }) => {
  $('#count').textContent = `${players.length}/${max}`;
  $('#players').innerHTML = players.map((p) => `<div class="pl ${p.id === myId ? 'me' : ''} ${p.host ? 'host' : ''}"><div class="av">${avatarSVG(p.av)}</div>${esc(p.name)}</div>`).join('');
  const amHost = players.some((p) => p.id === myId && p.host);
  $('#start').hidden = !(amHost && phase === 'lobby');
  $('#again').hidden = !amHost;
});
socket.on('reset', () => { prevScore = myScore = 0; show('lobby'); });

socket.on('question', (q) => {
  if (!joined) return;
  choice = null; show('game');
  $('#qno').textContent = `Question ${q.i + 1} of ${q.total}`;
  $('#qtext').textContent = q.q; $('#feedback').textContent = ''; $('#mini').innerHTML = ''; $('#ans').textContent = '';
  $('#opts').innerHTML = q.options.map((o, i) => `<button class="opt" data-i="${i}"><b><i>${'ABCD'[i]}</i></b>${esc(o)}</button>`).join('');
  const end = Date.now() + q.time * 1000; clearInterval(timer);
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    $('#secs').textContent = Math.ceil(left / 1000); $('#secs').classList.toggle('low', left < 8000);
    $('#barfill').style.width = (left / (q.time * 10)) + '%';
    if (!left) clearInterval(timer);
  };
  tick(); timer = setInterval(tick, 100);
});
$('#opts').onclick = (e) => {
  const b = e.target.closest('.opt'); if (!b || choice !== null) return;
  choice = +b.dataset.i; b.classList.add('picked');
  document.querySelectorAll('.opt').forEach((o) => (o.disabled = true));
  socket.emit('answer', choice); $('#feedback').textContent = 'Locked in. Waiting for the others...';
};
socket.on('answered', ({ n, total }) => ($('#ans').textContent = `${n}/${total} answered`));
socket.on('reveal', ({ answer, counts, explain, ranking }) => {
  if (!joined) return; clearInterval(timer);
  document.querySelectorAll('.opt').forEach((o, i) => { o.disabled = true; o.classList.add(i === answer ? 'right' : 'wrong'); o.insertAdjacentHTML('beforeend', `<span style="margin-left:auto">${counts[i]}</span>`); });
  const me = ranking.find((p) => p.id === myId); myScore = me ? me.score : 0;
  const gain = myScore - prevScore; prevScore = myScore;
  $('#feedback').textContent = (choice === answer ? `Correct! +${gain} points. ` : choice === null ? 'Time is up! ' : 'Wrong. ') + explain;
  $('#mini').innerHTML = ranking.slice(0, 5).map((p, i) => `<div>${avatarSVG(p.av)}#${i + 1} ${esc(p.name)} ${p.score}</div>`).join('');
});
socket.on('final', (r) => {
  if (!joined) return; clearInterval(timer); show('final');
  $('#podium').innerHTML = r.slice(0, 3).map((p, i) => `<div class="pod" style="animation-delay:${(2 - i) * .4}s"><div class="av">${avatarSVG(p.av)}</div><b>${esc(p.name)}</b><div class="step">${i + 1}</div></div>`).join('');
  $('#rank').innerHTML = r.map((p, i) => `<div class="rk ${p.id === myId ? 'me' : ''}"><span class="n">${i + 1}</span>${avatarSVG(p.av)}<span class="nm">${esc(p.name)}</span><span class="s">${p.score}</span></div>`).join('');
});
renderCust();
