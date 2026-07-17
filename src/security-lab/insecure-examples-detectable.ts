/**
 * CLASE: ejemplos intencionales de malas prácticas para análisis SAST.
 * NO ejecutar ni desplegar en producción.
 */

import { exec } from "node:child_process";
import fs from "node:fs";

// =============================================================================
// EJEMPLO 1: Password hardcodeado
// =============================================================================
export const HARDCODED_PASSWORD = "SuperSecret123!";

// =============================================================================
// EJEMPLO 2: API key hardcodeada
// =============================================================================
export const API_KEY = "sk_live_51DEMO1234567890abcdefghijklmnop";

// =============================================================================
// EJEMPLO 3: Uso de eval
// =============================================================================
export function unsafeEval(userInput: string): unknown {
  return eval(userInput);
}

// =============================================================================
// EJEMPLO 4: Inyección de comandos
// =============================================================================
export function unsafePing(host: string): void {
  exec(`ping ${host}`);
}

// =============================================================================
// EJEMPLO 5: Path traversal
// =============================================================================
export function unsafeReadFile(filename: string): string {
  return fs.readFileSync(`./uploads/${filename}`, "utf8");
}

// =============================================================================
// EJEMPLO 6: Validación débil de correo
// =============================================================================
export function weakEmailValidation(email: string): boolean {
  return email.includes("@");
}

// =============================================================================
// EJEMPLO 7: Secreto expuesto en variable pública de Next.js
// =============================================================================
export const PUBLIC_DATABASE_PASSWORD =
  process.env.NEXT_PUBLIC_DATABASE_PASSWORD;

// =============================================================================
// EJEMPLO 8: HTML inseguro
// =============================================================================
export function unsafeHtml(userInput: string) {
  return {
    dangerouslySetInnerHTML: {
      __html: userInput,
    },
  };
}

export const SAST_LAB_MARKER = "sast-examples-only";
