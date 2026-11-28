/**
 * GLOW VENTAS — backend gratis en Google Apps Script (cuenta somosglowapp@gmail.com)
 *
 * Qué hace solo, 24/7:
 *  1. Guarda cada lead de la página de demos en la hoja "Leads" (la base de datos).
 *  2. Avisa al celular de Juan y Wander (ntfy) al instante.
 *  3. Le escribe al cliente (correo siempre; WhatsApp automático cuando se conecte la API del número de Glow):
 *     confirmación al agendar · recordatorio 24 h antes · recordatorio 2 h antes · "¿reagendamos?" si no se conectó ·
 *     propuesta personalizada (con video y link de pago) cuando Juan marca "demo hecha" ·
 *     seguimientos a los 2, 5 y 9 días si no ha pagado · bienvenida cuando se marca "cliente".
 *  4. Resumen diario 7 AM y recordatorio a Juan 1 h antes de cada demo.
 * Reglas: solo escribe a quien llenó el formulario y aceptó recibir mensajes; horario 8 AM–8 PM; nunca a "no contactar"/"perdido";
 * si responden BAJA se marca "no contactar". La IA siempre firma como "Equipo Glow".
 *
 * Instalar: Hoja nueva "Glow Ventas" > Extensiones > Apps Script > pegar este archivo > ejecutar setup() (autorizar) >
 * Implementar > Nueva implementación > Aplicación web (Ejecutar como: yo · Acceso: cualquier persona) > copiar URL.
 * Propiedades (Configuración del proyecto > Propiedades de la secuencia de comandos): ZOOM, PAGO_URL, VIDEO_URL, WA_JUAN,
 * WA_TOKEN y WA_PHONE_ID (cuando el número de Glow esté en la API de WhatsApp de Meta).
 */
const HEAD = ['id','creado','origen','nombre','negocio','tipo','zona','whatsapp','email','acepta','modo','equipo',
  'fecha','hora','estado','dueno','ultimo_toque','proximo_toque','toques','notas','reunion','enviados','actualizado'];
const ESTADOS = ['nuevo','confirmado','demo hecha','propuesta','cliente','perdido','no contactar'];
const TZ = 'America/Panama';
const SHEET_ID = '1sO8vWgdo5J_CBmCvGlhsPXXcra8xSqCfXqGC8dAWnFo'; // hoja "Glow Ventas" en somosglowapp@gmail.com
function libro() { return SpreadsheetApp.openById(SHEET_ID); }
const BASE = 'https://somosglow.github.io/demo/';

function P() { return PropertiesService.getScriptProperties(); }
function cfg(k, d) { const v = P().getProperty(k); return v === null || v === '' ? (d === undefined ? '' : d) : v; }

