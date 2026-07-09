import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";
import { getRoleLabel } from "@/lib/roles";

export default async function ProfilePage() {
  const session = await getSession();

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Perfil de usuario</h1>
        <p className="mt-2 text-slate-600">
          Todos los roles autenticados pueden acceder a esta página.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Información del perfil">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Nombre</dt>
              <dd className="text-lg font-medium">{session?.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-lg font-medium">{session?.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Rol</dt>
              <dd className="text-lg font-medium">
                {session ? getRoleLabel(session.role) : "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="API protegida" badge="/api/profile">
          <p className="mb-4 text-sm">
            Prueba obtener tu perfil desde la API protegida:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-green-400">
            {`fetch('/api/profile').then(r => r.json()).then(console.log)`}
          </pre>
        </Card>
      </div>
    </DashboardLayout>
  );
}
