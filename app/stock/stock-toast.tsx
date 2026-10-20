"use client";

import { useEffect, useState } from "react";

/**
 * Toast transitorio de éxito para los movimientos de stock (US-22/23).
 * Se muestra al cargar `/stock?ok=ingreso|egreso` y se auto-oculta.
 */
export function StockToast({ ok }: { ok?: string }) {
  const [visible, setVisible] = useState(Boolean(ok));

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [ok]);

  if (!ok || !visible) return null;

  const mensaje =
    ok === "egreso"
      ? "Egreso registrado correctamente."
      : "Ingreso registrado correctamente.";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-on-primary shadow-xl">
      <span className="material-symbols-outlined text-[20px]">check_circle</span>
      <span className="text-sm font-medium">{mensaje}</span>
    </div>
  );
}