function setup() {
  const ss = libro();
  let sh = ss.getSheetByName('Leads');
  if (!sh) { sh = ss.insertSheet('Leads'); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  else { const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]; HEAD.forEach(k => { if (h.indexOf(k) < 0) sh.getRange(1, sh.getLastColumn() + 1).setValue(k); }); }
  const hh = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  ['fecha','hora','whatsapp','proximo_toque','id'].forEach(k => { const c = hh.indexOf(k); if (c >= 0) sh.getRange(1, c + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
  const p = P(), def = { CLAVE: Utilities.getUuid().slice(0, 8), TOPIC: 'glow-ventas-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16),
    ZOOM: '', PAGO_URL: '', VIDEO_URL: '', WA_JUAN: '', WA_TOKEN: '', WA_PHONE_ID: '', APP: BASE + 'ventas/', EMAILS: '', AUTO: 'si' };
  Object.keys(def).forEach(k => { if (p.getProperty(k) === null) p.setProperty(k, def[k]); });
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('resumenDiario').timeBased().atHour(7).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('automatizacion').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('revisarBajas').timeBased().everyHours(1).create();
  Logger.log('CLAVE del equipo: ' + p.getProperty('CLAVE') + ' · Tema ntfy: ' + p.getProperty('TOPIC'));
}

// ---------- base de datos ----------
// Sala de la videollamada: la de Zoom de Glow si está configurada; si no, una sala de Jitsi Meet única (gratis, sin cuenta para el cliente).
function sala(id) { return cfg('ZOOM') || ('https://meet.jit.si/GlowDemo-' + (id || Utilities.getUuid().slice(0, 8))); }
function hoja() { return libro().getSheetByName('Leads'); }
function cab() { return hoja().getRange(1, 1, 1, hoja().getLastColumn()).getValues()[0]; }
function filas() {
  const v = hoja().getDataRange().getValues(); const h = v.shift();
  const fmt = { fecha: 'yyyy-MM-dd', hora: 'HH:mm', proximo_toque: 'yyyy-MM-dd' };
  return v.map((r, i) => { const o = { _fila: i + 2 }; h.forEach((k, j) => o[k] = r[j] instanceof Date ? Utilities.formatDate(r[j], TZ, fmt[k] || "yyyy-MM-dd'T'HH:mm") : r[j]); return o; });
}
function set(f, k, val) { const c = cab().indexOf(k); if (c >= 0) hoja().getRange(f._fila, c + 1).setValue(val); f[k] = val; }
function enviados(f) { try { return JSON.parse(f.enviados || '{}'); } catch (e) { return {}; } }
function marcar(f, key) { const e = enviados(f); e[key] = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm"); set(f, 'enviados', JSON.stringify(e)); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const corto = (x, n) => String(x == null ? '' : x).slice(0, n || 120);

// ---------- API ----------
function doGet(e) {
  const q = e.parameter || {};
  if (q.action === 'propuesta') {           // página pública de propuesta: solo datos no sensibles
    const f = filas().find(x => x.id === q.id); if (!f) return out({ ok: false });
    return out({ ok: true, negocio: f.negocio, nombre: String(f.nombre).split(' ')[0], tipo: f.tipo, zona: f.zona, equipo: f.equipo, fecha: f.fecha, hora: f.hora, modo: f.modo,
      pago: cfg('PAGO_URL'), video: cfg('VIDEO_URL'), wa: cfg('WA_JUAN') });
  }
  if (q.action === 'cupos') return out({ ok: true, tomados: filas().filter(x => x.estado === 'cliente').length });
  if (q.key !== cfg('CLAVE')) return out({ ok: false, error: 'clave' });
  return out({ ok: true, leads: filas(), config: { zoom: cfg('ZOOM'), topic: cfg('TOPIC'), estados: ESTADOS,
    pago: cfg('PAGO_URL'), video: cfg('VIDEO_URL'), wa_api: !!(cfg('WA_TOKEN') && cfg('WA_PHONE_ID')), auto: cfg('AUTO', 'si') } });
}

function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (b.action === 'nuevo') return out(nuevo(b, b.key === cfg('CLAVE')));
    if (b.action === 'onboarding') return out(onboarding(b));
    if (b.action === 'chat') return out(chat(b));
    if (b.key !== cfg('CLAVE')) return out({ ok: false, error: 'clave' });
    if (b.action === 'actualizar') return out(actualizar(b));
    if (b.action === 'config') { ['ZOOM','PAGO_URL','VIDEO_URL','WA_JUAN','EMAILS','AUTO'].forEach(k => { if (b[k.toLowerCase()] != null) P().setProperty(k, corto(b[k.toLowerCase()], 400)); }); return out({ ok: true }); }
    if (b.action === 'importar') return out(importar(b));
    if (b.action === 'enviar') { const f = filas().find(x => x.id === b.id); if (!f) return out({ ok: false }); contactar(f, b.paso, true); return out({ ok: true }); }
    return out({ ok: false, error: 'accion' });
  } finally { lock.releaseLock(); }
}

function nuevo(b, interno) {
  const tel = corto(b.whatsapp, 20).replace(/[^\d+]/g, '');
  const email = corto(b.email, 120).trim().toLowerCase();
  if (!corto(b.negocio).trim() || tel.replace(/\D/g, '').length < 7) return { ok: false, error: 'datos' };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'correo' };
  const c = CacheService.getScriptCache(); const n = Number(c.get('n') || 0);
  if (!interno && n > 30) return { ok: false, error: 'limite' }; c.put('n', String(n + 1), 3600);
  const ahora = new Date();
  const f = { id: Utilities.getUuid().slice(0, 8), creado: ahora, origen: corto(b.origen, 30), nombre: corto(b.nombre, 80), negocio: corto(b.negocio, 80),
    tipo: corto(b.tipo, 30), zona: corto(b.zona, 80), whatsapp: tel, email, acepta: b.acepta ? 'si' : (interno ? 'manual' : 'no'),
    modo: corto(b.modo, 30), equipo: corto(b.equipo, 20), fecha: corto(b.fecha, 10), hora: corto(b.hora, 5),
    estado: 'nuevo', dueno: corto(b.dueno || 'Juan', 20), ultimo_toque: '', proximo_toque: b.fecha ? '' : Utilities.formatDate(ahora, TZ, 'yyyy-MM-dd'),
    toques: 0, notas: corto(b.notas, 500), reunion: corto(b.modo, 30) === 'Videollamada' ? sala(null) : '', enviados: '{}', actualizado: ahora };
  hoja().appendRow(cab().map(k => f[k] === undefined ? '' : f[k]));
  f._fila = hoja().getLastRow();
  avisar(`🗓️ Nueva demo: ${f.negocio}`, `${f.tipo || 'Negocio'} en ${f.zona || '—'}${f.fecha ? ' · ' + fechaLarga(f.fecha) + ' ' + h12(f.hora) : ''} · ${f.modo}\nAbre Glow Ventas para llamar o escribir.`, 'high', f.id);
  if (!interno && f.fecha) contactar(f, 'confirmacion');
  return { ok: true, id: f.id };
}

// Carga la lista de prospectos en frío: estado 'prospecto', sin avisos ni mensajes automáticos (Juan escribe a mano).
function importar(b) {
  const ya = new Set(filas().map(f => String(f.whatsapp).replace(/\D/g, '')));
  const ahora = new Date(); let n = 0, rep = 0;
  (b.filas || []).slice(0, 300).forEach(x => {
    const tel = corto(x.whatsapp, 20).replace(/[^\d+]/g, ''); const d = tel.replace(/\D/g, '');
    if (!corto(x.negocio).trim() || d.length < 7) return;
    if (ya.has(d)) { rep++; return; } ya.add(d);
    const f = { id: Utilities.getUuid().slice(0, 8), creado: ahora, origen: corto(x.origen || 'lista', 30), nombre: corto(x.nombre, 80), negocio: corto(x.negocio, 80),
      tipo: corto(x.tipo, 30), zona: corto(x.zona, 80), whatsapp: tel, email: '', acepta: 'no', modo: '', equipo: '', fecha: '', hora: '',
      estado: 'prospecto', dueno: corto(x.dueno || 'Juan', 20), ultimo_toque: '', proximo_toque: corto(x.proximo_toque, 10), toques: 0,
      notas: corto(x.notas, 500), reunion: '', enviados: '{}', actualizado: ahora };
    hoja().appendRow(cab().map(k => f[k] === undefined ? '' : f[k])); n++;
  });
  return { ok: true, importados: n, repetidos: rep };
}

function actualizar(b) {
  const f = filas().find(x => x.id === b.id); if (!f) return { ok: false, error: 'no existe' };
  const antes = f.estado;
  ['estado','dueno','proximo_toque','notas','reunion','fecha','hora','modo','email'].forEach(k => { if (b[k] != null) set(f, k, corto(b[k], 2000)); });
  if (b.fecha != null || b.hora != null) { const e = enviados(f); delete e.rec24; delete e.rec2; delete e.noshow; set(f, 'enviados', JSON.stringify(e)); }
  if (b.toque) { set(f, 'ultimo_toque', new Date()); set(f, 'toques', Number(f.toques || 0) + 1);
    if (b.toque_nota) set(f, 'notas', corto((f.notas ? f.notas + '\n' : '') + Utilities.formatDate(new Date(), TZ, 'dd/MM HH:mm') + ' ' + b.toque_nota, 3000)); }
  set(f, 'actualizado', new Date());
  if (b.estado === 'demo hecha' && antes !== 'demo hecha') contactar(f, 'propuesta');
  if (b.estado === 'cliente' && antes !== 'cliente') contactar(f, 'bienvenida');
  return { ok: true };
}

// ---------- onboarding (cliente que ya pagó llena los datos de su app) ----------
const OB = ['fecha','lead','negocio','nombre','whatsapp','email','direccion','instagram','colores','eslogan','servicios','horario','equipo','reglas','extra','estado'];
function onboarding(b) {
  if (!corto(b.negocio).trim()) return { ok: false, error: 'datos' };
  const ss = libro(); let sh = ss.getSheetByName('Onboarding');
  if (!sh) { sh = ss.insertSheet('Onboarding'); sh.appendRow(OB); sh.setFrozenRows(1); }
  const f = { fecha: new Date(), estado: 'por montar' }; OB.forEach(k => { if (k !== 'fecha' && k !== 'estado') f[k] = corto(b[k], 1500); });
  sh.appendRow(OB.map(k => f[k] || ''));
  const L = filas().find(x => (f.lead && x.id === f.lead) || (String(x.negocio).toLowerCase() === String(f.negocio).toLowerCase()));
  if (L) set(L, 'notas', corto((L.notas ? L.notas + '\n' : '') + Utilities.formatDate(new Date(), TZ, 'dd/MM HH:mm') + ' Onboarding recibido ✅', 3000));
  avisar(`🎉 Onboarding listo: ${f.negocio}`, `Ya mandó sus datos (servicios, horario, equipo). Hay que montar su app.`, 'high', L ? L.id : '');
  return { ok: true };
}

// ---------- asistente virtual 24/7 (IA). Se activa poniendo AI_KEY (llave de la API de Anthropic) en las propiedades ----------
const AI_SISTEMA = `Eres el asistente virtual de Glow en su página web (Panamá). Respondes en español, cálido, claro y corto (máximo 5 líneas).
Glow: app de citas con la marca de cada negocio (logo, colores, servicios, precios) para barberías, salones, spas, uñas y estéticas. Incluye: reserva en 3 toques sin registrarse, recordatorios automáticos, tarjeta de fidelidad (12 sellos, 2 de regalo), perfil de Google optimizado, QR y material para el local, agenda para el equipo, instalación y capacitación hechas por el equipo de Glow.
Planes: Esencial $35/mes o $350/año (2 meses gratis). Pro $79/mes o $790/año, en PREVENTA (asistente IA de WhatsApp, recordatorios por WhatsApp, depósitos Yappy/tarjeta, reseñas en Google, campañas de reactivación, reportes, multi-sucursal, soporte prioritario; se activa por partes cuando cada función esté probada y no se cobra la diferencia hasta entonces). Fundadores (primeros 10 negocios): instalación $175 en vez de $350 y mensualidad congelada en $35. Pagos con tarjeta, Yappy o transferencia; factura electrónica por correo.
Demo gratis de 20 minutos (videollamada, llamada o en el local) que se agenda en https://somosglow.github.io/demo/ . WhatsApp de Glow: +507 6130-5139. En la demo atiende Juan, del equipo.
Reglas: si preguntan, di con naturalidad que eres un asistente virtual. No inventes cifras de resultados, fechas de entrega, condiciones de contrato ni funciones que no estén aquí; si no sabes algo, ofrece que Juan lo responda por WhatsApp. Siempre que tenga sentido, invita a agendar la demo. No pidas datos de pago ni contraseñas. Nunca menciones "WM".`;
function chat(b) {
  const key = cfg('AI_KEY'); if (!key) return { ok: false, error: 'sin IA' };
  const c = CacheService.getScriptCache(), n = Number(c.get('chat') || 0); if (n > 300) return { ok: false, error: 'limite' }; c.put('chat', String(n + 1), 3600);
  const msgs = (Array.isArray(b.mensajes) ? b.mensajes : []).slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: corto(m.content, 600) })).filter(m => m.content);
  if (!msgs.length || msgs[0].role !== 'user') return { ok: false };
  const sys = AI_SISTEMA + (b.negocio ? `\nEl visitante vino desde un link personalizado para el negocio: ${corto(b.negocio, 60)}.` : '') + `\nPágina actual: ${corto(b.pagina, 20)}.`;
  try {
    const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: cfg('AI_MODEL', 'claude-haiku-5-5'), max_tokens: 350, system: sys, messages: msgs }) });
    if (r.getResponseCode() >= 300) return { ok: false, error: 'ia' };
    const j = JSON.parse(r.getContentText()); const t = (j.content || []).filter(x => x.type === 'text').map(x => x.text).join('').trim();
    return t ? { ok: true, reply: t } : { ok: false };
  } catch (x) { return { ok: false, error: 'ia' }; }
}

