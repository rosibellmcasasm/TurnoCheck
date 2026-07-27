# FICHA DE DIRECCIÓN DE ARTE — TurnoCheck

## Referencia del usuario (CONTRATO — ver 16, protocolo obligatorio)
- ¿Hay imagen(es) de referencia del usuario?: NO → el usuario pidió fusionar las apps líderes del nicho.

## Identidad derivada (FUSIÓN de líderes — 16 PASO 0.2bis — + banco del 54 para el dispositivo)
- TABLA DE LÍDERES: Buk/Aleluya/Siigo → institucional azul, sans geométrica, paneles de datos en tabla (tomado: la lógica de color azul de confianza + el layout de tabla) · Jibble → verificación con foto+GPS+geocerca como sello de confianza (tomado: el concepto de "sello verificado") · Homebase → calidez para dueños no técnicos (tomado: tono humano en el copy, no en el color de esta opción) · Deputy/When I Work → panel de "quién está trabajando ahora" en tiempo real (tomado: la fila de asistencia con hora exacta)
- Combinación tipográfica usada: Archivo (display) + Instrument Sans (body) — el mismo par validado para fintech/confianza en 16 (ejemplo Revolut/Nubank) · validada contra líderes: SÍ
- Arquetipo: Sabio (preciso, institucional, creíble) con undertone Cuidador (protector) · Mundo del sujeto (0.45): el sello/candado de prueba legal (foto+GPS como respaldo ante la UGPP) → el badge de verificación rotado; el desprendible de nómina → tabla de asistencia ordenada; los pesos colombianos → cifras tabulares protagonistas
- Dirección del banco 54 usada para el DISPOSITIVO OWNABLE: "Fintech de bolsillo" (numerales tabulares) + concepto propio de sello institucional · perturbación aplicada: azul institucional en vez del verde-saldo del banco (manda la lógica de color de los líderes del nicho, no la paleta literal del banco — regla (f) de 54)

## Personalidad compilada
- 3 adjetivos de personalidad: preciso, confiable, tranquilizador
- Compilación: ease-out corto y exacto (cero spring) · duración base 180-200ms · stagger 30-40ms · exclamaciones máx 1/pantalla (tono sobrio, no juguetón) · celebración nivel bajo (check discreto, no confetti) · radio tendencial 14-16px

## Brand kit final (los valores que viven en globals.css) — MODO CLARO (light-first)
- Fondo: `#EEF1F6` · Superficie: `#FDFEFF` · Hundido: `#E9EDF4` · Texto 1º/2º: `#171E2C` / `#5C6779`
- Acento: `#2554C7` (SOLO en: CTA primario, montos en vivo, nav activo, links) · Sello de verificación: mismo azul en outline, nunca relleno completo
- Semánticos: éxito `#1E824C` · error `#B42318` (siempre con ícono) · aviso `#B4790F`
- Display: Archivo (pesos 700/800/900) · Body: Instrument Sans (pesos 400/500/600) · Escala: display 32px / title 20px / body 15px / label 12px
- Radio: botones 14px · cards 16px · chips 8px · Profundidad: sombras suaves multicapa con tinte frío (nunca borde duro) · Espaciado base: escala 4·8·12·16·24·32·48·64
- Dispositivo ownable: sello circular rotado (-4°) con anillo interior punteado, sobre el ícono de la empresa/verificación · cifras siempre `tabular-nums`
- Motion signature: `--ease-out` cubic-bezier(0.16,1,0.3,1) · stagger 30-40ms · sin springs salvo micro-feedback de tap

## Trazabilidad y vetos
- Protocolo A/B/C: 2 rondas — Ronda 1 (A "Preciso y en Control" verde salvia-teal · B "Confianza Cercana" teal bento · C "Rápido y al Grano" mandarina timeline) descartada completa a pedido del usuario. Ronda 2: elegida **Opción D "Serio y Confiable"** (azul institucional, tabla) sobre E "Como tu Billetera" (oscuro/fintech) y F "Fácil de Primer Vistazo" (amber/circular). Páginas comparativas: `direcciones-abc.html` y `direcciones-def.html` (raíz del proyecto, se eliminan tras cerrar esta ficha).
- Paleta derivada de: fusión de líderes (Buk/Aleluya/Siigo) + banco 54 "Fintech de bolsillo" (perturbado: azul en vez de verde-saldo)
- Registro anti-repetición (anotar en ESTADO.md): azul institucional `#2554C7` + par Archivo/Instrument Sans quedan VETADOS para el próximo proyecto del SO
- Modo (claro/oscuro) DERIVADO por: audiencia no técnica (dueños de Pyme 35-55) que confía más en interfaces claras y "legibles" que en modo oscuro; oscuro se reservó como alternativa (Opción E) y no fue la elegida

## Idioma UI: Español (Colombia) · Fecha de cierre de la ficha: 2026-07-26 · Aprobada por el usuario: SÍ (eligió Opción D explícitamente)
