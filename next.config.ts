import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// CLASE: detecta las IPs de red de ESTA máquina (ej. 192.168.x.x). Cuando otra
// máquina abre http://ESA-IP:3000, el navegador manda ese origen; Next lo
// bloquearía en desarrollo salvo que esté en allowedDevOrigins. Aquí las
// agregamos automáticamente para que el laboratorio funcione en red local.
function getLocalNetworkOrigins(): string[] {
  const origins: string[] = [];
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        origins.push(net.address);
      }
    }
  }
  return origins;
}

// CLASE: headers de seguridad configurables desde variables de entorno
const securityHeadersEnabled =
  process.env.SECURITY_HEADERS_ENABLED !== "false";

const securityHeaders = [
  {
    // CLASE: X-Frame-Options — previene clickjacking al impedir que la página se cargue en iframes
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // CLASE: X-Content-Type-Options — evita que el navegador adivine el tipo MIME (MIME sniffing)
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // CLASE: Referrer-Policy — controla qué información de referrer se envía a otros sitios
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // CLASE: Permissions-Policy — restringe APIs del navegador (cámara, micrófono, geolocalización)
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // CLASE: Content-Security-Policy — política básica contra XSS e inyección de scripts
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'",
  },
];

const nextConfig: NextConfig = {
  // CLASE: permite que otras máquinas de la red usen la app en desarrollo.
  // Se agregan automáticamente las IPs de esta máquina; puedes añadir más con
  // la variable de entorno SFL_DEV_ORIGINS (separadas por comas).
  allowedDevOrigins: [
    ...getLocalNetworkOrigins(),
    ...(process.env.SFL_DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
  ],
  async headers() {
    if (!securityHeadersEnabled) return [];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
