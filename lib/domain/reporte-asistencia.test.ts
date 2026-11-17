import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ETIQUETA_SIN_DATOS,
  consolidarAsistenciaPorMedico,
  formatearPorcentajeAsistencia,
  porcentajeAsistencia,
  type GrupoAsistencia,
  type MedicoReporteAsistencia,
} from "./reporte-asistencia";

const MEDICOS: MedicoReporteAsistencia[] = [
  { id: "m3", firstName: "Santiago", lastName: "Ríos" },
  { id: "m1", firstName: "Marcos", lastName: "Álvarez" },
  { id: "m2", firstName: "Roberto", lastName: "Gómez" },
];

test("calcula el porcentaje de asistencia del período (CA1)", () => {
  const grupos: GrupoAsistencia[] = [
    { medicoId: "m1", estado: "ATENDIDO", cantidad: 8 },
    { medicoId: "m1", estado: "AUSENTE", cantidad: 2 },
    { medicoId: "m2", estado: "ATENDIDO", cantidad: 5 },
  ];

  const filas = consolidarAsistenciaPorMedico(MEDICOS, grupos);

  assert.deepEqual(
    filas.map((fila) => fila.medico),
    ["Marcos Álvarez", "Roberto Gómez", "Santiago Ríos"],
  );
  assert.deepEqual(filas[0], {
    medicoId: "m1",
    medico: "Marcos Álvarez",
    atendidos: 8,
    ausentes: 2,
    porcentaje: 80,
  });
  assert.equal(filas[1].porcentaje, 100);
});

test("muestra Sin datos para un médico sin turnos atendidos ni ausentes (CA2)", () => {
  const filas = consolidarAsistenciaPorMedico(MEDICOS, []);

  assert.equal(porcentajeAsistencia(0, 0), null);
  assert.equal(formatearPorcentajeAsistencia(null), ETIQUETA_SIN_DATOS);
  assert.equal(ETIQUETA_SIN_DATOS, "Sin datos");
  assert.deepEqual(filas[2], {
    medicoId: "m3",
    medico: "Santiago Ríos",
    atendidos: 0,
    ausentes: 0,
    porcentaje: null,
  });
});

test("redondea el porcentaje y formatea los valores", () => {
  assert.equal(porcentajeAsistencia(8, 2), 80);
  assert.equal(porcentajeAsistencia(5, 0), 100);
  assert.equal(porcentajeAsistencia(1, 2), 33);
  assert.equal(formatearPorcentajeAsistencia(80), "80%");
  assert.equal(formatearPorcentajeAsistencia(100), "100%");
});

test("ignora grupos de otros médicos y estados que no son asistencia", () => {
  const grupos: GrupoAsistencia[] = [
    { medicoId: "otro", estado: "ATENDIDO", cantidad: 9 },
    { medicoId: "m1", estado: "RESERVADO", cantidad: 4 },
    { medicoId: "m1", estado: "CANCELADO", cantidad: 3 },
  ];

  const filas = consolidarAsistenciaPorMedico(MEDICOS, grupos);

  assert.deepEqual(
    filas.map(({ atendidos, ausentes, porcentaje }) => ({
      atendidos,
      ausentes,
      porcentaje,
    })),
    [
      { atendidos: 0, ausentes: 0, porcentaje: null },
      { atendidos: 0, ausentes: 0, porcentaje: null },
      { atendidos: 0, ausentes: 0, porcentaje: null },
    ],
  );
});
