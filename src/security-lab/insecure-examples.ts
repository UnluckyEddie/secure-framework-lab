/**
 * CLASE: ejemplos intencionales de malas prácticas para análisis SAST
 * Este archivo NO se ejecuta en producción — solo sirve para demostración en clase.
 * Cada ejemplo incluye su corrección debuntada.
 */

// =============================================================================
// EJEMPLO 1: Password hardcodeado
// =============================================================================
// ❌ MAL: credencial en código fuente
export const HARDCODED_PASSWORD = "SuperSecret123!";
void HARDCODED_PASSWORD;

// ✅ CORRECCIÓN: usar variable de entorno privada
// const password = process.env.ADMIN_PASSWORD;
// if (!password) throw new Error("ADMIN_PASSWORD no configurada");

// =============================================================================
// EJEMPLO 2: API key hardcodeada
// =============================================================================
// ❌ MAL: clave de API expuesta en el repositorio
export const API_KEY = "sk-live-abc123xyz789secretkey";
void API_KEY;

// ✅ CORRECCIÓN: almacenar en .env (sin NEXT_PUBLIC_) y leer en servidor
// const apiKey = process.env.PAYMENT_API_KEY;

// =============================================================================
// EJEMPLO 3: Uso de eval (ejecución de código arbitrario)
// =============================================================================
// ❌ MAL: eval permite ejecutar código arbitrario — riesgo crítico de inyección
export function unsafeEval(userInput: string): unknown {
  return eval(userInput);
}

// ✅ CORRECCIÓN: usar funciones seguras, validar con Zod, nunca evaluar input del usuario
// const schema = z.object({ action: z.enum(["read", "write"]) });
// const parsed = schema.safeParse(JSON.parse(userInput));

// =============================================================================
// EJEMPLO 4: Validación débil en el cliente
// =============================================================================
// ❌ MAL: validación solo en frontend — fácil de omitir con herramientas de desarrollo
export function weakClientValidation(email: string): boolean {
  return email.includes("@");
}

// ✅ CORRECCIÓN: validar siempre en el servidor con Zod
// const emailSchema = z.string().email();
// const result = emailSchema.safeParse(email);

// =============================================================================
// EJEMPLO 5: Secreto expuesto en variable pública
// =============================================================================
// ❌ MAL: variable con NEXT_PUBLIC_ expone el valor al navegador
// process.env.NEXT_PUBLIC_DATABASE_PASSWORD = "db_secret_123"

// ✅ CORRECCIÓN: secretos sin prefijo NEXT_PUBLIC_, solo en servidor
// process.env.DATABASE_PASSWORD (en .env.local, nunca en el cliente)

// Export vacío para evitar warnings de módulo sin exports usados
export const SAST_LAB_MARKER = "sast-examples-only";
