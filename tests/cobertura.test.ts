import { test } from "node:test";
import assert from "node:assert/strict";
import {
  esNombreCoberturaVacio,
  normalizarNombreCobertura,
} from "../lib/domain/cobertura";

test("normalizarNombreCobertura es case-insensitive y trimea", () => {
  assert.equal(normalizarNombreCobertura("OSDE"), "osde");
  assert.equal(normalizarNombreCobertura("  Osde  "), "osde");
  assert.equal(normalizarNombreCobertura("PAMI"), "pami");
  assert.equal(normalizarNombreCobertura("IOMA"), "ioma");
});

test("dos nombres que difieren solo en mayúsculas normalizan igual (evita duplicados)", () => {
  assert.equal(
    normalizarNombreCobertura("Swiss Medical"),
    normalizarNombreCobertura("swiss medical"),
  );
});

test("variantes con puntos o espacios en las siglas normalizan igual (defecto 07)", () => {
  assert.equal(
    normalizarNombreCobertura("OSDE"),
    normalizarNombreCobertura("O.S.D.E"),
  );
  assert.equal(
    normalizarNombreCobertura("O. S. D. E"),
    normalizarNombreCobertura("osde"),
  );
  assert.equal(
    normalizarNombreCobertura("PAMI"),
    normalizarNombreCobertura("P.A.M.I"),
  );
  assert.equal(normalizarNombreCobertura("O.S.D.E"), "osde");
});

test("normalizador de cobertura: límites (solo quita puntos y espacios)", () => {
  assert.equal(normalizarNombreCobertura("P.A.M.I"), "pami");
  assert.equal(
    normalizarNombreCobertura("swissmedical"),
    normalizarNombreCobertura("Swiss Medical"),
  );
  assert.equal(normalizarNombreCobertura("Medifé"), "medifé");
  assert.equal(normalizarNombreCobertura("P-A-M-I"), "p-a-m-i");
  assert.equal(normalizarNombreCobertura("123.45"), "12345");
});

test("esNombreCoberturaVacio detecta vacío, espacios y null", () => {
  assert.equal(esNombreCoberturaVacio(""), true);
  assert.equal(esNombreCoberturaVacio("   "), true);
  assert.equal(esNombreCoberturaVacio(null), true);
  assert.equal(esNombreCoberturaVacio(undefined), true);
  assert.equal(esNombreCoberturaVacio("OSDE"), false);
});
