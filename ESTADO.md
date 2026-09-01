# ESTADO — TurnoCheck
Última actualización: 2026-09-01 | Sesión actual: 1

## Dashboard completo en Hoy: gráfico semanal, festivos, horas por proyecto (2026-09-01)
- ✅ Gráfico de horas trabajadas por día (L-D, semana actual) con Recharts — datos reales de
  `time_entries`. Se instaló `recharts` (revisado con `npm audit`, sin vulnerabilidades nuevas).
- ✅ Tarjeta "Próximos festivos" — se le agregó nombre a cada festivo en
  `festivos-colombia.ts` (antes solo devolvía fechas) + función `proximosFestivos()`.
- ✅ Donut "Horas por proyecto" en Hoy — reusa `work_site_id` (de la feature de Proyectos) para
  mostrar de un vistazo cuánto se ha invertido en cada obra.
- ✅ Tarjeta "Asistencia en vivo" ahora vive en una grilla `md:grid-cols-3` junto a Nómina — en
  escritorio queda side-by-side; en celular se apila igual que antes.
- PENDIENTE: confirmación de la usuaria viendo esto en su celular/computador.


## Menú de escritorio, guía de inicio y Proyectos por obra (2026-09-01)
- ✅ Menú lateral fijo en pantallas anchas (`Sidebar.tsx`, md+) — reemplaza el menú inferior
  solo en escritorio; el celular no cambió. Contenido de /app centrado con ancho máximo en
  escritorio. Hoy: tarjetas de nómina/trabajando-ahora lado a lado en escritorio.
- ✅ "Guía de inicio" en Hoy (`OnboardingChecklist.tsx`) — checklist de 4 pasos (primer
  empleado, sitio de trabajo, horario esperado, primera marcación) con progreso, se oculta
  sola al completarse o si el dueño le da a la X (localStorage, por navegador).
- ✅ **Proyectos por obra** (pedido real de un cliente de construcción: pasarle a SU cliente
  un informe de horas invertidas + avance para que le paguen): cada "sitio de trabajo" ahora
  también es un proyecto — se le agrega cliente final y % de avance (editable en Ajustes,
  manual). Cada marcación de entrada guarda a qué sitio perteneció (`work_site_id`, el sitio
  activo más cercano dentro de la geocerca — `lib/geo.ts: sitioDentroDeRango`). Reportes tiene
  ahora 2 pestañas: Nómina (lo de siempre) y Proyectos (horas totales invertidas por obra desde
  su inicio + % avance + personas involucradas, con export PDF/Excel para dársela al cliente).
- Migración `0014` (work_sites.cliente_final, work_sites.avance_porcentaje,
  time_entries.work_site_id).
- Decisión tomada con la usuaria: 1 sitio = 1 proyecto (no varios sitios por proyecto); avance
  = % manual, no etapas/hitos.
- PENDIENTE: confirmación de la usuaria probando el menú de escritorio, la guía de inicio y la
  pestaña de Proyectos en producción.

## Inspiración Jibble: panel en vivo, mapa y salida automática (2026-09-01)
La usuaria compartió un documento con 76 capturas del recorrido de Jibble. Se filtró qué
aplica a un negocio pyme colombiano (no integraciones tipo Slack/QuickBooks/HubSpot ni
roles complejos — eso es para empresas grandes) y se construyeron 3 cosas:
- ✅ Panel "Trabajando ahora" en Hoy — tarjeta en vivo (punto verde animado) que muestra
  qué empleados están marcados en este momento con el tiempo transcurrido, actualizado
  cada minuto.
- ✅ Mapa en vivo (`/app/mapa`, nuevo ítem en la barra inferior) — usa Leaflet +
  OpenStreetMap (gratis, sin API key ni costo) para mostrar los sitios de trabajo
  (círculos de la geocerca) y dónde está marcando cada empleado ahora mismo.
- ✅ Salida automática — nuevo ajuste "hora de cierre automático" en Ajustes. Si un
  empleado olvida marcar salida, la app cierra sola ese turno (solo los de DÍAS
  ANTERIORES, nunca el de hoy) la próxima vez que alguien abre la app — es una limpieza
  de primera versión, no un cron real en segundo plano, así que el cierre puede aparecer
  un poco después de la hora configurada. Los turnos cerrados así quedan marcados
  `cierre_automatico = true` y se lo avisan al dueño en el modal de foto de Hoy.
- Migración `0013` (companies.hora_cierre_automatico, time_entries.cierre_automatico).
- Se agregó `leaflet` + `react-leaflet` (+ `@types/leaflet` dev) — se revisó con
  `npm audit` antes de usarlos, sin vulnerabilidades nuevas.
- PENDIENTE: confirmación de la usuaria probando las 3 en producción.

## Cámara, foto de salida y exportar a Excel (2026-07-31)
- ✅ RAÍZ del video en negro en /app/marcar encontrada: el `useEffect` que pedía la cámara
  dependía de `fase`, y dentro del propio efecto se llamaba `setFase("lista")` — React
  re-ejecutaba el efecto, su limpieza apagaba las pistas de la cámara recién iniciadas, y como
  `fase` ya no era "cargando" no se volvía a pedir la cámara. Se corrigió con una ref que solo
  pide la cámara una vez por visita a la pantalla, y el apagado real de las pistas se movió a un
  efecto aparte que solo corre al salir de la pantalla. PENDIENTE: falta confirmación de la
  usuaria en producción de que la vista previa ya no sale negra.
- ✅ La foto de salida se capturaba pero se descontaba (solo existía `foto_url`, ligado a la
  entrada). Se agregó la columna `foto_salida_url` (migración 0011) y el modal de "Hoy" ahora
  muestra ambas fotos lado a lado. PENDIENTE: confirmar con una marcación NUEVA (post-fix) — la
  usuaria reportó ver solo una foto, pero probablemente estaba viendo una marcación vieja de
  antes del fix (que de verdad no tiene foto de salida guardada).
- ✅ La promesa de la landing decía "Reporte mensual en PDF/Excel" pero solo existía el PDF.
  Se construyó la exportación real a Excel en Reportes (botón "Excel" junto a "PDF") — genera un
  CSV con BOM UTF-8 que Excel abre nativamente con el mismo desglose que el PDF. Se eligió CSV en
  vez de la librería `xlsx` (paquete `.xlsx` real) porque esa librería tiene 2 vulnerabilidades
  de severidad ALTA sin parchar en npm (prototype pollution + ReDoS) — se instaló, se detectó con
  `npm audit`, y se desinstaló en la misma sesión sin usarla en el código.

## App en producción y bugs reales corregidos (2026-07-31)
App 100% en vivo en `https://turnocheck.app`, con GitHub/Vercel/Supabase/Resend/Hotmart todos
conectados. Durante pruebas reales de la usuaria se encontraron y corrigieron 3 bugs genuinos
(no placeholders — funciones que parecían listas pero no hacían nada):
- ✅ Botón "PDF" en Reportes no tenía onClick — ahora genera un PDF real (jsPDF + autotable) con
  el desglose por empleado y el total de la semana.
- ✅ La foto de cada marcación se guardaba pero no había forma de volver a verla — ahora, en Hoy,
  las marcaciones completas abren un modal con la foto (URL firmada del bucket privado), hora de
  entrada/salida, link al mapa y el aviso de geocerca si aplicó.
