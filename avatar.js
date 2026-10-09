// Jujutsu Kaisen inspired characters. Each preset fills the customizer, then players tweak it.
const CHARS = {
  gojo:    { n: 'Gojo',    hair: '#f1f5ff', style: 'spiky', outfit: '#14172b', acc: 'blindfold', aura: '#60a5fa' },
  itadori: { n: 'Itadori', hair: '#f472b6', style: 'short', outfit: '#1e2a5a', acc: 'none',      aura: '#f87171' },
  megumi:  { n: 'Megumi',  hair: '#1a1a2e', style: 'spiky', outfit: '#14172b', acc: 'none',      aura: '#22d3ee' },
  nobara:  { n: 'Nobara',  hair: '#d97706', style: 'bob',   outfit: '#1e2a5a', acc: 'none',      aura: '#fb923c' },
  sukuna:  { n: 'Sukuna',  hair: '#f9a8d4', style: 'spiky', outfit: '#7c1d1d', acc: 'marks',     aura: '#dc2626' },
  nanami:  { n: 'Nanami',  hair: '#e5c07b', style: 'short', outfit: '#3f3f46', acc: 'glasses',   aura: '#facc15' },
  maki:    { n: 'Maki',    hair: '#1f2937', style: 'long',  outfit: '#166534', acc: 'glasses',   aura: '#4ade80' },
  inumaki: { n: 'Inumaki', hair: '#e5e7eb', style: 'short', outfit: '#1e1b4b', acc: 'mask',      aura: '#a78bfa' },
};
const STYLES = ['spiky', 'short', 'bob', 'long'];
const ACCS = ['none', 'blindfold', 'glasses', 'marks', 'mask'];
const HAIR = {
  spiky: 'M27 46 L20 20 L35 31 L39 8 L49 26 L59 6 L63 28 L78 14 L73 46 Q50 22 27 46Z',
  short: 'M29 46 Q25 18 50 17 Q75 18 71 46 Q62 30 50 33 Q38 30 29 46Z',
  bob:   'M25 66 Q19 18 50 17 Q81 18 75 66 L67 66 Q69 34 50 33 Q31 34 33 66Z',
  long:  'M23 88 Q16 16 50 15 Q84 16 77 88 L69 88 Q71 34 50 32 Q29 34 31 88Z',
};
function avatarSVG(a) {
  const skin = '#fde0c8', ink = '#0d0b17';
  let f = '';
  if (a.acc === 'blindfold') f += `<rect x="30" y="43" width="40" height="10" fill="${ink}"/>`;
  else {
    f += `<ellipse cx="42" cy="50" rx="3" ry="4.2" fill="${ink}"/><ellipse cx="58" cy="50" rx="3" ry="4.2" fill="${ink}"/><circle cx="43" cy="48.5" r="1" fill="#fff"/><circle cx="59" cy="48.5" r="1" fill="#fff"/>`;
    if (a.acc === 'glasses') f += `<rect x="35" y="44" width="13" height="11" rx="2" fill="none" stroke="${ink}" stroke-width="1.6"/><rect x="52" y="44" width="13" height="11" rx="2" fill="none" stroke="${ink}" stroke-width="1.6"/><path d="M48 49h4" stroke="${ink}" stroke-width="1.6"/>`;
    if (a.acc === 'marks') f += `<path d="M37 56l-3 4M63 56l3 4M44 42h12" stroke="${ink}" stroke-width="1.4" fill="none"/>`;
  }
  f += a.acc === 'mask'
    ? `<path d="M31 55 Q50 61 69 55 L67 70 Q50 76 33 70Z" fill="#26233a" stroke="${a.aura}" stroke-width="1"/>`
    : `<path d="M45 63 Q50 66 55 63" stroke="${ink}" stroke-width="1.4" fill="none"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle class="aura" cx="50" cy="52" r="44" fill="${a.aura}" fill-opacity=".14" stroke="${a.aura}" stroke-width="1.5"/>
    <circle class="aura2" cx="50" cy="52" r="36" fill="none" stroke="${a.aura}" stroke-opacity=".6" stroke-dasharray="6 5"/>
    <rect x="44" y="64" width="12" height="12" fill="#e9c4a6"/>
    <path d="M10 100 Q14 74 50 72 Q86 74 90 100Z" fill="${a.outfit}"/>
    <path d="M40 73 L50 88 L60 73" fill="none" stroke="${a.aura}" stroke-width="2"/>
    <ellipse cx="50" cy="49" rx="18" ry="21" fill="${skin}"/>${f}
    <path d="${HAIR[a.style]}" fill="${a.hair}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;
}
