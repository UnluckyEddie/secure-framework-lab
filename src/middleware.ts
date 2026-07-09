import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionToken, SESSION_COOKIE } from "@/lib/session";
import { isApiAllowed, isRouteAllowed } from "@/lib/roles";
// CLASE: el middleware corre en runtime Edge, que NO soporta node:fs.
// Por eso NO importamos el logger (que escribe en archivo); solo usamos
// getRequestMeta (sin dependencias de Node) y registramos en consola.
import { getRequestMeta } from "@/lib/clientIp";

// CLASE: aquí se explica middleware — se ejecuta ANTES de cada petición a rutas protegidas
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas: no requieren sesión
  const publicPaths = ["/", "/login", "/unauthorized", "/register"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // APIs públicas
  const publicApis = ["/api/login", "/api/logout", "/api/register"];
  if (publicApis.some((api) => pathname.startsWith(api))) {
    return NextResponse.next();
  }

  // CLASE: revisar si existe cookie de sesión
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    // CLASE: redirigir a /login si no hay sesión
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = parseSessionToken(sessionToken);

  if (!session) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // CLASE: revisar el rol del usuario para autorización
  const isApi = pathname.startsWith("/api/");
  const allowed = isApi
    ? isApiAllowed(pathname, session.role)
    : isRouteAllowed(pathname, session.role);

  if (!allowed) {
    // CLASE: ACCESO DENEGADO POR MIDDLEWARE — se registra en CONSOLA.
    // El middleware (Edge) no puede escribir en el archivo de logs, así que
    // solo imprime aquí. Para que el evento aparezca en /admin/logs, la página
    // /unauthorized registra el acceso denegado (esa sí corre en Node).
    const meta = getRequestMeta(request.headers);
    console.log(
      "[SECURITY]",
      JSON.stringify({
        category: "AUTHZ",
        severity: "WARNING",
        user: session.email,
        role: session.role,
        ...meta,
        method: request.method,
        resource: pathname,
        statusCode: isApi ? 403 : 302,
        message: `Acceso denegado por middleware (rol: ${session.role})`,
        timestamp: new Date().toISOString(),
      })
    );

    // CLASE: bloquear rutas no permitidas — redirigir a /unauthorized
    if (isApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/lesson-guide/:path*",
    "/security-status/:path*",
    "/api/profile/:path*",
    "/api/admin/:path*",
    "/login",
  ],
};
