import assert from "node:assert/strict";
import test from "node:test";
import {
  MSG_TELEFONO_MIN,
  validarDatosMedico,
  validarTelefonoFormato,
  validarTelefonoLongitud,
} from "./usuario";

test("rechaza teléfonos con menos de 12 dígitos", () => {
  assert.equal(validarTelefonoFormato("12"), true);
  assert.equal(validarTelefonoLongitud("12"), false);
  assert.equal(validarDatosMedico({
    firstName: "Juan",
    lastName: "Pérez",
    dni: "30156789",
    email: "juan@example.com",
    phone: "12",
    especialidad: "Clínica médica",
    matricula: "MN 123456",
    password: "password1",
  }).phone, MSG_TELEFONO_MIN);
});