- ✅ Varios falsos "link expirado" en el login (confirmados con los logs de Supabase: el login SÍ
  había funcionado) — causa: doble-petición con el mismo código PKCE. Se blindó `/auth/callback`
  para revisar si ya hay sesión activa antes de declarar error, y se bloqueó el doble-clic en
  "Ya casi entras".
- ⏸️ PENDIENTE: la Fase 4 (compra de prueba real en Hotmart) sigue sin hacerse — es necesaria antes
  de anunciar la venta, para confirmar de punta a punta que el webhook + los correos funcionan y
  para verificar cómo llega realmente el evento de inicio de trial (placeholder sin confirmar).

## Puntualidad por empleado (2026-07-31)
Caso real: cada negocio (y cada empleado) puede tener un horario distinto — no una regla única
por empresa. Tolerancia acordada con el usuario: ±5 minutos = "a tiempo".
- ✅ `employees.hora_entrada_esperada` (migración `0009`, opcional) — se define al crear el
  empleado, en Empleados. Sin ella, no se califica llegada (no inventa tardanza para horarios
  flexibles, ej. obra civil).
- ✅ `lib/puntualidad.ts`: compara hora real vs esperada con la tolerancia de 5 min → temprano /
  a tiempo / tarde (+minutos). Mostrado en Hoy junto a "Entró {hora}" (rojo si tarde).
- tsc+lint+build limpios, lógica verificada con 5 casos de prueba (a tiempo por debajo y por
  encima de la tolerancia, tarde, temprano, sin hora asignada).

## Login por magic link: 3 bugs reales encontrados y corregidos (2026-07-30/31)
El usuario reportó "se dañó" varias veces seguidas tras cada arreglo — cada vez resultó ser un
bug DISTINTO, no el mismo repetido. Los 3, diagnosticados con los logs de Auth de Supabase
(`/logs/auth-logs`, clave para ver el `msg`/`error` real en vez de adivinar):
1. `confirm-click` no decodificaba el `confirmation_url` de la query string (%3A, %2F sin
   decodificar) → el navegador lo trataba como ruta relativa rota → 404 en vez del login real.
   Fix: `decodeURIComponent` antes de usarlo como href.
2. `/auth/callback` pedía el usuario con `getUser()` justo después del exchange en vez de usar
   el `user` que el propio `exchangeCodeForSession` ya devuelve — carrera de tiempos que a veces
   mostraba "link expirado" en logins que SÍ habían funcionado (confirmado: log de Supabase con
   login exitoso mientras la UI mostraba error).
3. El botón "Iniciar sesión" de `confirm-click` no estaba protegido contra doble-clic/doble-toque
   — un segundo click reenviaba el mismo código ya consumido por el primero, y Supabase respondía
   "ya expiró" aunque el primer intento hubiera entrado bien. Fix: bloqueo síncrono con useRef
   (un state solo no alcanza a tiempo) + mostrar "Entrando..." tras el primer clic. Además, como
   redundancia, `/auth/callback` ahora revisa si YA hay sesión activa antes de declarar error.
- Lección para la próxima vez que alguien reporte "se dañó" en este flujo: SIEMPRE pedir el log
  de `/logs/auth-logs` de Supabase antes de adivinar — cada vez reveló la causa real en segundos.

## Festivos de Colombia automáticos + geocerca multi-sitio (2026-07-31)
Caso real del usuario: su negocio (obra civil) no tiene un solo local fijo — el sitio de trabajo
cambia de proyecto en proyecto. Ajustado el diseño de geocerca para eso, no un solo punto fijo:
- ✅ `lib/festivos-colombia.ts`: calcula los festivos oficiales de Colombia para CUALQUIER año
  (fijos + los que la Ley Emiliani mueve al lunes + Semana Santa vía cálculo de Pascua/Gauss) —
  verificado a mano contra el calendario oficial 2026 (Jueves/Viernes Santo 2-3 abr, etc., todo
  coincide). Reemplaza el checkbox 100% manual en Marcar — ahora se autodetecta, sigue ajustable.
- ✅ `lib/geo.ts` + tabla `work_sites` (migración `0008`): geocerca con MÚLTIPLES sitios activos
  a la vez, no uno solo. En Ajustes, sección "Sitios de trabajo" — se registran parado en el
  lugar (botón de GPS), se pueden activar/desactivar (para obras terminadas) o borrar. Al marcar,
  se valida contra CUALQUIER sitio activo (radio 150m) — sin sitios registrados, no penaliza a
  nadie (negocios de local fijo que no configuren nada no se ven afectados). Aviso visible
  "⚠️ Lejos de toda obra registrada" en Marcar y un ícono de aviso en la fila de Hoy.
- ✅ Cada empleado YA tenía salario individual desde antes (`empleados` → campo "Salario mensual")
  — el usuario preguntó por esto pero ya estaba resuelto, solo se le explicó dónde está.
- tsc+lint+build limpios, verificado visualmente con datos de ejemplo a 375px (ruta temporal
  borrada tras confirmar). Migración aplicada y revisada con `get_advisors` — sin warnings nuevos.

## Sistema de emails del negocio — Fase 0-3 (2026-07-28)
Siguiendo el inventario/plan aprobado (transaccionales primero — ver `18-VENTA-HOTMART.md`):
- ✅ Resend conectado: dominio `turnocheck.app` verificado (DKIM+SPF+DMARC, los 4 registros DNS
  confirmados en Namecheap y en Resend), API key creada y pegada en Vercel (`RESEND_API_KEY`,
  `EMAIL_FROM=TurnoCheck <hola@turnocheck.app>`).
- ✅ Supabase Auth también usa Resend ahora como SMTP propio (Authentication → SMTP Settings) —
  esto quitó el límite de 2 correos/hora del servicio genérico Y desbloqueó poder editar la
  plantilla de emails (antes Supabase no dejaba editarla sin SMTP propio).
- ✅ Plantilla "Magic Link" editada: el link ahora apunta a `/auth/confirm-click` en vez del
  link directo — completa la mitigación de Hotmail/Outlook (Safe Links) que ya se había construido
  en el código pero necesitaba este cambio en Supabase para funcionar de punta a punta.
- ✅ `web/lib/email.ts` (nuevo): `sendWelcomeEmail` (con magic link real generado on-demand),
  `sendPaymentFailedEmail` (dunning), `sendCancellationEmail` (win-back) — usan el paquete `resend`
  (agregado a package.json), degradan a `false` sin lanzar si `RESEND_API_KEY` todavía falta (el
  acceso del usuario NUNCA depende de que el email salga).
- ✅ Conectados al webhook de Hotmart (`app/api/webhooks/hotmart/route.ts`): bienvenida SOLO en
  cuenta nueva (`isNewAccount`, nunca en renovaciones), dunning en `past_due`, cancelación en
  `canceled` — todos SOLO cuando `result === "applied"` (nunca en duplicados/ilegales).
  tsc+lint+build limpios.