// ---------- secuencia automática ----------
function enHorario() { const h = Number(Utilities.formatDate(new Date(), TZ, 'H')); return h >= 8 && h < 20; }
function demoDate(f) { return f.fecha && f.hora ? new Date(f.fecha + 'T' + f.hora + ':00-05:00') : null; }
function diasDesde(iso) { return iso ? (new Date() - new Date(iso + ':00-05:00')) / 86400000 : 0; }

function automatizacion() {
  if (cfg('AUTO', 'si') !== 'si') return;
  const ahora = new Date(), c = CacheService.getScriptCache();
  filas().forEach(f => {
    if (['no contactar','perdido'].includes(f.estado)) return;
    const e = enviados(f), d = demoDate(f), min = d ? (d - ahora) / 60000 : null;
    // aviso interno a Juan 1 h antes
    if (d && min > 0 && min <= 60 && !c.get('j' + f.id)) { c.put('j' + f.id, '1', 21600);
      avisar(`⏰ En ${Math.round(min)} min: demo con ${f.negocio}`, `${f.modo} · ${f.nombre} · ${f.whatsapp}`, 'high', f.id); }
    if (!enHorario() && !(d && min > 0 && min <= 150)) return;   // fuera de horario solo el recordatorio de 2 h
    if (['nuevo','confirmado'].includes(f.estado) && d) {
      if (min <= 24 * 60 && min > 150 && !e.rec24 && (new Date() - new Date(f.creado + ':00-05:00')) > 6 * 3600000) contactar(f, 'rec24');
      else if (min <= 150 && min > 0 && !e.rec2) contactar(f, 'rec2');
      else if (min < -60 && min > -24 * 60 && !e.noshow) { contactar(f, 'noshow'); avisar(`❓ ¿Se hizo la demo con ${f.negocio}?`, 'Márcala como "demo hecha" en Glow Ventas para que salga la propuesta, o reagenda.', 'default', f.id); }
    }
    if (f.estado === 'propuesta' || f.estado === 'demo hecha') {
      const base = e.propuesta; if (!base) return;
      const dd = diasDesde(base);
      if (dd >= 2 && !e.seg1) contactar(f, 'seg1');
      else if (dd >= 5 && !e.seg2) contactar(f, 'seg2');
      else if (dd >= 9 && !e.seg3) contactar(f, 'seg3');
    }
  });
}

