/**
 * Glow Ventas — backend gratis en Google Apps Script (cuenta somosglowapp@gmail.com)
 * Guarda los leads en una Google Sheet, avisa al celular de Juan y Wander (ntfy)
 * y le da los datos a la app "Glow Ventas" (solo con la clave del equipo).
 *
 * Instalar: Hoja nueva "Glow Ventas" > Extensiones > Apps Script > pegar este archivo >
 * ejecutar setup() una vez (autorizar) > Implementar > Nueva implementación > Aplicación web
 * (Ejecutar como: yo · Acceso: cualquier persona) > copiar la URL.
 */
const HEAD = ['id','creado','origen','nombre','negocio','tipo','zona','whatsapp','modo','equipo',
  'fecha','hora','estado','dueno','ultimo_toque','proximo_toque','toques','notas','reunion','actualizado'];
const ESTADOS = ['nuevo','confirmado','demo hecha','propuesta','cliente','perdido','no contactar'];

function P() { return PropertiesService.getScriptProperties(); }
function cfg(k, d) { const v = P().getProperty(k); return v === null ? d : v; }

function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Leads');
  if (!sh) { sh = ss.insertSheet('Leads'); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  const p = P();
  if (!p.getProperty('CLAVE')) p.setProperty('CLAVE', Utilities.getUuid().slice(0, 8));
  if (!p.getProperty('TOPIC')) p.setProperty('TOPIC', 'glow-ventas-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16));
  if (!p.getProperty('ZOOM')) p.setProperty('ZOOM', '');          // link de la sala personal de Zoom de Juan
  if (!p.getProperty('APP')) p.setProperty('APP', 'https://somosglow.github.io/demo/ventas/');
  if (!p.getProperty('EMAILS')) p.setProperty('EMAILS', '');       // correos extra para avisos, separados por coma
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('resumenDiario').timeBased().atHour(7).everyDays(1).inTimezone('America/Panama').create();
  ScriptApp.newTrigger('recordatorios').timeBased().everyMinutes(30).create();
  Logger.log('CLAVE del equipo: ' + p.getProperty('CLAVE'));
  Logger.log('Tema de avisos (ntfy): ' + p.getProperty('TOPIC'));
}

function hoja() { return SpreadsheetApp.getActive().getSheetByName('Leads'); }
function filas() {
  const v = hoja().getDataRange().getValues(); const h = v.shift();
  return v.map((r, i) => { const o = { _fila: i + 2 }; h.forEach((k, j) => o[k] = r[j] instanceof Date ? Utilities.formatDate(r[j], 'America/Panama', "yyyy-MM-dd'T'HH:mm") : r[j]); return o; });
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const corto = (x, n) => String(x == null ? '' : x).slice(0, n || 120);

function doGet(e) {
  const q = e.parameter || {};
  if (q.key !== cfg('CLAVE')) return out({ ok: false, error: 'clave' });
  return out({ ok: true, leads: filas(), config: { zoom: cfg('ZOOM', ''), topic: cfg('TOPIC', ''), estados: ESTADOS } });
}

function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (b.action === 'nuevo') return out(nuevo(b, b.key === cfg('CLAVE')));
    if (b.key !== cfg('CLAVE')) return out({ ok: false, error: 'clave' });
    if (b.action === 'actualizar') return out(actualizar(b));
    if (b.action === 'config') { ['ZOOM', 'EMAILS'].forEach(k => { if (b[k.toLowerCase()] != null) P().setProperty(k, corto(b[k.toLowerCase()], 300)); }); return out({ ok: true }); }
    return out({ ok: false, error: 'accion' });
  } finally { lock.releaseLock(); }
}