- ⏸️ PENDIENTE (Fase 4, no ejecutado todavía): prueba end-to-end real — compra de prueba en
  Hotmart → confirmar que el correo de bienvenida LLEGA (no a spam) → el magic link adentro
  funciona → entra a `/app`. También falta: `supabase secrets set RESEND_API_KEY=... EMAIL_FROM=...`
  para que el recordatorio diario (`recordatorio-diario`, Edge Function) empiece a enviar de verdad
  (usa sus propios secrets de Supabase, separados de las env vars de Vercel).
- ⏸️ NO construido a propósito (avisado, no a ciegas): carrito abandonado (sin tráfico real
  todavía para probarlo) y nurturing de lead magnet (no existe lead magnet).

## Dominio propio conectado (2026-07-28)
- ✅ Usuario compró `turnocheck.app` en Namecheap. Conectado a Vercel (Domains → Add Existing),
  DNS verificado, HTTPS activo. **Dominio en vivo: https://turnocheck.app** (también responde
  `www.turnocheck.app`). `turno-check.vercel.app` sigue funcionando como alias secundario.
- ✅ Supabase actualizado: Site URL → `https://turnocheck.app`, Redirect URLs con `/auth/callback`
  y `/auth/confirm-click` para el dominio nuevo Y el de `www` (además de las de `turno-check.vercel.app`
  y `localhost:3000` que ya estaban, sin borrar).
- ⏸️ PENDIENTE natural ahora que hay dominio propio: conectar Resend con `turnocheck.app` para
  (a) que los correos salgan de `hola@turnocheck.app` en vez del genérico de Supabase, (b) subir el
  límite de 2 correos/hora del servicio gratuito de Supabase, y (c) por fin poder editar la plantilla
  "Magic Link" (Supabase la bloquea para editar sin SMTP propio — ver sección de abajo). El usuario
  dijo "después" la última vez que se le ofreció — retomar cuando lo pida.

## Webhook de Hotmart construido (2026-07-28)
Endpoint real en `web/app/api/webhooks/hotmart/route.ts`, siguiendo `docs/sistema/18-VENTA-HOTMART.md`
("SEGURIDAD DEL WEBHOOK") adaptado al modelo real de la app (companies/subscriptions, no "profiles"):
- ✅ Migraciones `0006_hotmart_webhook.sql` (tablas `processed_events`+`webhook_log`, función atómica
  `apply_hotmart_event`, constraint de `subscriptions.status` ampliado a incluir `refunded`/`chargeback`)
  y `0007_...lock_rpc.sql` (el advisor de seguridad marcó la RPC ejecutable por anon/authenticated —
  Postgres otorga EXECUTE a PUBLIC por defecto en funciones nuevas; corregido revocando de PUBLIC
  explícitamente, no solo de anon/authenticated). Ambas aplicadas en el proyecto real y verificadas
  con `get_advisors` — sin warnings de seguridad nuevos.
- ✅ `lib/hotmart-verify.ts`: hottok en tiempo constante (`crypto.timingSafeEqual`), nunca `===`.
- ✅ `lib/hotmart-fsm.ts`: mapea evento Hotmart → estado (`statusForEvent`), bloquea reactivar un
  reembolso/chargeback con un evento viejo (`canTransition`), y mapea el código de oferta (`off=`)
  de cada uno de los 4 links ya conectados al plan interno (`planForOfferCode`).
- ✅ `lib/hotmart-account.ts`: resuelve o crea la cuenta+empresa del comprador por email — si ya
  existía (hizo onboarding antes de pagar) reutiliza su empresa; si pagó sin loguearse nunca, crea
  la cuenta de auth (passwordless) + empresa mínima. Nunca un insert ciego (siempre busca primero).
- ✅ El route handler: lee el raw body, verifica hottok, ventana anti-replay (5 min), idempotencia +
  transición legal + upsert atómico vía la RPC, loguea TODO intento en `webhook_log`. Fail-secure:
  si falta `HOTMART_HOTTOK` responde 503 sin procesar nada (se comprueba en cada request, NO al
  cargar el módulo, para no tumbar el resto del deploy si el secreto aún no está configurado).
- Verificado: build+lint limpios, lógica de `timingSafeEqualStr` y de `hotmart-fsm.ts` probada con
  scripts aislados (sin tocar `.env.local` real), `curl` local confirmó el 503 fail-secure (sin
  `HOTMART_HOTTOK` configurado, que es el estado actual).
- ⚠️ PLACEHOLDER sin verificar (documentado en el propio código, `hotmart-fsm.ts`): el evento de
  INICIO de trial se infiere por `price.value === 0` o `subscription.status === 'started'` — Hotmart
  no confirma el nombre/forma exacta hasta hacer una compra sandbox real con trial y capturar el
  JSON (Paso F de la guía, obligatorio ANTES de anunciar la venta).
- ⏸️ NO conectado todavía: el email de bienvenida con Resend (`RESEND_API_KEY` sigue sin configurar)
  — el acceso SÍ queda activo en la base de datos, pero no se le manda automáticamente el magic
  link; por ahora el comprador entra por `/login` con el mismo correo.
- ⏸️ Pendiente del usuario (Paso E de 18-VENTA-HOTMART.md): registrar el webhook en el panel de
  Hotmart apuntando a `https://turno-check.vercel.app/api/webhooks/hotmart`, elegir los eventos,
  copiar el HOTTOK a la variable de entorno `HOTMART_HOTTOK` en Vercel (nunca en el chat/repo), y
  mandar el test. Después: una compra de prueba real de punta a punta (checklist del archivo 18).

## Límite de correo de Supabase (built-in) — 2/hora (2026-07-28)
El "No pudimos enviar el link" tras varias pruebas de login NO era un bug: el servicio de correo
por defecto de Supabase (sin SMTP propio conectado) tiene un límite duro de **2 correos/hora**
(confirmado en supabase.com/docs/guides/auth/rate-limits) — se agotó entre las pruebas del agente y
las del usuario. El usuario eligió ESPERAR (no configurar Resend todavía). Con SMTP propio (Resend)
el límite sube a 30/hora (ajustable) — sigue siendo el paso pendiente de siempre, ahora con motivo
extra: sin esto, probar el login en producción es lento e incómodo. Recomendar conectar Resend
pronto si las pruebas siguen chocando con el límite.

## Deploy en producción (2026-07-28)
- ✅ Código subido a GitHub: `github.com/rosibellmcasasm/TurnoCheck` (el usuario corrió el push él
  mismo desde su terminal — este entorno no puede autenticar con GitHub).
- ✅ Proyecto importado en Vercel (root directory `web`, las 5 env vars pegadas a mano por el
  usuario desde su `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAIL`) — deploy exitoso.
- **URL pública: https://turno-check.vercel.app**
- ⏸️ PENDIENTE del usuario: agregar esa URL en Supabase → Authentication → URL Configuration
  (Site URL + Redirect URLs `/auth/callback` y `/auth/confirm-click`) — sin esto el login no
  funciona en producción, solo en localhost.
- Nota: el conector MCP de Vercel que se usó en sesiones anteriores para gestionar proyectos se
  desconectó a mitad de esta sesión — el deploy de hoy lo hizo el usuario a mano desde el dashboard,
  guiado paso a paso (capturas de pantalla). Si en una sesión futura el conector no está disponible,
  asumir que todo cambio en Vercel (env vars, redeploys, dominio) requiere guiar al usuario por el
  dashboard igual que hoy.

