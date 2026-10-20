# Coberturas Médicas (RF-05b) + Stock de Vacunas (RF-04a)

**Objetivo:** Implementar los módulos de Coberturas Médicas y Stock de Vacunas (datos, lógica, RBAC, API REST y UI).
**Rama:** `feat/coberturas-stock`
**Estrategia de entrega:** `single-pr` (rama de feature; push/PR/merge quedan a decisión del usuario).
**Test runner:** `node --test` vía `tsx --test` (sin dependencias nuevas).

## Specs

- **S1 (US-20, RF-05b):** Cada médico administra sus coberturas desde una pantalla ("Mis coberturas"). Debe ser autocompletado/sugerido en base a coberturas previamente cargadas por otros médicos (sin distinguir mayúsculas/minúsculas) para evitar duplicados. Permite agregar y quitar coberturas con confirmación previa.
- **S2 (US-20):** Si un médico quita una cobertura que solo él aceptaba, deja de estar disponible para nuevos registros de pacientes, pero los pacientes que ya la tenían registrada la conservan. Si la aceptan otros médicos, sigue disponible para pacientes.
- **S3 (US-21):** Un paciente elige su cobertura médica desde un desplegable formado por la unión de las coberturas aceptadas por al menos un médico activo, más la opción "Particular". Si elige una cobertura, el número de afiliado es obligatorio; si elige "Particular", no se requiere. Cada paciente solo posee una cobertura.
- **S4 (US-21):** La cobertura registrada debe ser visible en el perfil/detalle del paciente accedido por médicos o administradores.
- **S5 (US-24, RF-04a):** Acceso exclusivo para el rol "Enfermera". La pantalla principal muestra un listado/tabla con las unidades disponibles de cada vacuna.
- **S6 (RF-04a):** Solo 3 tipos de vacunas precargadas fijas: "Vacuna contra la Hepatitis B", "Vacuna antipoliomielítica (Polio)" y "Vacuna contra el VPH (Virus del Papiloma Humano)". No se permite crear ni eliminar tipos. El stock inicial del sistema arranca en 0.
- **S7 (US-22):** Registrar ingreso de cantidades recibidas (entero mayor a 0). Suma al stock actual.
- **S8 (US-23):** Permite descontar unidades seleccionando la vacuna, la cantidad y un motivo obligatorio (*Vencimiento*, *Rotura o pérdida*, *Corrección de carga*, u *Otro*). El stock nunca puede quedar negativo.

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|----|-------|------|--------|--------|
| T1 | S1-S8 | inline | done | 3d877b1 |
| T2 | S1,S3 | inline | done | 5a3edc8 |
| T3 | S6,S7,S8 | inline | done | 5a3edc8 |
| T4 | S1-S4 | inline | done | 5a3edc8 |
| T5 | S5-S8 | inline | done | 5a3edc8 |
| T6 | S1-S4 | inline | done | 5a3edc8 |
| T7 | S5-S8 | inline | done | 5a3edc8 |
| T8 | S1,S2 | inline | done | 894d823 |
| T9 | S5,S7,S8 | inline | done | 894d823 |
| T10 | S3,S4 | inline | done | 894d823 |
| T11 | S1,S5 | inline | done | 894d823 |
| T12 | S1,S3,S6,S7,S8 | inline | done | 899970f |
| T13 | S3,S4 (US-21 menú paciente) | inline | done | — |
| T14 | UI: sidebar + métricas + badges + mensajes exactos | inline | done | — |
| T15 | US-20: píldora N Activas + autocomplete + modal confirmación | inline | done | — |
| T16 | US-22/23: modales + hint disponible + mensajes | inline | done | — |
| T17 | US-24: métricas + SIN STOCK + modales + toast | inline | done | — |
| T18 | US-21: banner + notas + card COBERTURA ACTIVA | inline | done | — |

## Log

