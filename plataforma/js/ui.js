/* utilidades de interfaz: plantillas, íconos, hoja inferior, avisos, confeti, 3D */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ini = n => String(n || '?').split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
export const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const h12 = s => { let [h, m] = String(s).split(':').map(Number); const p = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${p}`; };
export const fechaL = d => { const s = `${DIAS_L[d.getDay()]} ${d.getDate()} de ${MESES_L[d.getMonth()]}`; return s[0].toUpperCase() + s.slice(1); };
export const durL = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`;

const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.2 2.6 3.7 5.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', cash: '<rect x="2" y="6" width="20" height="13" rx="3"/><circle cx="12" cy="12.5" r="3"/><path d="M6 6V4h12v2"/>',
  spark: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  wa: '<path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5z"/><path d="M8.5 8.5c.3 2.6 2.4 5 5 5.8l1.3-1.2 2 .9c-.2 1.3-1.3 2-2.5 2-4 0-7.5-3.5-7.5-7.5 0-1.2.7-2.3 2-2.5l.9 2z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9c0 2 4 2 4 0 0 2 5 2 5 0 0 2 5 2 5 0 0 2 4 2 4 0"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play: '<path d="M7 4v16l13-8z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>', book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', heart: '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
};
export const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

export function toast(msg, icon = 'check') { $$('.toast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = ic(icon, 18) + esc(msg); document.body.append(t); setTimeout(() => t.remove(), 2600); }

export function sheet(html, { onClose } = {}) {
  closeSheet(); const v = document.createElement('div'); v.className = 'veil'; const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = '<div class="grab"></div>' + html;
  v.onclick = () => { closeSheet(); onClose && onClose(); }; document.body.append(v, s); s.querySelector('[autofocus]')?.focus();
  let y0 = null; s.addEventListener('touchstart', e => { if (s.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  s.addEventListener('touchmove', e => { if (y0 != null) { const dy = e.touches[0].clientY - y0; if (dy > 0) s.style.transform = `translateY(${dy}px)`; } }, { passive: true });
  s.addEventListener('touchend', e => { if (y0 != null) { const dy = (e.changedTouches[0].clientY - y0); s.style.transform = ''; if (dy > 120) { closeSheet(); onClose && onClose(); } } y0 = null; });
  return s;
}
export function closeSheet() { $$('.veil,.sheet').forEach(x => x.remove()); }

export function confetti(colors = ['#FFB547', '#FF7A59', '#fff', '#3DDC97', '#7C5CFF']) {
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.append(c); const x = c.getContext('2d');
  const W = c.width = innerWidth * devicePixelRatio, H = c.height = innerHeight * devicePixelRatio;
  const ps = Array.from({ length: 160 }, () => ({ x: W / 2, y: H * .45, vx: (Math.random() - .5) * 26 * devicePixelRatio, vy: (-Math.random() * 22 - 8) * devicePixelRatio, r: (4 + Math.random() * 6) * devicePixelRatio, c: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
  let f = 0; (function loop() { x.clearRect(0, 0, W, H); ps.forEach(p => { p.vy += .55 * devicePixelRatio; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }); if (++f < 170) requestAnimationFrame(loop); else c.remove(); })();
  try { navigator.vibrate && navigator.vibrate([20, 40, 20]); } catch (e) {}
}

/* inclinación 3D con el dedo/ratón y con el giroscopio */
export function tilt(root = document) {
  $$('.tilt', root).forEach(el => {
    if (el._t) return; el._t = 1;
    const mv = (cx, cy) => { const r = el.getBoundingClientRect(); const x = (cx - r.left) / r.width - .5, y = (cy - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`; };
    el.addEventListener('pointermove', e => mv(e.clientX, e.clientY)); el.addEventListener('pointerleave', () => el.style.transform = '');
  });
}

export function vibrar(ms = 12) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

/* número que sube animado */
export function contar(root = document) {
  $$('[data-n]', root).forEach(el => { const fin = Number(el.dataset.n), pre = el.dataset.pre || '', suf = el.dataset.suf || '', dec = Number(el.dataset.dec || 0); const t0 = performance.now(), d = 900;
    (function f(t) { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + (fin * e).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(f); })(t0); });
}

/* cara = true en lo que ve el cliente (su app y la TV): ahí se aplica el estilo del negocio */
export function setBrand(t, cara = false) { const d = document.documentElement, r = d.style; r.setProperty('--brand', t?.color || '#FF7A59'); r.setProperty('--brand2', t?.color2 || '#FFB547');
  const e = cara && t?.estilo && t.estilo !== 'claro' ? t.estilo : ''; if (e) d.dataset.estilo = e; else delete d.dataset.estilo;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', (ESTILOS[e] || ESTILOS.claro).bg); }
export const ESTILOS = {
  claro: { n: 'Glow claro', d: 'Limpio y luminoso', bg: '#F6F5F2', card: '#FFFFFF', tx: '#0F1420', f: 'Poppins', w: 700 },
  elegante: { n: 'Elegante', d: 'Oscuro y fuerte · barberías', bg: '#0C0D10', card: '#1B1C21', tx: '#F4F1EA', f: 'Oswald', w: 600, up: 1 },
  natural: { n: 'Natural', d: 'Cálido y suave · spas', bg: '#F1ECE3', card: '#FFFCF7', tx: '#2A2621', f: 'Cormorant Garamond', w: 700 },
  vibrante: { n: 'Vibrante', d: 'Colores vivos · uñas', bg: '#FFF3F8', card: '#FFFFFF', tx: '#0F1420', f: 'Poppins', w: 800 },
  clasico: { n: 'Clásico', d: 'Sobrio y fino · salones', bg: '#FAF8F4', card: '#FFFFFF', tx: '#1D1B18', f: 'Playfair Display', w: 600 },
};
export const pickerEstilos = (sel, nombre = 'Tu negocio') => `<div class="estilos">${Object.entries(ESTILOS).map(([k, e]) => `<button type="button" class="est ${sel === k ? 'on' : ''}" data-est="${k}"><div class="pv" style="background:${e.bg};color:${e.tx}"><b style="font-family:'${e.f}';font-weight:${e.w};${e.up ? 'text-transform:uppercase;' : ''}">${esc(nombre).slice(0, 16)}</b><i></i></div><div class="b sm">${e.n}</div><div class="xs mut">${e.d}</div></button>`).join('')}</div>`;

/* .ics para agregar al calendario */
export function ics({ titulo, inicio, dur, lugar }) {
  const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const fin = new Date(inicio.getTime() + dur * 60000);
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Glow//ES', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@glow', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(inicio), 'DTEND:' + f(fin), 'SUMMARY:' + titulo, 'LOCATION:' + (lugar || ''), 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:' + titulo, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = 'cita.ics'; a.click();
}
export const wa = (tel, txt) => `https://wa.me/${String(tel || '').replace(/\D/g, '').replace(/^(\d{8})$/, '507$1')}?text=${encodeURIComponent(txt)}`;

/* foto desde el celular → JPEG comprimido (para portada, logo, galería y equipo) */
export function leerImagen(file, max = 1200, q = 0.78) {
  return new Promise((ok, mal) => { if (!file) return mal(new Error('sin archivo')); const r = new FileReader(); r.onerror = mal;
    r.onload = () => { const im = new Image(); im.onerror = mal; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q)); }; im.src = r.result; }; r.readAsDataURL(file); });
}
export const estrellas = (n, size = 16) => `<span style="color:#F5A623;font-size:${size}px;letter-spacing:1px">${'★'.repeat(Math.round(n))}<span style="color:#D9D6CF">${'★'.repeat(5 - Math.round(n))}</span></span>`;
export const avatar = (o, cls = '', estilo = '') => o?.foto ? `<div class="av ${cls}" style="${estilo};background:url(${o.foto}) center/cover"></div>` : `<div class="av ${cls}" style="--c:${o?.color || 'var(--grad)'};${estilo}">${esc(ini(o?.nombre))}</div>`;
