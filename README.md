# Farmacia UNS

Aplicación web de Farmacia UNS desarrollada con Next.js App Router, React y TypeScript.

## Requisitos

- Node.js 20 o superior
- pnpm 10

## Preparar el proyecto

Clona el repositorio, instala las dependencias y crea el archivo local de variables de entorno:

```bash
git clone <URL_DEL_REPOSITORIO>
cd farmaciauns
pnpm install
```

Copia `.env.example` como `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

En macOS o Linux:

```bash
cp .env.example .env.local
```

Completa las variables de `.env.local` con las credenciales de los servicios cuando estén disponibles:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | URL de conexión PostgreSQL de Neon. Se usa para conectar con la base de datos y ejecutar operaciones como `prisma db push`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk para la autenticación. |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk. Solo debe utilizarse en el servidor. |

`.env.local` contiene credenciales y no debe compartirse ni subirse al repositorio. Git lo excluye; `.env.example` contiene únicamente los nombres de las variables.

## Ejecutar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Prisma

El schema de la base de datos está en `prisma/schema.prisma`. `pnpm install` genera automáticamente el cliente Prisma en `generated/prisma`. También se genera antes de cada build:

```bash
pnpm build
```

Para validar el schema o regenerar el cliente manualmente:

```bash
pnpm exec prisma validate --schema prisma/schema.prisma
pnpm exec prisma generate --schema prisma/schema.prisma
```

Las operaciones que acceden a Neon, como `prisma db push`, requieren que `DATABASE_URL` esté configurada con una URL válida.

## Validaciones

```bash
pnpm exec prisma validate --schema prisma/schema.prisma
pnpm exec tsc --noEmit
pnpm lint
```
