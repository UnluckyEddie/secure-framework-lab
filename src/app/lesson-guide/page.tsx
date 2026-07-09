import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/Card";
import { getSession } from "@/lib/session";

const lessons = [
  {
    title: "Middleware",
    badge: "Next.js",
    content:
      "El middleware de Next.js se ejecuta antes de que una petición llegue a una ruta o API. Permite verificar autenticación, autorización, redirecciones y modificar headers. En este lab, `src/middleware.ts` revisa la cookie de sesión y el rol del usuario.",
  },
  {
    title: "Autenticación",
    badge: "Sesión",
    content:
      "La autenticación verifica la identidad del usuario (¿quién eres?). Aquí usamos login con email/contraseña contra usuarios mock. Al iniciar sesión se crea una cookie httpOnly con datos de sesión simulados (no JWT real).",
  },
  {
    title: "Autorización",
    badge: "Roles",
    content:
      "La autorización determina qué puede hacer un usuario autenticado (¿qué tienes permitido?). ADMIN accede a todo, TEACHER a dashboard/reports/profile, STUDENT solo a dashboard/profile. Se implementa en middleware y en APIs.",
  },
  {
    title: "Validación en servidor",
    badge: "Zod",
    content:
      "Nunca confíes en validaciones solo del frontend. Un atacante puede enviar peticiones directamente a la API. Zod define esquemas que validan datos en el servidor antes de procesarlos. Ver `/api/register`.",
  },
  {
    title: "Variables de entorno",
    badge: ".env",
    content:
      "Los secretos (APP_SECRET) deben estar en variables sin prefijo NEXT_PUBLIC_. Las variables con NEXT_PUBLIC_ se exponen al navegador. Revisa `.env.example` para ver la diferencia.",
  },
  {
    title: "Headers de seguridad",
    badge: "next.config.ts",
    content:
      "Headers como X-Frame-Options, CSP y X-Content-Type-Options protegen contra clickjacking, XSS y MIME sniffing. Se configuran en `next.config.ts` y se pueden activar/desactivar con SECURITY_HEADERS_ENABLED.",
  },
  {
    title: "SAST",
    badge: "Análisis estático",
    content:
      "Static Application Security Testing analiza el código fuente sin ejecutarlo. Herramientas como Semgrep detectan patrones inseguros: passwords hardcodeados, uso de eval, secretos expuestos. Revisa `src/security-lab/insecure-examples.ts`.",
  },
  {
    title: "DAST",
    badge: "Análisis dinámico",
    content:
      "Dynamic Application Security Testing escanea la aplicación en ejecución. OWASP ZAP puede analizar localhost:3000 buscando vulnerabilidades en headers, cookies y endpoints. Usa `/security-status` para verificar configuración.",
  },
];

export default async function LessonGuidePage() {
  const session = await getSession();

  return (
    <DashboardLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Guía de clase</h1>
        <p className="mt-2 text-slate-600">
          Conceptos clave de seguridad en el desarrollo de aplicaciones con
          frameworks modernos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {lessons.map((lesson) => (
          <Card key={lesson.title} title={lesson.title} badge={lesson.badge}>
            <p className="text-sm leading-relaxed">{lesson.content}</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
