/* Glow Demo · service worker: app instalable, apertura sin conexión y notificaciones */
const CACHE='king-v4';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/index.html','/icons/e-192.png','/icons/c-192.png','/icons/badge.png'])).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
/* páginas: siempre la versión más nueva; si no hay internet, la última guardada */
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||r.mode!=='navigate')return;
  e.respondWith(fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>res.redirected?fetch(r):res).then(res=>{const cp=res.clone();const K=new URL(r.url).pathname.startsWith('/via')?'/via/index.html':'/index.html';caches.open(CACHE).then(c=>c.put(K,cp));return res;}).catch(()=>caches.match(new URL(r.url).pathname.startsWith('/via')?'/via/index.html':'/index.html')));
});
/* avisos enviados desde el servidor (listo para cuando se active el envío con la app cerrada) */
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{};}catch(_){d={title:'Glow Demo Equipo',body:e.data?e.data.text():''};}
  const n=d.notification||d.data||d;
  const ios=/iPhone|iPad|iPod|Macintosh/.test(self.navigator.userAgent||'');
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const open=list.find(c=>c.focused&&c.visibilityState==='visible');
    if(open&&!ios){open.postMessage({t:'push',n});return;}
    return self.registration.showNotification(n.title||'Glow Demo Equipo',{body:n.body||'',icon:'/icons/e-192.png',badge:'/icons/badge.png',tag:n.tag||undefined,renotify:!!n.tag,data:{url:n.url||'/equipo',id:n.id,ref:n.ref},vibrate:[200,100,200,100,200],silent:false,requireInteraction:true});
  }));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'/equipo';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if(new URL(c.url).pathname.startsWith(url)&&'focus' in c){c.postMessage({t:'openAlert',id:e.notification.data&&e.notification.data.id});return c.focus();}}
    return self.clients.openWindow(url);
  }));
});
