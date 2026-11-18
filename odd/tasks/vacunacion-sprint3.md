# Vacunación Sprint 3 — US-33, US-34, US-35, US-36, US-60 + KI-05

Objetivo: gestión de turnos de vacunación de la enfermera (RF-04b), alerta de stock bajo (RF-04c) y verificación del KI-05 (tope de 50 unidades en ingresos de stock). Rama: `feature/vacunacion-sprint3` (desde `develop`). Estrategia de entrega: `feature-branch-chain` (PRs encadenados contra la rama de feature; merge a `develop` al final — elegida por el usuario el 2026-11-18). Test runner: `pnpm test`.

## Specs

### S1 (US-33) — Asignar turno de vacunación
Como enfermera, quiero asignar un turno de vacunación a un paciente, para organizar la aplicación de vacunas según el stock.
- Opción "Turnos de vacunación" en el menú de la enfermera, botón "Asignar turno". Buscar paciente por nombre o DNI (solo pacientes activos), elegir la vacuna (se muestran las unidades disponibles) y un día y horario libre: "turnos de 15 minutos, de lunes a viernes de 8:00 a 18:00".
- Al confirmar: el turno queda "Reservado" y se descuenta 1 unidad del stock de la vacuna.
- CA1: Hepatitis B con 45 unidades → el stock pasa a 44 y el paciente lo ve en "Mis turnos".
- CA2: vacuna con 0 unidades → opción deshabilitada con la indicación "Sin stock".
- CA3: horario que ya tiene un turno de vacunación → no se ofrece.
- CA4: paciente que ya tiene un turno en esa fecha y hora → el sistema lo informa y no lo asigna.
- Wireframe: aviso "Dosis sujeta a stock en confirmación"; leyenda Disponible/Ocupado; botones "Cancelar" y "Confirmar"; tarjeta del paciente con DNI y estado ACTIVO.

### S2 (US-34) — Consultar turnos de vacunación de un día
Como enfermera, quiero consultar los turnos de vacunación de un día, para organizar mi jornada.
- Pantalla "Turnos de vacunación" (día actual por defecto), ordenados por hora, con paciente, DNI, vacuna y estado (Reservado, Atendido, Ausente o Cancelado). Se puede cambiar de día.
- CA2: día sin turnos → "No hay turnos de vacunación para este día".
- CA3: usuario sin rol de enfermera → se le niega el acceso.
- Wireframe: chips ATENDIDOS / PENDIENTES / TURNOS DEL DÍA, navegación de día con "HOY", botón "+ Asignar turno", subtítulo "Gestión y seguimiento de turnos para aplicación de biológicos en vacunatorio.".

### S3 (US-35) — Cancelar turno de vacunación
Como enfermera, quiero cancelar un turno de vacunación, para liberar el horario y devolver la dosis al stock.
- Cada turno futuro tiene el botón "Cancelar", con confirmación. Al confirmar: "Cancelado", horario libre y la unidad vuelve al stock.
- El máximo de 50 se controla solo al registrar ingresos (US-22): las dosis que vuelven se suman aunque se supere ese máximo.
- CA1: Polio con stock 20 → al cancelar, stock 21.
- CA2: mensaje de confirmación → "Volver" deja el turno reservado.
- CA3: el paciente ve el turno en "Anteriores" con estado "Cancelado".
- CA4: vacuna con 50 unidades → al cancelar, stock 51.
- Wireframe del modal: "¿Cancelar el turno de vacunación de {paciente}?" y "El horario queda libre y la dosis vuelve al stock."; botones "Volver" y "Cancelar turno".

### S4 (US-36) — Alerta de stock bajo
Como enfermera, quiero ver una alerta cuando el stock de una vacuna es bajo, para reponerla a tiempo.
- Stock de 10 unidades o menos → la pantalla de stock la marca con la etiqueta "Stock bajo" y el Inicio de la enfermera muestra un aviso con las vacunas en esa situación. Se evalúa automáticamente después de cada ingreso, egreso, reserva, cancelación o ausencia. La alerta desaparece cuando el stock supera las 10 unidades.
- CA1: 11 unidades + egreso de 1 → 10 y "Stock bajo".
- CA2: al iniciar sesión, la enfermera ve en su Inicio el aviso con la vacuna y sus unidades.
- CA3: ingreso que la deja en 30 → la alerta desaparece.
- CA4: 11 unidades + asignación de turno → 10 y "Stock bajo".
- Wireframes: banner "Atención: hay vacunas con stock bajo (10 unidades o menos)" en stock; en Inicio, aviso con "Requiere revisión y solicitud de reposición preventiva inmediata." y listado por vacuna con unidades y etiqueta "Stock bajo".
- Decisión aprobada en plan: 0 unidades mantiene "Sin stock" (US-24); badge "Stock bajo" para 1–10; el banner/aviso incluye 0.

### S5 (US-60) — Registrar aplicación o ausencia
Como enfermera, quiero registrar si se aplicó la vacuna o si el paciente no asistió, para cerrar el turno de vacunación.
- En la lista de turnos de vacunación, los turnos reservados del día actual o de días anteriores tienen los botones "Vacuna aplicada" y "Ausente".
- "Vacuna aplicada" → "Atendido"; la dosis ya se descontó al reservar, el stock no cambia. "Ausente" → "Ausente" y la dosis vuelve al stock (misma regla que US-35).
- CA1: turno reservado del día + "Vacuna aplicada" → "Atendido" y el stock no cambia.
- CA2: Polio con stock 8 + "Ausente" → "Ausente" y stock 9.
- CA3: turno de un día futuro → los botones no están disponibles.
- CA4: el paciente ve el turno en "Anteriores" con estado "Atendido" o "Ausente".
- Wireframes de modales: "¿Confirmar que se aplicó la {vacuna} a {paciente}?" con nota "La dosis fue descontada previamente al reservar el turno. Registrar la aplicación no descuenta stock adicional."; "¿Marcar a {paciente} como ausente?" con "La dosis vuelve al stock.".