## Checkout de Hotmart conectado al paywall (2026-07-28)
El usuario creó los 4 productos/ofertas en Hotmart y pasó los links reales. Se conectaron en
`web/app/paywall/page.tsx` (`HOTMART_LINKS`): el botón principal ahora navega al link correcto
según `planId` (micro/pyme) y el toggle mensual/anual — 4 combinaciones, verificado en navegador
que el `href` cambia con cada toggle. Se agregó un link secundario "Ya pagué, iniciar sesión" que
manda a `/login` (antes esa era la única acción del botón principal).
⚠️ IMPORTANTE — el webhook de Hotmart todavía NO existe (`api/webhooks/hotmart`, ver 18-VENTA-HOTMART.md):
comprar en Hotmart hoy NO activa ni crea automáticamente la cuenta en Supabase. El usuario paga en
Hotmart y por separado tiene que entrar por `/login` con el mismo correo. Falta: (1) construir el
endpoint del webhook con las 4 defensas (firma HOTTOK, validar evento, idempotencia, nunca confiar
en el payload crudo), (2) `supabase secrets`/env con `HOTMART_HOTTOK`, (3) decidir y documentar el
matching por email (Modelo 2A ya elegido en Sesión 1 — mitigar el bug de "email distinto" pasando
`src`/`sck` como tracking del checkout cuando exista el login antes del pago). Sin esto, technically
alguien podría pagar y no tener acceso automático — anotado para la próxima sesión de venta real.

## Bug real encontrado y corregido: el login por magic link nunca creaba sesión (2026-07-27)
"no pude entrar" del usuario NO era el link vencido (como se pensó las veces anteriores) — era un bug
real en `app/auth/callback/page.tsx`: el proyecto usa flujo **PKCE** (default de `@supabase/ssr`), así
que el link mágico llega con `?code=...` en la URL, y hay que cambiarlo por la sesión con
`supabase.auth.exchangeCodeForSession(code)` ANTES de pedir el usuario. El código viejo solo hacía
`getUser()` esperando que `detectSessionInUrl` resolviera solo un `#access_token` de flujo implícito
— que no es el que usa este proyecto — así que SIEMPRE fallaba silenciosamente y mandaba al error
"link expirado" sin importar que el link fuera válido. Corregido: se agregó el `exchangeCodeForSession`
al inicio de `completar()`. Verificado en el navegador con un código inválido a propósito → mostró
el mensaje de error correcto sin crashear (tsc+build limpios). NO se pudo verificar el camino de
ÉXITO en este entorno (el navegador de este sandbox no puede completar el flujo real de principio a
fin: el link debe abrirse desde el MISMO navegador que pidió el código, y ese navegador tiene que ser
el del usuario). Pendiente: que el usuario entre a `/login`, pida el link con su correo real desde
SU PROPIO navegador (no un link que yo genere), y lo abra desde su bandeja de entrada — ese es el
único camino que ahora sí debería funcionar de punta a punta.

## Panel de administración /admin (2026-07-27)
Primera versión, nivel "MVP/primeras ventas" del 21-BACKOFFICE.md (solo secciones Ventas+Usuarios —
Salud/Uso se agregan cuando haya usuarios reales usando la app, no antes). Usuario confirmó el plan
("está bien") tras sugerirle yo los 3 defaults (primer número = Usuarios, sin pagos/eventos reales
todavía, acceso solo su correo).
- ✅ Ruta `/admin` protegida en DOBLE capa: `proxy.ts` (redirige a `/app` si el correo de sesión no es
  `ADMIN_EMAIL`) + `app/admin/layout.tsx` (mismo chequeo server-side, por si algo evade el proxy).
  `ADMIN_EMAIL=rosibellmcasasm@hotmail.com` en `.env.local` (y placeholder vacío en `.env.example`).
- ✅ `lib/supabase/admin-queries.ts` (`getResumenAdmin`): usa el cliente admin (`admin.ts`, salta RLS
  a propósito) para juntar companies+subscriptions+employees+auth.users(email) de TODAS las empresas —
  solo se llama desde `/admin/*`, nunca desde código alcanzable por un usuario normal.
- ✅ `app/admin/page.tsx`: cards resumen (empresas totales, en trial, activas, altas 7 días) con
  `AnimatedNumber`, banner de aviso (hoy fijo en "✅ Todo en orden" — no hay disparadores reales
  todavía: sin Hotmart no hay churn/margen que vigilar, sin error_log no hay errores que contar),
  card de Ventas HONESTA ("$0 — no medido todavía, se llena sola al conectar Hotmart" en vez de
  inventar un número), tabla de usuarios (empresa/correo/plan/estado de suscripción/empleados/alta).
- Verificado con el mismo patrón ya usado en la capa de diseño premium: ruta temporal
  `/qa-preview-admin-temporal` (reexportaba el componente real de `/admin/page.tsx` sin el guard de
  login, porque el navegador de este entorno no completa el magic-link real) → screenshot a 375px
  confirmando el render correcto (0 empresas — dato real y honesto, el usuario de prueba nunca
  completó el login así que no hay `company` creada aún) → se borró la ruta. tsc+lint+build limpios.
- Autoevaluación (sin `revisor-visual` disponible, declarado como tal): estructura clara, jerarquía
  correcta, estados honestos (ningún número inventado), consistente con el resto de `/app/*` (mismos
  tokens de sombra/color/tipografía). No se pudo verificar visualmente la TABLA con filas reales (el
  único estado visto fue el vacío) — el código sigue el mismo patrón ya verificado en Reportes/Empleados,
  pero queda pendiente confirmarlo con al menos una empresa real registrada.
- ⏸️ NO construido todavía (a propósito, nivel siguiente del backoffice): sección de Salud/Errores
  (falta tabla `error_log` + Error Boundaries que la alimenten), sección de Uso/Retención (falta
  `event_log`), LTV/CAC/ganancia real (dependen de datos reales de Hotmart, que no existe aún).

## Diseño premium / anti-slop — capa de profundidad y movimiento (2026-07-27)
Diagnóstico (sin subagente `revisor-visual` disponible — autoevaluado y declarado como tal):
3 violaciones concretas encontradas por grep+lectura de código: (1) cero tokens de sombra en
`globals.css`, las 4 pantallas de `/app/*` 100% planas (`border` sin `shadow`) · (2) el dispositivo
ownable `.sello-verificado` solo se usaba en 1 lugar de toda la app (Garantía de la landing) · (3)
cero imports de Motion en `/app/*` — sin conteo de cifra héroe, sin stagger, sin tap feedback, sin
transición entre pestañas. Usuario aprobó el plan de 3 capas, ejecutado:
- ✅ Sistema de profundidad: `--shadow-sm/md/lg/xl/2xl` redefinidos en `@theme` de `globals.css` con
  tinte frío multicapa (antes eran los grises genéricos de Tailwind) — aplica automáticamente a TODO
  `shadow-*` ya usado en el código. Cards de Hoy/Empleados/Reportes/Ajustes ahora con `shadow-sm`,
  la tarjeta de nómina y el modal con `shadow-md`/`shadow-xl`.
