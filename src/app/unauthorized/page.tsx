import Link from "next/link";
import { headers } from "next/headers";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getSession } from "@/lib/session";
// CLASE: logger para dejar registro del acceso denegado (visible en /admin/logs).
import { logSecurityEvent, getRequestMeta } from "@/lib/securityLogger";

export default async function UnauthorizedPage() {
  const session = await getSession();
  const meta = getRequestMeta(await headers());

  // CLASE: registramos el acceso denegado aquí porque esta página corre en el
  // runtime de Node y escribe en el mismo archivo que lee /admin/logs.
  logSecurityEvent({
    category: "AUTHZ",
    severity: "WARNING",
    user: session?.email ?? "anónimo",
    role: session?.role,
    ...meta,
    method: "GET",
    resource: "/unauthorized",
    statusCode: 403,
    message: `Usuario redirigido por falta de permisos (rol: ${
      session?.role ?? "desconocido"
    })`,
  });

  return (
    <DashboardLayout session={session}>
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <div className="mb-4 text-5xl">🚫</div>
          <h1 className="text-2xl font-bold text-red-900">Acceso no autorizado</h1>
          <p className="mt-4 text-red-700">
            Tu rol <strong>{session?.role ?? "desconocido"}</strong> no tiene
            permiso para acceder a esta ruta.
          </p>
          <p className="mt-2 text-sm text-red-600">
            El middleware detectó que intentaste acceder a un recurso restringido
            y te redirigió aquí.
          </p>

          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Ir al dashboard
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Inicio
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
