"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MEDIOS_PAGO = ["Efectivo", "Débito", "Crédito", "Transferencia"] as const;
type MedioPagoLabel = (typeof MEDIOS_PAGO)[number];

type PacienteResultado = {
  id: string;
  nombreCompleto: string;
  dni: string | null;
  cobertura: string | null;
  numeroAfiliado: string | null;
};

type Consulta = {
  id: string;
  fecha: string;
  hora: string;
  profesional: string;
  especialidad: string | null;
  estado: "Reservado" | "Atendido";
  estadoCobro: "PENDIENTE DE PAGO";
};

type DetallePaciente = {
  paciente: PacienteResultado;
  consultas: Consulta[];
};

export function PagoForm({
  pacientes,
  initialQuery,
  operador,
}: {
  pacientes: PacienteResultado[];
  initialQuery: string;
  operador: { nombre: string; legajo: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [resultados, setResultados] = useState(pacientes);
  const [paciente, setPaciente] = useState<PacienteResultado | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [turnoId, setTurnoId] = useState("");
  const [importe, setImporte] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPagoLabel>("Efectivo");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buscarPacientes = useCallback(async (termino: string, signal?: AbortSignal) => {
    const texto = termino.trim();
    if (!texto) {
      setResultados([]);
      return;
    }

    try {
      const response = await fetch(`/api/v1/pagos/pacientes?q=${encodeURIComponent(texto)}`, { signal });
      if (!response.ok) throw new Error("No se pudo buscar");
      setResultados((await response.json()) as PacienteResultado[]);
    } catch (buscarError) {
      if (buscarError instanceof DOMException && buscarError.name === "AbortError") return;
      setError("No se pudieron buscar pacientes.");
    }
  }, []);

  useEffect(() => {
    if (paciente) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void buscarPacientes(query, controller.signal);
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, paciente, buscarPacientes]);

  async function seleccionarPaciente(seleccionado: PacienteResultado) {
    setError(null);
    setMensaje(null);
    setPaciente(seleccionado);
    setTurnoId("");
    const response = await fetch(`/api/v1/pagos/pacientes/${seleccionado.id}`);
    const data = (await response.json()) as DetallePaciente | { error?: string };
    if (!response.ok || !("consultas" in data)) {
      setError("No se pudieron cargar las consultas pendientes.");
      setConsultas([]);
      return;
    }
    setConsultas(data.consultas);
    setTurnoId(data.consultas[0]?.id ?? "");
  }

  async function registrarPago(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    if (!paciente) {
      setError("Seleccioná un paciente.");
      return;
    }
    if (!turnoId) {
      setError("Seleccioná una consulta pendiente.");
      return;
    }
    if (!importe || !/^\d+(?:[.,]\d{1,2})?$/.test(importe)) {
      setError("Ingresá un importe válido mayor o igual a $0, con hasta dos decimales.");
      return;
    }
    const importeNumerico = Number(importe.replace(",", "."));
    if (!Number.isFinite(importeNumerico) || importeNumerico < 0) {
      setError("El importe debe ser numérico y mayor o igual a 0.");
      return;
    }
    if (!MEDIOS_PAGO.includes(medioPago)) {
      setError("Seleccioná un medio de pago válido.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("/api/v1/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turno_id: turnoId,
          paciente_id: paciente.id,
          importe: importeNumerico,
          medio_pago: medioPago,
        }),
      });
      const data = (await response.json()) as {
        mensaje?: string;
        pago?: { numeroComprobante: number };
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "No se pudo registrar el pago.");
        return;
      }
      setMensaje(
        `${data.mensaje} Comprobante correlativo N.º ${data.pago?.numeroComprobante ?? "—"}.`,
      );
      await seleccionarPaciente(paciente);
      setImporte("");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={registrarPago} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-6">
      <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <SectionTitle number="1" title="Paciente" />
        <label htmlFor="buscar-paciente" className="mt-5 block text-xs font-semibold uppercase tracking-wider">
          Buscar por documento o apellido
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="buscar-paciente"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void buscarPacientes(query);
              }
            }}
            placeholder="DNI o apellido"
            className="h-11 min-w-0 flex-1 rounded border border-outline-variant bg-surface px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void buscarPacientes(query)}
            className="h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary"
          >
            Buscar
          </button>
        </div>
        {!paciente && resultados.length > 0 && (
          <div className="mt-3 divide-y divide-outline-variant rounded border border-outline-variant">
            {resultados.map((resultado) => (
              <button
                type="button"
                key={resultado.id}
                onClick={() => seleccionarPaciente(resultado)}
                className="block w-full px-3 py-3 text-left text-sm hover:bg-surface-container-low"
              >
                <span className="font-semibold">{resultado.nombreCompleto}</span>
                <span className="ml-2 text-on-surface-variant">DNI {resultado.dni ?? "—"}</span>
              </button>
            ))}
          </div>
        )}
        {!paciente && query.trim() && resultados.length === 0 && (
          <p role="status" className="mt-4 rounded border border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
            No se encontraron pacientes para “{query.trim()}”. Probá con DNI, apellido, nombre o nombre completo.
          </p>
        )}
        {paciente && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded border border-outline-variant bg-surface-container-low p-4">
            <div>
              <p className="font-semibold">{paciente.nombreCompleto}</p>
              <p className="text-sm text-on-surface-variant">DNI: {paciente.dni ?? "—"} · HC: no registrada</p>
            </div>
            <button type="button" onClick={() => { setPaciente(null); setConsultas([]); setTurnoId(""); }} className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold">
              Cambiar paciente
            </button>
          </div>
        )}
      </section>

      {paciente && (
        <>
          <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <SectionTitle number="2" title="Cobertura médica" />
            <div className="mt-5 rounded border border-outline-variant bg-surface-container-low p-4">
              <p className="font-semibold">{paciente.cobertura ?? "Sin cobertura registrada"}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                N.º de afiliado: {paciente.numeroAfiliado ?? "—"}
              </p>
              <p className="mt-3 text-xs text-on-surface-variant">
                Datos precargados desde el padrón del paciente (no editables aquí).
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <SectionTitle number="3" title="Consultas pendientes de pago" />
            {consultas.length === 0 ? (
              <p className="mt-5 rounded border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
                El paciente no tiene consultas pendientes de pago
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                    <tr><th className="px-3 py-3">Sel.</th><th className="px-3 py-3">Fecha / hora</th><th className="px-3 py-3">Profesional / especialidad</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Cobro</th></tr>
                  </thead>
                  <tbody>
                    {consultas.map((consulta) => (
                      <tr key={consulta.id} className="border-t border-outline-variant">
                        <td className="px-3 py-3"><input type="radio" name="turno" value={consulta.id} required checked={turnoId === consulta.id} onChange={() => setTurnoId(consulta.id)} /></td>
                        <td className="px-3 py-3 font-medium">{consulta.fecha} · {consulta.hora} hs</td>
                        <td className="px-3 py-3">{consulta.profesional}<span className="block text-xs text-on-surface-variant">{consulta.especialidad ?? "—"}</span></td>
                        <td className="px-3 py-3"><span className="rounded bg-primary-fixed px-2 py-1 text-xs font-semibold">{consulta.estado}</span></td>
                        <td className="px-3 py-3"><span className="whitespace-nowrap border border-outline px-2 py-1 text-xs font-semibold">{consulta.estadoCobro}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      </div>
      <div className="space-y-6">
      <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <SectionTitle number="4" title="Liquidación y medio de pago" />
        <label htmlFor="importe" className="mt-5 block text-xs font-semibold uppercase tracking-wider">Importe ($)</label>
        <input
          id="importe"
          name="importe"
          type="text"
          inputMode="decimal"
          pattern="[0-9]+([.,][0-9]{1,2})?"
          value={importe}
          onChange={(event) => {
            const valor = event.target.value;
            if (valor === "" || /^\d*(?:[.,]\d{0,2})?$/.test(valor)) setImporte(valor);
          }}
          required
          aria-describedby="importe-ayuda"
          className="mt-2 h-12 w-full rounded border border-outline-variant bg-surface px-3 text-lg font-semibold"
        />
        <p id="importe-ayuda" className="mt-1 text-xs italic text-on-surface-variant">Importe mayor o igual a $0, con hasta dos decimales.</p>
        <label htmlFor="medio-pago" className="mt-5 block text-xs font-semibold uppercase tracking-wider">Medio de pago</label>
        <select id="medio-pago" name="medio_pago" value={medioPago} onChange={(event) => setMedioPago(event.target.value as MedioPagoLabel)} required className="mt-2 h-12 w-full rounded border border-outline-variant bg-surface px-3">
          {MEDIOS_PAGO.map((medio) => <option key={medio}>{medio}</option>)}
        </select>
        <div className="mt-6 border-t border-outline-variant pt-5">
          <div className="flex justify-between text-sm"><span>Arancel consulta médica</span><strong>${importe || "0"}</strong></div>
          <div className="mt-2 flex justify-between text-sm"><span>Copago / coseguro</span><strong>$0</strong></div>
          <div className="mt-4 flex justify-between text-xl font-bold"><span>Total a cobrar</span><span>${importe || "0"}</span></div>
        </div>
        {error && <p role="alert" className="mt-4 rounded bg-error-container p-3 text-sm text-on-error-container">{error}</p>}
        {mensaje && <p role="status" className="mt-4 rounded bg-primary-fixed p-3 text-sm text-on-primary-fixed">{mensaje}</p>}
        <button type="submit" disabled={cargando} className="mt-6 h-12 w-full rounded bg-primary text-sm font-semibold text-on-primary disabled:opacity-50">
          {cargando ? "Registrando..." : "Registrar pago"}
        </button>
        <button type="button" onClick={() => router.push("/pagos")} className="mt-2 h-11 w-full rounded border border-outline-variant text-sm font-semibold">
          Cancelar
        </button>
        <p className="mt-5 text-center text-xs text-on-surface-variant">El comprobante correlativo se genera inmediatamente después de confirmar la transacción.</p>
      </section>
      <aside className="rounded-xl bg-surface-container-low p-5 text-sm shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Trazabilidad de caja</h2>
        <dl className="mt-4 space-y-3">
          <div><dt className="text-on-surface-variant">Operador</dt><dd className="font-semibold">{operador.nombre}</dd></div>
          <div><dt className="text-on-surface-variant">Legajo</dt><dd className="font-semibold">{operador.legajo}</dd></div>
          <div><dt className="text-on-surface-variant">Puesto físico</dt><dd className="font-semibold">Admisión Central - Box 1</dd></div>
          <div><dt className="text-on-surface-variant">Régimen fiscal</dt><dd className="font-semibold">Comprobante Tipo B</dd></div>
        </dl>
      </aside>
      </div>
    </form>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-semibold">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-sm text-on-primary">{number}</span>
      {title}
    </h2>
  );
}
