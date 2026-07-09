import { Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <DashboardLayout session={session}>
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="mt-2 text-slate-600">
            Autenticación básica con cookie de sesión simulada
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-center text-slate-500">Cargando...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}
