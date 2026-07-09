import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";
import { getAllowedRoutesForRole } from "@/lib/roles";
import { getRoleLabel } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await getSession();
  const allowedRoutes = session ? getAllowedRoutesForRole(session.role) : [];

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Bienvenido, {session?.name}. Esta ruta está protegida por middleware.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Tu sesión" badge="Activa">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-medium">{session?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{session?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-medium">
                {session ? getRoleLabel(session.role) : "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Rutas permitidas" badge={session?.role}>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {allowedRoutes.map((route) => (
              <li key={route}>{route}</li>
            ))}
          </ul>
        </Card>

        <Card title="Middleware" badge="CLASE" className="md:col-span-2">
          <p className="text-sm">
            El archivo <code className="rounded bg-slate-100 px-1">src/middleware.ts</code>{" "}
            intercepta cada petición antes de llegar a las rutas protegidas.
            Verifica la cookie de sesión y el rol del usuario. Si no hay sesión,
            redirige a <code className="rounded bg-slate-100 px-1">/login</code>.
            Si el rol no tiene permiso, redirige a{" "}
            <code className="rounded bg-slate-100 px-1">/unauthorized</code>.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
