import { requirePaciente } from "@/lib/authorization";
import { listarPagosDePaciente } from "@/lib/pago-service";
import { MisPagosClient } from "./mis-pagos-client";

export const dynamic = "force-dynamic";

export default async function MisPagosPage() {
  const paciente = await requirePaciente();
  const datos = await listarPagosDePaciente(paciente.id);
  return <MisPagosClient datos={datos} />;
}