function contactar(f, paso, forzado) {
  if (['no contactar'].includes(f.estado)) return;
  if (f.acepta === 'no' && !forzado) return;
  const m = mensajes(f)[paso]; if (!m) return;
  let ok = false;
  if (f.email) { try { GmailApp.sendEmail(f.email, m.asunto, m.texto + PIE_TXT, { name: 'Glow', htmlBody: html(m), replyTo: 'somosglowapp@gmail.com' }); ok = true; } catch (x) {} }
  const wa = waEnviar(f, paso, m);
  if (!wa) avisar(`💬 WhatsApp para ${f.negocio}: ${m.corto}`, 'Toca para abrir Glow Ventas y enviarlo con un toque.', 'default', f.id);
  marcar(f, paso);
  if (paso === 'propuesta') set(f, 'estado', 'propuesta');
  set(f, 'toques', Number(f.toques || 0) + 1); set(f, 'ultimo_toque', new Date());
  set(f, 'notas', corto((f.notas ? f.notas + '\n' : '') + Utilities.formatDate(new Date(), TZ, 'dd/MM HH:mm') + ` Auto: ${m.corto} (${[ok ? 'correo' : '', wa ? 'WhatsApp' : ''].filter(Boolean).join(' + ') || 'pendiente WhatsApp manual'})`, 3000));
}