- ✅ El sello de verificación (`.sello-verificado`) ahora vive en las pantallas reales: fila de
  asistencia de Hoy y el badge de foto en `StepResultado` del onboarding (antes solo en la landing).
- ✅ Animaciones baseline agregadas a `/app/*`: `AnimatedNumber` (nuevo componente,
  `components/app/shell/AnimatedNumber.tsx`) hace contar la cifra de "Nómina de hoy" de 0 a su valor
  en 700ms · stagger de 35ms en las filas de Hoy · `whileTap` en botones de Empleados · transición
  fade+slide entre pestañas del panel (`AppPageTransition.tsx`, nuevo, envuelve `{children}` en
  `app/app/layout.tsx`) · entrada animada del modal "Nuevo empleado".
- Verificado con una ruta temporal `/qa-preview-temporal` (datos de mentira, sin sesión) porque el
  navegador de esta sesión no pudo completar el login real para ver `/app` autenticado — se borró
  apenas se confirmó visualmente el conteo ($0→valor) y el stagger. tsc+lint+build limpios.
- Autoevaluación de la pantalla "Hoy" (sin revisor independiente disponible): ~37/40 usabilidad,
  ~18/20 craft — declarado como autoevaluación, no verificado por un revisor con contexto limpio.

## Panel de 4 expertos (2026-07-27) — puntajes y qué se ejecutó
Puntajes: Copy 14/20 · Diseño/Craft 15/20 · Conversión 13/20 · Retención 8/20 · Negocio 12/20.
Usuario aprobó los 10 hallazgos ("todos"). Ejecutado:
- ✅ Subtítulo del hero reescrito (era lista de features → ahora nombra el mecanismo + beneficio)
- ✅ Mecanismo renombrado: "El Cierre Blindado" → **"El Cierre a Prueba de Demandas"** (más ownable,
  se traza directo al dolor #1 dominante de FICHA-AVATAR — miedo a demandas) en Hero/Solución/Oferta/CtaFinal
- ✅ Suavizados los claims de "legal" sin validar (Oferta, paywall): "cálculo legal automático" →
  "cálculo según la ley colombiana"; "respaldo legal" → "respaldo ante cualquier reclamo" — el motor
  sigue sin validación de abogado (ver "Parámetros legales"), así que el copy ya no promete más de
  lo que el producto puede sostener
- ✅ Línea de aversión a la pérdida agregada en Oferta y Paywall (antes el paywall era "todo amable,
  nada de urgencia" — hallazgo del experto de conversión)
- ✅ Momento de "reconocimiento" emocional agregado en `StepResultado.tsx` del onboarding (patrón Noom:
  desculpabiliza antes de vender — "no es que hagas mal las cuentas...")
- ✅ Loop de retención: pasó de "documentado" a "con gatillo real" — Edge Function `recordatorio-diario`
  desplegada + programada con pg_cron (9am COT) que avisa por correo al dueño si sus empleados no han
  marcado. Requiere que el usuario configure `RESEND_API_KEY`/`EMAIL_FROM` como secrets de la Edge
  Function (`supabase secrets set`) para que efectivamente envíe — sin eso corre pero no manda nada.
- ⏸️ NO ejecutados (requieren al usuario o son decisión de negocio, no de código): logo genérico
  (es gusto/identidad del usuario, no se cambia sin su input) · canal de adquisición sin probar
  (requiere presupuesto y accionar del usuario) · foso competitivo débil (decisión estratégica de
  producto a mediano plazo, no un fix de código)
- Sin subagente `revisor-visual` disponible — pantallas tocadas verificadas por observación directa
  a 375px (screenshots tomados), declarado como autoevaluación, no revisor independiente.

⏸️ CHECKPOINT — Última acción completada: Auditoría exhaustiva ejecutada y sus hallazgos corregidos —
backend real conectado (Supabase: schema+RLS+auth+proxy de protección), placeholders del carrusel
reemplazados por pantallas reales, estados vacíos/loading/error agregados, header con logo en /app,
límite de plan aplicado (DB + cliente). tsc+lint+build limpios, verificado en navegador (proxy
redirige /app→/login sin sesión). / Siguiente acción exacta: usuario debe (a) configurar Site URL +
Redirect URLs en el dashboard de Supabase Auth para que el magic link funcione en producción, (b)
crear el repo vacío en GitHub y darme la URL para el primer push, (c) probar el login real de punta
a punta con su propio correo.

## Qué es esta app (3 líneas máximo)
Reloj checador desde el celular (con foto + GPS) para Pymes colombianas de 3-15 empleados. Calcula automático horas extra, recargos nocturnos, dominicales y festivos según la ley colombiana, y genera el reporte de nómina en 1 clic. Monetización: suscripción mensual/anual.

## Promesa central
"Esta app ayuda a dueños de Pymes colombianas (restaurantes, tiendas, talleres) a saber exacto quién trabajó, cuándo y cuánto pagarle sin miedo a demandas laborales ni sanciones de la UGPP, mediante marcación con foto+GPS y cálculo automático de la ley laboral colombiana."

## Reporte de validación (Sesión 1)
- Veredicto: Excelente oportunidad (dato aportado por el usuario en documento de investigación propio)
- Apps de referencia: Buk, Aleluya, Siigo Nube (caros/complejos para <10 empleados) · Jibble, Clockify (no entienden ley laboral colombiana)
- Lo que la competencia hace mal (nuestra oportunidad): cobran por módulos que no se necesitan, configuración de semanas, no calculan bien recargos nocturnos/festivos de Colombia
- Brecha LATAM confirmada: sí — +1.6M microempresas en Colombia gestionan personal manualmente; segmento 1-10 empleados desatendido por Buk/Aleluya
- Precio de referencia del mercado: $1.5-$3 USD/empleado/mes (apps internacionales)

## Dirección de Arte (Sesión 2 — NO cambiar sin justificación)
- FICHA-ARTE.md: existe y aprobada por el usuario — 2026-07-26 (eligió explícitamente Opción D)
- ¿Hubo referencia visual del usuario?: NO — pidió fusión de líderes del nicho (Buk, Aleluya, Siigo, Jibble, Homebase, Deputy, When I Work)
- Resumen: fondo #EEF1F6 · superficie #FDFEFF · acento #2554C7 (azul institucional) · éxito #1E824C · error #B42318 · aviso #B4790F · Display "Archivo" (700-900) · Body "Instrument Sans" (400-600) · radio 14-16px · modo CLARO
- Personalidad: preciso · confiable · tranquilizador (arquetipo Sabio con undertone Cuidador)
- Dispositivo ownable: sello circular de verificación rotado (-4°) + cifras siempre tabular-nums
- LOGO (superseded 2026-07-26): el usuario probó primero un SVG simple (isotipo anillo+check) —
  descartado. Logo DEFINITIVO: imagen de reloj+check en azul (PNG generado con Gemini, encontrada
  en Downloads como `Gemini_Generated_Image_agogtagogtagogta.png`). Se le quitó el fondo blanco con
  un script Node+sharp (umbral de blancura con borde suave para evitar halo) y se recortó al
  bounding box real del contenido → `public/brand/turnocheck-logo-raster.png` (700×653, fondo
  transparente). Al ser una imagen ya coloreada (no un trazo monocromo), se usa DIRECTA con
  `next/image` — SIN el círculo `bg-primary` de contenedor que usaba el logo anterior. Aplicado en:
  Header de landing, OnboardingShell, /login, y como favicon (`app/icon.png`). Se borraron los
  archivos del logo anterior (LogoMark.tsx, turnocheck-icon.svg, icon.svg) por quedar sin uso.
  NO tocado: los ShieldCheck de trust-badges/mockups (son íconos funcionales, no el logo).
  Ajuste 2026-07-26: el color original del PNG (azul degradado #2563EB→#1D4ED8, de Gemini) se
  reemplazó por el azul institucional PLANO `#2554C7` (el `--primary` real de la app) preservando
  el canal alpha/antialiasing — vía script Node+sharp (recolor.js), sin degradé (coherente con
  DESIGN-CORE: un acento sólido, no degradés arbitrarios).
- REGISTRO ANTI-REPETICIÓN (29/54): azul institucional #2554C7 + par Archivo/Instrument Sans quedan VETADOS para el próximo proyecto del SO. Dirección del banco 54 usada: "Fintech de bolsillo" (perturbada: azul en vez de verde-saldo)
- Descartadas (no volver a proponer): Ronda 1 completa — A "Preciso y en Control" (verde salvia-teal), B "Confianza Cercana" (teal bento), C "Rápido y al Grano" (mandarina timeline). Ronda 2 — E "Como tu Billetera" (oscuro/fintech), F "Fácil de Primer Vistazo" (amber/circular)

## Avatar y venta (Sesión 1 — NO cambiar sin validar)
- FICHA-AVATAR.md: existe y aprobada por el usuario — 2026-07-26
- Resumen: Don Carlos, 44 años, dueño de restaurante en Bogotá con 8 empleados · dolor #1: "me meten los dedos en la boca firmando horas que no son" + pánico a demanda laboral/UGPP · deseo #1: saber quién trabajó y cuánto pagar en 1 clic · nivel de consciencia: Problema/Solución (sabe que pierde plata, cree que la única alternativa es un software gigante) · sofisticación del mercado: media-alta en software pesado, muy baja en soluciones simples mobile-first
- 3 razones de compra dominantes (Jim Edwards): 1) Escapar del dolor mental (miedo a demandas/UGPP) · 2) Ahorrar dinero (fugas de nómina) · 3) Ahorrar tiempo/evitar esfuerzo (caos de quincena)
- Landing: pendiente — sigue estructura canónica de 10 secciones del 19

