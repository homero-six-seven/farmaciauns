# Fix: Reporte de Errores 21_10_26 — US-20 a US-24

**Objetivo:** Resolver los 3 defectos del "Reporte de Errores 21_10_26" asociados a US-20..US-24: 08 (Quitar cobertura no funciona), 09 (no se puede registrar "Particular"), 07 (coberturas duplicadas con puntos).
**Rama:** `fix/reporte-errores-us20-24`
**Estrategia de entrega:** `single-pr` (push/PR/merge a decisión del usuario).
**Test runner:** `pnpm test` (`tsx --test`).

## Specs

- **S1 (Defecto 08, US-20, Alta):** Al hacer clic en "Quitar" en una tarjeta de "Mis coberturas", la asociación se elimina de la base y, tras refrescar, la cobertura ya no aparece. (Reporte: "No funciona la acción 'Quitar': al seleccionar IOMA y apretar 'Quitar' no se elimina. Incluso al refrescar la página, la cobertura sigue apareciendo.")
- **S2 (Defecto 09, US-21, Alta):** Un paciente puede registrar su cobertura como "Particular" y el sistema la refleja correctamente. (Reporte: "No se permite registrar con la opción 'Particular' (el sistema no procesa el guardado o bloquea el formulario)". Esperado: "Se registra la cobertura como particular del paciente correctamente.")
- **S3 (Defecto 07, US-20, Media):** Ingresar una cobertura que ya existe pero con puntos en las siglas (ej: "O.S.D.E" vs "OSDE") no crea un duplicado: se unifica con la existente o se rechaza. (Reporte: "Se permite ingresar una cobertura que ya existe pero con puntos, registrando por ejemplo 'O.S.D.E' como un duplicado.")

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|----|-------|------|--------|--------|
| T1 | S1 | inline | done | fix bugs IDs: 07, 08, 09 (squash) |
| T2 | S2 | inline | done | fix bugs IDs: 07, 08, 09 (squash) |
| T3 | S3 | inline | done | fix bugs IDs: 07, 08, 09 (squash) |

## Log

- **L1:** "Che, teje un reporte de errores, quiero que resuelvas todos los bugs encontrados desde las US20 a US24, primero analiza los bugs, confirmalos y crea el plan para resolver cada uno y muestramelo"
- **L2 (2026-10-22):** Fuente: "Reporte de Errores 21_10_26.pdf" (28 páginas, 19 defectos). En el rango US-20..US-24 hay 3 defectos (07, 08, 09); US-22/23/24 no tienen defectos reportados.
- **L3 (2026-10-22):** Re-evaluación tras pull: `develop` incorporó `36abd61 "Fixed US errors"` (solo agenda US-25/26/27); el código de coberturas/stock no cambió. Los 3 defectos se re-confirmaron contra el estado actual.
- **L4 (2026-10-22, análisis):** Confirmaciones a nivel de código:
  - **07:** `lib/domain/cobertura.ts:13` — `normalizarNombreCobertura` = `trim().toLowerCase()` sin quitar puntos → "O.S.D.E" ≠ "OSDE" → fila duplicada (`nombreNormalizado` es `@unique`).
  - **08:** `app/coberturas/coberturas-lista.tsx:119` — el botón submit del modal tiene `onClick={() => setConfirmar(null)}`: desmonta el form antes del default action del navegador, la server action nunca corre. Además `app/actions.ts:606` tiene `catch {}` silencioso.
  - **09:** el guardado SÍ persiste (`coberturaId: null`), pero `app/cobertura/page.tsx:30` usa `cobertura.coberturaId != null` y el modelo no distingue "Particular" de "nunca registró": la página vuelve a mostrar el form sin confirmación.
- **L5 (2026-10-22, decisiones):** Orden de implementación: T1 (08) → T2 (09) → T3 (07). T2 requiere la columna `User.esParticular Boolean @default(false)` (aditiva, aplicada con `prisma db push`). T3 requiere backfill/dedupe de `nombreNormalizado` existente.
- **L6 (2026-10-22, T1 done):** Bug 08 resuelto: el cierre del modal pasó de `onClick` (desmontaba el form antes del submit) a `onSubmit` del form en `app/coberturas/coberturas-lista.tsx`. Sin test automatizado posible (wiring de UI, sin runner de componentes) — excepción documentada. Evidencia: `tsc --noEmit` OK, `eslint` OK, `pnpm test` 36/36. Verificación manual: entrar como médico → Mis coberturas → Quitar → confirmar → la cobertura desaparece y NO reaparece al refrescar. **Risk: 6** (ningún test automatizado cubre el wiring del modal).
- **L7 (2026-10-22, T2 done):** Bug 09 resuelto: columna `User.esParticular Boolean @default(false)` (schema + `prisma db push` OK contra Neon — el pooler responde por TCP), `obtenerCoberturaDePaciente`/`asignarCoberturaAPaciente` devuelven/setean el flag, `app/cobertura/page.tsx` muestra la card "COBERTURA ACTIVA — Particular" cuando corresponde, y el autorregistro US-06 marca "Particular" al crear el paciente. Sin test unitario nuevo (la lógica es I/O de Prisma; no hay infra de mock) — excepción documentada. Evidencia: `tsc` OK, `eslint` OK, `pnpm test` 36/36. Verificación manual: paciente sin cobertura → Mi cobertura → elegir "Particular" → Guardar → se ve la card "Cobertura: Particular / Nº afiliado: —" y NO reaparece el form. **Risk: 1** (formato persistido: columna aditiva con default, aplicada vía db push).
- **L8 (2026-10-22, T3 done):** Bug 07 resuelto. RED→GREEN: nuevo test `variantes con puntos o espacios en las siglas normalizan igual (defecto 07)` (37 tests, 1 fail → 37/37). `normalizarNombreCobertura` ahora hace `trim().toLowerCase().replace(/[\s.]+/g, "")`. `prisma/seed.ts` reutiliza el helper. Nuevo `prisma/backfill-cobertura-normalizado.ts` (idempotente) corrido contra Neon: ANTES había 10 filas con duplicados reales (`I.O.M.A`+`IOMA`, `O.S.D.E`+`OSDE`); DESPUÉS: 8 filas limpias (2 duplicadas eliminadas, 2 vínculos médico↔cobertura re-apuntados, 0 pacientes afectados, 3 claves re-normalizadas; 2ª corrida sin cambios). Evidencia: `tsc` OK, `eslint` OK, `pnpm test` 37/37. **Risk: 1** (migración de datos existentes en Neon).
- **L9 (2026-10-22, verificación final):** Revisión de los specs S1/S2/S3 en copia limpia del repo: **S1 PASS, S2 PASS, S3 PASS, sin blockers**. Advisories (pre-existentes, no bloquean): `catch {}` silencioso en `quitarCobertura` (actions.ts) y falta de test automatizado para el wiring S1/S2 (excepción documentada). RED→GREEN de S3 re-confirmado contra baseline 36abd61. Probe de límites del normalizador agregado como regresión (`tests/cobertura.test.ts`, 38 tests). Evidencia final: `pnpm test` 38/38 OK, `tsc` OK, `eslint` OK.
- **L10 (2026-10-22, feature cerrada):** Un único commit `fix bugs IDs: 07, 08, 09` en `fix/reporte-errores-us20-24` (S1+S2+S3 + regresiones + backfill), pusheado a origin. PR/merge a develop quedan a decisión del usuario.