function nuevo(b, interno) {
  const tel = corto(b.whatsapp, 20).replace(/[^\d+]/g, '');
  if (!corto(b.negocio).trim() || tel.replace(/\D/g, '').length < 7) return { ok: false, error: 'datos' };
  // evitar spam: máximo 30 leads públicos por hora
  const c = CacheService.getScriptCache(); const n = Number(c.get('n') || 0);
  if (!interno && n > 30) return { ok: false, error: 'limite' }; c.put('n', String(n + 1), 3600);
  const id = Utilities.getUuid().slice(0, 8);
  const ahora = new Date();
  const fila = { id, creado: ahora, origen: corto(b.origen, 30), nombre: corto(b.nombre, 80), negocio: corto(b.negocio, 80),
    tipo: corto(b.tipo, 30), zona: corto(b.zona, 80), whatsapp: tel, modo: corto(b.modo, 30), equipo: corto(b.equipo, 20),
    fecha: corto(b.fecha, 10), hora: corto(b.hora, 5), estado: b.fecha ? 'nuevo' : corto(b.estado || 'nuevo', 20),
    dueno: corto(b.dueno || 'Juan', 20), ultimo_toque: '', proximo_toque: b.fecha ? '' : Utilities.formatDate(ahora, 'America/Panama', 'yyyy-MM-dd'),
    toques: 0, notas: corto(b.notas, 500), reunion: '', actualizado: ahora };
  if (fila.modo === 'Videollamada') fila.reunion = cfg('ZOOM', '');
  hoja().appendRow(HEAD.map(k => fila[k]));
  const cuando = fila.fecha ? ` · ${fila.fecha} ${fila.hora}` : '';
  avisar(`🗓️ Nueva demo: ${fila.negocio}`, `${fila.tipo || 'Negocio'} en ${fila.zona || '—'}${cuando} · ${fila.modo || ''}\nAbre Glow Ventas para llamar o escribir.`, 'high', id);
  return { ok: true, id };
}

function actualizar(b) {
  const f = filas().find(x => x.id === b.id); if (!f) return { ok: false, error: 'no existe' };
  const sh = hoja(); const permit = ['estado','dueno','proximo_toque','notas','reunion','fecha','hora','modo'];
  permit.forEach(k => { if (b[k] != null) sh.getRange(f._fila, HEAD.indexOf(k) + 1).setValue(corto(b[k], 500)); });
  if (b.toque) {
    sh.getRange(f._fila, HEAD.indexOf('ultimo_toque') + 1).setValue(new Date());
    sh.getRange(f._fila, HEAD.indexOf('toques') + 1).setValue(Number(f.toques || 0) + 1);
    if (b.toque_nota) sh.getRange(f._fila, HEAD.indexOf('notas') + 1).setValue(corto((f.notas ? f.notas + '\n' : '') + Utilities.formatDate(new Date(), 'America/Panama', 'dd/MM HH:mm') + ' ' + b.toque_nota, 2000));
  }
  sh.getRange(f._fila, HEAD.indexOf('actualizado') + 1).setValue(new Date());
  return { ok: true };
}

function avisar(titulo, texto, prioridad, id) {
  const app = cfg('APP', '') + (id ? '#' + id : '');
  try {
    UrlFetchApp.fetch('https://ntfy.sh/', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ topic: cfg('TOPIC'), title: titulo, message: texto, priority: prioridad === 'high' ? 4 : 3,
        tags: ['sparkles'], click: app, actions: [{ action: 'view', label: 'Abrir Glow Ventas', url: app }] }) });
  } catch (x) {}
  const emails = cfg('EMAILS', '');
  if (emails) try { MailApp.sendEmail(emails, titulo, texto + '\n\n' + app); } catch (x) {}
}

function hoyPA() { return Utilities.formatDate(new Date(), 'America/Panama', 'yyyy-MM-dd'); }

function resumenDiario() {
  const hoy = hoyPA(); const L = filas();
  const demos = L.filter(x => x.fecha === hoy && !['perdido','no contactar'].includes(x.estado));
  const seg = L.filter(x => x.proximo_toque && String(x.proximo_toque).slice(0, 10) <= hoy && !['cliente','perdido','no contactar'].includes(x.estado));
  if (!demos.length && !seg.length) return;
  avisar('☀️ Hoy en Glow Ventas', `${demos.length} demo(s): ${demos.map(x => x.hora + ' ' + x.negocio).join(', ') || '—'}\n${seg.length} seguimiento(s) por WhatsApp pendientes.`, 'default');
}

function recordatorios() {
  const ahora = new Date(); const L = filas(); const c = CacheService.getScriptCache();
  L.forEach(x => {
    if (!x.fecha || !x.hora || ['perdido','no contactar','cliente'].includes(x.estado)) return;
    const t = new Date(x.fecha + 'T' + x.hora + ':00-05:00'); const min = (t - ahora) / 60000;
    if (min > 0 && min <= 60 && !c.get('r' + x.id)) {
      c.put('r' + x.id, '1', 21600);
      avisar(`⏰ En ${Math.round(min)} min: demo con ${x.negocio}`, `${x.modo} · ${x.nombre} · ${x.whatsapp}`, 'high', x.id);
    }
  });
}
