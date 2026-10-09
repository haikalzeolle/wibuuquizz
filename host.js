const $ = (s) => document.querySelector(s), socket = io();
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const show = (id) => document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
let ok = false, timer = null;

let lastKey = null;
const login = (k) => { lastKey = String(k || '').trim(); $('#err').textContent = 'Checking...'; socket.emit('hostLogin', lastKey); };
$('#f').onsubmit = (e) => { e.preventDefault(); login($('#key').value); };
socket.on('connect', () => {
  $('#st').textContent = 'Connected. Enter the host password.';
  const k = lastKey || new URLSearchParams(location.search).get('key'); // /host?key=PASSWORD logs in automatically
  if (k) login(k);
});
socket.on('connect_error', () => ($('#st').textContent = 'Cannot reach the server yet. Wait a moment and refresh.'));
$('#start').onclick = () => socket.emit('start');
$('#skip').onclick = () => socket.emit('skip');
$('#again').onclick = () => socket.emit('reset');
socket.on('hostFail', () => ($('#err').textContent = 'Wrong password.'));
socket.on('hostOk', ({ phase }) => { ok = true; show(phase === 'lobby' ? 'hlobby' : 'game'); });
socket.on('reset', () => ok && show('hlobby'));

socket.on('lobby', ({ players, max }) => {
  if (!ok) return;
  $('#count').textContent = `${players.length}/${max}`;
  $('#start').disabled = !players.length;
  $('#players').innerHTML = players.map((p) => `<div class="pl"><div class="av">${avatarSVG(p.av)}</div>${esc(p.name)}</div>`).join('');
});
socket.on('question', (q) => {
  if (!ok) return; show('game'); $('#skip').hidden = false;
  $('#qno').textContent = `Question ${q.i + 1} of ${q.total}`; $('#qtext').textContent = q.q;
  $('#feedback').textContent = ''; $('#mini').innerHTML = ''; $('#ans').textContent = '0 answered';
  $('#opts').innerHTML = q.options.map((o, i) => `<button class="opt" disabled><b><i>${'ABCD'[i]}</i></b>${esc(o)}</button>`).join('');
  const end = Date.now() + q.time * 1000; clearInterval(timer);
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    $('#secs').textContent = Math.ceil(left / 1000); $('#secs').classList.toggle('low', left < 8000);
    $('#barfill').style.width = left / (q.time * 10) + '%';
    if (!left) clearInterval(timer);
  };
  tick(); timer = setInterval(tick, 100);
});
socket.on('answered', ({ n, total }) => ok && ($('#ans').textContent = `${n}/${total} answered`));
socket.on('reveal', ({ answer, counts, explain, ranking, last }) => {
  if (!ok) return; clearInterval(timer); $('#skip').hidden = true;
  document.querySelectorAll('.opt').forEach((o, i) => { o.classList.add(i === answer ? 'right' : 'wrong'); o.insertAdjacentHTML('beforeend', `<span style="margin-left:auto">${counts[i]}</span>`); });
  $('#feedback').textContent = explain || (last ? 'Last question done. Final ranking is next.' : 'Next question starts in a few seconds.');
  $('#mini').innerHTML = ranking.slice(0, 5).map((p, i) => `<div>${avatarSVG(p.av)}#${i + 1} ${esc(p.name)} ${p.score}</div>`).join('');
});
socket.on('final', (r) => {
  if (!ok) return; clearInterval(timer); show('final');
  $('#podium').innerHTML = r.slice(0, 3).map((p, i) => `<div class="pod" style="animation-delay:${(2 - i) * .4}s"><div class="av">${avatarSVG(p.av)}</div><b>${esc(p.name)}</b><div class="step">${i + 1}</div></div>`).join('');
  $('#rank').innerHTML = r.map((p, i) => `<div class="rk"><span class="n">${i + 1}</span>${avatarSVG(p.av)}<span class="nm">${esc(p.name)}</span><span class="s">${p.score}</span></div>`).join('');
});
