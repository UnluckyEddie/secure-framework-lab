import Link from "next/link";
import type { Role } from "@/lib/types";
import { getAllowedRoutesForRole } from "@/lib/roles";
import { LogoutButton } from "./LogoutButton";

const NAV_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/admin": "Admin",
  "/admin/logs": "Logs",
  "/reports": "Reportes",
  "/profile": "Perfil",
  "/lesson-guide": "Guía de clase",
  "/security-status": "Estado de seguridad",
};

interface NavbarProps {
  session?: { name: string; role: Role } | null;
}

export function Navbar({ session }: NavbarProps) {
  const allowedRoutes = session ? getAllowedRoutesForRole(session.role) : [];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Secure Framework Lab
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {session ? (
            <>
              {allowedRoutes.map((route) => (
                <Link
                  key={route}
                  href={route}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {NAV_LABELS[route] ?? route}
                </Link>
              ))}
              <span className="ml-2 hidden text-sm text-slate-500 sm:inline">
                {session.name} ({session.role})
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Registro
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
