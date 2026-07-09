import { cookies } from "next/headers";
import type { Session } from "./types";

// CLASE: cookie de sesión simulada — NO es JWT real, solo para demostración en clase
export const SESSION_COOKIE = "sfl-session";

export function createSessionToken(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function parseSessionToken(token: string): Session | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    const data = JSON.parse(json) as Session;
    if (!data.email || !data.role || !data.name) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export function getSessionCookieOptions() {
  return {
  // CLASE: opciones seguras para cookies — descomentar en producción con HTTPS
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  };
}
