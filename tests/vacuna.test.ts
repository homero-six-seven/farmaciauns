import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MOTIVOS_EGRESO,
  esMotivoEgreso,
  msgStockMaximo,
  normalizarDetalleMotivo,
  puedeRegistrarIngreso,
  validarCantidad,
} from "../lib/domain/vacuna";

test("validarCantidad acepta enteros mayores a 0", () => {
  assert.equal(validarCantidad(1), true);
  assert.equal(validarCantidad(50), true);
  assert.equal(validarCantidad(1000), true);
});

test("validarCantidad rechaza 0, negativos, decimales y NaN", () => {
  assert.equal(validarCantidad(0), false);
  assert.equal(validarCantidad(-1), false);
  assert.equal(validarCantidad(1.5), false);
  assert.equal(validarCantidad(NaN), false);
});

test("US-22 rechaza ingresos que superan el máximo de 50 unidades", () => {
  assert.equal(puedeRegistrarIngreso(45, 5), true);
  assert.equal(puedeRegistrarIngreso(45, 10), false);
  assert.equal(
    msgStockMaximo(5),
    "El stock máximo por vacuna es de 50 unidades (disponibles para ingresar: 5)",
  );
});

test("el catálogo de motivos es exactamente los 4 requeridos", () => {
  assert.deepEqual(MOTIVOS_EGRESO, [
    "VENCIMIENTO",
    "ROTURA_PERDIDA",
    "CORRECCION_CARGA",
    "OTRO",
  ]);
});

test("esMotivoEgreso reconoce solo los motivos válidos", () => {
  for (const m of MOTIVOS_EGRESO) {
    assert.equal(esMotivoEgreso(m), true, `debería aceptar ${m}`);
  }
  assert.equal(esMotivoEgreso("INVALIDO"), false);
  assert.equal(esMotivoEgreso(""), false);
  assert.equal(esMotivoEgreso("vencimiento"), false); // case-sensitive
});

test("normalizarDetalleMotivo trimea y devuelve null si vacío", () => {
  assert.equal(normalizarDetalleMotivo("  frasco roto  "), "frasco roto");
  assert.equal(normalizarDetalleMotivo("   "), null);
  assert.equal(normalizarDetalleMotivo(undefined), null);
  assert.equal(normalizarDetalleMotivo(null), null);
});
