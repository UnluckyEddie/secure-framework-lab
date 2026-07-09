import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";
import { getAllowedRoutesForRole } from "@/lib/roles";
import { areSecurityHeadersEnabled } from "@/lib/env";
import { SecurityHeadersChecker } from "@/components/SecurityHeadersChecker";

export default async function SecurityStatusPage() {
  const session = await getSession();
  const headersEnabled = areSecurityHeadersEnabled();
  const allowedRoutes = session ? getAllowedRoutesForRole(session.role) : [];

  const securityHeaders = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
  ];

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Estado de seguridad</h1>
        <p className="mt-2 text-slate-600">
          Panel para verificar configuración de seguridad — útil para prácticas
          DAST con OWASP ZAP
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          title="Headers de seguridad"
          badge={headersEnabled ? "Activos" : "Desactivados"}
        >
          <p className="mb-3 text-sm">
            Variable SECURITY_HEADERS_ENABLED:{" "}
            <strong>{headersEnabled ? "true" : "false"}</strong>
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {securityHeaders.map((header) => (
              <li key={header}>{header}</li>
            ))}
          </ul>
          <SecurityHeadersChecker />
        </Card>

        <Card title="Sesión actual" badge={session ? "Activa" : "Sin sesión"}>
          {session ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Usuario</dt>
                <dd className="font-medium">{session.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">{session.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rol</dt>
                <dd className="font-medium">{session.role}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">No hay sesión activa</p>
          )}
        </Card>

        <Card title="Rutas permitidas" badge={session?.role ?? "—"}>
          {session ? (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {allowedRoutes.map((route) => (
                <li key={route}>{route}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Inicia sesión para ver rutas</p>
          )}
        </Card>

        <Card title="Escaneo DAST" badge="OWASP ZAP">
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li>Ejecuta la app: npm run dev</li>
            <li>Abre OWASP ZAP</li>
            <li>Escanea http://localhost:3000</li>
            <li>Compara hallazgos con este panel</li>
            <li>Documenta headers faltantes o débiles</li>
          </ol>
        </Card>
      </div>
    </DashboardLayout>
  );
}
