# Secure Framework Lab

Laboratorio educativo en **Next.js** para la clase universitaria de **Seguridad en el desarrollo de aplicaciones**.

Demuestra en vivo cómo implementar mecanismos de seguridad usando las características de un framework moderno: middleware, autenticación, autorización por roles, validación con Zod, variables de entorno, cookies de sesión y headers de seguridad.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

Copia las variables de entorno:

```bash
cp .env.example .env.local
```

## Cómo correr

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@example.com | Admin123! | ADMIN |
| teacher@example.com | Teacher123! | TEACHER |
| student@example.com | Student123! | STUDENT |

## Estructura de rutas

| Ruta | Acceso |
|------|--------|
| `/` | Público |
| `/login` | Público |
| `/register` | Público |
| `/unauthorized` | Público |
| `/dashboard` | ADMIN, TEACHER, STUDENT |
| `/admin` | Solo ADMIN |
| `/reports` | ADMIN, TEACHER |
| `/profile` | ADMIN, TEACHER, STUDENT |
| `/lesson-guide` | Autenticado |
| `/security-status` | Autenticado |

### APIs

| Endpoint | Acceso |
|----------|--------|
| `POST /api/login` | Público |
| `POST /api/logout` | Público |
| `POST /api/register` | Público (con validación Zod) |
| `GET /api/profile` | Autenticado |
| `GET /api/admin/users` | Solo ADMIN |

## Prácticas que puedes hacer

1. **Middleware** — Revisa `src/middleware.ts` y prueba acceder a rutas protegidas sin sesión.
2. **Roles** — Inicia sesión con cada usuario y documenta qué rutas permite o bloquea.
3. **Validación Zod** — Usa `/register` con datos correctos e incorrectos.
4. **Variables de entorno** — Compara `.env.example` con `src/lib/env.ts`.
5. **Headers de seguridad** — Revisa `next.config.ts` y `/security-status`.
6. **SAST** — Analiza `src/security-lab/insecure-examples.ts` con Semgrep.
7. **DAST** — Escanea `http://localhost:3000` con OWASP ZAP.

## Cómo probar el middleware

1. Abre una ventana de incógnito.
2. Intenta acceder a `/dashboard` sin iniciar sesión.
3. Deberías ser redirigido a `/login`.
4. Inicia sesión y verifica que puedes acceder.
5. Con rol STUDENT, intenta `/admin` o `/reports` — deberías ir a `/unauthorized`.

## Cómo probar roles

| Rol | Dashboard | Admin | Reports | Profile |
|-----|-----------|-------|---------|---------|
| ADMIN | ✅ | ✅ | ✅ | ✅ |
| TEACHER | ✅ | ❌ | ✅ | ✅ |
| STUDENT | ✅ | ❌ | ❌ | ✅ |

## Revisión SAST básica con Semgrep

Instala Semgrep:

```bash
pip install semgrep
```

Ejecuta el análisis:

```bash
semgrep --config auto src/
```

O busca patrones específicos:

```bash
semgrep --config "p/javascript" src/security-lab/
```

Revisa los hallazgos en `src/security-lab/insecure-examples.ts` y documenta las correcciones.

## Escaneo con OWASP ZAP

1. Descarga [OWASP ZAP](https://www.zaproxy.org/download/).
2. Ejecuta la app: `npm run dev`
3. En ZAP, configura el proxy o usa "Automated Scan" con URL `http://localhost:3000`
4. Revisa alertas sobre headers, cookies y endpoints expuestos.
5. Compara resultados con `/security-status`.

## Preguntas de reflexión

1. ¿Por qué la validación del frontend no es suficiente?
2. ¿Qué diferencia hay entre autenticación y autorización?
3. ¿Por qué las cookies deben ser `httpOnly`?
4. ¿Qué riesgo hay de poner secretos en variables `NEXT_PUBLIC_`?
5. ¿Qué detecta SAST que DAST no puede detectar, y viceversa?
6. ¿Cómo mejorarías la cookie de sesión simulada para producción?
7. ¿Qué headers faltan o podrían reforzarse en esta app?

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Zod
- ESLint

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # ESLint
```