// ---------- textos (firma Equipo Glow; sin promesas de cifras) ----------
function mensajes(f) {
  const n = String(f.nombre || '').split(' ')[0] || 'hola', neg = f.negocio, cuando = f.fecha ? `${fechaLarga(f.fecha)} a las ${h12(f.hora)}` : '';
  const z = f.reunion || sala(f.id), video = String(f.modo).indexOf('Video') >= 0;
  const lugar = video ? (z ? `Entras aquí: ${z}` : 'Te enviamos el link de la videollamada antes de empezar.') :
    String(f.modo).indexOf('Visita') >= 0 ? 'Juan te visita en tu local; si cambia algo, responde este mensaje.' : 'Juan te llama a este número.';
  const prop = `${BASE}propuesta/?id=${f.id}`, reag = `${BASE}?o=reagendar&negocio=${encodeURIComponent(neg)}`;
  return {
    confirmacion: { corto: 'confirmación de demo', asunto: `✅ Tu demo de Glow para ${neg} quedó agendada`,
      texto: `Hola ${n} 👋\n\nTu demo gratis de Glow para ${neg} quedó para el ${cuando} (${String(f.modo).toLowerCase()}).\n${lugar}\n\nEn 20 minutos te mostramos tu propia app de citas con la marca de ${neg}. Mientras tanto, mira tu presentación personalizada: ${BASE}presentacion/?id=${f.id}&negocio=${encodeURIComponent(neg)}\nSi necesitas cambiar la hora: ${reag}\n\nEquipo Glow ✨` },
    rec24: { corto: 'recordatorio 24 h', asunto: `Mañana es tu demo de Glow, ${n}`,
      texto: `Hola ${n}, te recordamos que mañana ${cuando} es la demo de Glow para ${neg}.\n${lugar}\n\n¿Te sigue quedando bien? Si no, elige otra hora aquí: ${reag}\n\nEquipo Glow ✨` },
    rec2: { corto: 'recordatorio 2 h', asunto: `En 2 horas: tu demo de Glow`,
      texto: `¡Hola ${n}! En un rato (${h12(f.hora)}) es tu demo de Glow.\n${lugar}\nNos vemos 🙌\n\nEquipo Glow ✨` },
    noshow: { corto: '¿reagendamos?', asunto: `¿Reagendamos tu demo de Glow?`,
      texto: `Hola ${n}, parece que hoy no pudimos conectarnos para la demo de ${neg}. ¡Pasa! Elige otro día y hora aquí: ${reag}\n\nEquipo Glow ✨` },
    propuesta: { corto: 'propuesta', asunto: `Tu propuesta de Glow para ${neg}`,
      texto: `Hola ${n}, ¡gracias por tu tiempo en la demo! 🙏\n\nAquí está tu propuesta personalizada para ${neg}, con el video, lo que incluye y cómo apartar tu cupo de fundador:\n${prop}\n\nPrecio fundador: $175 de instalación (normal $350) + $35/mes congelado. Cualquier duda, responde este mensaje y Juan te ayuda.\n\nEquipo Glow ✨` },
    seg1: { corto: 'seguimiento 1', asunto: `¿Pudiste ver la propuesta de ${neg}?`,
      texto: `Hola ${n}, ¿pudiste ver la propuesta de Glow para ${neg}? Si tienes alguna duda, te la resolvemos en 2 minutos.\n${prop}\n\nEquipo Glow ✨` },
    seg2: { corto: 'seguimiento 2', asunto: `Los cupos de fundador de Glow se están llenando`,
      texto: `Hola ${n}, te escribimos porque los cupos de precio fundador de Glow son pocos y queremos guardarte uno para ${neg}. Si quieres, lo dejamos listo esta semana: ${prop}\n\nEquipo Glow ✨` },
    seg3: { corto: 'último seguimiento', asunto: `Último mensaje sobre Glow para ${neg}`,
      texto: `Hola ${n}, no te queremos llenar de mensajes 🙏 Si más adelante quieres tu app de citas para ${neg}, aquí estamos: ${prop}\n¡Mucho éxito!\n\nEquipo Glow ✨` },
    bienvenida: { corto: 'bienvenida', asunto: `¡Bienvenido a Glow, ${neg}! 🎉`,
      texto: `Hola ${n}, ¡bienvenido a Glow! Ya eres parte de nuestros negocios fundadores.\n\nPrimer paso (5 minutos): llena aquí los datos de tu app (servicios, precios, horario y equipo): ${BASE}onboarding/?id=${f.id}&negocio=${encodeURIComponent(neg)}\nDespués Juan te escribe para coordinar la entrega y la capacitación de tu equipo. Tu factura electrónica te llega a este correo.\n\nEquipo Glow ✨` },
  };
}
const PIE_TXT = '\n\n—\nRecibes este mensaje porque agendaste una demo en Glow. Si no quieres recibir más mensajes, responde BAJA.';
function html(m) {
  const t = m.texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/(https?:\/\/\S+)/g, '<a href="$1" style="color:#FF7A59">$1</a>').replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1b1f2a"><div style="background:#0F1420;padding:18px;border-radius:14px 14px 0 0;text-align:center"><span style="color:#FFB547;font-size:24px;font-weight:bold">Glow ✨</span></div><div style="padding:20px;border:1px solid #eee;border-top:0;border-radius:0 0 14px 14px;line-height:1.6">${t}<p style="color:#999;font-size:12px;margin-top:24px">Recibes este mensaje porque agendaste una demo en Glow. Si no quieres recibir más mensajes, responde BAJA.</p></div></div>`;
}

