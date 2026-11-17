"use client";

import { useState } from "react";

type Datos = Awaited<ReturnType<typeof import("@/lib/pago-service").listarPagosDePaciente>>;

function formatearDni(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return value ?? "—";
}

export function MisPagosClient({ datos }: { datos: Datos }) {
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);

  async function descargar(id: string) {
    setError(null);
    setDescargando(id);
    try {
      const response = await fetch(`/api/v1/pagos/${id}/comprobante/pdf`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudo descargar el comprobante.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `comprobante-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "No se pudo descargar el comprobante.");
    } finally {
      setDescargando(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col">
      <nav aria-label="Ruta de navegación" className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <span>Portal paciente</span><span aria-hidden="true">›</span><span className="text-on-surface">Mis pagos</span>
      </nav>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis pagos</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Consultá tus pagos y descargá los comprobantes.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded bg-primary-fixed px-3 py-2 font-mono text-[10px] font-semibold uppercase text-on-surface-variant">
          <span>DNI {formatearDni(datos.paciente.dni)}</span><span aria-hidden="true">•</span>
          <span>Cobertura {datos.paciente.cobertura ?? "Particular"}</span>
        </div>
      </header>
      {error && <p role="alert" className="mb-4 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</p>}
      {datos.pagos.length === 0 ? (
        <section className="rounded-xl bg-surface-container-lowest p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold">Todavía no tenés pagos registrados</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Cuando realices un pago, vas a poder consultar aquí el detalle y descargar tu comprobante.</p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low px-4 text-[10px] uppercase tracking-wider text-on-surface-variant">
              <tr><th className="px-4 py-3">Fecha y hora de pago</th><th className="px-4 py-3">Consulta</th><th className="px-4 py-3">Importe</th><th className="px-4 py-3">Medio</th><th className="px-4 py-3 text-right">Comprobante</th></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {datos.pagos.map((pago) => (
                <tr key={pago.id} className="align-top">
                  <td className="px-4 py-4"><div>{pago.fechaPago}</div><div className="text-xs text-on-surface-variant">{pago.horaPago} h</div></td>
                  <td className="px-4 py-4"><div>{pago.consulta.medico}</div><div className="text-xs text-on-surface-variant">{pago.consulta.fecha} · {pago.consulta.hora} h</div></td>
                  <td className="px-4 py-4 font-semibold">$ {pago.importe}</td>
                  <td className="px-4 py-4">{pago.medioPago}</td>
                  <td className="px-4 py-4 text-right"><button type="button" onClick={() => void descargar(pago.id)} disabled={descargando === pago.id} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:opacity-60">{descargando === pago.id ? "Descargando…" : "Descargar comprobante"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
