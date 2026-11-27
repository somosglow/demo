/* Asistente virtual de Glow 24/7 — burbuja de chat para las páginas de Glow.
   Usa la IA del backend (Apps Script, acción "chat") si está activa; si no, responde con la base de conocimiento local. */
(()=>{
const CRM=window.GLOW_CRM||"",WA="50761305139";
const css=`#gx-btn{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:999;width:60px;height:60px;border-radius:50%;border:0;background:linear-gradient(135deg,#FFB547,#FF7A59);box-shadow:0 12px 30px rgba(255,122,89,.45);font-size:28px;cursor:pointer;animation:gxp 2.4s infinite}
@keyframes gxp{0%,100%{box-shadow:0 12px 30px rgba(255,122,89,.45),0 0 0 0 rgba(255,181,71,.5)}60%{box-shadow:0 12px 30px rgba(255,122,89,.45),0 0 0 14px rgba(255,181,71,0)}}
#gx-tip{position:fixed;right:84px;bottom:calc(30px + env(safe-area-inset-bottom));z-index:999;background:#1E2638;color:#fff;border:1px solid #3a4666;border-radius:14px 14px 4px 14px;padding:9px 12px;font:500 13px Poppins,system-ui,sans-serif;box-shadow:0 10px 25px rgba(0,0,0,.4);max-width:210px}
#gx{position:fixed;right:12px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:1000;width:min(370px,calc(100vw - 24px));height:min(560px,calc(100vh - 120px));background:#141b2b;border:1px solid #34405c;border-radius:22px;box-shadow:0 25px 60px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden;font-family:Poppins,system-ui,sans-serif;color:#fff}
#gx.on{display:flex;animation:gxu .3s}@keyframes gxu{from{opacity:0;transform:translateY(16px)}}
#gx header{display:flex;align-items:center;gap:10px;padding:13px 14px;background:linear-gradient(135deg,rgba(255,181,71,.18),rgba(255,122,89,.18));border-bottom:1px solid #34405c}
#gx header i{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#FFB547,#FF7A59);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:19px}
#gx header b{font-size:14.5px;display:block}#gx header small{font-size:11.5px;color:#4DD98C}#gx header button{margin-left:auto;background:none;border:0;color:#AEB4C0;font-size:22px;cursor:pointer}
#gx-m{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.gx-b{max-width:86%;padding:9px 12px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
.gx-b.bot{background:#1E2638;border:1px solid #2f3a55;border-bottom-left-radius:5px;align-self:flex-start}.gx-b.me{background:linear-gradient(135deg,#FFB547,#FF7A59);color:#111;border-bottom-right-radius:5px;align-self:flex-end;font-weight:500}
.gx-b a{color:#FFB547;font-weight:600}
.gx-q{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}.gx-q button{background:#1E2638;border:1px solid #3a4666;color:#fff;border-radius:99px;padding:7px 11px;font:inherit;font-size:12.5px;cursor:pointer}
#gx form{display:flex;gap:8px;padding:10px;border-top:1px solid #34405c}#gx input{flex:1;background:#1E2638;border:1px solid #3a4666;border-radius:14px;padding:11px 12px;color:#fff;font:inherit;font-size:15px;outline:none}
#gx form button{border:0;border-radius:14px;width:46px;background:linear-gradient(135deg,#FFB547,#FF7A59);font-size:18px;cursor:pointer}
.gx-t{align-self:flex-start;color:#AEB4C0;font-size:12px}.gx-f{text-align:center;color:#6f7890;font-size:10.5px;padding:0 10px 8px}`;
document.head.insertAdjacentHTML("beforeend",`<style>${css}</style>`);
document.body.insertAdjacentHTML("beforeend",`<div id="gx-tip">👋 ¿Tienes dudas? Pregúntame, respondo al instante</div><button id="gx-btn" aria-label="Abrir asistente de Glow">💬</button>
<div id="gx" role="dialog" aria-label="Asistente de Glow"><header><i>✦</i><div><b>Asistente de Glow</b><small>● En línea 24/7</small></div><button aria-label="Cerrar" id="gx-x">×</button></header>
<div id="gx-m"></div><div class="gx-q" id="gx-q"></div><form id="gx-f"><input id="gx-i" placeholder="Escribe tu pregunta…" maxlength="400" autocomplete="off"><button aria-label="Enviar">➤</button></form><div class="gx-f">Asistente virtual de Glow · Juan, del equipo, te atiende personalmente en la demo</div></div>`);
const $=id=>document.getElementById(id),M=$("gx-m"),H=[];
const neg=new URLSearchParams(location.search).get("negocio")||"";
const pagina=location.pathname.includes("presentacion")?"presentacion":location.pathname.includes("propuesta")?"propuesta":"demo";
const agendar=pagina==="demo"?`<a href="#" data-go="pn3">Agendar mi demo aquí</a>`:`<a href="https://somosglow.github.io/demo/${neg?"?negocio="+encodeURIComponent(neg):""}">Agendar mi demo aquí</a>`;
const wa=`<a target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent("Hola Glow, tengo una pregunta"+(neg?" sobre "+neg:""))}">escríbenos por WhatsApp</a>`;
const K=[
 [/precio|cu[aá]nto|cuesta|costo|vale|tarifa|plan/i,`Tenemos 2 planes:\n• Esencial: $35 al mes (o $350 al año, 2 meses gratis).\n• Pro: $79 al mes (o $790 al año), en preventa.\n\n🚀 Precio de fundador para los primeros 10 negocios: instalación $175 en vez de $350 y mensualidad congelada en $35.\n\n¿Quieres verlo funcionando con tu negocio? ${agendar}`],
 [/fundador|cupo|descuento|oferta|promo/i,`Los primeros 10 negocios pagan $175 de instalación (normal $350) y congelan su mensualidad en $35. La barra de cupos de la página se actualiza con cada cliente nuevo. ${agendar}`],
 [/pro\b|whatsapp.*(ia|bot|asistente)|asistente.*whatsapp|preventa/i,`El plan Pro ($79/mes) incluye todo lo de Esencial más: asistente con IA en tu WhatsApp que responde y agenda, recordatorios por WhatsApp, depósitos con Yappy y tarjeta, reseñas en Google, campañas para recuperar clientes, reportes y varias sucursales.\n\nEstá en preventa: lo apartas hoy y se activa por partes a medida que cada función queda probada; no se cobra la diferencia hasta que esté activa.`],
 [/qu[eé] (es|hace|incluye)|c[oó]mo funciona|funciones|servicios|incluye/i,`Glow es tu propia app de citas con tu logo, colores y precios:\n📲 Tus clientes reservan en 3 toques, sin registrarse\n⏰ Recordatorios automáticos antes de cada cita\n🎁 Tarjeta de fidelidad digital\n📍 Perfil de Google optimizado y QR para tu local\n👥 Agenda para todo tu equipo\n🤝 Nosotros lo montamos y capacitamos a tu equipo.`],
 [/demo|reuni[oó]n|cita|agendar|ver(lo)?|probar/i,`La demo es gratis y dura 20 minutos: te mostramos la app con el nombre de tu negocio, hacemos una reserva de prueba y ves los recordatorios y la tarjeta de fidelidad. Puede ser por videollamada, llamada o en tu local. ${agendar}`],
 [/pag(o|ar)|yappy|tarjeta|transferencia|factura/i,`Puedes pagar con tarjeta, Yappy o transferencia, mensual o anual. Te enviamos tu factura electrónica por correo.`],
 [/tiempo|cu[aá]ndo|demora|tarda|r[aá]pido|instal/i,`Nosotros lo montamos todo: nos pasas tu logo, servicios, precios y horario, armamos tu app, tu Google y tu QR, y capacitamos a tu equipo. Coordinamos la fecha de entrega contigo en la demo.`],
 [/fresha|booksy|agendapro|otra app|ya uso|competencia|diferencia/i,`La diferencia con Glow: tu cliente reserva en TU app, con tu marca (no en un directorio con tu competencia al lado), en español, con soporte local en Panamá, y nosotros te lo montamos todo, incluso el material QR para tu local.`],
 [/descarg|app store|play store|instalar la app|registr/i,`Tus clientes no tienen que descargar nada: reservan desde un link o el QR de tu local en 3 toques, sin registrarse. Si quieren, la pueden agregar a su pantalla de inicio como una app.`],
 [/cancel|contrato|permanencia|salir/i,`Esos detalles te los explica Juan en la demo según el plan que elijas, ${wa} y te responde.`],
 [/humano|persona|juan|hablar con|asesor|llamar/i,`¡Claro! Juan, del equipo, te atiende personalmente: ${wa} o ${agendar}.`],
 [/hola|buenas|hey|saludos/i,`¡Hola! 👋 Soy el asistente virtual de Glow. Te ayudo con precios, cómo funciona la app o a agendar tu demo gratis. ¿Qué te gustaría saber?`],
 [/gracias|perfecto|ok|genial|listo/i,`¡Con gusto! 😊 Si quieres verlo funcionando con tu negocio, ${agendar}.`],
];
function local(t){for(const[r,a]of K)if(r.test(t))return a;return `Buena pregunta. Para no darte una respuesta incorrecta, Juan te la responde personalmente: ${wa}. También puedes ${agendar.replace("Agendar","agendar")}.`}
function add(t,who){const d=document.createElement("div");d.className="gx-b "+who;if(who==="bot")d.innerHTML=t;else d.textContent=t;M.appendChild(d);M.scrollTop=M.scrollHeight;d.querySelectorAll("[data-go]").forEach(a=>a.onclick=e=>{e.preventDefault();cerrar();if(window.tab)tab(a.dataset.go)})}
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
async function responder(t){add(t,"me");H.push({role:"user",content:t});const w=document.createElement("div");w.className="gx-t";w.textContent="Escribiendo…";M.appendChild(w);M.scrollTop=M.scrollHeight;
 let r="";if(CRM){try{const j=await fetch(CRM,{method:"POST",body:JSON.stringify({action:"chat",pagina,negocio:neg,mensajes:H.slice(-10)})}).then(x=>x.json());if(j.ok&&j.reply)r=esc(j.reply).replace(/(https?:\/\/\S+)/g,'<a target="_blank" rel="noopener" href="$1">$1</a>').replace(/\n/g,"<br>")}catch(e){}}
 if(!r){await new Promise(x=>setTimeout(x,500+Math.random()*500));r=local(t)}
 w.remove();add(r,"bot");H.push({role:"assistant",content:r.replace(/<[^>]+>/g,"")})}
const Q=["💰 ¿Cuánto cuesta?","📲 ¿Qué incluye?","🚀 Precio de fundador","📅 Quiero una demo","💜 Plan Pro"];
$("gx-q").innerHTML=Q.map(q=>`<button>${q}</button>`).join("");$("gx-q").querySelectorAll("button").forEach(b=>b.onclick=()=>{responder(b.textContent.replace(/^\S+\s/,""))});
function abrir(){$("gx").classList.add("on");$("gx-tip").remove?.();if(!M.children.length)add(`¡Hola! 👋 Soy el asistente virtual de Glow${neg?", aquí para ayudarte con la app de <b>"+esc(neg)+"</b>":""}. Pregúntame lo que quieras sobre precios, cómo funciona o cómo agendar tu demo gratis.`,"bot");setTimeout(()=>$("gx-i").focus(),200)}
function cerrar(){$("gx").classList.remove("on")}
$("gx-btn").onclick=()=>$("gx").classList.contains("on")?cerrar():abrir();$("gx-x").onclick=cerrar;
$("gx-f").onsubmit=e=>{e.preventDefault();const t=$("gx-i").value.trim();if(!t)return;$("gx-i").value="";responder(t)};
setTimeout(()=>{const t=$("gx-tip");if(t)t.style.display="none"},9000);
})();
