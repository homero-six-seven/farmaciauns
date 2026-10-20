/**
 * Tests unitarios del dominio de agenda (RF-01).
 *
 * Correr desde la raíz del repo:
 *   node --import tsx --test lib/domain/agenda.test.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  MSG_DIA_INVALIDO,
  MSG_DURACION_INVALIDA,
  MSG_FIN_ANTES_DE_INICIO,
  MSG_FRANJA_SUPERPUESTA,
  MSG_HORA_FORMATO,
  MSG_HORA_MULTIPLO,
  diaSemanaDe,
  diasDelMes,
  esMesHabilitado,
  etiquetaFechaLarga,
  etiquetaMes,
  expandirMes,
  formatearHora,
  franjasSinTurnos,
  generarTurnos,
  hoyEnArgentina,
  mensajeFranjaSinTurnos,
  mesesHabilitados,
  parsearHora,
  parsearMes,
  patronDesdeFranjas,
  rangoDelMes,
  sumarMeses,
  validarDuracion,
  validarFranjas,
} from "./agenda";
import { MSG_CAMPO_OBLIGATORIO } from "./usuario";

const NOVIEMBRE_2026 = { anio: 2026, mes: 11 };

describe("horas", () => {
  test("parsea HH:MM a minutos", () => {
    assert.equal(parsearHora("08:00"), 480);
    assert.equal(parsearHora("08:20"), 500);
    assert.equal(parsearHora("23:55"), 1435);
  });

  test("rechaza horas inválidas", () => {
    assert.equal(parsearHora("24:00"), null);
    assert.equal(parsearHora("8:00"), null);
    assert.equal(parsearHora("12:60"), null);
    assert.equal(parsearHora(""), null);
  });

  test("formatea minutos a HH:MM", () => {
    assert.equal(formatearHora(500), "08:20");
    assert.equal(formatearHora(0), "00:00");
  });
});

describe("validarDuracion", () => {
  test("acepta enteros de 5 a 120 en múltiplos de 5", () => {
    for (const valida of [5, 20, 45, 120]) {
      assert.equal(validarDuracion(valida), null);
    }
  });

  test("rechaza valores fuera de rango, no múltiplos o no enteros", () => {
    for (const invalida of [0, 7, 125, 20.5, Number.NaN]) {
      assert.equal(validarDuracion(invalida), MSG_DURACION_INVALIDA);
    }
  });
});

describe("generarTurnos", () => {
  test("08:00–10:10 con turnos de 20 deja 6 turnos y 10 min libres", () => {
    const { turnos, sobranteMin } = generarTurnos({ inicioMin: 480, finMin: 610 }, 20);
    assert.equal(turnos.length, 6);
    assert.equal(sobranteMin, 10);
    assert.deepEqual(turnos[0], { inicioMin: 480, finMin: 500 });
    assert.deepEqual(turnos[5], { inicioMin: 580, finMin: 600 });
  });

  test("franja que divide exacto no deja sobrante", () => {
    const { turnos, sobranteMin } = generarTurnos({ inicioMin: 480, finMin: 720 }, 20);
    assert.equal(turnos.length, 12);
    assert.equal(sobranteMin, 0);
  });

  test("franja más corta que un turno no genera turnos", () => {
    const { turnos, sobranteMin } = generarTurnos({ inicioMin: 540, finMin: 570 }, 45);
    assert.equal(turnos.length, 0);
    assert.equal(sobranteMin, 30);
  });
});

describe("franjasSinTurnos", () => {
  test("detecta las franjas donde no entra la nueva duración", () => {
    const franjas = [
      { fecha: "2026-11-02", inicioMin: 480, finMin: 510 },
      { fecha: "2026-11-04", inicioMin: 840, finMin: 1080 },
    ];
    assert.deepEqual(franjasSinTurnos(franjas, 45), [franjas[0]]);
    assert.deepEqual(franjasSinTurnos(franjas, 30), []);
  });
});

describe("validarFranjas", () => {
  test("acepta franjas válidas y las devuelve ordenadas", () => {
    const resultado = validarFranjas(
      [
        { diaSemana: 3, inicio: "14:00", fin: "18:00" },
        { diaSemana: 1, inicio: "08:00", fin: "12:00" },
      ],
      20,
    );
    assert.deepEqual(resultado, {
      ok: true,
      franjas: [
        { diaSemana: 1, inicioMin: 480, finMin: 720 },
        { diaSemana: 3, inicioMin: 840, finMin: 1080 },
      ],
    });
  });

  test("una lista vacía es válida (cierra la agenda)", () => {
    assert.deepEqual(validarFranjas([], 20), { ok: true, franjas: [] });
  });

  test("marca la superposición en la fila posterior, con el bloque en conflicto", () => {
    const resultado = validarFranjas(
      [
        { diaSemana: 1, inicio: "08:00", fin: "12:00" },
        { diaSemana: 1, inicio: "10:00", fin: "13:00" },
      ],
      20,
    );
    assert.equal(resultado.ok, false);
    if (!resultado.ok) {
      assert.equal(resultado.errores[0], undefined);
      assert.equal(
        resultado.errores[1],
        `${MSG_FRANJA_SUPERPUESTA} (conflicto con Lunes 08:00 - 12:00)`,
      );
    }
  });

  test("franjas que solo se tocan no se superponen", () => {
    const resultado = validarFranjas(
      [
        { diaSemana: 1, inicio: "08:00", fin: "12:00" },
        { diaSemana: 1, inicio: "12:00", fin: "14:00" },
      ],
      30,
    );
    assert.equal(resultado.ok, true);
  });

  test("mismo horario en días distintos no se superpone", () => {
    const resultado = validarFranjas(
      [
        { diaSemana: 1, inicio: "08:00", fin: "12:00" },
        { diaSemana: 2, inicio: "08:00", fin: "12:00" },
      ],
      20,
    );
    assert.equal(resultado.ok, true);
  });

  test("valida cada fila: día, obligatorio, formato, múltiplo, orden y turno mínimo", () => {
    const resultado = validarFranjas(
      [
        { diaSemana: 0, inicio: "08:00", fin: "12:00" },
        { diaSemana: 1, inicio: "", fin: "12:00" },
        { diaSemana: 2, inicio: "8", fin: "12:00" },
        { diaSemana: 3, inicio: "08:03", fin: "12:00" },
        { diaSemana: 4, inicio: "18:00", fin: "09:00" },
        { diaSemana: 5, inicio: "10:00", fin: "10:00" },
        { diaSemana: 6, inicio: "09:00", fin: "09:30" },
      ],
      45,
    );
    assert.deepEqual(resultado, {
      ok: false,
      errores: {
        0: MSG_DIA_INVALIDO,
        1: MSG_CAMPO_OBLIGATORIO,
        2: MSG_HORA_FORMATO,
        3: MSG_HORA_MULTIPLO,
        4: MSG_FIN_ANTES_DE_INICIO,
        5: MSG_FIN_ANTES_DE_INICIO,
        6: mensajeFranjaSinTurnos(45),
      },
    });
  });
});

describe("fechas y meses", () => {
  test("calcula el día de la semana ISO", () => {
    assert.equal(diaSemanaDe("2026-10-19"), 1); // lunes
    assert.equal(diaSemanaDe("2026-11-08"), 7); // domingo
    assert.equal(diaSemanaDe("2027-01-01"), 5); // viernes
  });

  test("respeta la cantidad de días de cada mes", () => {
    assert.equal(diasDelMes({ anio: 2027, mes: 2 }).length, 28);
    assert.equal(diasDelMes({ anio: 2028, mes: 2 }).length, 29);
    assert.equal(diasDelMes(NOVIEMBRE_2026).length, 30);
    assert.equal(diasDelMes({ anio: 2026, mes: 12 }).at(-1), "2026-12-31");
  });

  test("arma el rango del mes y la fecha larga", () => {
    assert.deepEqual(rangoDelMes({ anio: 2027, mes: 2 }), { desde: "2027-02-01", hasta: "2027-02-28" });
    assert.equal(etiquetaFechaLarga("2026-11-02"), "Lunes 2 de Noviembre de 2026");
  });

  test("hoy se calcula en hora de Argentina, no en UTC", () => {
    // 02:30 UTC del 20/10 son las 23:30 del 19/10 en Argentina.
    assert.equal(hoyEnArgentina(new Date("2026-10-20T02:30:00Z")), "2026-10-19");
    assert.equal(hoyEnArgentina(new Date("2026-10-20T03:00:00Z")), "2026-10-20");
  });

  test("parsea y nombra meses", () => {
    assert.deepEqual(parsearMes("2026-11"), NOVIEMBRE_2026);
    assert.equal(parsearMes("2026-13"), null);
    assert.equal(parsearMes("noviembre"), null);
    assert.equal(etiquetaMes(NOVIEMBRE_2026), "Noviembre 2026");
  });

  test("suma meses cruzando el año", () => {
    assert.deepEqual(sumarMeses({ anio: 2026, mes: 11 }, 3), { anio: 2027, mes: 2 });
    assert.deepEqual(sumarMeses({ anio: 2026, mes: 1 }, -1), { anio: 2025, mes: 12 });
  });

  test("habilita el mes actual y los 5 siguientes", () => {
    const meses = mesesHabilitados("2026-10-19");
    assert.equal(meses.length, 6);
    assert.deepEqual(meses[0], { anio: 2026, mes: 10 });
    assert.deepEqual(meses[5], { anio: 2027, mes: 3 });
    assert.equal(esMesHabilitado({ anio: 2026, mes: 9 }, "2026-10-19"), false);
    assert.equal(esMesHabilitado({ anio: 2027, mes: 4 }, "2026-10-19"), false);
  });
});

describe("expandirMes", () => {
  const lunesMañana = [{ diaSemana: 1 as const, inicioMin: 480, finMin: 720 }];

  test("aplica el patrón a todas las fechas del mes", () => {
    const fechas = expandirMes(NOVIEMBRE_2026, lunesMañana, "2026-11-01").map((f) => f.fecha);
    assert.deepEqual(fechas, ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);
  });

  test("excluye las fechas pasadas e incluye hoy", () => {
    const fechas = expandirMes(NOVIEMBRE_2026, lunesMañana, "2026-11-09").map((f) => f.fecha);
    assert.deepEqual(fechas, ["2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);
  });

  test("un patrón vacío no genera franjas", () => {
    assert.deepEqual(expandirMes(NOVIEMBRE_2026, [], "2026-11-01"), []);
  });
});

describe("patronDesdeFranjas", () => {
  test("toma, por cada día, las franjas de la última fecha", () => {
    const patron = patronDesdeFranjas([
      { fecha: "2026-11-04", inicioMin: 840, finMin: 1080 }, // miércoles
      { fecha: "2026-11-02", inicioMin: 480, finMin: 720 }, // lunes, patrón viejo
      { fecha: "2026-11-09", inicioMin: 540, finMin: 600 }, // lunes, patrón nuevo
      { fecha: "2026-11-09", inicioMin: 840, finMin: 900 },
    ]);
    assert.deepEqual(patron, [
      { diaSemana: 1, inicioMin: 540, finMin: 600 },
      { diaSemana: 1, inicioMin: 840, finMin: 900 },
      { diaSemana: 3, inicioMin: 840, finMin: 1080 },
    ]);
  });

  test("expandir y reconstruir devuelve el mismo patrón", () => {
    const original = [
      { diaSemana: 1 as const, inicioMin: 480, finMin: 720 },
      { diaSemana: 3 as const, inicioMin: 840, finMin: 1080 },
    ];
    assert.deepEqual(patronDesdeFranjas(expandirMes(NOVIEMBRE_2026, original, "2026-11-01")), original);
  });
});
