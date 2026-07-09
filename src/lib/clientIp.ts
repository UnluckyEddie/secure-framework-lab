// CLASE: utilidades SIN dependencias de Node (seguras para el middleware, que
// corre en runtime Edge). Extraen y dan formato a los datos de la petición.

// CLASE: normaliza la IP para que se lea bien.
// En local suele llegar "::1" (IPv6) o "::ffff:127.0.0.1" (IPv4 mapeada).
function normalizeIp(ip: string): string {
  const clean = ip.trim();
  if (clean === "::1" || clean === "127.0.0.1") return "localhost";
  // IPv4 "mapeada" dentro de IPv6, ej: ::ffff:192.168.0.5 -> 192.168.0.5
  if (clean.startsWith("::ffff:")) {
    const ipv4 = clean.slice(7);
    return ipv4 === "127.0.0.1" ? "localhost" : ipv4;
  }
  return clean || "desconocida";
}

// CLASE: obtiene la IP del cliente desde los headers.
// Los proxies/CDN/escáneres ponen la IP real en alguno de estos headers.
// Probamos varios porque cada servidor usa el suyo.
export function getClientIp(headers: Headers): string {
  // x-forwarded-for puede traer varias IPs: la primera es la del cliente real.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return normalizeIp(forwarded.split(",")[0]);

  // Otros headers comunes según el proxy/CDN que haya delante.
  const candidates = [
    "x-real-ip",
    "cf-connecting-ip", // Cloudflare
    "true-client-ip", // Akamai / Cloudflare
    "x-client-ip",
    "fastly-client-ip",
  ];
  for (const name of candidates) {
    const value = headers.get(name);
    if (value) return normalizeIp(value);
  }

  // Header "Forwarded" estándar (RFC 7239), ej: for=192.0.2.60;proto=http
  const std = headers.get("forwarded");
  if (std) {
    const match = std.match(/for=(?:"?\[?)([^;,"\]]+)/i);
    if (match) return normalizeIp(match[1]);
  }

  // Sin proxy (conexión directa en local) no podemos ver la IP real.
  return "localhost";
}

// CLASE: MODO EDUCATIVO — permite "simular" venir de otra IP desde el navegador.
// Si la URL trae ?simip=1.2.3.4, usamos esa IP para las pruebas de detección.
// Así los alumnos pueden ver comportamientos "desde distintas IP" sin necesitar
// varios dispositivos. En producción esto se ignoraría.
export function extractSimIp(pathOrUrl: string): string | null {
  const match = pathOrUrl.match(/[?&]simip=([^&\s]+)/i);
  if (!match) return null;
  const ip = decodeURIComponent(match[1]).trim();
  // Validación básica para no aceptar cualquier basura.
  const looksLikeIp = /^[0-9a-fA-F.:]+$/.test(ip) && ip.length <= 45;
  return looksLikeIp ? ip : null;
}

// CLASE: convierte un user-agent largo en algo legible: "Chrome en Windows".
// No es exhaustivo, solo cubre los casos más comunes para la clase.
export function parseUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (!ua || ua === "desconocido") return "Desconocido";

  // Herramientas automatizadas / línea de comandos.
  if (ua.includes("sqlmap")) return "sqlmap (herramienta)";
  if (ua.includes("nikto")) return "Nikto (escáner)";
  if (ua.includes("nmap")) return "Nmap (escáner)";
  if (ua.includes("zap")) return "OWASP ZAP (escáner)";
  if (ua.includes("curl")) return "curl (línea de comandos)";
  if (ua.includes("wget")) return "wget (línea de comandos)";
  if (ua.includes("postman")) return "Postman";

  // Navegador. El orden importa (Edge y Chrome comparten cadenas).
  let browser = "Navegador";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";

  // Sistema operativo.
  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return os ? `${browser} en ${os}` : browser;
}

// CLASE: datos comunes de la petición que enriquecen cada log.
export interface RequestMeta {
  ip: string; // IP del cliente (ya normalizada)
  userAgent: string; // user-agent completo (para análisis fino)
  client: string; // versión legible: "Chrome en Windows"
  referer: string; // desde qué página llegó (si el navegador lo envía)
}

// CLASE: extrae de una sola vez la metadata útil de los headers.
export function getRequestMeta(headers: Headers): RequestMeta {
  const userAgent = headers.get("user-agent") ?? "desconocido";
  return {
    ip: getClientIp(headers),
    userAgent,
    client: parseUserAgent(userAgent),
    referer: headers.get("referer") ?? headers.get("referrer") ?? "-",
  };
}
