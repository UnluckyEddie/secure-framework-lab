import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import {
  getSecurityLogs,
  clearSecurityLogs,
  logSecurityEvent,
  getRequestMeta,
} from "@/lib/securityLogger";

// CLASE: API solo para ADMIN. Sirve para que la tabla se auto-actualice (GET)
// y para vaciar los logs (DELETE). Verificamos el rol en cada método.

// GET → devuelve los logs actuales en JSON (para el auto-refresh del front).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json({ logs: getSecurityLogs() });
}

// DELETE → borra todos los logs. Queda registrada la propia acción de borrado.
export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const meta = getRequestMeta(await headers());
  clearSecurityLogs();

  // CLASE: dejamos un rastro de quién limpió los logs (acción administrativa).
  logSecurityEvent({
    category: "ADMIN",
    severity: "WARNING",
    user: session.email,
    role: session.role,
    ...meta,
    method: "DELETE",
    resource: "/api/admin/logs",
    statusCode: 200,
    message: "Un administrador borró todos los logs de seguridad",
  });

  return NextResponse.json({ ok: true });
}
