// CLASE: SERVIDOR PERSONALIZADO de Next.js + REGISTRO DE TRÁFICO.
//
// ¿Por qué existe este archivo?
// 1) Next.js NO expone la IP real de quien se conecta en los route handlers ni
//    en el middleware. Aquí leemos la IP real del socket TCP y la inyectamos en
//    el header "x-forwarded-for" para que toda la app la vea.
// 2) El registro de visitas que hacíamos desde el navegador (VisitTracker) NO
//    veía a los escáneres, porque estos piden rutas inexistentes (/phpinfo.php,
//    etc.) donde nuestro JavaScript nunca se ejecuta. Como ESTE servidor ve
//    TODAS las peticiones, aquí registramos el tráfico completo, incluidos los
//    escaneos de otras máquinas.
//
// Nota: es un servidor educativo. En producción se usaría un proxy real
// (nginx, etc.) y un almacén de logs profesional (no un archivo JSON).

import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // todas las interfaces: otras máquinas pueden entrar
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

// --- Almacén de logs (mismo archivo y formato que src/lib/securityLogger.ts) ---
const DATA_DIR = join(process.cwd(), ".data");
const LOG_FILE = join(DATA_DIR, "security-logs.json");
const MAX_LOGS = 500;

function readLogs() {
  try {
    if (!existsSync(LOG_FILE)) return [];
    return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeLog(entry) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const all = readLogs();
    all.push(entry);
    if (all.length > MAX_LOGS) all.splice(0, all.length - MAX_LOGS);
    // Escritura SÍNCRONA: en Node (un solo hilo) esto es atómico respecto a
    // otras escrituras, así no se corrompe el archivo aunque haya varias fuentes.
    writeFileSync(LOG_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch {
    // No rompemos el servidor si falla el log.
  }
}

// --- Utilidades de IP / user-agent (equivalentes a src/lib/clientIp.ts) ---
function normalizeIp(ip) {
  const clean = (ip || "").trim();
  if (clean === "::1" || clean === "127.0.0.1") return "localhost";
  if (clean.startsWith("::ffff:")) {
    const ipv4 = clean.slice(7);
    return ipv4 === "127.0.0.1" ? "localhost" : ipv4;
  }
  return clean || "desconocida";
}

function parseUserAgent(ua) {
  const s = (ua || "").toLowerCase();
  if (!s) return "Desconocido";
  if (s.includes("sqlmap")) return "sqlmap (herramienta)";
  if (s.includes("nikto")) return "Nikto (escáner)";
  if (s.includes("nmap")) return "Nmap (escáner)";
  if (s.includes("zap")) return "OWASP ZAP (escáner)";
  if (s.includes("curl")) return "curl (línea de comandos)";
  if (s.includes("wget")) return "wget (línea de comandos)";
  if (s.includes("python-requests") || s.includes("go-http")) return "Cliente HTTP (script)";
  if (s.includes("postman")) return "Postman";
  let browser = "Navegador";
  if (s.includes("edg/")) browser = "Edge";
  else if (s.includes("opr/") || s.includes("opera")) browser = "Opera";
  else if (s.includes("firefox")) browser = "Firefox";
  else if (s.includes("chrome")) browser = "Chrome";
  else if (s.includes("safari")) browser = "Safari";
  let os = "";
  if (s.includes("windows")) os = "Windows";
  else if (s.includes("android")) os = "Android";
  else if (s.includes("iphone") || s.includes("ipad")) os = "iOS";
  else if (s.includes("mac os") || s.includes("macintosh")) os = "macOS";
  else if (s.includes("linux")) os = "Linux";
  return os ? `${browser} en ${os}` : browser;
}

// --- Detección de ataques (equivalente a src/lib/attackDetection.ts) ---
const ATTACK_PATTERNS = [
  { regex: /('|%27)?\s*(or|and)\s+\d+\s*=\s*\d+|union\s+select|;\s*drop\s+table|--\s|\/\*/i, label: "Inyección SQL" },
  { regex: /<script|onerror\s*=|onload\s*=|javascript:|<img\b|<svg\b/i, label: "Cross-Site Scripting (XSS)" },
  { regex: /\.\.\/|\.\.\\|\/etc\/passwd|c:\\windows/i, label: "Path Traversal" },
  { regex: /;\s*(ls|cat|whoami|id|dir)\b|\|\s*(whoami|cat|ls)\b|&&\s*\w+|`[^`]+`/i, label: "Inyección de comandos" },
];
// Rutas típicas que buscan los escáneres (sondas de vulnerabilidades).
const PROBE_PATHS = [
  ".php", ".env", "wp-login", "wp-admin", "phpmyadmin", "/.git", "/.aws",
  "server-info", "server-status", "config.json", "composer.lock", "id_rsa",
  "/actuator", "/console", "shell", "cgi-bin",
];
const SUSPICIOUS_AGENTS = ["sqlmap", "nikto", "nmap", "nessus", "acunetix", "zap", "dirbuster", "gobuster", "masscan"];

function scanForAttacks(text) {
  const found = [];
  for (const p of ATTACK_PATTERNS) if (p.regex.test(text)) found.push(p.label);
  return found;
}
function isProbePath(pathname) {
  const p = pathname.toLowerCase();
  return PROBE_PATHS.some((probe) => p.includes(probe));
}
function isSuspiciousUserAgent(ua) {
  const s = (ua || "").toLowerCase();
  return SUSPICIOUS_AGENTS.some((a) => s.includes(a));
}

// --- Comportamiento por IP: flood y enumeración (estado en memoria) ---
const ipActivity = new Map();
const BEHAVIOR_WINDOW_MS = 12_000;
const FLOOD_THRESHOLD = 25; // muchas peticiones seguidas
const ENUM_THRESHOLD = 8; // muchas rutas distintas (escaneo)

function registerIpRequest(ip, pathname) {
  const now = Date.now();
  let a = ipActivity.get(ip);
  if (!a) {
    a = { events: [], floodFlagged: false, enumFlagged: false };
    ipActivity.set(ip, a);
  }
  a.events = a.events.filter((e) => now - e.time <= BEHAVIOR_WINDOW_MS);
  if (a.events.length === 0) { a.floodFlagged = false; a.enumFlagged = false; }
  a.events.push({ time: now, path: pathname });
  const detected = [];
  if (a.events.length >= FLOOD_THRESHOLD && !a.floodFlagged) {
    a.floodFlagged = true;
    detected.push("Exceso de peticiones (flood / posible bot)");
  }
  const distinct = new Set(a.events.map((e) => e.path.split("?")[0]));
  if (distinct.size >= ENUM_THRESHOLD && !a.enumFlagged) {
    a.enumFlagged = true;
    detected.push("Enumeración de rutas (escaneo desde la misma IP)");
  }
  return detected;
}

// --- Sesión: decodifica la cookie sfl-session (base64url(JSON)) ---
function getUserFromCookie(cookieHeader) {
  try {
    if (!cookieHeader) return { user: "anónimo", role: undefined };
    const match = cookieHeader.match(/sfl-session=([^;]+)/);
    if (!match) return { user: "anónimo", role: undefined };
    const json = Buffer.from(decodeURIComponent(match[1]), "base64url").toString("utf-8");
    const data = JSON.parse(json);
    return { user: data.email ?? "anónimo", role: data.role };
  } catch {
    return { user: "anónimo", role: undefined };
  }
}

// --- ¿Qué peticiones NO registramos? (ruido y APIs que ya se auto-registran) ---
function shouldSkip(pathname) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt") return true;
  if (/\.(css|js|map|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|webp)$/i.test(pathname)) return true;
  // Estas APIs ya escriben sus propios logs detallados (evitamos duplicados):
  const selfLogged = [
    "/api/login", "/api/register", "/api/logout",
    "/api/admin/users", "/api/admin/logs", "/api/profile",
  ];
  if (selfLogged.some((p) => pathname.startsWith(p))) return true;
  return false;
}

// --- Registro de una petición de tráfico ---
function logTraffic(req, statusCode) {
  const rawUrl = req.url || "/";
  const pathname = rawUrl.split("?")[0];
  if (shouldSkip(pathname)) return;

  const headers = req.headers;

  // CLASE: ignoramos los PREFETCH automáticos de Next (cuando pasas el cursor
  // por un enlace, Next precarga la página en segundo plano). No son visitas
  // reales del usuario y ensuciarían los logs / darían falsos positivos.
  if (headers["next-router-prefetch"] === "1" || headers["purpose"] === "prefetch") {
    return;
  }

  const userAgent = headers["user-agent"] || "desconocido";
  // IP real (ya la inyectamos en x-forwarded-for más abajo).
  let ip = normalizeIp((headers["x-forwarded-for"] || "").split(",")[0]);

  // MODO EDUCATIVO: ?simip=1.2.3.4 permite simular otra IP desde el navegador.
  const simMatch = rawUrl.match(/[?&]simip=([^&\s]+)/i);
  if (simMatch) {
    const candidate = decodeURIComponent(simMatch[1]).trim();
    if (/^[0-9a-fA-F.:]+$/.test(candidate)) ip = candidate;
  }

  // Quitamos parámetros internos de Next (_rsc) para que el recurso se lea limpio.
  const resource = rawUrl.replace(/([?&])_rsc=[^&]*/g, "$1").replace(/[?&]$/, "").slice(0, 200);

  const { user, role } = getUserFromCookie(headers.cookie);
  const client = parseUserAgent(userAgent);
  const base = {
    user, role, ip, client, userAgent,
    referer: headers["referer"] || headers["referrer"] || "-",
    method: req.method || "GET",
    resource,
  };

  // 1) Evento de VISITA (tráfico normal).
  writeLog({
    ...base,
    category: "VISIT",
    severity: "INFO",
    statusCode,
    message: statusCode === 404 ? "Petición a ruta inexistente" : "Visita / petición al servidor",
    timestamp: new Date().toISOString(),
    eventId: randomUUID(),
  });

  // 2) Detección de comportamientos por IP (flood / enumeración).
  for (const behavior of registerIpRequest(ip, resource)) {
    writeLog({
      ...base, category: "ATTACK", severity: "WARNING", statusCode: 429,
      attackTypes: [behavior],
      message: `Comportamiento sospechoso desde la IP ${ip}: ${behavior}`,
      timestamp: new Date().toISOString(), eventId: randomUUID(),
    });
  }

  // 3) Patrones de ataque en la URL (SQLi, XSS, traversal, comandos).
  // Decodificamos primero: los ataques vienen URL-encoded (%3Cscript%3E) y los
  // espacios pueden llegar como "+" o "%20". Normalizamos ambos para detectarlos.
  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl.replace(/\+/g, " "));
  } catch {
    // Si la URL está mal formada, escaneamos la versión original.
  }
  const attacks = scanForAttacks(decodedUrl);
  if (attacks.length > 0) {
    writeLog({
      ...base, category: "ATTACK", severity: "ERROR", statusCode: statusCode || 400,
      attackTypes: attacks,
      message: `Posible ataque en la URL: ${attacks.join(", ")}`,
      timestamp: new Date().toISOString(), eventId: randomUUID(),
    });
  }

  // 4) Sondas de vulnerabilidades típicas (rutas que buscan los escáneres).
  if (isProbePath(pathname)) {
    writeLog({
      ...base, category: "ATTACK", severity: "WARNING", statusCode: statusCode || 404,
      attackTypes: ["Sonda de vulnerabilidad (escaneo)"],
      message: `Sonda de escaneo: intento de acceder a ${pathname}`,
      timestamp: new Date().toISOString(), eventId: randomUUID(),
    });
  }

  // 5) User-agent de herramienta de escaneo conocida.
  if (isSuspiciousUserAgent(userAgent)) {
    writeLog({
      ...base, category: "ATTACK", severity: "WARNING", statusCode,
      attackTypes: ["Escáner / herramienta automatizada"],
      message: `Herramienta de escaneo detectada: ${client}`,
      timestamp: new Date().toISOString(), eventId: randomUUID(),
    });
  }
}

app.prepare().then(() => {
  createServer((req, res) => {
    // IP real de la máquina que se conecta (extremo del socket TCP).
    const remoteAddress = req.socket.remoteAddress || "";
    if (remoteAddress && !req.headers["x-forwarded-for"]) {
      req.headers["x-forwarded-for"] = remoteAddress;
    }

    // Cuando la respuesta termina, ya sabemos el código de estado: registramos.
    res.on("finish", () => {
      try {
        logTraffic(req, res.statusCode);
      } catch {
        // nunca dejamos que un fallo de log afecte la petición
      }
    });

    handle(req, res);
  }).listen(port, hostname, () => {
    console.log(`> Secure Framework Lab escuchando en:`);
    console.log(`  - Local:   http://localhost:${port}`);
    console.log(`  - Red:     http://<IP-DE-ESTA-MAQUINA>:${port}`);
    console.log(`  (otras máquinas de la red pueden conectarse por la IP)`);
  });
});
