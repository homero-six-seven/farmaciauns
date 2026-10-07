/**
 * Estado compartido de los formularios que usan server actions.
 *
 * NOTA (importante): este archivo NO lleva `"use server"` a propósito. Un
 * archivo con `"use server"` solo debe exportar funciones (server actions);
 * exportar VALORES (como `ESTADO_INICIAL`) desde ahí rompe la importación en
 * los client components: el valor llega como `undefined` y provoca
 * "Cannot read properties of undefined" en runtime.
 *
 * Ver docs/CAMBIOS-US-GRUPO1.md → "Notas de implementación".
 */

import type { CampoError } from "./domain/usuario";

export type FormState = {
  errors: CampoError;
  /** Valores ingresados (para repoblar el form tras un error). Sin contraseñas. */
  values?: Record<string, string>;
};

export const ESTADO_INICIAL: FormState = { errors: {}, values: {} };
