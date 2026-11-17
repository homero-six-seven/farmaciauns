import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MSG_RANGO_INVALIDO,
  consolidarTurnosPorEspecialidad,
  totalizarReporte,
  validarRangoReporte,
  type GrupoTurnoReporte,
} from "./reporte-turnos";

test("consolida los turnos por especialidad y estado (CA1)", () => {
  const grupos: GrupoTurnoReporte[] = [
    { especialidad: "CLINICA_MEDICA", estado: "RESERVADO", cantidad: 3 },
    { especialidad: "CLINICA_MEDICA", estado: "ATENDIDO", cantidad: 8 },
    { especialidad: "CLINICA_MEDICA", estado: "AUSENTE", cantidad: 2 },
    { especialidad: "CLINICA_MEDICA", estado: "CANCELADO", cantidad: 1 },
    { especialidad: "PEDIATRIA", estado: "RESERVADO", cantidad: 2 },
    { especialidad: "PEDIATRIA", estado: "ATENDIDO", cantidad: 5 },
    { especialidad: "PEDIATRIA", estado: "CANCELADO", cantidad: 1 },
    { especialidad: "TRAUMATOLOGIA", estado: "RESERVADO", cantidad: 1 },
    { especialidad: null, estado: "ATENDIDO", cantidad: 99 },
    { especialidad: "PEDIATRIA", estado: "AUSENTE", cantidad: 0 },
  ];

  const filas = consolidarTurnosPorEspecialidad(grupos);
  assert.deepEqual(filas[0], {
    especialidad: "CLINICA_MEDICA",
    etiqueta: "Clínica médica",
    reservados: 3,
    atendidos: 8,
    ausentes: 2,
    cancelados: 1,
    total: 14,
  });
  assert.deepEqual(filas[1], {
    especialidad: "PEDIATRIA",
    etiqueta: "Pediatría",
    reservados: 2,
    atendidos: 5,
    ausentes: 0,
    cancelados: 1,
    total: 8,
  });
  assert.equal(filas[2].total, 1);
  assert.deepEqual(totalizarReporte(filas), {
    reservados: 6,
    atendidos: 13,
    ausentes: 2,
    cancelados: 2,
    total: 23,
  });
});

test("un período sin turnos muestra todas las cantidades en 0 (CA2)", () => {
  const filas = consolidarTurnosPorEspecialidad([]);
  assert.equal(filas.length, 3);
  for (const fila of filas) {
    assert.equal(fila.reservados, 0);
    assert.equal(fila.atendidos, 0);
    assert.equal(fila.ausentes, 0);
    assert.equal(fila.cancelados, 0);
    assert.equal(fila.total, 0);
  }
  assert.deepEqual(totalizarReporte(filas), {
    reservados: 0,
    atendidos: 0,
    ausentes: 0,
    cancelados: 0,
    total: 0,
  });
});

test("rechaza un rango invertido y acepta fechas iguales (CA3)", () => {
  const invertido = validarRangoReporte("2026-11-30", "2026-11-01");
  assert.equal(invertido.valido, false);
  if (!invertido.valido) {
    assert.equal(invertido.error, MSG_RANGO_INVALIDO);
  }

  const exacto = validarRangoReporte("2026-11-01", "2026-11-01");
  assert.deepEqual(exacto, { valido: true, desde: "2026-11-01", hasta: "2026-11-01" });
});

test("rechaza fechas incompletas, con formato inválido o inexistentes", () => {
  assert.equal(validarRangoReporte("2026-11-01", undefined).valido, false);
  assert.equal(validarRangoReporte(undefined, "2026-11-30").valido, false);
  assert.equal(validarRangoReporte("01/11/2026", "30/11/2026").valido, false);
  assert.equal(validarRangoReporte("2026-02-30", "2026-03-01").valido, false);
});
