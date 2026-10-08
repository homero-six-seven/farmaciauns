import Link from "next/link";
import { FormBaseLayout } from "@/components/form-base-layout";
import { InfoCard } from "@/components/info-card";
import { RegistroPacienteForm } from "./registro-paciente-form";

export default function RegistroPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Paso 01 / Alta de usuario
          </div>
          <div className="text-sm text-on-surface-variant">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/pantalla_1_iniciar_sesi_n"
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-70"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Registro de paciente
          </h1>
          <p className="mt-1 text-on-surface-variant">
            Ingresá tus datos personales para crear tu cuenta de paciente.
          </p>
        </div>

        <FormBaseLayout
          ayuda={
            <>
              <InfoCard
                titulo="Declaración jurada"
                descripcion="La información suministrada reviste carácter de declaración jurada. Verificá que los datos sean correctos antes de enviar."
              />
              <InfoCard
                titulo="Seguridad de contraseña"
                descripcion="Usá al menos 8 caracteres. Evitá contraseñas predecibles o que ya uses en otros servicios."
              />
              <InfoCard
                titulo="Verificación de email"
                descripcion="Te enviaremos un correo de confirmación a la casilla indicada para validar tu identidad."
              />
            </>
          }
        >
          <RegistroPacienteForm />
        </FormBaseLayout>

        <footer className="mt-6 text-center text-xs text-on-surface-variant">
          © 2026 Sala Médica — Prototipo
        </footer>
      </div>
    </main>
  );
}
