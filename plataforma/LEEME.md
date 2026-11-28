# Glow Plataforma (prototipo navegable, v2)
Una sola plataforma multi-negocio, tema claro con el color de cada negocio.
- Portada Glow `#/`: mapa 3D de Panamá con cada negocio y sus estrellas, planes (Esencial $35, Pro $79, Negocio $149; instalación con precio fundador), alta de negocio.
- App del cliente `#/s/<slug>`: portada/logo/galería, pestañas, lo más pedido, ofertas, servicios con buscador y precio por profesional, extras, equipo con fotos y estrellas, membresías, paquetes, regalos, referidos, productos, reseñas por estrellas, mapa, horario y feriados, ES/EN, asistente 24/7, cupones, depósito, pase QR + "Ya llegué", fila sin cita, tarjeta de fidelidad (+ Wallet en la versión real), mis citas.
- App del equipo `/equipo`: PIN, mi día, 14 días, estado (disponible/almorzando), cliente sin cita, cobro, números, reseñas, día libre.
- Panel del dueño `/panel/<sección>`: inicio con alertas, agenda por profesional/sucursal con arrastrar y citas fijas, fila, caja (productos, regalo, paquete, 4 métodos, gastos, cierre), clientes (agregar/importar/exportar, ficha, fotos antes/después), servicios y productos (inventario, paquetes, membresías, extras), ofertas/cupones/referidos/regalos, marketing (te toca tu corte, recuperar, cumpleaños, día flojo, reseñas), mensajes automáticos, reportes exportables, equipo (fotos, galería, sucursal), ajustes (fotos, horario, feriados, sucursales, reglas).
- TV de recepción `/tv`. Panel maestro `#/glow`. Guía `#/guia`.
- Datos: `js/store.js` (localStorage, sincronizado entre pestañas; mismo modelo que la base real, todo con `tid`).
- Falta para producción (Max): base real con seguridad por negocio, login real, WhatsApp API, pagos (Yappy/tarjeta), Apple/Google Wallet firmado, factura DGI.
