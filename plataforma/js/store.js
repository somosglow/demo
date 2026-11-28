/* Glow Plataforma — capa de datos multi-negocio.
   Modo demo: todo vive en este navegador (localStorage) y se sincroniza en vivo entre pestañas.
   La forma de los datos es la misma que tendrá la base real (Firestore): cada documento lleva tid (id del negocio). */
const KEY = 'glow.plataforma.v3';
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('glow-plataforma') : null;
const subs = new Set();

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const fromMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const parse = s => { const [d, t = '00:00'] = s.split('T'); const [y, mo, da] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number); return new Date(y, mo - 1, da, h, mi); };
export const iso = d => `${ymd(d)}T${hm(d)}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
export const ITBMS = 0.07;

let db = null;
function load() {
  try { const x = JSON.parse(localStorage.getItem(KEY)); if (x && x.v === 3) return x; } catch (e) {}
  const s = seed(); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} return s;
}
function save(origen = 'local') {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  if (bc && origen === 'local') bc.postMessage('cambio');
  subs.forEach(f => { try { f(); } catch (e) { console.error(e); } });
}
if (bc) bc.onmessage = () => { db = load(); subs.forEach(f => f()); };
window.addEventListener('storage', e => { if (e.key === KEY) { db = load(); subs.forEach(f => f()); } });
export const onChange = f => { subs.add(f); return () => subs.delete(f); };
export const reset = () => { localStorage.removeItem(KEY); db = load(); save(); };

/* ---------- lectura ---------- */
export const tenants = () => db.tenants;
export const tenant = slugOrId => db.tenants.find(t => t.slug === slugOrId || t.id === slugOrId);
const of = (col, tid) => db[col].filter(x => x.tid === tid);
export const services = tid => of('services', tid).filter(s => !s.borrado);
export const service = id => db.services.find(s => s.id === id);
export const staff = tid => of('staff', tid).filter(s => !s.borrado);
export const member = id => db.staff.find(s => s.id === id);
export const clients = tid => of('clients', tid);
export const client = id => db.clients.find(c => c.id === id);
export const bookings = tid => of('bookings', tid);
export const booking = id => db.bookings.find(b => b.id === id);
export const sales = tid => of('sales', tid);
export const waitlist = tid => of('waitlist', tid);
export const reviews = tid => of('reviews', tid);
export const activas = tid => bookings(tid).filter(b => !['cancelada'].includes(b.estado));

/* ---------- escritura ---------- */
function put(col, obj) { const i = db[col].findIndex(x => x.id === obj.id); if (i >= 0) db[col][i] = { ...db[col][i], ...obj }; else db[col].push(obj); save(); return db[col].find(x => x.id === obj.id); }
export const saveTenant = t => put('tenants', t);
export const saveService = s => put('services', s);
export const saveStaff = s => put('staff', s);
export const saveClient = c => put('clients', c);
export const saveBooking = b => put('bookings', b);
export const addWait = w => put('waitlist', { id: uid('w'), creado: iso(new Date()), ...w });
export const addReview = r => put('reviews', { id: uid('r'), fecha: iso(new Date()), ...r });

export function upsertClient(tid, { nombre, tel, email }) {
  const dig = String(tel || '').replace(/\D/g, '').slice(-8);
  let c = clients(tid).find(x => String(x.tel).replace(/\D/g, '').slice(-8) === dig && dig);
  if (c) return put('clients', { id: c.id, nombre: nombre || c.nombre, email: email || c.email });
  return put('clients', { id: uid('c'), tid, nombre, tel, email: email || '', creado: iso(new Date()), sellos: 0, notas: '', cumple: '' });
}

export function crearCita(tid, { items, staffId, inicio, cliente, nota = '', origen = 'app', deposito = 0, metodo = '' }) {
  const c = upsertClient(tid, cliente);
  const svs = items.map(service); const dur = svs.reduce((a, s) => a + s.dur, 0); const total = svs.reduce((a, s) => a + s.precio, 0);
  if (!libre(tid, staffId, inicio, dur)) throw new Error('Ese horario se acaba de ocupar. Elige otro, por favor.');
  const b = { id: uid('b'), tid, cid: c.id, items, staffId, inicio, dur, total, estado: 'confirmada', origen, nota,
    pago: { deposito, pagado: deposito > 0 ? deposito : 0, metodo }, creado: iso(new Date()), codigo: codigo(tenant(tid)) };
  return put('bookings', b);
}
function codigo(t) { return (t.nombre.match(/\b\w/g) || ['G']).join('').slice(0, 2).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }

export function estado(bid, estado, extra = {}) {
  const b = booking(bid); if (!b) return;
  put('bookings', { id: bid, estado, ...extra });
  if (estado === 'completada' && b.estado !== 'completada') {
    const c = client(b.cid); const t = tenant(b.tid);
    if (c) put('clients', { id: c.id, sellos: ((c.sellos || 0) + 1) % (t.fidelidad?.meta || 10) === 0 ? 0 : (c.sellos || 0) + 1, premios: ((c.sellos || 0) + 1) % (t.fidelidad?.meta || 10) === 0 ? (c.premios || 0) + 1 : (c.premios || 0) });
  }
}
export function cobrar(bid, { metodo, propina = 0, descuento = 0 }) {
  const b = booking(bid); const sub = Math.max(0, b.total - descuento); const itbms = +(sub * ITBMS).toFixed(2);
  const total = +(sub + itbms + Number(propina || 0)).toFixed(2);
  const pendiente = +(total - (b.pago?.pagado || 0)).toFixed(2);
  put('sales', { id: uid('v'), tid: b.tid, bid, staffId: b.staffId, fecha: iso(new Date()), sub, itbms, propina: Number(propina || 0), total, cobrado: pendiente, metodo });
  estado(bid, 'completada', { pago: { ...b.pago, pagado: total, metodo } });
  return { sub, itbms, total, pendiente };
}

/* ---------- disponibilidad ---------- */
export function horarioDe(tid, staffId, fecha) {
  const t = tenant(tid); const dow = fecha.getDay();
  const m = staffId ? member(staffId) : null;
  if (m?.libres?.includes(ymd(fecha))) return [];
  const h = (m?.horario && m.horario[dow]) || t.horario[dow] || [];
  return h.map(([a, b]) => [toMin(a), toMin(b)]);
}
export function ocupado(tid, staffId, fecha, excl = null) {
  const d = ymd(fecha);
  const ev = activas(tid).filter(b => b.id !== excl && b.staffId === staffId && b.inicio.startsWith(d)).map(b => [toMin(b.inicio.slice(11)), toMin(b.inicio.slice(11)) + b.dur]);
  const bl = (member(staffId)?.bloqueos || []).filter(x => x.fecha === d).map(x => [toMin(x.desde), toMin(x.hasta)]);
  return ev.concat(bl);
}
export function libre(tid, staffId, inicio, dur, excl = null) {
  const f = parse(inicio); const a = toMin(inicio.slice(11)), b = a + dur;
  const dentro = horarioDe(tid, staffId, f).some(([x, y]) => a >= x && b <= y);
  return dentro && !ocupado(tid, staffId, f, excl).some(([x, y]) => a < y && b > x);
}
export function puede(m, items) { return items.every(i => !m.servicios || m.servicios.includes(i)); }
/** Horas libres de un día. staffId null = cualquiera (devuelve también quién atiende). */
export function slots(tid, items, staffId, fecha, paso = 15) {
  const dur = items.reduce((a, i) => a + (service(i)?.dur || 0), 0); if (!dur) return [];
  const pros = staffId ? [member(staffId)] : staff(tid).filter(m => puede(m, items));
  const ahora = new Date(); const hoy = ymd(ahora) === ymd(fecha); const min = hoy ? ahora.getHours() * 60 + ahora.getMinutes() + 30 : 0;
  const out = new Map();
  pros.forEach(m => {
    horarioDe(tid, m.id, fecha).forEach(([x, y]) => {
      for (let a = Math.ceil(x / paso) * paso; a + dur <= y; a += paso) {
        if (a < min || out.has(a)) continue;
        if (!ocupado(tid, m.id, fecha).some(([p, q]) => a < q && a + dur > p)) out.set(a, m.id);
      }
    });
  });
  return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([a, sid]) => ({ hora: fromMin(a), staffId: sid }));
}

/* ---------- métricas ---------- */
export function metricas(tid, desde, hasta) {
  const bs = bookings(tid).filter(b => b.inicio >= desde && b.inicio < hasta);
  const vs = sales(tid).filter(v => v.fecha >= desde && v.fecha < hasta);
  const ingresos = vs.reduce((a, v) => a + v.sub, 0);
  const comp = bs.filter(b => b.estado === 'completada').length;
  const noshow = bs.filter(b => b.estado === 'no-show').length;
  const cancel = bs.filter(b => b.estado === 'cancelada').length;
  let cap = 0, usado = 0;
  for (let d = parse(desde + (desde.length === 10 ? 'T00:00' : '')); ymd(d) < hasta.slice(0, 10); d = addDays(d, 1))
    staff(tid).forEach(m => { horarioDe(tid, m.id, d).forEach(([x, y]) => cap += y - x); });
  bs.filter(b => b.estado !== 'cancelada').forEach(b => usado += b.dur);
  return { citas: bs.length, completadas: comp, noshow, cancel, ingresos, ticket: comp ? ingresos / comp : 0, ocupacion: cap ? Math.min(1, usado / cap) : 0 };
}

/* ---------- alta de negocio (onboarding) ---------- */
const PLANTILLAS = {
  barberia: { cats: ['Cortes', 'Barba', 'Combos', 'Extras'], s: [['Cortes', 'Corte clásico', 30, 12], ['Cortes', 'Fade / degradado', 40, 15], ['Cortes', 'Corte niño', 30, 10], ['Barba', 'Perfilado de barba', 20, 8], ['Barba', 'Barba con toalla caliente', 30, 12], ['Combos', 'Corte + barba', 60, 22], ['Extras', 'Cejas', 10, 4], ['Extras', 'Mascarilla negra', 15, 8]] },
  unas: { cats: ['Manos', 'Pies', 'Sistemas', 'Extras'], s: [['Manos', 'Manicure', 40, 15], ['Manos', 'Manicure semipermanente', 60, 25], ['Pies', 'Pedicure spa', 60, 25], ['Sistemas', 'Acrílicas', 120, 45], ['Sistemas', 'Poligel', 100, 40], ['Sistemas', 'Retoque', 75, 30], ['Extras', 'Diseño por uña', 10, 2], ['Extras', 'Parafina', 15, 8]] },
  salon: { cats: ['Corte', 'Color', 'Tratamientos', 'Peinados'], s: [['Corte', 'Corte de dama', 45, 25], ['Corte', 'Corte de caballero', 30, 12], ['Color', 'Tinte completo', 120, 60], ['Color', 'Mechas / balayage', 180, 120], ['Tratamientos', 'Keratina', 150, 90], ['Tratamientos', 'Hidratación profunda', 45, 30], ['Peinados', 'Blower', 45, 20], ['Peinados', 'Peinado de evento', 60, 40]] },
  spa: { cats: ['Masajes', 'Faciales', 'Cuerpo'], s: [['Masajes', 'Masaje relajante 60 min', 60, 55], ['Masajes', 'Masaje descontracturante', 60, 65], ['Masajes', 'Piedras calientes', 75, 75], ['Faciales', 'Limpieza facial profunda', 60, 50], ['Faciales', 'Hidrafacial', 50, 85], ['Cuerpo', 'Exfoliación corporal', 45, 40]] },
  estetica: { cats: ['Cejas', 'Pestañas', 'Depilación'], s: [['Cejas', 'Diseño de cejas', 30, 15], ['Cejas', 'Laminado de cejas', 45, 35], ['Pestañas', 'Lifting de pestañas', 60, 40], ['Pestañas', 'Extensiones clásicas', 120, 60], ['Depilación', 'Depilación de axilas', 15, 10], ['Depilación', 'Piernas completas', 45, 30]] },
};
export const TIPOS = { barberia: 'Barbería', unas: 'Uñas', salon: 'Salón de belleza', spa: 'Spa', estetica: 'Estética' };
const HOR = (a = '09:00', b = '19:00', dom = false) => ({ 0: dom ? [['10:00', '15:00']] : [], 1: [[a, b]], 2: [[a, b]], 3: [[a, b]], 4: [[a, b]], 5: [[a, b]], 6: [['09:00', '17:00']] });

export function crearNegocio({ nombre, tipo = 'barberia', zona = '', color = '#FF7A59', color2 = '#FFB547', tel = '', equipo = ['Ana', 'Luis'], plan = 'Esencial', demo = false }) {
  const tid = uid('t');
  let slug = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'negocio';
  while (tenant(slug)) slug += '-' + Math.floor(Math.random() * 9);
  const t = { id: tid, slug, nombre, tipo, zona, color, color2, tel, plan, estado: 'activo', creado: iso(new Date()), demo,
    horario: HOR(), deposito: { activo: tipo !== 'barberia', pct: 20 }, politica: 'Puedes cancelar o cambiar gratis hasta 4 horas antes.',
    fidelidad: { meta: 10, premio: 'Servicio gratis' }, lema: { barberia: 'Tu corte, a tu hora.', unas: 'Uñas perfectas, sin esperar.', salon: 'Tu estilo, a tu hora.', spa: 'Tu momento de calma.', estetica: 'Mírate increíble.' }[tipo] || 'Reserva en segundos.' };
  db.tenants.push(t);
  const P = PLANTILLAS[tipo] || PLANTILLAS.barberia;
  const sids = P.s.map(([cat, n, dur, precio]) => { const s = { id: uid('s'), tid, cat, nombre: n, dur, precio, desde: false }; db.services.push(s); return s.id; });
  const colores = ['#FF7A59', '#7C5CFF', '#2EC5FF', '#3DDC97', '#FFB547', '#FF5C8A'];
  equipo.filter(Boolean).forEach((n, i) => db.staff.push({ id: uid('m'), tid, nombre: n, rol: i === 0 ? 'Dueño(a) / ' + (TIPOS[tipo] || '') : 'Profesional', color: colores[i % colores.length], pin: String(1111 * ((i % 9) + 1)).slice(0, 4), servicios: null, comision: 40, bloqueos: [], libres: [] }));
  save(); return t;
}

/* ---------- datos de ejemplo ---------- */
function seed() {
  db = { v: 3, tenants: [], services: [], staff: [], clients: [], bookings: [], sales: [], waitlist: [], reviews: [] };
  const a = crearNegocioSeed({ nombre: 'Barbería Ejemplo', tipo: 'barberia', zona: 'San Francisco, Panamá', color: '#FF7A59', color2: '#FFB547', equipo: ['Carlos', 'Andrés', 'Kevin'], plan: 'Pro' }, 'barberia-ejemplo');
  const b = crearNegocioSeed({ nombre: 'Nails Studio Ejemplo', tipo: 'unas', zona: 'Costa del Este, Panamá', color: '#FF5C8A', color2: '#FFB3C7', equipo: ['Valentina', 'Sofía'], plan: 'Esencial' }, 'nails-ejemplo');
  const c = crearNegocioSeed({ nombre: 'Spa Ejemplo', tipo: 'spa', zona: 'Coronado, Panamá', color: '#3DDC97', color2: '#B8F5D9', equipo: ['Mariela', 'José'], plan: 'Pro' }, 'spa-ejemplo');
  [a, b, c].forEach(t => historia(t.id));
  return db;
}
function crearNegocioSeed(o, slug) { const t = crearNegocio(o); t.slug = slug; t.demo = true; return t; }
const NOM = ['María', 'José', 'Ana', 'Luis', 'Carmen', 'Jorge', 'Gabriela', 'Ricardo', 'Paola', 'Daniel', 'Valeria', 'Andrés', 'Lucía', 'Fernando', 'Isabel', 'Miguel', 'Sara', 'Diego', 'Natalia', 'Roberto', 'Camila', 'Kevin', 'Yariela', 'Eduardo', 'Melissa', 'Óscar', 'Daniela', 'Alexis', 'Katherine', 'Iván'];
const APE = ['González', 'Rodríguez', 'Pérez', 'Castillo', 'Díaz', 'Herrera', 'Ríos', 'Vega', 'Moreno', 'Ortiz', 'Núñez', 'Batista', 'Samaniego', 'Quintero', 'Arosemena', 'Chen', 'Barría', 'Pinzón', 'Jaén', 'Méndez', 'Sánchez', 'De León', 'Tejada', 'Cedeño'];
function rnd(n) { return Math.floor(Math.random() * n); }
function historia(tid) {
  // 260 clientes (ejemplo): unos fieles, muchos ocasionales y algunos que dejaron de venir
  const cs = Array.from({ length: 260 }, (_, i) => { const c = { id: uid('c'), tid, nombre: NOM[rnd(NOM.length)] + ' ' + APE[rnd(APE.length)], tel: '+507 6' + (100 + rnd(899)) + '-' + (1000 + rnd(8999)), email: '', creado: iso(addDays(new Date(), -150 + rnd(60))), sellos: 0, premios: 0, notas: i % 9 === 0 ? 'Prefiere la mañana.' : i % 13 === 0 ? 'Le gusta conversar poco.' : '', cumple: `19${80 + rnd(20)}-${pad(1 + rnd(12))}-${pad(1 + rnd(28))}`, perfil: i < 40 ? 'fiel' : i < 200 ? 'normal' : 'perdido' }; db.clients.push(c); return c; });
  const peso = cs.map(c => c.perfil === 'fiel' ? 2.6 : c.perfil === 'normal' ? 1 : 1.2); const tot = peso.reduce((a, b) => a + b, 0);
  const elegir = d => { for (let k = 0; k < 6; k++) { let r = Math.random() * tot, i = 0; while ((r -= peso[i]) > 0) i++; const c = cs[i]; if (c.perfil === 'perdido' && d > -55) continue; return c; } return cs[rnd(200)]; };
  const svs = db.services.filter(s => s.tid === tid); const ms = db.staff.filter(s => s.tid === tid);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0); const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  for (let d = -90; d <= 10; d++) {
    const dia = addDays(hoy, d); const dow = dia.getDay(); const t = db.tenants.find(x => x.id === tid);
    const h = t.horario[dow]; if (!h || !h.length) continue;
    const fin_sem = dow === 5 || dow === 6 ? 0.12 : 0;
    ms.forEach(m => {
      let cur = toMin(h[0][0]) + rnd(3) * 15; const fin = toMin(h[0][1]);
      const prob = (d < 0 ? 0.42 : d === 0 ? 0.48 : Math.max(0.08, 0.36 - d * 0.03)) + fin_sem;
      while (cur < fin - 30) {
        if (Math.random() < prob) {
          const s = svs[rnd(svs.length)]; if (cur + s.dur > fin) break;
          const c = elegir(d); const inicio = `${ymd(dia)}T${fromMin(cur)}`;
          const pasado = d < 0 || (d === 0 && cur + s.dur < ahoraMin);
          const r = Math.random(); const est = pasado ? (r < 0.88 ? 'completada' : r < 0.94 ? 'no-show' : 'cancelada') : 'confirmada';
          const b = { id: uid('b'), tid, cid: c.id, items: [s.id], staffId: m.id, inicio, dur: s.dur, total: s.precio, estado: est, origen: ['app', 'app', 'instagram', 'whatsapp', 'google', 'recepción'][rnd(6)], nota: '', pago: { deposito: 0, pagado: est === 'completada' ? s.precio : 0, metodo: est === 'completada' ? ['Yappy', 'Yappy', 'Tarjeta', 'Efectivo'][rnd(4)] : '' }, creado: iso(addDays(dia, -rnd(5))), codigo: 'EJ-' + rnd(9999) };
          db.bookings.push(b);
          if (est === 'completada') { c.sellos = (c.sellos + 1) % 10; const it = +(s.precio * ITBMS).toFixed(2); const pr = rnd(4) ? 0 : 1 + rnd(3); db.sales.push({ id: uid('v'), tid, bid: b.id, staffId: m.id, fecha: inicio, sub: s.precio, itbms: it, propina: pr, total: +(s.precio + it + pr).toFixed(2), cobrado: +(s.precio + it + pr).toFixed(2), metodo: b.pago.metodo }); }
          cur += s.dur + (rnd(3) ? 0 : 15);
        } else cur += 30;
      }
    });
  }
  ['Excelente atención, súper puntuales.', 'Me encantó, reservé en segundos.', 'El mejor de la zona. 10/10', 'Muy limpio y amables.'].forEach((txt, i) => db.reviews.push({ id: uid('r'), tid, cid: cs[i].id, estrellas: 5 - (i === 3 ? 1 : 0), texto: txt, fecha: iso(addDays(new Date(), -i * 3)) }));
}

/* arrancar al final: todas las funciones ya existen */
db = load();
