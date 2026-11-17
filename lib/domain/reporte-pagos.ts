import type { FechaISO } from "./agenda";

export const MSG_SIN_PAGOS = "No hay pagos en el período";

export const MEDIOS_PAGO_REPORTE = [
  { medio: "EFECTIVO", etiqueta: "EFECTIVO" },
  { medio: "DEBITO", etiqueta: "DÉBITO" },
  { medio: "CREDITO", etiqueta: "CRÉDITO" },
  { medio: "TRANSFERENCIA", etiqueta: "TRANSFERENCIA" },
] as const;

export type MedioPagoReporte = (typeof MEDIOS_PAGO_REPORTE)[number]["medio"];

export const ETIQUETA_MEDIO_PAGO: Record<MedioPagoReporte, string> =
  Object.fromEntries(
    MEDIOS_PAGO_REPORTE.map(({ medio, etiqueta }) => [medio, etiqueta]),
  ) as Record<MedioPagoReporte, string>;

const FORMATEADOR_IMPORTE = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const FORMATEADOR_FECHA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type ImporteLike = number | string | { toString(): string } | null | undefined;

type PersonaReporte = {
  firstName: string | null;
  lastName: string | null;
};

export interface DatosPagoReporte {
  id: string;
  createdAt: Date;
  importe: ImporteLike;
  medioPago: MedioPagoReporte;
  paciente: PersonaReporte;
  medico: PersonaReporte | null;
}

export interface PagoReporte {
  id: string;
  fecha: string;
  paciente: string;
  medico: string;
  importe: number;
  medioPago: MedioPagoReporte;
  medioPagoEtiqueta: string;
}

export interface TotalesPagoReporte {
  porMedio: Record<MedioPagoReporte, number>;
  general: number;
  cantidad: number;
}

export interface ReportePagos {
  desde: FechaISO;
  hasta: FechaISO;
  pagos: PagoReporte[];
  totales: TotalesPagoReporte;
  sinPagos: boolean;
}

function nombreCompleto(persona: PersonaReporte): string {
  return `${persona.firstName ?? ""} ${persona.lastName ?? ""}`.trim();
}

export function normalizarImporte(importe: ImporteLike): number {
  if (importe === null || importe === undefined) {
    return 0;
  }
  const valor = typeof importe === "number" ? importe : Number(importe.toString());
  return Number.isFinite(valor) ? valor : 0;
}

export function formatearImporte(importe: number): string {
  return FORMATEADOR_IMPORTE.format(importe);
}

export function formatearFechaPago(fecha: Date): string {
  return FORMATEADOR_FECHA.format(fecha);
}

export function consolidarPagos(
  datos: readonly DatosPagoReporte[],
): PagoReporte[] {
  return datos.map((dato) => ({
    id: dato.id,
    fecha: formatearFechaPago(dato.createdAt),
    paciente: nombreCompleto(dato.paciente),
    medico: dato.medico ? nombreCompleto(dato.medico) : "Sin profesional",
    importe: normalizarImporte(dato.importe),
    medioPago: dato.medioPago,
    medioPagoEtiqueta: ETIQUETA_MEDIO_PAGO[dato.medioPago],
  }));
}

export function totalizarPagos(
  pagos: readonly Pick<PagoReporte, "importe" | "medioPago">[],
): TotalesPagoReporte {
  const porMedio = Object.fromEntries(
    MEDIOS_PAGO_REPORTE.map(({ medio }) => [medio, 0]),
  ) as Record<MedioPagoReporte, number>;

  for (const pago of pagos) {
    porMedio[pago.medioPago] += normalizarImporte(pago.importe);
  }

  return {
    porMedio,
    general: Object.values(porMedio).reduce((sum, importe) => sum + importe, 0),
    cantidad: pagos.length,
  };
}
