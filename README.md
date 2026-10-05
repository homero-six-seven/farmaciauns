# Farmacia UNS

Aplicación web desarrollada con **Next.js (App Router)**, **React** y **TypeScript**. Usa **Clerk** para autenticación y **Prisma** con **Neon (PostgreSQL)** para la base de datos. El despliegue se realiza en **Vercel**.

## Variables de entorno

Copia `.env.example` como `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

```bash
cp .env.example .env
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

Un administrador puede crear una invitación de personal mediante
`POST /api/admin/invitations` con `{ "email": "...", "role": "medico" }` o
`{ "email": "...", "role": "enfermera" }`. Clerk envía el email y la persona
define su contraseña desde el enlace recibido.

## 🔐 Usuarios y Credenciales de Prueba

Para probar las diferentes funcionalidades y permisos de la aplicación según el rol, se han creado los siguientes usuarios desde el Dashboard de Clerk. 

> **Nota:** Todos los usuarios comparten la misma contraseña de acceso para facilitar la evaluación del proyecto.

| Rol | Correo Electrónico (Email) | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@example.com` | `0ef2af58d1c9bfe6` |
| **Enfermera** | `enfermera@example.com` | `0ef2af58d1c9bfe6` |
| **Paciente** | `paciente@example.com` | `0ef2af58d1c9bfe6` |
| **Medico** | `medico@example.com` | `0ef2af58d1c9bfe6` |

---

### 🚀 Cómo probar los roles en el entorno local

1. Inicia sesión en la aplicación utilizando cualquiera de las credenciales de la tabla.
2. Cada usuario tiene asignado su correspondiente `role` en sus metadatos públicos (`publicMetadata`), lo que redirige y habilita los permisos específicos dentro del sistema (panel de administración, registro/atención de pacientes o consulta de turnos).