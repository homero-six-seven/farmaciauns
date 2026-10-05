import Link from "next/link";

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      <header className="h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center justify-between px-gutter">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[20px]">
              local_hospital
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface uppercase">
            SALA MÉDICA
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-space-md">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-xl md:p-12 flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-space-lg text-on-surface">
              <span className="material-symbols-outlined text-[44px]">gpp_maybe</span>
            </div>
            <div className="space-y-space-xs mb-space-lg max-w-md">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                Acceso denegado
              </h1>
              <p className="font-body-lg text-body-lg text-secondary">
                No tenés permiso para acceder a esta sección
              </p>
            </div>
            <div className="w-full max-w-xs flex flex-col items-center gap-space-sm pt-space-xs">
              <Link
                href="/inicio"
                className="w-full h-10 px-space-lg rounded-lg bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-secondary transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Volver al inicio
              </Link>
            </div>
          </div>
          <div className="mt-space-lg flex items-center gap-2 text-secondary font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Si considerás que esto es un error, por favor comunicate con recepción.</span>
          </div>
        </div>
      </main>

      <footer className="py-space-md text-center font-label-sm text-secondary">
        Sistema Sala Médica v1.0
      </footer>
    </div>
  );
}
