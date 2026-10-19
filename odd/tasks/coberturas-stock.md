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

## Log

- **L1:** "Arranca las implementaciones, luego testealas y dame el verdicto final una vez terminado todo, tambien dime que implementaste y que deberia hacer para testearlo manualmente"
- **L2 (2026-10-19):** Implementación completa en rama `feat/coberturas-stock` (4 commits). Verificación: `tsc --noEmit` OK, `eslint --quiet` OK, `pnpm test` 8/8 OK, `prisma validate` OK.
- **L3 (2026-10-19, PENDIENTE):** Aplicación del schema a Neon BLOQUEADA desde el entorno de ejecución (P1001, host Neon inaccesible). Pasos pendientes en el entorno del usuario:
  - `pnpm exec prisma db push` (aditivo: 4 tablas + 2 enums + 2 columnas nullable en User).
  - `pnpm db:seed` (carga las 3 vacunas fijas con stock 0; el upsert no resetea stock existente).