// ---------- WhatsApp Cloud API (se activa sola cuando existan WA_TOKEN y WA_PHONE_ID) ----------
// Requiere plantillas aprobadas por Meta con estos nombres: glow_<paso> (1 variable de texto = el mensaje corto).
function waEnviar(f, paso, m) {
  const tok = cfg('WA_TOKEN'), pid = cfg('WA_PHONE_ID'); if (!tok || !pid || !f.whatsapp) return false;
  let to = String(f.whatsapp).replace(/\D/g, ''); if (to.length <= 8) to = '507' + to;
  const body = { messaging_product: 'whatsapp', to, type: 'template',
    template: { name: 'glow_' + paso, language: { code: 'es' }, components: [{ type: 'body', parameters: [{ type: 'text', text: String(f.nombre || '').split(' ')[0] || 'hola' }, { type: 'text', text: f.negocio }] }] } };
  try { const r = UrlFetchApp.fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + tok }, payload: JSON.stringify(body) });
    return r.getResponseCode() < 300; } catch (x) { return false; }
}

// ---------- bajas por correo ----------
function revisarBajas() {
  const hilos = GmailApp.search('newer_than:2d (subject:Glow) (BAJA OR "no me escriban" OR "no gracias")', 0, 30);
  if (!hilos.length) return; const L = filas();
  hilos.forEach(h => h.getMessages().forEach(msg => {
    const de = (msg.getFrom().match(/<([^>]+)>/) || [, msg.getFrom()])[1].toLowerCase();
    if (!/\bbaja\b/i.test(msg.getPlainBody().split('\n').slice(0, 5).join(' '))) return;
    L.filter(f => String(f.email).toLowerCase() === de && f.estado !== 'no contactar').forEach(f => { set(f, 'estado', 'no contactar'); avisar(`🚫 ${f.negocio} pidió no recibir más mensajes`, 'Marcado como "no contactar".', 'default', f.id); });
  }));
}

