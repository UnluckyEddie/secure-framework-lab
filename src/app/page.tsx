import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { getAppName } from '@/lib/env';
import { getSession } from '@/lib/session';

export default async function HomePage() {
  const session = await getSession();

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{getAppName()}</h1>
        <p className="mt-2 text-lg text-slate-600">
          Laboratorio educativo para la clase de Seguridad en el desarrollo de
          aplicaciones
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Autenticación" badge="Módulo 1">
          <p>
            Aprende a implementar login con cookies de sesión simuladas y
            validación de credenciales contra datos mock.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Ir al login →
          </Link>
        </Card>

        <Card title="Autorización por roles" badge="Módulo 2">
          <p>
            Explora cómo ADMIN, TEACHER y STUDENT tienen acceso a diferentes
            rutas según sus permisos.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Ver dashboard →
          </Link>
        </Card>

        <Card title="Validación con Zod" badge="Módulo 3">
          <p>
            Prueba el formulario de registro con validación del lado servidor
            usando esquemas Zod.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Probar registro →
          </Link>
        </Card>

        <Card title="Guía de clase" badge="Teoría">
          <p>
            Explicaciones breves sobre middleware, headers, SAST, DAST y más.
          </p>
          <Link
            href="/lesson-guide"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Leer guía →
          </Link>
        </Card>

        <Card title="Estado de seguridad" badge="DAST">
          <p>
            Revisa headers activos, sesión actual y rutas permitidas para tu
            rol.
          </p>
          <Link
            href="/security-status"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Ver estado →
          </Link>
        </Card>

        <Card title="Panel Admin" badge="Solo ADMIN">
          <p>
            Ruta protegida exclusiva para administradores. Prueba acceder con
            distintos roles.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Ir a admin →
          </Link>
        </Card>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-semibold text-amber-900">
          Objetivo del laboratorio
        </h2>
        <p className="mt-2 text-sm text-amber-800">
          Esta aplicación demuestra en vivo cómo implementar mecanismos de
          seguridad que ofrece un framework moderno como Next.js: middleware,
          cookies, validación servidor, variables de entorno y headers de
          seguridad. No usa base de datos real — todo funciona con datos mock en
          memoria.
        </p>
      </div>
    </DashboardLayout>
  );
}
