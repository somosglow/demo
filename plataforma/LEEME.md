# Glow Plataforma (prototipo navegable)
Una sola plataforma multi-negocio: cada salón tiene su app con su marca (`#/s/<slug>`), su app de equipo (`/equipo`), su panel (`/panel/<sección>`), y Glow tiene el panel maestro (`#/glow`).
- Datos: `js/store.js` (modo demo en localStorage, sincronizado en vivo entre pestañas). Mismo modelo que tendrá la base real: cada documento lleva `tid`.
- Vistas: `inicio.js`, `cliente.js`, `equipo.js`, `dueno.js`, `glow.js`, `guia.js`. Estilos: `css/app.css` (color por negocio en `--brand`/`--brand2`).
- Sin build: módulos ES nativos. QR: qrcode-generator (MIT, Kazuhiko Arase) en `vendor/`.
- Siguiente paso (Max): conectar store.js a la base real de Glow con seguridad por negocio, login real, WhatsApp API, pagos.
