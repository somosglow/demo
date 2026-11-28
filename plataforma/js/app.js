import * as S from './store.js';
import { $, $$, esc, ic, ini, tilt, setBrand, contar, closeSheet } from './ui.js';

const app = $('#app');
let limpiar = null;
const rutas = [
  [/^#?\/?$/, () => import('./inicio.js')],
  [/^#\/s\/([^/]+)\/?$/, () => import('./cliente.js')],
  [/^#\/s\/([^/]+)\/equipo\/?$/, () => import('./equipo.js')],
  [/^#\/s\/([^/]+)\/panel(?:\/(\w+))?\/?$/, () => import('./dueno.js')],
  [/^#\/glow(?:\/(\w+))?\/?$/, () => import('./glow.js')],
  [/^#\/s\/([^/]+)\/tv\/?$/, () => import('./tv.js')],
  [/^#\/guia\/?$/, () => import('./guia.js')],
];
async function ir() {
  let h = location.hash || '#/';
  const q = new URLSearchParams(location.search); if (q.get('s') && h === '#/') { h = '#/s/' + q.get('s'); history.replaceState(null, '', location.pathname + h); }
  const hq = h.split('?')[0];
  for (const [re, mod] of rutas) {
    const m = hq.match(re); if (!m) continue;
    try { limpiar && limpiar(); } catch (e) {}
    limpiar = null; closeSheet(); window.scrollTo(0, 0);
    const M = await mod();
    app.classList.remove('vt'); void app.offsetWidth; app.classList.add('vt');
    limpiar = M.render(app, m.slice(1)) || null;
    tilt(app); contar(app);
    return;
  }
  location.hash = '#/';
}
addEventListener('hashchange', ir); ir();
const st = document.createElement('style'); st.textContent = '#app.vt{animation:fade .35s ease both}'; document.head.append(st);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
export { S };
