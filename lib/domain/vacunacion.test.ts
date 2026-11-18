import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DURACION_TURNO_VACUNACION_MIN,
  FIN_VACUNATORIO_MIN,
  INICIO_VACUNATORIO_MIN,
  MSG_PACIENTE_NO_ENCONTRADO,
  MSG_SIN_STOCK,
  MSG_SIN_TURNOS_VACUNACION,
  diaHabilAnterior,
  esDiaHabilVacunacion,
  esFechaISO,
  grillaVacunacion,
  horariosVacunacionLibres,
  motivoTurnoVacunacionNoCancelable,
  proximoDiaHabil,
  puedeRegistrarAplicacionOAusencia,
  stockTrasDevolverDosis,
  stockTrasReservarDosis,
  sumarDias,
} from "./vacunacion";
import { MSG_TURNO_NO_CANCELABLE } from "./turno";

const MIERCOLES = "2026-11-18";
const JUEVES = "2026-11-19";
const VIERNES = "2026-11-20";
const SABADO = "2026-11-21";
const DOMINGO = "2026-11-22";
const LUNES = "2026-11-23";
const MARTES = "2026-11-24";

test("esDiaHabilVacunacion acepta lunes a viernes y rechaza el fin de semana", () => {
  assert.equal(esDiaHabilVacunacion(MIERCOLES), true);
  assert.equal(esDiaHabilVacunacion(JUEVES), true);
  assert.equal(esDiaHabilVacunacion(VIERNES), true);
  assert.equal(esDiaHabilVacunacion(LUNES), true);
  assert.equal(esDiaHabilVacunacion(SABADO), false);
  assert.equal(esDiaHabilVacunacion(DOMINGO), false);
});

test("grillaVacunacion genera 40 slots de 15 minutos entre 08:00 y 18:00", () => {
  const grilla = grillaVacunacion(MIERCOLES);
  assert.equal(grilla.length, 40);
  assert.equal(grilla[0].inicioMin, INICIO_VACUNATORIO_MIN);
  assert.equal(
    grilla[0].finMin,
    INICIO_VACUNATORIO_MIN + DURACION_TURNO_VACUNACION_MIN,
  );
  const ultimo = grilla[grilla.length - 1];
  assert.equal(ultimo.inicioMin, FIN_VACUNATORIO_MIN - DURACION_TURNO_VACUNACION_MIN);
  assert.equal(ultimo.finMin, FIN_VACUNATORIO_MIN);
  for (const h of grilla) {
    assert.equal(h.fecha, MIERCOLES);
    assert.equal(h.finMin - h.inicioMin, DURACION_TURNO_VACUNACION_MIN);
  }
});

test("grillaVacunacion no ofrece horarios los fines de semana", () => {
  assert.deepEqual(grillaVacunacion(SABADO), []);
  assert.deepEqual(grillaVacunacion(DOMINGO), []);
});

test("horariosVacunacionLibres quita los ocupados y los que ya empezaron", () => {
  const ocupados = [
    { fecha: MIERCOLES, inicioMin: 480, finMin: 495 },
    { fecha: MIERCOLES, inicioMin: 720, finMin: 735 },
  ];
  // Miércoles 12:00 hora de Argentina (= 15:00 UTC).
  const ahora = new Date("2026-11-18T15:00:00Z");
  const libres = horariosVacunacionLibres(MIERCOLES, ocupados, ahora);
  // Desde 08:00 hasta 12:00 inclusive ya empezaron: 17 slots menos.
  assert.equal(libres.length, 23);
  assert.equal(libres.some((h) => h.inicioMin === 720), false);
  assert.equal(libres.some((h) => h.inicioMin === 735), true);
  assert.equal(libres[0].inicioMin, 735);
  assert.equal(libres[libres.length - 1].inicioMin, 1065);
});

test("horariosVacunacionLibres de un día futuro muestra toda la grilla sin ocupados", () => {
  const ahora = new Date("2026-11-18T15:00:00Z");
  const libres = horariosVacunacionLibres(LUNES, [], ahora);
  assert.equal(libres.length, 40);
});

