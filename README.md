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
