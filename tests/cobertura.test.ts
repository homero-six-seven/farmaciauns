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

test("esNombreCoberturaVacio detecta vacío, espacios y null", () => {
  assert.equal(esNombreCoberturaVacio(""), true);
  assert.equal(esNombreCoberturaVacio("   "), true);
  assert.equal(esNombreCoberturaVacio(null), true);
  assert.equal(esNombreCoberturaVacio(undefined), true);
  assert.equal(esNombreCoberturaVacio("OSDE"), false);
});
