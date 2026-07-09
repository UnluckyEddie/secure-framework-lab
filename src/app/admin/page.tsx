import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";
import { MOCK_USERS } from "@/lib/users";

// CLASE: esta ruta requiere rol ADMIN — protegida por middleware
export default async function AdminPage() {
  const session = await getSession();

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Panel de Administrador</h1>
        <p className="mt-2 text-slate-600">
          Solo usuarios con rol ADMIN pueden acceder a esta página.
        </p>
      </div>

      <div className="grid gap-6">
        <Card title="Usuarios del sistema" badge="ADMIN">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Rol</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((user) => (
                  <tr key={user.email} className="border-b border-slate-100">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="API de administración" badge="/api/admin/users">
          <p className="mb-4 text-sm">
            Esta API también está protegida. Prueba hacer una petición GET desde
            la consola del navegador:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-green-400">
            {`fetch('/api/admin/users').then(r => r.json()).then(console.log)`}
          </pre>
        </Card>
      </div>
    </DashboardLayout>
  );
}
