import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MEDIOS_PAGO_REPORTE,
  MSG_SIN_PAGOS,
  consolidarPagos,
  formatearFechaPago,
  formatearImporte,
  normalizarImporte,
  totalizarPagos,
  type DatosPagoReporte,
} from "./reporte-pagos";

const DATOS: DatosPagoReporte[] = [
  {
    id: "p1",
    createdAt: new Date("2026-11-16T12:00:00.000Z"),
    importe: 15000,
    medioPago: "DEBITO",
    paciente: { firstName: "María", lastName: "Gómez" },
    medico: { firstName: "Marcos", lastName: "Álvarez" },
  },
  {
    id: "p2",
    createdAt: new Date("2026-11-10T12:00:00.000Z"),
    importe: 12000,
    medioPago: "EFECTIVO",
    paciente: { firstName: "Lucas", lastName: "Romero" },
    medico: { firstName: "Roberto", lastName: "Gómez" },
  },
  {
    id: "p3",
    createdAt: new Date("2026-11-05T12:00:00.000Z"),
    importe: 18000,
    medioPago: "TRANSFERENCIA",
    paciente: { firstName: "Claudia", lastName: "Benítez" },
    medico: { firstName: "Marcos", lastName: "Álvarez" },
  },
  {
    id: "p4",
    createdAt: new Date("2026-11-20T12:00:00.000Z"),
    importe: { toString: () => "12345.67" },
    medioPago: "CREDITO",
    paciente: { firstName: "Ana", lastName: "Pérez" },
    medico: null,
  },
  {
    id: "p5",
    createdAt: new Date("2026-11-21T12:00:00.000Z"),
    importe: 0,
    medioPago: "EFECTIVO",
    paciente: { firstName: "Nora", lastName: "Díaz" },
    medico: { firstName: "Marcos", lastName: "Álvarez" },
  },
];

test("lista todos los pagos y totaliza por medio y general (CA1)", () => {
  const pagos = consolidarPagos(DATOS);

  assert.equal(pagos.length, 5);
  assert.equal(pagos[0].fecha, "16/11/2026");
  assert.equal(pagos[0].paciente, "María Gómez");
  assert.equal(pagos[0].medico, "Marcos Álvarez");
  assert.equal(pagos[0].medioPagoEtiqueta, "DÉBITO");
  assert.equal(pagos[3].medico, "Sin profesional");
  assert.equal(pagos[3].importe, 12345.67);

  assert.deepEqual(totalizarPagos(pagos), {
    porMedio: {
      EFECTIVO: 12000,
      DEBITO: 15000,
      CREDITO: 12345.67,
      TRANSFERENCIA: 18000,
    },
    general: 57345.67,
    cantidad: 5,
  });
});

test("muestra el mensaje y totales en 0 para un período sin pagos (CA2)", () => {
  const pagos = consolidarPagos([]);

  assert.equal(MSG_SIN_PAGOS, "No hay pagos en el período");
  assert.deepEqual(pagos, []);
  assert.deepEqual(totalizarPagos(pagos), {
    porMedio: {
      EFECTIVO: 0,
      DEBITO: 0,
      CREDITO: 0,
      TRANSFERENCIA: 0,
    },
    general: 0,
    cantidad: 0,
  });
});

test("los cuatro medios aparecen siempre en el orden del wireframe", () => {
  assert.deepEqual(
    MEDIOS_PAGO_REPORTE.map(({ etiqueta }) => etiqueta),
    ["EFECTIVO", "DÉBITO", "CRÉDITO", "TRANSFERENCIA"],
  );
});

test("normaliza importes y aplica el formato de fecha y moneda", () => {
  assert.equal(normalizarImporte(null), 0);
  assert.equal(normalizarImporte(undefined), 0);
  assert.equal(normalizarImporte(Number.NaN), 0);
  assert.equal(normalizarImporte({ toString: () => "12.50" }), 12.5);
  assert.equal(formatearFechaPago(new Date("2026-11-01T03:00:00.000Z")), "01/11/2026");
  assert.match(formatearImporte(15000), /^\$\s*15\.000$/);
  assert.match(formatearImporte(12345.67), /^\$\s*12\.345,67$/);
});
