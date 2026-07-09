import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";

export default async function ReportsPage() {
  const session = await getSession();

  const mockReports = [
    { id: 1, title: "Intentos de acceso no autorizado", count: 12, severity: "Alta" },
    { id: 2, title: "Validaciones fallidas en registro", count: 45, severity: "Media" },
    { id: 3, title: "Sesiones activas", count: 3, severity: "Baja" },
    { id: 4, title: "Headers de seguridad activos", count: 5, severity: "Info" },
  ];

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
        <p className="mt-2 text-slate-600">
          Accesible para ADMIN y TEACHER. Los estudiantes serán redirigidos a
          /unauthorized.
        </p>
      </div>

      <div className="grid gap-4">
        {mockReports.map((report) => (
          <Card key={report.id} title={report.title} badge={report.severity}>
            <p className="text-2xl font-bold text-slate-900">{report.count}</p>
            <p className="text-sm text-slate-500">eventos registrados (mock)</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