## Estrategia de monetización (Sesión 1 — NO cambiar sin validar)
- Modelo: Preview anónimo → paywall → login/auth (el DEFAULT del SO, 02C) — AJUSTADO en Sesión 4 desde la
  decisión inicial de "registro primero": el onboarding corre SIN cuenta (datos en localStorage), el
  usuario ve su primer cálculo real, y RECIÉN AHÍ se le pide crear cuenta (en el paywall) para guardar
  su progreso y activar el trial. Razón: TurnoCheck es nicho UTILITARIO (02B) — el valor es obvio y
  pedir cuenta antes de mostrarlo es fricción pura; además seguimos el patrón Duolingo ("el registro se
  siente como un paso natural dentro de un proceso que ya empezó", no una puerta de entrada).
- Trial: 7 días con tarjeta (modalidad Hotmart, óptimo 5-9 días según 02C).
- Pricing: Plan Micro $9.99/mes (hasta 5 empleados) | Plan Pyme $19.99/mes (hasta 15 empleados) — ambos con anual mostrado como precio/mes ("2 meses gratis")
- Onboarding: nicho UTILITARIO (02B) → 6 pantallas cortas, directo al valor (30-60s a la primera victoria), NO 15-25 preguntas de wellness. Pantallas: (1) negocio+tipo, (2) tipo de jornada (día/noche/dominical — personaliza el recargo que se destaca en la demo), (3) cuántos empleados (personaliza el plan recomendado), (4) agregar primer empleado, (5) "calculando" (loading, patrón Noom), (6) resultado personalizado (el cálculo en vivo, con la jornada real del negocio) → paywall → login.
- Refinamiento 2026-07-26 (a partir de un análisis externo que el usuario trajo, evaluado y aplicado parcialmente): se agregó el paso de jornada + microcopy de privacidad sobre foto/GPS junto a la cámara + línea de "6 horas ahorradas" (dato ya existente en FICHA-AVATAR, no inventado). Se EVALUÓ y se DESCARTÓ agregar una pantalla "¿eres dueño o empleado?" a este onboarding: el tráfico que llega aquí viene siempre de la landing de venta (dirigida al dueño), así que la pregunta sería fricción decorativa (Regla 2 de 02B). El enrolamiento de EMPLEADOS es un requisito real pero pertenece a la app interna (Sesión 5), ver Pendientes.

## Secuencia maestra de construcción (NO saltar)
- Estado de la secuencia: Landing ✅ construida · Onboarding ✅ · Paywall ✅ · Login (UI) ✅ · App interna (pendiente, Sesión 5) · Servicios externos (pendiente, Sesión 6)
- Ruta aprobada: `/` → `/onboarding` → `/paywall` → `/login` → `/app`
- Landing: construida — protagonista: cálculo automático de recargos + prueba legal con foto/GPS — CTA primario: "Calcular mi primera nómina gratis" → /onboarding
- Onboarding: construido — 6 pasos, primera victoria: ver el cálculo en vivo del primer empleado
- Paywall: construido y pulido — oferta principal: Plan Pyme $19.99 USD/mes (recomendado), con línea de tiempo del trial
- Login/Auth: UI construida (magic link) — backend real pendiente Sesión 6
- App interna: pendiente — secciones candidatas: Asistencia hoy / Empleados / Reportes / Configuración
- Servicios externos: pendiente — GitHub/Supabase/IA(no aplica)/Vercel/Resend/dominio/Hotmart

## Parámetros legales Colombia (CRÍTICO — motor de cálculo de Sesión 5, aportado por el usuario 2026-07-26)
- Ley 2101 de 2021, vigente desde el 15 de julio de 2026: jornada máxima semanal baja de 48 a **42 horas**. El sueldo mensual NO se reduce.
- **Divisor mensual: 210 horas** (ya NO 220/240) → valor hora ordinaria = salario mensual ÷ 210. Este es el parámetro más sensible: un error aquí invalida TODOS los cálculos de la app.
- Toda hora trabajada por encima de 42 h/semana = hora extra/suplementaria, sin importar cómo se repartan los días.
- 3 modelos válidos de distribución (el dueño elige uno por defecto, configurable): (a) 6 días × 7h (descanso domingo) · (b) 5 días × 8.4h (descanso sáb+dom) · (c) turnos 24/7: máx 6h/turno, 36h/semana, SIN recargo nocturno ni dominical en este modelo específico.
- Límites duros: mínimo 4h continuas por turno · máximo 9h/día en jornada flexible (sin contar extras) · extras máx. 2h/día y 12h/semana.
- Exoneración: ya no aplica la jornada semestral familiar ni las 2 horas recreativas de la ley anterior, al cumplir las 42h.
- Regla de implementación: estos parámetros van en una tabla configurable en base de datos (25), NUNCA hardcodeados en el frontend — así si la ley vuelve a cambiar, se actualiza sin republicar la app (mismo mecanismo de mitigación ya anotado en el documento de validación del usuario, punto 17.1).

## Decisiones técnicas (NO re-discutir sin pedirlo el usuario)
- Framework: Next.js (App Router) — decidido el 2026-07-26 — razón: la landing necesita SEO (keywords con demanda confirmada: "control de asistencia turnos colombia", "liquidar horas extras colombia")
- Stack: React + TypeScript + Tailwind v4 + shadcn/ui + Supabase (auth, DB, storage para fotos de marcación) + Vercel
- Features del MVP (orden de prioridad): 1) Marcación entrada/salida con foto+GPS · 2) Panel del dueño en tiempo real (quién llegó/quién no) · 3) Motor de cálculo de horas ordinarias/extras/nocturnas/dominicales/festivas según Colombia · 4) Exportador de reporte mensual PDF/Excel
- NO construir todavía: capacitaciones, firma de contratos, liquidación de cesantías/vacaciones, integración bancos/DIAN
- Modelo de IA: no aplica (esta app no usa IA generativa — es motor de reglas legales, no modelo de lenguaje)
- Regla "nunca" del producto: nunca calcular o reportar un valor de nómina que no siga la fórmula legal colombiana vigente y verificable · nunca compartir la foto o ubicación de un empleado con nadie fuera del dueño de esa empresa · nunca dejar vencer el trial y cobrar sin avisar antes la fecha y el monto exactos
- Loop de retención (24, decidido Sesión 4): Gatillo = hora de inicio de turno / recordatorio · Acción = marcar entrada/salida con foto+GPS · Recompensa = ver el cálculo en vivo + tranquilidad de tener todo blindado · Inversión = historial acumulado de empleados/turnos/reportes (cambiar de app cuesta más cuanto más se usa)
- Método de auth (26): Supabase Auth con Magic Link (passwordless) por correo — IMPLEMENTADO 2026-07-27 (`supabase.auth.signInWithOtp` + `/auth/callback`).
- Modelo de datos (25): IMPLEMENTADO 2026-07-27 — companies · employees · time_entries · subscriptions, todo con `owner_id` denormalizado + indexado (RLS de alto rendimiento) + Storage bucket `marcaciones`. Migraciones en `web/supabase/migrations/0001-0004`.
- Supabase: proyecto NUEVO creado 2026-07-26 vía MCP — "turnocheck" (id `dqnznvkyurlsjctnpizb`, región us-east-1, plan free $0/mes, confirmado con el usuario antes de crear). URL: https://dqnznvkyurlsjctnpizb.supabase.co. Separado del proyecto "Evoke App" (otra app, inactivo). `.env.local` creado con URL + publishable key (públicas, sin riesgo); la SUPABASE_SECRET_KEY la pega el usuario directamente desde el dashboard — el agente nunca la ve. `.env.example` (sin secretos) SÍ se commitea; se corrigió `web/.gitignore` (`.env*` ignoraba también `.env.example` por error — se agregó `!.env.example`).
- Git: repo inicializado en la raíz del proyecto 2026-07-26, primer commit hecho. Pendiente: usuario debe crear el repositorio vacío en GitHub y darme la URL para conectar el remoto y hacer push (una de las 5 cosas que le tocan a él).

