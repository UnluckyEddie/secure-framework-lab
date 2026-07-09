import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import type { Role } from "@/lib/types";

interface DashboardLayoutProps {
  children: ReactNode;
  session?: { name: string; role: Role } | null;
}

export function DashboardLayout({ children, session }: DashboardLayoutProps) {
  // CLASE: el registro de visitas ahora lo hace el SERVIDOR (server.mjs), que ve
  // TODAS las peticiones (incluidos escáneres a rutas inexistentes). Por eso ya
  // no necesitamos el VisitTracker en el navegador.
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
