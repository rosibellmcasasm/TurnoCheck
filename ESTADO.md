# ESTADO — TurnoCheck
Última actualización: 2026-07-27 | Sesión actual: 1

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
- [ ] ⚠️ CRÍTICO Y REPETIDO 2 VECES: `web/.env.local` → `SUPABASE_SECRET_KEY` sigue siendo la clave
      de OTRO proyecto de Supabase (verificado 2026-07-27, sin ver el valor completo — solo se comparó
      a qué proyecto apunta). Hasta que esto no se corrija con la clave real de "turnocheck"
      (`sb_secret_...` desde https://supabase.com/dashboard/project/dqnznvkyurlsjctnpizb/settings/api-keys,
      pestaña "API Keys" no "Legacy"), el backend real no funciona pese a que todo el código ya está listo.
- [ ] Configurar en el dashboard de Supabase (Authentication → URL Configuration): Site URL y Redirect
      URLs (agregar `http://localhost:3000/auth/callback` para dev y la URL de Vercel cuando exista)
      — sin esto el link mágico puede rechazar la redirección.
- [ ] Activar los recordatorios diarios: `supabase secrets set RESEND_API_KEY=... EMAIL_FROM=...`
      (proyecto `dqnznvkyurlsjctnpizb`) — la función y el cron ya están desplegados, solo faltan las claves.
- [ ] Crear el repositorio vacío en GitHub (turnocheck) y darme la URL para el primer push.
- [ ] Crear cuenta de Vercel para publicar (aún no se ha hecho).
- [ ] Crear cuenta de Hotmart cuando se llegue a la sesión de venta/cobro real.
- [ ] Probar el login real con su propio correo de punta a punta (pedir el link, abrirlo, confirmar que crea la empresa) — solo posible después de corregir la clave secreta.

## Notas para la próxima sesión
- El usuario aportó un documento de investigación propio muy completo (avatar, dolores, deseos, objeciones, MVP, monetización, riesgos) — ya se usó como Reporte de Validación de la Sesión 1.
- El usuario suele traer análisis de otras IAs (Gemini) para contrastar — evaluarlos con criterio propio contra las reglas del SO antes de aplicar: adoptar lo que mejora sin romper reglas (ver ejemplos ya aplicados), rechazar explícitamente y explicar por qué lo que viola reglas duras (prueba social inventada, cambios de modelo de monetización ya decidido, claims falsos).
