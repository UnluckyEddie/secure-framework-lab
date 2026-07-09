import { DashboardLayout } from "@/components/DashboardLayout";
import { RegisterForm } from "@/components/RegisterForm";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getSession();

  return (
    <DashboardLayout session={session}>
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Registro</h1>
          <p className="mt-2 text-slate-600">
            Formulario con validación del lado servidor usando Zod
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <RegisterForm />
        </div>

        <div className="mt-6">
          <Card title="Reglas de validación (Zod)" badge="Servidor">
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>Nombre: mínimo 3 caracteres</li>
              <li>Email: formato válido</li>
              <li>Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 número</li>
              <li>Edad: mínimo 18 años</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