## Refinamiento del paywall (2026-07-26, a partir de análisis externo evaluado)
- APLICADO: línea de tiempo visual del trial (Hoy $0 → día de recordatorio → día de cobro con fecha
  exacta) · precio también en COP aproximado junto al USD (el usuario piensa en pesos) · CTA más
  específico "Probar 7 días gratis — $0 hoy" · insignias de confianza (pago por Hotmart — CORREGIDO
  de la sugerencia original que decía "App Store/Google Play", falso para una web app · ley laboral
  colombiana · cancela cuando quieras).
- RECHAZADO — testimonio de cliente inventado ("Efraín G., Medellín"): viola la regla de PRUEBA
  SOCIAL EN FRÍO (19/02B) — cero testimonios hasta tener 3 reales. Se agregará cuando existan.
- RECHAZADO — cambiar a modelo freemium (paywall solo al 3er empleado o al exportar PDF): la matriz
  de 02C documenta el freemium como el modelo de MENOR conversión de los 3 (2.1% vs ~12% del modelo
  de prueba ya implementado). Se mantiene Modelo 2 (onboarding-first con trial) — cosa juzgada de
  Sesión 1, no se reabre sin pedido explícito del usuario.

## Video del hero (2026-07-26)
- El usuario aportó un video promocional (10s, 1280x720, H.264+AAC, 2.36MB). Se comprimió con
  ffmpeg (binario portátil vía `ffmpeg-static`, sin instalar nada a nivel de sistema): audio
  eliminado (es autoplay muted, no hace falta) + libx264 CRF 27 + faststart → 927KB (-61%). Se
  generó también un poster JPG (primer frame) para que cargue rápido mientras el video buffer.
  Reemplazó el mockup HTML "HeroDemo" que había en el Hero de la landing (`components/app/landing/
  Hero.tsx`) — sigue la jerarquía de PRUEBA SOCIAL EN FRÍO del 19: un demo real siempre le gana a
  un mockup. Archivos: `public/video/turnocheck-demo.mp4` + `turnocheck-demo-poster.jpg`.
  PhoneMock.tsx se conservó (lo sigue usando la sección "La app por dentro").

## Auditoría exhaustiva y correcciones (2026-07-27)
Reporte completo entregado y aprobado ("todo") por el usuario; ejecutado por capas:
- 🔴 CRÍTICOS resueltos: (1) Backend real conectado — Supabase project `dqnznvkyurlsjctnpizb`,
  4 tablas (companies/employees/time_entries/subscriptions) con RLS por `owner_id = (select auth.uid())`
  + índices, trigger de límite de plan, bucket de Storage `marcaciones` (privado, por carpeta de usuario).
  Advisors de seguridad y rendimiento revisados y en verde. (2) Auth real por magic link
  (`supabase.auth.signInWithOtp` + `/auth/callback` que crea la empresa desde el onboarding anónimo
  y limpia el localStorage) — reemplaza el login de mentira. `proxy.ts` (antes middleware.ts — Next 16
  renombró la convención) protege TODO `/app/*`: sin sesión, redirige a `/login`. (3) Carrusel "La app
  por dentro" ya NO dice "en construcción": muestra 3 reproducciones fieles de las pantallas reales
  (`components/app/landing/AppScreens.tsx`) — no son PNG literales (la app exige login), pero sí el
  mismo diseño/contenido, declarado como tal (nivel 2 de mockups honestos, 19).
- 🟠 IMPORTANTES resueltos: límite de empleados por plan aplicado en 2 capas (trigger SQL +
  `puedeAgregarEmpleado()` en cliente, que manda al paywall en vez de mostrar un error) · vacío
  muerto corregido en estados vacíos de Hoy/Reportes (centrado + ícono) · header con logo agregado
  a todo `/app/*` (`AppHeader.tsx`) · Error Boundaries agregados (`app/error.tsx` y `app/app/error.tsx`).
