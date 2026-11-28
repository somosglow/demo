/* Glow Plataforma — capa de datos multi-negocio.
   Modo demo: todo vive en este navegador (localStorage) y se sincroniza en vivo entre pestañas.
   La forma de los datos es la misma que tendrá la base real (Firestore): cada documento lleva tid (id del negocio). */
const KEY = 'glow.plataforma.v5';
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
const COLS = ['tenants', 'services', 'staff', 'clients', 'bookings', 'sales', 'waitlist', 'reviews', 'offers', 'coupons', 'giftcards', 'products', 'packages', 'cpackages', 'expenses', 'queue', 'outbox'];
function load() {
  try { const x = JSON.parse(localStorage.getItem(KEY)); if (x && x.v === 4) { COLS.forEach(k => x[k] = x[k] || []); return x; } } catch (e) {}
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
export const offers = tid => of('offers', tid).filter(x => !x.borrado);
export const coupons = tid => of('coupons', tid).filter(x => !x.borrado);
export const giftcards = tid => of('giftcards', tid);
export const products = tid => of('products', tid).filter(x => !x.borrado);
export const product = id => db.products.find(x => x.id === id);
export const packages = tid => of('packages', tid).filter(x => !x.borrado);
export const cpackages = tid => of('cpackages', tid);
export const expenses = tid => of('expenses', tid);
export const queue = tid => of('queue', tid);
export const outbox = tid => of('outbox', tid);
export const precio = (sid, staffId) => { const s = service(sid); if (!s) return 0; const p = staffId && s.precios && s.precios[staffId]; return p != null && p !== '' ? Number(p) : s.precio; };
export const extrasDe = tid => (tenant(tid)?.extras || []);
export const ofertaActiva = (tid, sid) => offers(tid).find(o => o.activa && (!o.vence || o.vence >= ymd(new Date())) && (!o.servicios?.length || o.servicios.includes(sid)));
export const activas = tid => bookings(tid).filter(b => !['cancelada'].includes(b.estado));

/* ---------- escritura ---------- */
function put(col, obj) { const i = db[col].findIndex(x => x.id === obj.id); if (i >= 0) db[col][i] = { ...db[col][i], ...obj }; else db[col].push(obj); save(); return db[col].find(x => x.id === obj.id); }
export const saveTenant = t => put('tenants', t);
export const saveService = s => put('services', s);
export const saveStaff = s => put('staff', s);
export const saveClient = c => put('clients', c);
export const saveBooking = b => put('bookings', b);
export const addWait = w => put('waitlist', { id: uid('w'), creado: iso(new Date()), ...w });
export const guardar = (col, obj) => put(col, obj.id ? obj : { id: uid(col[0]), ...obj });
export const msg = (tid, o) => put('outbox', { id: uid('o'), tid, fecha: iso(new Date()), canal: 'WhatsApp', estado: 'enviado', ...o });
export const addReview = r => put('reviews', { id: uid('r'), fecha: iso(new Date()), ...r });

export function upsertClient(tid, { nombre, tel, email }) {
  const dig = String(tel || '').replace(/\D/g, '').slice(-8);
  let c = clients(tid).find(x => String(x.tel).replace(/\D/g, '').slice(-8) === dig && dig);
  if (c) return put('clients', { id: c.id, nombre: nombre || c.nombre, email: email || c.email });
  return put('clients', { id: uid('c'), tid, nombre, tel, email: email || '', creado: iso(new Date()), sellos: 0, notas: '', cumple: '' });
}

/** Precio de una reserva: servicios (con precio por profesional), extras, oferta y cupón. */
export function cotizar(tid, { items, extras = [], staffId, cupon = '' }) {
  const ex = extrasDe(tid).filter(e => extras.includes(e.id));
  const lineas = items.map(i => { const base = precio(i, staffId); const of = ofertaActiva(tid, i); const d = of ? (of.tipo === 'pct' ? base * of.valor / 100 : Math.min(base, of.valor)) : 0; return { id: i, nombre: service(i)?.nombre, base, desc: +d.toFixed(2), oferta: of?.titulo || '' }; });
  const sub = lineas.reduce((a, l) => a + l.base, 0) + ex.reduce((a, e) => a + e.precio, 0);
  const dOf = lineas.reduce((a, l) => a + l.desc, 0);
  const cp = cupon ? cuponValido(tid, cupon) : null; const dCp = cp ? +((sub - dOf) * (cp.tipo === 'pct' ? cp.valor / 100 : 0) + (cp.tipo === 'monto' ? Math.min(cp.valor, sub - dOf) : 0)).toFixed(2) : 0;
  const dur = items.reduce((a, i) => a + (service(i)?.dur || 0), 0) + ex.reduce((a, e) => a + (e.dur || 0), 0);
  return { lineas, extras: ex, sub, descuento: +(dOf + dCp).toFixed(2), cupon: cp, total: +Math.max(0, sub - dOf - dCp).toFixed(2), dur };
}
export function cuponValido(tid, code) { const c = coupons(tid).find(x => x.codigo.toUpperCase() === String(code).trim().toUpperCase()); if (!c || !c.activo) return null; if (c.vence && c.vence < ymd(new Date())) return null; if (c.max && (c.usos || 0) >= c.max) return null; return c; }
export function crearCita(tid, { items, extras = [], staffId, inicio, cliente, nota = '', origen = 'app', deposito = 0, metodo = '', cupon = '', sucursal = '' }) {
  const c = upsertClient(tid, cliente); const q = cotizar(tid, { items, extras, staffId, cupon });
  if (!libre(tid, staffId, inicio, q.dur)) throw new Error('Ese horario se acaba de ocupar. Elige otro, por favor.');
  const t = tenant(tid);
  const b = { id: uid('b'), tid, cid: c.id, items, extras, staffId, inicio, dur: q.dur, total: q.total, bruto: q.sub, descuento: q.descuento, cupon: q.cupon?.codigo || '', estado: 'confirmada', origen, nota, sucursal,
    pago: { deposito, pagado: deposito > 0 ? deposito : 0, metodo }, creado: iso(new Date()), codigo: codigo(t), avisos: {} };
  put('bookings', b);
  if (q.cupon) put('coupons', { id: q.cupon.id, usos: (q.cupon.usos || 0) + 1 });
  msg(tid, { cid: c.id, bid: b.id, tipo: 'Confirmación', texto: `Hola ${c.nombre.split(' ')[0]} ✨ Tu cita en ${t.nombre} quedó confirmada: ${inicio.slice(0, 10)} a las ${inicio.slice(11)}. Código ${b.codigo}.` });
  return b;
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
/** Cobro en caja: cita (opcional) + productos, con descuento, propina, tarjeta de regalo y paquete. */
export function cobrar(bid, { metodo, propina = 0, descuento = 0, productos = [], gift = '', paquete = '' , tid = null, cid = null, staffId = null }) {
  const b = bid ? booking(bid) : null; tid = b?.tid || tid;
  let servicios = b ? b.total : 0; let usoPaquete = null;
  if (b && paquete) { const cp = cpackages(tid).find(x => x.id === paquete && x.restantes > 0); if (cp) { usoPaquete = cp; servicios = 0; } }
  const prods = productos.map(x => ({ ...x, p: product(x.pid) })).filter(x => x.p);
  const vProd = prods.reduce((a, x) => a + x.p.precio * x.qty, 0);
  const sub = +Math.max(0, servicios + vProd - descuento).toFixed(2); const itbms = +(sub * ITBMS).toFixed(2);
  let total = +(sub + itbms + Number(propina || 0)).toFixed(2);
  const previo = b?.pago?.pagado || 0; let pendiente = +(total - previo).toFixed(2);
  let pagoGift = 0;
  if (gift) { const g = giftcards(tid).find(x => x.codigo.toUpperCase() === gift.toUpperCase()); if (g && g.saldo > 0) { pagoGift = Math.min(g.saldo, pendiente); put('giftcards', { id: g.id, saldo: +(g.saldo - pagoGift).toFixed(2) }); pendiente = +(pendiente - pagoGift).toFixed(2); } }
  prods.forEach(x => put('products', { id: x.p.id, stock: Math.max(0, (x.p.stock || 0) - x.qty), vendidos: (x.p.vendidos || 0) + x.qty }));
  if (usoPaquete) put('cpackages', { id: usoPaquete.id, restantes: usoPaquete.restantes - 1 });
  put('sales', { id: uid('v'), tid, bid: bid || null, cid: b?.cid || cid, staffId: b?.staffId || staffId, fecha: iso(new Date()), sub, servicios, productos: prods.map(x => ({ pid: x.pid, nombre: x.p.nombre, qty: x.qty, precio: x.p.precio })), itbms, propina: Number(propina || 0), total, cobrado: pendiente, gift: pagoGift, paquete: !!usoPaquete, metodo });
  if (b) { estado(bid, 'completada', { pago: { ...b.pago, pagado: total, metodo } });
    const c = client(b.cid); const t = tenant(tid); if (c && t.avisos?.gracias !== false) msg(tid, { cid: c.id, bid, tipo: 'Gracias + reseña', texto: `¡Gracias por venir a ${t.nombre}, ${c.nombre.split(' ')[0]}! 💛 ¿Nos dejas tu reseña? Te toma 1 minuto.` }); }
  return { sub, itbms, total, pendiente, pagoGift };
}
export function venderRegalo(tid, { monto, de, para, tel, metodo }) {
  const g = put('giftcards', { id: uid('g'), tid, codigo: 'REGALO-' + Math.random().toString(36).slice(2, 6).toUpperCase(), monto: +monto, saldo: +monto, de, para, tel, creado: iso(new Date()) });
  put('sales', { id: uid('v'), tid, bid: null, fecha: iso(new Date()), sub: +monto, servicios: 0, productos: [], itbms: 0, propina: 0, total: +monto, cobrado: +monto, metodo, concepto: 'Tarjeta de regalo ' + g.codigo });
  return g;
}
export function venderPaquete(tid, { pkgId, cid, metodo }) {
  const k = packages(tid).find(x => x.id === pkgId); const cp = put('cpackages', { id: uid('k'), tid, cid, pkgId, nombre: k.nombre, servicio: k.servicio, restantes: k.sesiones, total: k.sesiones, vence: ymd(addDays(new Date(), k.dias || 90)), creado: iso(new Date()) });
  put('sales', { id: uid('v'), tid, bid: null, cid, fecha: iso(new Date()), sub: k.precio, servicios: k.precio, productos: [], itbms: +(k.precio * ITBMS).toFixed(2), propina: 0, total: +(k.precio * (1 + ITBMS)).toFixed(2), cobrado: +(k.precio * (1 + ITBMS)).toFixed(2), metodo, concepto: 'Paquete ' + k.nombre });
  return cp;
}
/* fila de clientes sin cita */
export function unirseFila(tid, { nombre, tel, servicio }) { const n = queue(tid).filter(q => q.creado.startsWith(ymd(new Date()))).length + 1; return put('queue', { id: uid('q'), tid, nombre, tel, servicio, numero: n, estado: 'esperando', creado: iso(new Date()) }); }
export function esperaFila(tid) { const w = queue(tid).filter(q => q.estado === 'esperando' && q.creado.startsWith(ymd(new Date()))); const libres = Math.max(1, staff(tid).filter(m => m.estadoFila !== 'almorzando').length); return w.map((q, i) => ({ ...q, pos: i + 1, min: Math.round((i + 1) * 30 / libres) })); }
/* avisos automáticos (en la versión real los manda el servidor; aquí se generan al abrir) */
export function procesarAvisos(tid) {
  const t = tenant(tid); const a = t.avisos || {}; const ahora = new Date();
  bookings(tid).filter(b => b.estado === 'confirmada' && !b.cid.startsWith('x')).forEach(b => {
    const f = parse(b.inicio); const min = (f - ahora) / 60000; const av = b.avisos || {}; const c = client(b.cid); if (!c) return;
    if (a.h24 !== false && min > 0 && min <= 1440 && !av.h24 && b.creado < iso(addDays(ahora, -0.04))) { msg(tid, { cid: c.id, bid: b.id, tipo: 'Recordatorio 24 h', texto: `Hola ${c.nombre.split(' ')[0]} 👋 Te esperamos mañana a las ${b.inicio.slice(11)} en ${t.nombre}. Responde 1 para confirmar o 2 para cambiar.` }); av.h24 = 1; put('bookings', { id: b.id, avisos: av }); }
    if (min > 0 && min <= (a.antes || 120) && !av.antes) { msg(tid, { cid: c.id, bid: b.id, tipo: `Recordatorio ${a.antes || 120} min`, texto: `¡Hoy es tu cita! ${b.inicio.slice(11)} en ${t.nombre}. Al llegar toca "Ya llegué" en tu pase.` }); av.antes = 1; put('bookings', { id: b.id, avisos: av }); }
  });
}

/* ---------- disponibilidad ---------- */
export function horarioDe(tid, staffId, fecha) {
  const t = tenant(tid); const dow = fecha.getDay();
  const m = staffId ? member(staffId) : null;
  if (m?.libres?.includes(ymd(fecha))) return [];
  if ((t.cierres || []).some(c => c.fecha === ymd(fecha))) return [];
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
export function slots(tid, items, staffId, fecha, paso = 15, extraDur = 0) {
  const dur = items.reduce((a, i) => a + (service(i)?.dur || 0), 0) + extraDur; if (!items.length) return [];
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
export const plantilla = tipo => (PLANTILLAS[tipo] || PLANTILLAS.barberia).s.map(([cat, nombre, dur, precio]) => ({ cat, nombre, dur, precio }));
const PLANTILLAS = {
  barberia: { cats: ['Cortes', 'Barba', 'Combos', 'Extras'], s: [['Cortes', 'Corte clásico', 30, 12], ['Cortes', 'Fade / degradado', 40, 15], ['Cortes', 'Corte niño', 30, 10], ['Barba', 'Perfilado de barba', 20, 8], ['Barba', 'Barba con toalla caliente', 30, 12], ['Combos', 'Corte + barba', 60, 22], ['Extras', 'Cejas', 10, 4], ['Extras', 'Mascarilla negra', 15, 8]] },
  unas: { cats: ['Manos', 'Pies', 'Sistemas', 'Extras'], s: [['Manos', 'Manicure', 40, 15], ['Manos', 'Manicure semipermanente', 60, 25], ['Pies', 'Pedicure spa', 60, 25], ['Sistemas', 'Acrílicas', 120, 45], ['Sistemas', 'Poligel', 100, 40], ['Sistemas', 'Retoque', 75, 30], ['Extras', 'Diseño por uña', 10, 2], ['Extras', 'Parafina', 15, 8]] },
  salon: { cats: ['Corte', 'Color', 'Tratamientos', 'Peinados'], s: [['Corte', 'Corte de dama', 45, 25], ['Corte', 'Corte de caballero', 30, 12], ['Color', 'Tinte completo', 120, 60], ['Color', 'Mechas / balayage', 180, 120], ['Tratamientos', 'Keratina', 150, 90], ['Tratamientos', 'Hidratación profunda', 45, 30], ['Peinados', 'Blower', 45, 20], ['Peinados', 'Peinado de evento', 60, 40]] },
  spa: { cats: ['Masajes', 'Faciales', 'Cuerpo'], s: [['Masajes', 'Masaje relajante 60 min', 60, 55], ['Masajes', 'Masaje descontracturante', 60, 65], ['Masajes', 'Piedras calientes', 75, 75], ['Faciales', 'Limpieza facial profunda', 60, 50], ['Faciales', 'Hidrafacial', 50, 85], ['Cuerpo', 'Exfoliación corporal', 45, 40]] },
  estetica: { cats: ['Cejas', 'Pestañas', 'Depilación'], s: [['Cejas', 'Diseño de cejas', 30, 15], ['Cejas', 'Laminado de cejas', 45, 35], ['Pestañas', 'Lifting de pestañas', 60, 40], ['Pestañas', 'Extensiones clásicas', 120, 60], ['Depilación', 'Depilación de axilas', 15, 10], ['Depilación', 'Piernas completas', 45, 30]] },
};
const MEMB = {
  barberia: [['Club Corte', 30, '2 cortes al mes + 10% en productos'], ['Club Corte + Barba', 45, '2 cortes + 2 barbas al mes, prioridad de agenda'], ['Club VIP', 75, 'Cortes y barbas ilimitados (1 por semana) + bebida']],
  unas: [['Manos siempre listas', 40, '2 manicures semipermanentes al mes'], ['Manos y pies', 65, '2 manicures + 1 pedicure spa al mes']],
  salon: [['Blower Club', 45, '4 blowers al mes'], ['Cabello perfecto', 85, '4 blowers + 1 hidratación profunda al mes']],
  spa: [['Calma mensual', 65, '1 masaje de 60 min al mes + 10% en productos'], ['Bienestar total', 120, '2 masajes + 1 facial al mes']],
  estetica: [['Cejas siempre', 25, '2 diseños de cejas al mes'], ['Mirada perfecta', 55, 'Cejas + lifting de pestañas cada mes']] };
export const ZONAS = { 'san francisco': [8.993, -79.505], 'costa del este': [9.012, -79.462], 'coronado': [8.534, -79.893], 'via espana': [8.999, -79.522], 'vía españa': [8.999, -79.522], 'bella vista': [8.983, -79.527], 'obarrio': [8.990, -79.517], 'el dorado': [9.007, -79.546], 'chorrera': [8.880, -79.783], 'arraijan': [8.948, -79.660], 'san miguelito': [9.033, -79.500], 'condado del rey': [9.028, -79.530], 'albrook': [8.973, -79.553], 'punta pacifica': [8.979, -79.509], 'vista alegre': [8.928, -79.700], 'david': [8.427, -82.431], 'santiago': [8.100, -80.983], 'colon': [9.359, -79.900], 'colón': [9.359, -79.900], 'chitre': [7.964, -80.429], 'boquete': [8.780, -82.441], 'penonome': [8.519, -80.357], 'las tablas': [7.765, -80.274], 'bocas': [9.340, -82.241], 'panama': [8.983, -79.519], 'panamá': [8.983, -79.519] };
export function geoDe(t) { if (t.geo) return t.geo; const z = (t.zona || '').toLowerCase(); const k = Object.keys(ZONAS).find(k => z.includes(k)); const g = ZONAS[k || 'panamá']; return [g[0] + (Math.random() - .5) * .004, g[1] + (Math.random() - .5) * .004]; }
export const TIPOS = { barberia: 'Barbería', unas: 'Uñas', salon: 'Salón de belleza', spa: 'Spa', estetica: 'Estética' };
const HOR = (a = '09:00', b = '19:00', dom = false) => ({ 0: dom ? [['10:00', '15:00']] : [], 1: [[a, b]], 2: [[a, b]], 3: [[a, b]], 4: [[a, b]], 5: [[a, b]], 6: [['09:00', '17:00']] });

const EXTRAS = {
  barberia: [['Diseño / rayitas', 3, 5], ['Lavado', 3, 10], ['Mascarilla negra', 6, 10], ['Cejas', 3, 5]],
  unas: [['Diseño por uña', 2, 5], ['Francés', 5, 10], ['Retiro de sistema', 8, 15], ['Parafina', 6, 10]],
  salon: [['Plancha adicional', 8, 15], ['Ampolla', 10, 5], ['Lavado especial', 5, 10], ['Ondas', 10, 15]],
  spa: [['Aromaterapia', 8, 0], ['Piedras calientes', 12, 15], ['Exfoliación de pies', 10, 15]],
  estetica: [['Tinte de cejas', 8, 10], ['Henna', 10, 10], ['Mascarilla calmante', 6, 10]] };
const PRODUCTOS = {
  barberia: [['Cera mate', 14, 18], ['Aceite para barba', 16, 12], ['Shampoo de barba', 12, 10], ['Pomada brillo', 13, 6], ['Peine de madera', 6, 25]],
  unas: [['Aceite de cutícula', 8, 20], ['Crema de manos', 10, 14], ['Lima profesional', 4, 30], ['Top coat', 9, 3]],
  salon: [['Shampoo sin sal', 18, 15], ['Mascarilla reparadora', 22, 9], ['Protector térmico', 16, 11], ['Sérum de puntas', 20, 4]],
  spa: [['Aceite de masaje', 18, 10], ['Vela aromática', 15, 8], ['Crema corporal', 20, 12]],
  estetica: [['Sérum de pestañas', 28, 7], ['Gel de cejas', 12, 10], ['Desmaquillante', 14, 9]] };
export function crearNegocio({ nombre, tipo = 'barberia', zona = '', color = '#FF7A59', color2 = '#FFB547', tel = '', equipo = ['Ana', 'Luis'], plan = 'Esencial', demo = false, servicios = null }) {
  const tid = uid('t');
  let slug = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'negocio';
  while (tenant(slug)) slug += '-' + Math.floor(Math.random() * 9);
  const anio = new Date().getFullYear();
  const t = { id: tid, slug, nombre, tipo, zona, color, color2, tel, plan, estado: 'activo', creado: iso(new Date()), demo,
    horario: HOR(), deposito: { activo: tipo !== 'barberia', pct: 20 }, politica: 'Puedes cancelar o cambiar gratis hasta 4 horas antes.',
    fidelidad: { meta: 10, premio: 'Servicio gratis' }, referidos: { activo: true, pct: 10 }, avisos: { h24: true, antes: 120, gracias: true, tetoca: 21 },
    sucursales: [{ id: 'principal', nombre: zona ? zona.split(',')[0] : 'Principal', dir: zona }], fila: true, idiomas: ['es', 'en'],
    cierres: [{ fecha: `${anio}-12-25`, motivo: 'Navidad' }, { fecha: `${anio + 1}-01-01`, motivo: 'Año Nuevo' }],
    extras: (EXTRAS[tipo] || EXTRAS.barberia).map(([n, p, d]) => ({ id: uid('e'), nombre: n, precio: p, dur: d })),
    membresias: (MEMB[tipo] || []).map(([n, p, i]) => ({ id: uid('mb'), nombre: n, precio: p, incluye: i, activa: true })),
    lema: { barberia: 'Tu corte, a tu hora.', unas: 'Uñas perfectas, sin esperar.', salon: 'Tu estilo, a tu hora.', spa: 'Tu momento de calma.', estetica: 'Mírate increíble.' }[tipo] || 'Reserva en segundos.' };
  t.geo = geoDe(t);
  db.tenants.push(t);
  const P = PLANTILLAS[tipo] || PLANTILLAS.barberia;
  const lista = servicios && servicios.length ? servicios.map(x => [x.cat || 'Servicios', x.nombre, +x.dur || 30, +x.precio || 0]) : P.s;
  const sids = lista.map(([cat, n, dur, precio]) => { const s = { id: uid('s'), tid, cat, nombre: n, dur, precio, desde: false, precios: {} }; db.services.push(s); return s.id; });
  const colores = ['#FF7A59', '#7C5CFF', '#2EC5FF', '#3DDC97', '#FFB547', '#FF5C8A'];
  equipo.filter(Boolean).forEach((n, i) => db.staff.push({ id: uid('m'), tid, nombre: n, rol: i === 0 ? 'Dueño(a) · ' + (TIPOS[tipo] || '') : 'Profesional', color: colores[i % colores.length], pin: String(1111 * ((i % 9) + 1)).slice(0, 4), servicios: null, comision: 40, bloqueos: [], libres: [], sucursal: 'principal', bio: '', estadoFila: 'disponible' }));
  (PRODUCTOS[tipo] || PRODUCTOS.barberia).forEach(([n, p, st]) => db.products.push({ id: uid('p'), tid, nombre: n, precio: p, stock: st, minimo: 5, costo: +(p * 0.45).toFixed(2), vendidos: 0 }));
  db.coupons.push({ id: uid('u'), tid, codigo: 'BIENVENIDA10', tipo: 'pct', valor: 10, activo: true, usos: 0, max: 0, vence: '', nota: 'Primera visita' });
  db.packages.push({ id: uid('k'), tid, nombre: '5 visitas de ' + (db.services.find(x => x.id === sids[0])?.nombre || 'servicio'), servicio: sids[0], sesiones: 5, precio: +((db.services.find(x => x.id === sids[0])?.precio || 10) * 4.5).toFixed(2), dias: 120, activo: true });
  save(); return t;
}

/* ---------- datos de ejemplo ---------- */
function seed() {
  db = { v: 4, tenants: [], services: [], staff: [], clients: [], bookings: [], sales: [], waitlist: [], reviews: [], offers: [], coupons: [], giftcards: [], products: [], packages: [], cpackages: [], expenses: [], queue: [], outbox: [] };
  const a = crearNegocioSeed({ nombre: 'Barbería Ejemplo', tipo: 'barberia', zona: 'San Francisco, Panamá', color: '#FF7A59', color2: '#FFB547', equipo: ['Carlos', 'Andrés', 'Kevin'], plan: 'Pro' }, 'barberia-ejemplo');
  const b = crearNegocioSeed({ nombre: 'Nails Studio Ejemplo', tipo: 'unas', zona: 'Costa del Este, Panamá', color: '#FF5C8A', color2: '#FFB3C7', equipo: ['Valentina', 'Sofía'], plan: 'Esencial' }, 'nails-ejemplo');
  const c = crearNegocioSeed({ nombre: 'Spa Ejemplo', tipo: 'spa', zona: 'Coronado, Panamá', color: '#3DDC97', color2: '#B8F5D9', equipo: ['Mariela', 'José'], plan: 'Pro' }, 'spa-ejemplo');
  // cada negocio con lo suyo: precios por profesional, ofertas, regalos, gastos, sucursales
  const BIOS = ['Más de 10 años de experiencia. Especialista en fades y diseño.', 'Detallista y puntual. Barba perfecta con toalla caliente.', 'Cortes modernos y para niños. Paciencia de oro.', 'Artista del color y las uñas esculpidas.', 'Manos suaves, masajes que se sienten.'];
  [a, b, c].forEach((t, k) => {
    const ms = db.staff.filter(m => m.tid === t.id); ms.forEach((m, i) => m.bio = BIOS[(i + k) % BIOS.length]);
    db.services.filter(s => s.tid === t.id).forEach(s => { s.precios = { [ms[0].id]: s.precio + (t.tipo === 'spa' ? 10 : 3) }; });
    const sv = db.services.filter(s => s.tid === t.id);
    db.offers.push({ id: uid('f'), tid: t.id, titulo: 'Martes de ' + sv[1].nombre.toLowerCase(), desc: '20% de descuento en ' + sv[1].nombre + ' todos los martes de diciembre.', tipo: 'pct', valor: 20, servicios: [sv[1].id], vence: ymd(addDays(new Date(), 30)), activa: true });
    db.offers.push({ id: uid('f'), tid: t.id, titulo: 'Combo navideño', desc: '$5 menos en ' + sv[sv.length - 3].nombre + ' hasta el 24.', tipo: 'monto', valor: 5, servicios: [sv[sv.length - 3].id], vence: ymd(addDays(new Date(), 26)), activa: true });
    db.coupons.push({ id: uid('u'), tid: t.id, codigo: 'NAVIDAD', tipo: 'monto', valor: 3, activo: true, usos: 4, max: 50, vence: ymd(addDays(new Date(), 30)), nota: 'Campaña de diciembre' });
    [['Ana Ríos', 'Para mamá', 40, 25], ['Luis Vega', 'Cumpleaños de Pedro', 25, 25]].forEach(([de, para, m, sal]) => db.giftcards.push({ id: uid('g'), tid: t.id, codigo: 'REGALO-' + Math.random().toString(36).slice(2, 6).toUpperCase(), monto: m, saldo: sal, de, para, tel: '', creado: iso(addDays(new Date(), -10)) }));
    [['Alquiler del local', 'Fijo', 900, -27], ['Luz y agua', 'Fijo', 140, -20], ['Productos (proveedor)', 'Insumos', 260, -12], ['Publicidad Instagram', 'Marketing', 60, -6], ['Limpieza', 'Insumos', 35, -2]].forEach(([c2, cat, m, d]) => db.expenses.push({ id: uid('x'), tid: t.id, concepto: c2, cat, monto: m, fecha: ymd(addDays(new Date(), d)) }));
  });
  a.sucursales = [{ id: 'principal', nombre: 'San Francisco', dir: 'Calle 74, San Francisco' }, { id: 'costa', nombre: 'Costa del Este', dir: 'Av. Centenario, Costa del Este' }];
  db.staff.filter(m => m.tid === a.id)[2].sucursal = 'costa';
  [a, b, c].forEach(t => historia(t.id));
  [a, b, c].forEach(t => db.clients.filter(c2 => c2.tid === t.id).slice(0, 7).forEach((c2, i) => { if (t.membresias[i % 2]) c2.membresia = t.membresias[i % 2].nombre; }));
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
          if (est === 'completada') { c.sellos = (c.sellos + 1) % 10; const it = +(s.precio * ITBMS).toFixed(2); const pr = rnd(4) ? 0 : 1 + rnd(3); db.sales.push({ id: uid('v'), tid, bid: b.id, cid: c.id, servicios: s.precio, productos: [], staffId: m.id, fecha: inicio, sub: s.precio, itbms: it, propina: pr, total: +(s.precio + it + pr).toFixed(2), cobrado: +(s.precio + it + pr).toFixed(2), metodo: b.pago.metodo }); }
          cur += s.dur + (rnd(3) ? 0 : 15);
        } else cur += 30;
      }
    });
  }
  ['Excelente atención, súper puntuales.', 'Me encantó, reservé en segundos.', 'El mejor de la zona. 10/10', 'Muy limpio y amables.', 'Siempre salgo feliz, recomendadísimo.', 'Rápido y sin esperar, como debe ser.', 'Me recordaron la cita y llegué a tiempo 🙌', 'Buen ambiente y buena música.', 'Precio justo por la calidad.'].forEach((txt, i) => db.reviews.push({ id: uid('r'), tid, staffId: ms[i % ms.length].id, cid: cs[i].id, estrellas: i % 4 === 3 ? 4 : 5, texto: txt, fecha: iso(addDays(new Date(), -i * 3)) }));
}

/* arrancar al final: todas las funciones ya existen */
db = load();
