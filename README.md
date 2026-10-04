# Farmacia UNS

Aplicación web desarrollada con **Next.js (App Router)**, **React** y **TypeScript**. Usa **Clerk** para autenticación y **Prisma** con **Neon (PostgreSQL)** para la base de datos. El despliegue se realiza en **Vercel**.

## Variables de entorno

Copia `.env.example` como `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

## Prisma

El schema de la base de datos está en `prisma/schema.prisma`. `pnpm install` genera automáticamente el cliente Prisma en `generated/prisma`. También se genera antes de cada build.

Para validar el schema o regenerar el cliente manualmente:

```bash
pnpm exec prisma validate --schema prisma/schema.prisma
pnpm exec prisma generate --schema prisma/schema.prisma
```

Las operaciones que acceden a Neon, como `prisma db push`, requieren que `DATABASE_URL` esté configurada con una URL válida.

## Control de acceso por roles

Las rutas protegidas usan Clerk para identificar al usuario y consultan su rol
en `User.role` mediante `requireRole` de `lib/authorization.ts`. Los roles
válidos son `admin`, `enfermera`, `medico` y `paciente`.

Para proteger una nueva página, validar el rol en el Server Component:

```tsx
import { requireRole } from "@/lib/authorization";

await requireRole(["admin"]);
```

Un usuario sin rol válido o sin permiso es enviado a la pantalla de acceso
denegado. El helper también acepta los valores actuales
`ADMINISTRADOR` y `ADMINISTRATIVO` como `admin`.
