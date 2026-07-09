import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LogsViewer } from "@/components/LogsViewer";
import { getSession } from "@/lib/session";
import { getSecurityLogs } from "@/lib/securityLogger";

// CLASE: la página siempre debe leer los logs más recientes, no cachearlos.
export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const session = await getSession();

  // CLASE: defensa en profundidad — además del middleware, verificamos el rol aquí.
  if (!session || session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Cargamos los logs iniciales en el servidor; el visor los refresca en cliente.
  const logs = getSecurityLogs();

  return (
    <DashboardLayout session={session}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Logs de seguridad</h1>
        <p className="mt-2 text-slate-600">
          Registro detallado de eventos (guardado en archivo local, solo para
          práctica). Usa los filtros, el buscador y el auto-refresh. Pasa el
          cursor sobre el navegador para ver el user-agent completo.
        </p>
      </div>

      <LogsViewer initialLogs={logs} />
    </DashboardLayout>
  );
}
