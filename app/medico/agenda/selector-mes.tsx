"use client";

import { useRouter } from "next/navigation";

/** Selector de mes de "Mi agenda" (US-27): navega a `?mes=YYYY-MM`. */
export function SelectorMes({
  mes,
  meses,
}: {
  mes: string;
  meses: { valor: string; etiqueta: string }[];
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
      Mes:
      <select
        value={mes}
        onChange={(e) => router.push(`?mes=${e.target.value}`)}
        className="h-10 min-w-48 rounded border-0 bg-surface-container-low px-3 text-sm font-semibold normal-case tracking-normal text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {meses.map((m) => (
          <option key={m.valor} value={m.valor}>
            {m.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}
