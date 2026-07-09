// CLASE: sistema básico de logs de seguridad (solo educativo, NO producción).
// Guardamos los logs en un ARCHIVO JSON local. ¿Por qué un archivo y no memoria?
// En Next.js las rutas API y las páginas pueden ejecutarse en contextos distintos,
// así que un array en memoria NO siempre se comparte entre ellas (la tabla salía vacía).
// Un archivo local sí es visible para todas las rutas del servidor.
// En producción se usaría una base de datos o un SIEM, nunca un archivo simple.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Re-exportamos las utilidades de la petición (todas seguras para Edge).
export { getClientIp, parseUserAgent, getRequestMeta } from "./clientIp";
export type { RequestMeta } from "./clientIp";

// Categoría del evento: agrupa el tipo de acción de seguridad.
// VISIT  = visita/navegación a una página.
// ATTACK = intento de ataque detectado (SQLi, XSS, escáner, fuerza bruta...).
export type LogCategory =
  | "AUTH"
  | "AUTHZ"
  | "ADMIN"
  | "ERROR"
  | "VISIT"
  | "ATTACK";

// Severidad: qué tan importante/grave es el evento.
export type LogSeverity = "INFO" | "WARNING" | "ERROR";

// CLASE: estructura de un log de seguridad. Cada campo describe el evento.
// Los campos marcados como opcionales (?) enriquecen el log; si un evento no
// los tiene, no pasa nada (así los logs viejos siguen siendo válidos).
export interface SecurityLog {
  timestamp: string; // fecha y hora en formato ISO (se agrega automáticamente)
  eventId: string; // identificador único del evento
  category: LogCategory; // AUTH, AUTHZ, ADMIN, ERROR, VISIT o ATTACK
  severity: LogSeverity; // INFO, WARNING o ERROR
  user: string; // usuario relacionado (email o "anónimo")
  role?: string; // rol del usuario si hay sesión (ADMIN, TEACHER, STUDENT)
  ip: string; // dirección IP de origen (ya normalizada, ej. "localhost")
  client?: string; // navegador/SO legible, ej. "Chrome en Windows"
  userAgent?: string; // user-agent completo (para análisis detallado)
  referer?: string; // página desde la que llegó la petición
  method: string; // método HTTP (GET, POST, etc.)
  resource: string; // ruta o recurso al que se accedió
  statusCode: number; // código de respuesta HTTP
  attackTypes?: string[]; // tipos de ataque detectados (SQLi, XSS, etc.)
  message: string; // descripción corta y legible del evento
}

// Los datos que envía quien llama: NO incluye timestamp ni eventId (se generan solos).
export type SecurityLogInput = Omit<SecurityLog, "timestamp" | "eventId">;

// Límite de eventos que conservamos en el archivo.
const MAX_LOGS = 500;

// Carpeta y archivo donde se guardan los logs (dentro del proyecto).
const DATA_DIR = join(process.cwd(), ".data");
const LOG_FILE = join(DATA_DIR, "security-logs.json");

// Lee todos los logs del archivo. Si no existe o falla, devuelve lista vacía.
function readLogs(): SecurityLog[] {
  try {
    if (!existsSync(LOG_FILE)) return [];
    const raw = readFileSync(LOG_FILE, "utf-8");
    return JSON.parse(raw) as SecurityLog[];
  } catch {
    return [];
  }
}

// Guarda la lista completa de logs en el archivo (creando la carpeta si hace falta).
function writeLogs(all: SecurityLog[]): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(LOG_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch {
    // Si falla la escritura no rompemos la app (es solo práctica).
  }
}

// CLASE: palabras sensibles que NUNCA deben quedar guardadas en un log.
const SENSITIVE_WORDS = ["password", "token", "cookie", "cvv", "tarjeta", "card"];

// Evita que por error se registre información sensible en el campo "message".
function sanitizeMessage(message: string): string {
  let safe = message;
  for (const word of SENSITIVE_WORDS) {
    const regex = new RegExp(`${word}\\s*[:=]\\s*\\S+`, "gi");
    safe = safe.replace(regex, `${word}: [OCULTO]`);
  }
  return safe;
}

// Genera un id simple y único para cada evento.
function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// CLASE: función principal. Recibe el evento, agrega fecha/hora e id,
// lo guarda en memoria y lo imprime en consola en formato JSON.
export function logSecurityEvent(input: SecurityLogInput): SecurityLog {
  const entry: SecurityLog = {
    ...input,
    message: sanitizeMessage(input.message),
    // También limpiamos el referer por si trae datos sensibles en la URL.
    referer: input.referer ? sanitizeMessage(input.referer) : input.referer,
    timestamp: new Date().toISOString(),
    eventId: generateEventId(),
  };

  // Leemos lo que ya había, agregamos el nuevo y recortamos al máximo permitido.
  const all = readLogs();
  all.push(entry);
  if (all.length > MAX_LOGS) {
    all.splice(0, all.length - MAX_LOGS);
  }
  writeLogs(all);

  // CLASE: también se muestra en la consola del servidor para verlo en vivo.
  console.log("[SECURITY]", JSON.stringify(entry));

  return entry;
}

// CLASE: consulta los logs guardados (más recientes primero).
export function getSecurityLogs(): SecurityLog[] {
  return readLogs().reverse();
}

// CLASE: borra todos los logs (acción de administrador). Deja el archivo vacío.
export function clearSecurityLogs(): void {
  writeLogs([]);
}