// ---------- avisos internos ----------
function avisar(titulo, texto, prioridad, id) {
  const app = cfg('APP', BASE + 'ventas/') + (id ? '#' + id : '');
  try { UrlFetchApp.fetch('https://ntfy.sh/', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ topic: cfg('TOPIC'), title: titulo, message: texto, priority: prioridad === 'high' ? 4 : 3, tags: ['sparkles'], click: app,
      actions: [{ action: 'view', label: 'Abrir Glow Ventas', url: app }] }) }); } catch (x) {}
  const emails = cfg('EMAILS'); if (emails) try { MailApp.sendEmail(emails, titulo, texto + '\n\n' + app); } catch (x) {}
}
function resumenDiario() {
  const hoy = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), L = filas();
  const demos = L.filter(x => x.fecha === hoy && !['perdido','no contactar'].includes(x.estado));
  const seg = L.filter(x => x.proximo_toque && String(x.proximo_toque).slice(0, 10) <= hoy && !['cliente','perdido','no contactar'].includes(x.estado));
  if (!demos.length && !seg.length) return;
  avisar('☀️ Hoy en Glow Ventas', `${demos.length} demo(s): ${demos.map(x => h12(x.hora) + ' ' + x.negocio).join(', ') || '—'}\n${seg.length} seguimiento(s) pendientes.`, 'default');
}

// ---------- utilidades ----------
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fechaLarga(f) { if (!f) return ''; const d = new Date(String(f).slice(0, 10) + 'T12:00:00-05:00'); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MES[d.getMonth()]}`; }
function h12(h) { if (!h) return ''; let [a, b] = String(h).split(':').map(Number); const p = a >= 12 ? 'pm' : 'am'; a = a % 12 || 12; return `${a}:${String(b).padStart(2, '0')} ${p}`; }
