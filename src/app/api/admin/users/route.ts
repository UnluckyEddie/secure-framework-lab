import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { MOCK_USERS } from "@/lib/users";
// CLASE: logger para registrar acciones administrativas.
import { logSecurityEvent, getRequestMeta } from "@/lib/securityLogger";

// CLASE: esta ruta requiere rol ADMIN — el middleware bloquea otros roles
export async function GET() {
  const session = await getSession();
  const meta = getRequestMeta(await headers());

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.role !== "ADMIN") {
    // CLASE: ACCESO DENEGADO a una API de administración.
    logSecurityEvent({
      category: "AUTHZ",
      severity: "WARNING",
      user: session.email,
      role: session.role,
      ...meta,
      method: "GET",
      resource: "/api/admin/users",
      statusCode: 403,
      message: `Acceso denegado a API admin (rol: ${session.role})`,
    });
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = MOCK_USERS.map(({ password, ...user }) => {
    void password;
    return user;
  });

  // CLASE: ACCIÓN ADMINISTRATIVA — un admin consultó la lista de usuarios.
  logSecurityEvent({
    category: "ADMIN",
    severity: "INFO",
    user: session.email,
    role: session.role,
    ...meta,
    method: "GET",
    resource: "/api/admin/users",
    statusCode: 200,
    message: "Admin consultó la lista de usuarios",
  });

  return NextResponse.json({
    users,
    total: users.length,
    message: "Lista de usuarios (solo administradores)",
  });
}
