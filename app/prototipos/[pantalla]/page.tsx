import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { requireRole, type Role } from "@/lib/authorization";

const pantallas = [
  "pantalla_1_iniciar_sesi_n",
  "pantalla_2_iniciar_sesi_n_estados_de_error",
  "pantalla_3_inicio_del_administrador",
  "pantalla_4_inicio_del_m_dico",
  "pantalla_5_inicio_del_paciente",
  "pantalla_6_acceso_denegado",
  "pantalla_7_registro_de_paciente",
  "pantalla_8_registro_de_paciente_estado_con_errores",
  "pantalla_9_registro_exitoso",
  "pantalla_10_recuperar_contrase_a",
  "pantalla_11_definir_contrase_a_nueva",
  "pantalla_12_cambio_de_contrase_a_desde_el_email_de_alta",
  "pantalla_13_alta_de_m_dico",
  "pantalla_14_alta_de_m_dico_estado_con_errores",
  "pantalla_15_confirmaci_n_de_alta_de_m_dico",
  "pantalla_16_alta_de_personal_administrativo",
  "pantalla_17_alta_de_personal_administrativo_estado_con_errores",
  "pantalla_18_confirmaci_n_de_alta_de_personal_administrativo",
  "pantalla_19_listado_de_m_dicos",
  "pantalla_20_listado_de_m_dicos_sin_resultados",
  "pantalla_21_b_squeda_de_pacientes_administrador",
  "pantalla_22_b_squeda_de_pacientes_m_dico",
  "pantalla_23_listado_de_personal_administrativo",
  "pantalla_24_listado_de_enfermeras",
] as const;

const pantallasPublicas = new Set([
  "pantalla_1_iniciar_sesi_n",
  "pantalla_2_iniciar_sesi_n_estados_de_error",
  "pantalla_6_acceso_denegado",
  "pantalla_7_registro_de_paciente",
  "pantalla_8_registro_de_paciente_estado_con_errores",
  "pantalla_9_registro_exitoso",
  "pantalla_10_recuperar_contrase_a",
  "pantalla_11_definir_contrase_a_nueva",
  "pantalla_12_cambio_de_contrase_a_desde_el_email_de_alta",
]);

const rolesPorPantalla: Partial<Record<(typeof pantallas)[number], Role[]>> = {
  pantalla_3_inicio_del_administrador: ["admin"],
  pantalla_4_inicio_del_m_dico: ["medico"],
  pantalla_5_inicio_del_paciente: ["paciente"],
  pantalla_13_alta_de_m_dico: ["admin"],
  pantalla_14_alta_de_m_dico_estado_con_errores: ["admin"],
  pantalla_15_confirmaci_n_de_alta_de_m_dico: ["admin"],
  pantalla_16_alta_de_personal_administrativo: ["admin"],
  pantalla_17_alta_de_personal_administrativo_estado_con_errores: ["admin"],
  pantalla_18_confirmaci_n_de_alta_de_personal_administrativo: ["admin"],
  pantalla_19_listado_de_m_dicos: ["admin"],
  pantalla_20_listado_de_m_dicos_sin_resultados: ["admin"],
  pantalla_21_b_squeda_de_pacientes_administrador: ["admin"],
  pantalla_22_b_squeda_de_pacientes_m_dico: ["medico"],
  pantalla_23_listado_de_personal_administrativo: ["admin"],
  pantalla_24_listado_de_enfermeras: ["admin"],
};

export function generateStaticParams() {
  return pantallas.map((pantalla) => ({ pantalla }));
}

export default async function PrototipoPage({
  params,
}: {
  params: Promise<{ pantalla: string }>;
}) {
  const { pantalla } = await params;

  if (!pantallas.includes(pantalla as (typeof pantallas)[number])) {
    notFound();
  }

  if (!pantallasPublicas.has(pantalla)) {
    await auth.protect();

    const allowedRoles =
      rolesPorPantalla[pantalla as (typeof pantallas)[number]];

    if (allowedRoles) {
      await requireRole(allowedRoles);
    }
  }

  return (
    <iframe
      className="h-screen w-full border-0"
      src={`/${pantalla}/code.html`}
      title={pantalla.replaceAll("_", " ")}
    />
  );
}
