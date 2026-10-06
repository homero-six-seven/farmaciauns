/**
 * Hash de contraseñas con `node:crypto` (scrypt).
 *
 * Se usa scrypt para NO agregar dependencias externas (bcrypt/argon2).
 * Solo se usa del lado del servidor (server actions); nunca se importa
 * en un client component.
 *
 * Formato del hash: `<salt_hex>:<derived_hex>`.
 */

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}