test("motivoTurnoVacunacionNoCancelable: solo turnos futuros reservados se cancelan", () => {
  // Miércoles 12:00 hora de Argentina.
  const ahora = new Date("2026-11-18T15:00:00Z");
  const futuro = {
    tipo: "VACUNACION",
    estado: "RESERVADO",
    fecha: MIERCOLES,
    inicioMin: 750,
  } as const;
  const pasado = {
    tipo: "VACUNACION",
    estado: "RESERVADO",
    fecha: MIERCOLES,
    inicioMin: 600,
  } as const;
  assert.equal(motivoTurnoVacunacionNoCancelable(futuro, ahora), null);
  assert.equal(
    motivoTurnoVacunacionNoCancelable(pasado, ahora),
    MSG_TURNO_NO_CANCELABLE,
  );
  assert.equal(
    motivoTurnoVacunacionNoCancelable(
      { tipo: "CONSULTA", estado: "RESERVADO", fecha: JUEVES, inicioMin: 480 } as const,
      ahora,
    ),
    MSG_TURNO_NO_CANCELABLE,
  );
  assert.equal(
    motivoTurnoVacunacionNoCancelable(
      { tipo: "VACUNACION", estado: "CANCELADO", fecha: JUEVES, inicioMin: 480 } as const,
      ahora,
    ),
    MSG_TURNO_NO_CANCELABLE,
  );
});

test("puedeRegistrarAplicacionOAusencia: solo turnos de vacunación reservados de hoy o antes", () => {
  const hoy = MIERCOLES;
  assert.equal(
    puedeRegistrarAplicacionOAusencia(
      { tipo: "VACUNACION", estado: "RESERVADO", fecha: MIERCOLES },
      hoy,
    ),
    true,
  );
  assert.equal(
    puedeRegistrarAplicacionOAusencia(
      { tipo: "VACUNACION", estado: "RESERVADO", fecha: "2026-11-17" },
      hoy,
    ),
    true,
  );
  assert.equal(
    puedeRegistrarAplicacionOAusencia(
      { tipo: "VACUNACION", estado: "RESERVADO", fecha: JUEVES },
      hoy,
    ),
    false,
  );
  assert.equal(
    puedeRegistrarAplicacionOAusencia(
      { tipo: "VACUNACION", estado: "ATENDIDO", fecha: MIERCOLES },
      hoy,
    ),
    false,
  );
  assert.equal(
    puedeRegistrarAplicacionOAusencia(
      { tipo: "CONSULTA", estado: "RESERVADO", fecha: MIERCOLES },
      hoy,
    ),
    false,
  );
});

test("stockTrasReservarDosis descuenta 1 unidad si hay stock, o devuelve null", () => {
  assert.equal(stockTrasReservarDosis(45), 44);
  assert.equal(stockTrasReservarDosis(1), 0);
  assert.equal(stockTrasReservarDosis(0), null);
});

test("stockTrasDevolverDosis suma 1 unidad sin tope (US-35 CA4 / US-60 CA2)", () => {
  assert.equal(stockTrasDevolverDosis(20), 21);
  assert.equal(stockTrasDevolverDosis(8), 9);
  assert.equal(stockTrasDevolverDosis(50), 51);
});

test("esFechaISO acepta solo fechas YYYY-MM-DD bien formadas", () => {
  assert.equal(esFechaISO("2026-11-18"), true);
  assert.equal(esFechaISO("2026-1-18"), false);
  assert.equal(esFechaISO("18/11/2026"), false);
  assert.equal(esFechaISO(""), false);
  assert.equal(esFechaISO("hola"), false);
  assert.equal(esFechaISO("2026-13-01"), false);
  assert.equal(esFechaISO("2026-11-31"), false);
});

test("sumarDias suma y resta días calendario cruzando meses y años", () => {
  assert.equal(sumarDias("2026-11-18", 1), "2026-11-19");
  assert.equal(sumarDias("2026-11-18", -1), "2026-11-17");
  assert.equal(sumarDias("2026-11-18", 3), "2026-11-21");
  assert.equal(sumarDias("2026-11-30", 1), "2026-12-01");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(sumarDias("2026-03-01", -1), "2026-02-28");
});

test("el mensaje de día sin turnos de vacunación es el del CA2 de US-34", () => {
  assert.equal(MSG_SIN_TURNOS_VACUNACION, "No hay turnos de vacunación para este día");
});

test("los mensajes de la asignación son los de US-33 CA2 y de búsqueda vacía", () => {
  assert.equal(MSG_SIN_STOCK, "Sin stock");
  assert.equal(MSG_PACIENTE_NO_ENCONTRADO, "No se encontraron pacientes");
});

test("proximoDiaHabil avanza hasta el próximo día hábil", () => {
  assert.equal(proximoDiaHabil(LUNES), "2026-11-24"); // martes
  assert.equal(proximoDiaHabil(VIERNES), LUNES); // salta el finde
  assert.equal(proximoDiaHabil(SABADO), LUNES);
  assert.equal(proximoDiaHabil(DOMINGO), LUNES);
});

test("diaHabilAnterior retrocede hasta el día hábil anterior", () => {
  assert.equal(diaHabilAnterior(LUNES), VIERNES); // salta el finde
  assert.equal(diaHabilAnterior(SABADO), VIERNES);
  assert.equal(diaHabilAnterior(MARTES), LUNES);
});
