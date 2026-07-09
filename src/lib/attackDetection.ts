// CLASE: detección MUY BÁSICA de patrones de ataque (solo educativa).
// En producción se usan WAF, reglas OWASP CRS, rate limiting real, etc.
// Aquí solo buscamos "firmas" simples con expresiones regulares para enseñar la idea.

// Tipos de ataque que sabemos reconocer (a nivel didáctico).
export type AttackType =
  | "SQL_INJECTION"
  | "XSS"
  | "PATH_TRAVERSAL"
  | "COMMAND_INJECTION"
  | "SCANNER";

// CLASE: cada patrón es una firma sencilla. NO cubre todos los casos reales,
// solo los más típicos para demostrar en clase.
const ATTACK_PATTERNS: { type: AttackType; regex: RegExp; label: string }[] = [
  {
    type: "SQL_INJECTION",
    // ' OR 1=1 , UNION SELECT , -- , ; DROP TABLE
    regex: /('|%27)?\s*(or|and)\s+\d+\s*=\s*\d+|union\s+select|;\s*drop\s+table|--\s|\/\*/i,
    label: "Inyección SQL",
  },
  {
    type: "XSS",
    // <script>, onerror=, javascript:, <img ...>
    regex: /<script|onerror\s*=|onload\s*=|javascript:|<img\b|<svg\b/i,
    label: "Cross-Site Scripting (XSS)",
  },
  {
    type: "PATH_TRAVERSAL",
    // ../  ..\  /etc/passwd  c:\windows
    regex: /\.\.\/|\.\.\\|\/etc\/passwd|c:\\windows/i,
    label: "Path Traversal",
  },
  {
    type: "COMMAND_INJECTION",
    // ; ls , | whoami , && cat , `id`
    regex: /;\s*(ls|cat|whoami|id|dir)\b|\|\s*(whoami|cat|ls)\b|&&\s*\w+|`[^`]+`/i,
    label: "Inyección de comandos",
  },
];

// CLASE: user-agents típicos de herramientas de escaneo/pentesting.
const SUSPICIOUS_AGENTS = [
  "sqlmap",
  "nikto",
  "nmap",
  "nessus",
  "acunetix",
  "zap", // OWASP ZAP
  "dirbuster",
  "gobuster",
  "masscan",
  "curl", // se incluye para la práctica; en producción NO se bloquea curl sin más
];

// CLASE: revisa un texto (URL, parámetro, campo del formulario) y devuelve
// la lista de tipos de ataque detectados. Si está limpio, devuelve [].
export function scanForAttacks(text: string): AttackType[] {
  if (!text) return [];
  const found: AttackType[] = [];
  for (const pattern of ATTACK_PATTERNS) {
    if (pattern.regex.test(text)) {
      found.push(pattern.type);
    }
  }
  return found;
}

// CLASE: revisa el user-agent buscando herramientas de escaneo conocidas.
export function isSuspiciousUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SUSPICIOUS_AGENTS.some((agent) => ua.includes(agent));
}

// Devuelve una etiqueta legible para cada tipo de ataque.
export function attackLabel(type: AttackType): string {
  const pattern = ATTACK_PATTERNS.find((p) => p.type === type);
  if (pattern) return pattern.label;
  if (type === "SCANNER") return "Escáner / herramienta automatizada";
  return type;
}

// ---------------------------------------------------------------------------
// CLASE: detección MUY simple de fuerza bruta (muchos intentos fallidos por IP).
// Guardamos el contador en globalThis para que sea compartido entre rutas.
// ---------------------------------------------------------------------------
interface BruteForceEntry {
  count: number; // intentos fallidos acumulados
  firstAt: number; // momento del primer intento (ms)
}

const globalForBrute = globalThis as unknown as {
  __bruteForce?: Map<string, BruteForceEntry>;
};
const bruteForceMap: Map<string, BruteForceEntry> = (globalForBrute.__bruteForce ??=
  new Map());

// Ventana de tiempo y umbral (valores bajos para verlo rápido en clase).
const WINDOW_MS = 60_000; // 1 minuto
const THRESHOLD = 5; // 5 intentos fallidos

// Registra un intento fallido para una IP y devuelve true si supera el umbral.
export function registerFailedLogin(ip: string): boolean {
  const now = Date.now();
  const entry = bruteForceMap.get(ip);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    // Primer intento o la ventana anterior ya expiró: reiniciamos.
    bruteForceMap.set(ip, { count: 1, firstAt: now });
    return false;
  }

  entry.count += 1;
  return entry.count >= THRESHOLD;
}

// Cuando el login es exitoso, limpiamos el contador de esa IP.
export function resetFailedLogin(ip: string): void {
  bruteForceMap.delete(ip);
}

// ---------------------------------------------------------------------------
// CLASE: detección de COMPORTAMIENTOS por IP (no solo firmas en el texto).
// Miramos el patrón de peticiones de cada IP dentro de una ventana de tiempo:
//   - FLOOD: demasiadas peticiones muy seguidas (posible bot / DoS).
//   - ENUMERATION: la misma IP toca muchas rutas distintas (escaneo/fuzzing).
// Guardamos el estado por IP en globalThis (compartido entre peticiones).
// ---------------------------------------------------------------------------
export type IpBehavior = "FLOOD" | "ENUMERATION";

interface IpActivity {
  events: { time: number; path: string }[]; // peticiones recientes
  floodFlagged: boolean; // ya avisamos de flood en esta ventana
  enumFlagged: boolean; // ya avisamos de enumeración en esta ventana
}

const globalForIp = globalThis as unknown as {
  __ipActivity?: Map<string, IpActivity>;
};
const ipActivityMap: Map<string, IpActivity> = (globalForIp.__ipActivity ??=
  new Map());

// Ventana y umbrales (bajos para verlo rápido en clase).
const BEHAVIOR_WINDOW_MS = 15_000; // 15 segundos
const FLOOD_THRESHOLD = 10; // 10+ peticiones en la ventana = flood
const ENUM_THRESHOLD = 6; // 6+ rutas distintas en la ventana = enumeración

// CLASE: registra una petición de una IP y devuelve los comportamientos
// sospechosos NUEVOS detectados (para no repetir el log en cada request).
export function registerIpRequest(ip: string, path: string): IpBehavior[] {
  const now = Date.now();
  let activity = ipActivityMap.get(ip);

  if (!activity) {
    activity = { events: [], floodFlagged: false, enumFlagged: false };
    ipActivityMap.set(ip, activity);
  }

  // Quitamos las peticiones viejas (fuera de la ventana) y reseteamos avisos.
  activity.events = activity.events.filter(
    (e) => now - e.time <= BEHAVIOR_WINDOW_MS
  );
  if (activity.events.length === 0) {
    activity.floodFlagged = false;
    activity.enumFlagged = false;
  }

  // Agregamos la petición actual.
  activity.events.push({ time: now, path });

  const detected: IpBehavior[] = [];

  // FLOOD: muchas peticiones en la ventana.
  if (activity.events.length >= FLOOD_THRESHOLD && !activity.floodFlagged) {
    activity.floodFlagged = true;
    detected.push("FLOOD");
  }

  // ENUMERATION: muchas rutas DISTINTAS en la ventana.
  const distinctPaths = new Set(
    activity.events.map((e) => e.path.split("?")[0])
  );
  if (distinctPaths.size >= ENUM_THRESHOLD && !activity.enumFlagged) {
    activity.enumFlagged = true;
    detected.push("ENUMERATION");
  }

  return detected;
}

// Etiqueta legible para cada comportamiento.
export function behaviorLabel(behavior: IpBehavior): string {
  if (behavior === "FLOOD")
    return "Exceso de peticiones (flood / posible bot)";
  if (behavior === "ENUMERATION")
    return "Enumeración de rutas (escaneo desde la misma IP)";
  return behavior;
}
