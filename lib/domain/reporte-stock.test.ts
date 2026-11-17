import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LIMITE_STOCK_BAJO,
  consolidarReporteStock,
  esStockBajo,
  limitesMovimientosEnArgentina,
  totalizarReporteStock,
  type GrupoMovimientoStock,
  type GrupoTurnoStock,
  type VacunaReporteStock,
} from "./reporte-stock";

const VACUNAS: VacunaReporteStock[] = [
  { id: "v1", nombre: "Hepatitis B", stockActual: 44 },
  { id: "v2", nombre: "Polio", stockActual: 8 },
  { id: "v3", nombre: "VPH", stockActual: 0 },
];

test("consolida ingresos, egresos y turnos por vacuna (CA1)", () => {
  const movimientos: GrupoMovimientoStock[] = [
    { vacunaId: "v1", tipo: "INGRESO", cantidad: 10 },
    { vacunaId: "v1", tipo: "EGRESO", cantidad: 6 },
    { vacunaId: "v1", tipo: "EGRESO", cantidad: 2 },
    { vacunaId: "v2", tipo: "INGRESO", cantidad: 2 },
    { vacunaId: "v2", tipo: "EGRESO", cantidad: 5 },
    { vacunaId: "v3", tipo: "EGRESO", cantidad: 1 },
    { vacunaId: "v3", tipo: "INGRESO", cantidad: 0 },
    { vacunaId: "inexistente", tipo: "INGRESO", cantidad: 99 },
  ];
  const turnos: GrupoTurnoStock[] = [
    { vacunaId: "v1", cantidad: 4 },
    { vacunaId: "v2", cantidad: 3 },
    { vacunaId: "v3", cantidad: 1 },
    { vacunaId: null, cantidad: 50 },
    { vacunaId: "v1", cantidad: 0 },
  ];

  const filas = consolidarReporteStock(VACUNAS, movimientos, turnos);

  assert.deepEqual(filas[0], {
    vacunaId: "v1",
    nombre: "Hepatitis B",
    stockActual: 44,
    ingresos: 10,
    egresos: 8,
    turnos: 4,
    stockBajo: false,
  });
  assert.deepEqual(filas[1], {
    vacunaId: "v2",
    nombre: "Polio",
    stockActual: 8,
    ingresos: 2,
    egresos: 5,
    turnos: 3,
    stockBajo: true,
  });
  assert.deepEqual(filas[2], {
    vacunaId: "v3",
    nombre: "VPH",
    stockActual: 0,
    ingresos: 0,
    egresos: 1,
    turnos: 1,
    stockBajo: true,
  });
  assert.deepEqual(totalizarReporteStock(filas), { biologicos: 3, alertas: 2 });
});

test("marca como stock bajo hasta 10 unidades, pero no 11 (CA2)", () => {
  assert.equal(LIMITE_STOCK_BAJO, 10);
  assert.equal(esStockBajo(10), true);
  assert.equal(esStockBajo(11), false);

  const filas = consolidarReporteStock(
    [
      ...VACUNAS,
      { id: "v4", nombre: "Gripe", stockActual: 10 },
      { id: "v5", nombre: "Neumococo", stockActual: 11 },
    ],
    [],
    [],
  );

  assert.deepEqual(totalizarReporteStock(filas), { biologicos: 5, alertas: 3 });
  assert.equal(filas[3].stockBajo, true);
  assert.equal(filas[4].stockBajo, false);
});

test("un período sin movimientos ni turnos muestra todas las cantidades en 0", () => {
  const filas = consolidarReporteStock(VACUNAS, [], []);

  for (const fila of filas) {
    assert.equal(fila.ingresos, 0);
    assert.equal(fila.egresos, 0);
    assert.equal(fila.turnos, 0);
  }
  assert.deepEqual(totalizarReporteStock([]), { biologicos: 0, alertas: 0 });
});

test("los límites de movimientos usan el día completo en hora Argentina", () => {
  const limites = limitesMovimientosEnArgentina("2026-11-01", "2026-11-30");

  assert.equal(limites.desde.toISOString(), "2026-11-01T03:00:00.000Z");
  assert.equal(limites.hasta.toISOString(), "2026-12-01T03:00:00.000Z");
});
