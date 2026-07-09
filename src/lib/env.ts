// CLASE: este es un secreto que NO debe estar hardcodeado — usar process.env.APP_SECRET
export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    // Valor por defecto solo para desarrollo local
    return "dev-secret-change-in-production";
  }
  return secret;
}

export function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Secure Framework Lab";
}

export function areSecurityHeadersEnabled(): boolean {
  return process.env.SECURITY_HEADERS_ENABLED !== "false";
}