### S6 (KI-05) — Tope de 50 unidades en ingresos (verificación)
Al registrar un ingreso, el sistema no puede dejar una vacuna por encima de 50 unidades.
- Reproducción esperada: vacuna con 45 unidades + ingreso de 10 → el sistema informa "El stock máximo por vacuna es de 50 unidades (disponibles para ingresar: 5)" y el stock sigue en 45.
- Estado actual: ya implementado (commit `f5c71c0` en `develop`; guard en `lib/stock-service.ts` `registrarIngreso`, mensaje en `lib/domain/vacuna.ts`, tests en `tests/vacuna.test.ts`, CA reflejado en `odd/tasks/coberturas-stock.md` S7).
- Alcance: verificación end-to-end (test + reproducción manual) y confirmación del criterio en el doc existente; no se reimplementa.

### Invariantes transversales
- La dosis se descuenta al reservar (S1); vuelve al cancelar (S3) o marcar ausente (S5); "aplicada" no mueve stock (S5).
- Las devoluciones suman aunque se superen 50 (solo los ingresos tienen tope).
- Stock bajo = stockActual ≤ 10, siempre derivado (sin columna nueva).
- Reservas, cancelaciones y ausencias mueven `stockActual` pero NO crean filas de `MovimientoStock` (consistente con US-44 ya entregada, que cuenta turnos y movimientos por separado).
- Slots de vacunación: globales, de 15 minutos, lunes a viernes de 8:00 a 18:00. Concurrencia protegida reutilizando `slotMedico` (unique) con clave `VACUNACION|<fecha>|<inicioMin>` y `slotPaciente` para el conflicto del paciente.

## Tasks

- T1 — Dominio puro de vacunación y stock bajo con tests RED→GREEN (grilla 15 min lun–vie 8–18, horarios libres, reglas de cancelación/cierre, umbral stock bajo, devolución sin tope) · S1,S3,S4,S5 · inline · ✅ RED→GREEN (89 tests) + eslint limpio
- T2 — US-36: banner y badge "Stock bajo" en `/stock` + aviso en Inicio de la enfermera · S4 · inline · ✅ lint + suite (89 tests)
- T3 — US-34: ruta `/turnos-vacunacion` con lista del día, chips, navegación de día, botón "+ Asignar turno", guard enfermera y item de sidebar · S2 · inline · ✅ tests 92/92 + eslint + tsc limpios
- T4 — US-33: flujo de asignación `/turnos-vacunacion/asignar` (paciente activo → vacuna con unidades → grilla de horarios → confirmar) con transacción atómica de reserva y descuento · S1 · inline · pendiente
- T5 — US-35: botón "Cancelar" en turnos futuros con modal de confirmación y devolución de dosis sin tope · S3 · inline · pendiente
- T6 — US-60: botones "Vacuna aplicada"/"Ausente" para turnos de hoy o anteriores con modales y devolución solo en ausencia · S5 · inline · pendiente
- T7 — KI-05: verificación del fix (test + reproducción 45+10), confirmar CA en doc de stock, suite completa y cierre · S6 · inline · pendiente

## Log

- L1 (2026-11-18, pedido original): "En la carpeta cosasNuevas te deje los nuevos archivos que tienes que ver, en ellos encontraras wireframes y documentacion detallando las us a implentar, tenemos que implementar las siguientes US:33,34,35,36,60, known issue, genera un plan y presentamelo"
- L2 (2026-11-18): Plan presentado y aprobado ("Dale"). Fuentes: `cosasNuevas/Analisis Requerimientos para Sprint 3.pdf` (extraído con pdfjs-dist) y `cosasNuevas/Known Issues Sprint 2.pdf`; wireframes leídos vía OCR de Windows (es-ES), modelo sin visión directa. Sin migración de esquema: `Turno` ya soporta `tipo: VACUNACION`. KI-05 ya corregido en `f5c71c0`. Estimación de forecast: ~1.300 líneas autoradas → estrategia de entrega a definir por el usuario (ask-on-risk).
- L3 (2026-11-18): Estrategia de entrega elegida por el usuario: `feature-branch-chain` (slices como PRs encadenados contra `feature/vacunacion-sprint3`).
- L4 (2026-11-18): T1 commiteado como `19952ab`; assess nativo sobre `bc980da..19952ab`: `medium` (executable_change en `lib/domain/vacuna.ts`), `review_due: false`, `under_budget` (el slice sigue acumulando contra el límite `bc980da`). Limitación ambiental: en este checkout no hay `.env`/`DATABASE_URL`, así que `prisma generate`, `next build` y `next dev` no corren localmente (QA visual queda en la máquina del usuario); se compensa con lint + suite de dominio.
- L5 (2026-11-18, instrucción del usuario): "no comitees nada" y luego la aclaración "Si comitea pero no pushees" → los commits locales están permitidos; queda PROHIBIDO pushear (no `git push` a ningún remoto). T2 quedó commiteado como `7aa5055` justo antes de la instrucción; no se revierte.