- **L1:** "Arranca las implementaciones, luego testealas y dame el verdicto final una vez terminado todo, tambien dime que implementaste y que deberia hacer para testearlo manualmente"
- **L2 (2026-10-19):** Implementación completa en rama `feat/coberturas-stock` (4 commits). Verificación: `tsc --noEmit` OK, `eslint --quiet` OK, `pnpm test` 8/8 OK, `prisma validate` OK.
- **L3 (2026-10-19, RESUELTA):** Aplicación del schema a Neon resuelta por HTTP (el TCP 5432 hacia Neon está bloqueado en esta red, así que `prisma db push` no puede correr):
  - DDL aditivo generado offline con `prisma migrate diff --from-schema --to-schema --script`.
  - Aplicado vía `@neondatabase/serverless` (driver HTTP) en una transacción: 4 tablas + 2 enums + 2 columnas nullable en User.
  - `pnpm db:seed` corrido: 3 vacunas fijas (stock 0) + 5 enfermeras + 6 médicos de prueba.
- **L4 (2026-10-19):** Cierre de la brecha de US-21 (menú paciente "Mi cobertura"): no existía la pantalla del paciente para ver/registrar su cobertura (solo se capturaba en el autorregistro US-06 y en el detalle US-12). Se agregó:
  - `app/cobertura/page.tsx` + `app/cobertura/cobertura-form.tsx` (vista de solo lectura si ya tiene cobertura; formulario con desplegable "Particular" + disponibles si no).
  - Server action `registrarCoberturaPaciente` en `app/actions.ts`.
  - Card "Mi cobertura" en `app/inicio/page.tsx` (rama paciente).
  - Fix de mensaje US-23 CA2: `MSG_STOCK_INSUFICIENTE` ahora es "No hay suficientes unidades" (antes "Stock insuficiente").
- **L5 (2026-10-19):** Fase 2 — alineación con wireframes (`WireframesNuevas/` US-20/21/22-23/24), **opción (a)** elegida por el usuario: solo ajustes de UI **sin** cambios de schema. Alcance acordado:
  - Sidebar lateral consistente (`Volver al inicio`) en `/coberturas`, `/cobertura` y `/stock`.
  - Métricas/badges computables desde datos existentes: "Convenios N Activas" (US-20), "Catálogo: 3" + "Disponibilidad Neta %" + "SIN STOCK" (US-24).
  - Modales de ingreso/egreso (US-22/23/24) + confirmación al quitar cobertura (US-20, reemplaza `window.confirm`).
  - Autocomplete enriquecido (dropdown filtrable) en US-20 (sin tipo/descripción: eso era schema).
  - Mensajes exactos: voseo "Ya aceptás esta cobertura", "Ingresá una cantidad mayor a 0", "No hay suficientes unidades (disponibles: N)".
  - US-21: banner "Todavía no registraste tu cobertura", notas de ayuda y card "COBERTURA ACTIVA" (sin plan/vigencia: eso era schema).
  - **Fuera de alcance (schema):** `Cobertura.tipo/descripcion`, `Vacuna.lote/descripcion`, `MovimientoStock.proveedor/destino`, `User.plan/vigencia`, y motivos de egreso alternativos del wireframe US-24 (manda US-23).
- **L6 (2026-10-19):** Fase 2 implementada (opción a, sin schema):
  - `components/page-sidebar.tsx` compartido; aplicado en `/stock`, `/coberturas` y `/cobertura`.
  - Mensajes exactos: `MSG_CANTIDAD_INVALIDA` → "Ingresá una cantidad mayor a 0"; `MSG_COBERTURA_YA_ACEPTADA` → "Ya aceptás esta cobertura"; `msgStockInsuficiente(n)` → "No hay suficientes unidades (disponibles: n)" (con `stockActual` en `registrarEgreso` y mapeo `startsWith` en `errorStock`).
  - `/stock`: métricas (catálogo + disponibilidad neta), badge "Sin stock", movimientos vía `stock-modals.tsx` (modales) + `stock-toast.tsx` (toast vía `?ok=ingreso|egreso`). Se eliminó `stock-form.tsx`.
  - `/coberturas`: píldora "N activas", autocomplete enriquecido (`coberturas-form.tsx`) y confirmación con modal (`coberturas-lista.tsx`, reemplaza `window.confirm`).
  - `/cobertura`: banner "Todavía no registraste tu cobertura", card "Cobertura activa" y notas de ayuda.