- 🟡 PULIDO resuelto: skeletons de carga en las 4 pantallas del panel (ya no pantalla blanca mientras
  carga). PENDIENTE (no crítico, anotado para después): estado "offline" explícito en /app/marcar.
- Se corrigieron además 3 errores reales de lint (`react-hooks/set-state-in-effect`) durante la
  verificación — 2 son falsos positivos documentados (lectura de localStorage tras montar, necesaria
  por SSR) y 1 se resolvió reescribiendo el patrón (empleados/page.tsx) sin necesidad de excepción.
- Sin revisor-visual disponible en este entorno — auditoría de diseño puntuada por observación directa
  y declarada como tal, no autoevaluada por quien construyó (se avisó explícitamente al usuario).

## Sesiones completadas ✅
- Sesión 3 — Página de ventas: landing con las 10 secciones canónicas + mecanismo bautizado "el Cierre Blindado" + páginas legales reales (/privacidad /terminos /reembolso /contacto). Auditoría de escaneabilidad pasada (se corrigió la sección de Agitación, que era un muro de texto). Pendiente: reemplazar los placeholders del carrusel por screenshots reales cuando exista la app interna.
- Sesión 4 — Onboarding (6 pasos tras refinamiento) + paywall personalizado y pulido + login por magic link (UI). Datos en localStorage (sin backend real todavía). Probado en navegador — verificado 2026-07-26.

- Sesión 5 — App interna: 4 secciones (Hoy / Empleados / Reportes / Ajustes) + motor de cálculo legal
  real (`lib/nomina.ts`, Ley 2101: divisor 210, jornada 42h, recargos nocturno/extra/dominical) +
  marcación con cámara y GPS reales (`app/app/marcar`, con fallback honesto si el dispositivo no
  da permiso). Todo sobre localStorage todavía — Supabase real es Sesión 6. Verificado 2026-07-26
  con un caso de prueba (turno 6:58am-11pm → $118.173, matemática confirmada a mano).

## Sesión en progreso 🔧
- Ninguna — Sesión 5 cerrada. Próxima: Sesión 6 (Supabase, Hotmart, seguridad/RLS).

## Próximas sesiones 📋
- Sesión 5: App interna (marcación real con foto+GPS, panel de empleados en vivo, reportes). REQUISITO
  agregado 2026-07-26: los EMPLEADOS nunca crean cuenta con correo/contraseña — se enrolan por un
  link de WhatsApp o código PIN/QR que genera el dueño desde su panel; su pantalla de marcación es
  de un solo toque (foto + confirmar). Esto responde directo a la objeción #1 de FICHA-AVATAR
  ("mis empleados no van a saber usar una app").
- Sesión 6: Conexiones reales — Supabase (proyecto nuevo, no reutilizar "Evoke App"), auth por magic link real, Hotmart, seguridad/RLS

## Problemas conocidos ⚠️
- Resuelto (Sesión 5): `readAppData()` regeneraba un ID aleatorio del empleado semilla en cada
  lectura si nunca se había persistido — causaba "No encontramos ese empleado" al navegar a marcar.
  Fix: se persiste la semilla en el primer read.
- Resuelto (Sesión 5): si entrada y salida caían en el mismo minuto, el cálculo de turno los
  tomaba como si hubieran cruzado la medianoche y sumaba 24h de más. Fix: solo se considera cruce
  de medianoche si la salida es ESTRICTAMENTE menor a la entrada.
- ⚠️ PENDIENTE — el motor de `lib/nomina.ts` es una primera versión técnica de la Ley 2101 (supuestos
  documentados en el propio archivo). Antes de usarlo con nómina real de un cliente, debe validarlo
  un contador o abogado laboral colombiano. No declarar el motor "listo para vender" sin ese paso.
- ⚠️ PENDIENTE — los días festivos de Colombia se marcan a mano (checkbox) por ahora; falta una
  tabla de festivos por año (se agrega en Sesión 6 con base de datos real).

## Pendientes del usuario (acciones que el usuario debe hacer)
- [x] RESUELTO 2026-07-27: `SUPABASE_SECRET_KEY` corregida al formato/proyecto correcto
      (`sb_secret_...` de "turnocheck") — verificado con una llamada real a la Admin API
      (`auth.admin.generateLink`), sin que el agente viera el valor completo de la clave.
- [ ] Configurar en el dashboard de Supabase (Authentication → URL Configuration): Site URL y Redirect
      URLs — agregar `http://localhost:3000/auth/callback`, la URL de Vercel cuando exista, Y el
      dominio propio cuando el usuario lo compre (dijo 2026-07-28 que va a comprar uno — anotar
      recordatorio: sin este paso el login no funciona en el dominio nuevo).
- [ ] Editar la plantilla "Magic Link" en Supabase (Authentication → Email Templates): cambiar
      `<a href="{{ .ConfirmationURL }}">` por
      `<a href="{{ .SiteURL }}/auth/confirm-click?confirmation_url={{ .ConfirmationURL }}">`.
      2026-07-28: el usuario pidió que el login siga siendo "solo un link" (sin código escrito) —
      se reemplazó el código de 6 dígitos por una pantalla intermedia `/auth/confirm-click` con un
      botón "Iniciar sesión": Hotmail/Outlook puede pre-visitar esa pantalla sin gastar el link real
      (que solo se consume cuando el usuario hace clic en el botón). Sin este cambio de plantilla,
      el correo sigue trayendo el link directo de siempre y el problema no se resuelve.
- [ ] Activar los recordatorios diarios: `supabase secrets set RESEND_API_KEY=... EMAIL_FROM=...`
      (proyecto `dqnznvkyurlsjctnpizb`) — la función y el cron ya están desplegados, solo faltan las claves.
- [x] RESUELTO 2026-07-28: repositorio GitHub creado (`github.com/rosibellmcasasm/TurnoCheck`),
      remoto agregado localmente. PENDIENTE del usuario: correr `git push -u origin master` desde
      SU propia terminal (el agente no puede — el push pide login interactivo que este entorno no
      puede abrir).
- [x] RESUELTO: cuenta de Vercel ya conectada (equipo `rosibellmcasasm-3809's projects`).
- [ ] Comprar el dominio propio (mencionado 2026-07-28, sin comprar aún) — cuando lo tenga, avisar
      para conectarlo en Vercel + actualizar Supabase (ver primer punto de esta lista).
- [ ] Crear cuenta de Hotmart cuando se llegue a la sesión de venta/cobro real.
- [ ] Probar el login real con su propio correo de punta a punta usando el CÓDIGO de 6 dígitos (no
      el link) — pendiente hasta que agregue `{{ .Token }}` a la plantilla de Supabase.

## Notas para la próxima sesión
- El usuario aportó un documento de investigación propio muy completo (avatar, dolores, deseos, objeciones, MVP, monetización, riesgos) — ya se usó como Reporte de Validación de la Sesión 1.
- El usuario suele traer análisis de otras IAs (Gemini) para contrastar — evaluarlos con criterio propio contra las reglas del SO antes de aplicar: adoptar lo que mejora sin romper reglas (ver ejemplos ya aplicados), rechazar explícitamente y explicar por qué lo que viola reglas duras (prueba social inventada, cambios de modelo de monetización ya decidido, claims falsos).
