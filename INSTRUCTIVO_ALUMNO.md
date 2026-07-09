# Instructivo del alumno — Secure Framework Lab

**Materia:** Seguridad en el desarrollo de aplicaciones  
**Herramienta:** Next.js (App Router) + React + TypeScript

---

## 1. ¿Qué es esta aplicación?

**Secure Framework Lab** es un laboratorio educativo diseñado para demostrar, en vivo y con código real, cómo un framework moderno como **Next.js** ayuda a implementar seguridad en aplicaciones web.

No es una app de producción ni un sistema de pentesting avanzado. Es un entorno controlado, simple y fácil de modificar durante clase, donde puedes:

- Ver cómo funciona la **autenticación** (¿quién eres?).
- Probar la **autorización por roles** (¿qué puedes hacer?).
- Entender el **middleware** que protege rutas antes de que se carguen.
- Validar datos en el **servidor** con **Zod**.
- Gestionar **secretos** con variables de entorno.
- Configurar **headers de seguridad** HTTP.
- Analizar código con **SAST** (análisis estático).
- Escanear la app en ejecución con **DAST** (análisis dinámico).

La app **no usa base de datos real**. Los usuarios y registros viven en memoria (datos mock), para que puedas concentrarte en los mecanismos de seguridad del framework.

---

## 2. ¿Para qué sirve? (Propósito del laboratorio)

El objetivo principal es que aprendas a **implementar seguridad usando las características del framework**, no solo a memorizar conceptos teóricos.

Al terminar las prácticas deberías poder:

1. Explicar la diferencia entre autenticación y autorización.
2. Identificar dónde se protege cada ruta y API en el código.
3. Justificar por qué la validación debe estar en el servidor.
4. Diferenciar variables de entorno públicas y privadas.
5. Reconocer malas prácticas comunes (secretos hardcodeados, `eval`, etc.).
6. Ejecutar una revisión básica con Semgrep y un escaneo con OWASP ZAP.
7. Documentar hallazgos y proponer correcciones.

---

## 3. Requisitos e instalación

### Requisitos

- Node.js 18 o superior
- npm
- Navegador web (Chrome o Firefox recomendado)
- Editor de código (VS Code / Cursor)
- Para la Práctica 5: Python + Semgrep y/o OWASP ZAP

### Pasos de instalación

```bash
# 1. Entra al proyecto
cd secure-framework-lab

# 2. Instala dependencias
npm install

# 3. Copia las variables de entorno
cp .env.example .env.local

# 4. Inicia la aplicación
npm run dev
```

Abre en el navegador: **http://localhost:3000**

> Si el puerto 3000 está ocupado, Next.js puede usar otro (por ejemplo 3001). Revisa el mensaje en la terminal.

---

## 4. Usuarios de prueba

Usa estas credenciales para probar los distintos roles:

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| **ADMIN** | admin@example.com | Admin123! | Acceso total |
| **TEACHER** | teacher@example.com | Teacher123! | Acceso intermedio |
| **STUDENT** | student@example.com | Student123! | Acceso limitado |

---

## 5. Mapa de la aplicación

### Páginas principales

| Ruta | ¿Quién puede entrar? | Qué aprendes aquí |
|------|----------------------|-------------------|
| `/` | Todos | Introducción y enlaces a cada módulo |
| `/login` | Todos | Autenticación con cookie de sesión |
| `/register` | Todos | Validación con Zod en el servidor |
| `/dashboard` | ADMIN, TEACHER, STUDENT | Ruta protegida por middleware |
| `/admin` | Solo ADMIN | Autorización estricta por rol |
| `/reports` | ADMIN, TEACHER | Rol intermedio |
| `/profile` | ADMIN, TEACHER, STUDENT | Perfil y API protegida |
| `/unauthorized` | Todos | Página de acceso denegado |
| `/lesson-guide` | Usuarios autenticados | Teoría breve de cada tema |
| `/security-status` | Usuarios autenticados | Panel para prácticas DAST |

### APIs

| Endpoint | Método | Acceso |
|----------|--------|--------|
| `/api/login` | POST | Público |
| `/api/logout` | POST | Público |
| `/api/register` | POST | Público (validado con Zod) |
| `/api/profile` | GET | Autenticado |
| `/api/admin/users` | GET | Solo ADMIN |

### Matriz de permisos esperada

| Ruta | ADMIN | TEACHER | STUDENT | Sin sesión |
|------|-------|---------|---------|------------|
| `/dashboard` | ✅ | ✅ | ✅ | ❌ → `/login` |
| `/admin` | ✅ | ❌ → `/unauthorized` | ❌ → `/unauthorized` | ❌ → `/login` |
| `/reports` | ✅ | ✅ | ❌ → `/unauthorized` | ❌ → `/login` |
| `/profile` | ✅ | ✅ | ✅ | ❌ → `/login` |

---

## 6. Archivos clave que debes conocer

Antes de empezar las prácticas, ubica estos archivos en el proyecto:

| Archivo | Para qué sirve |
|---------|----------------|
| `src/middleware.ts` | Protege rutas: revisa sesión y rol |
| `src/lib/roles.ts` | Define qué rol puede acceder a cada ruta |
| `src/lib/session.ts` | Manejo de la cookie de sesión |
| `src/lib/users.ts` | Usuarios mock y validación de login |
| `src/lib/env.ts` | Lectura de variables de entorno |
| `src/app/api/register/route.ts` | Validación con Zod |
| `next.config.ts` | Headers de seguridad HTTP |
| `.env.example` | Plantilla de variables de entorno |
| `src/security-lab/insecure-examples.ts` | Ejemplos de malas prácticas (SAST) |

Busca también comentarios que empiezan con **`// CLASE:`** — están puestos para explicar conceptos durante la sesión en vivo.

---

## 7. Prácticas paso a paso

Completa las 5 prácticas en orden. Cada una incluye pasos concretos, qué observar y qué debes entregar.

---

### Práctica 1 — Identificar mecanismos de seguridad del framework

**Objetivo:** Reconocer las capas de seguridad que Next.js ofrece de forma nativa.

#### Paso 1 — Arranca la aplicación

```bash
npm run dev
```

Abre http://localhost:3000 y recorre la página de inicio.

#### Paso 2 — Explora los archivos de seguridad

Abre cada archivo de la tabla de la sección 6 y responde por escrito:

- ¿Qué hace?
- ¿En qué momento del flujo de una petición actúa?
- ¿Qué pasaría si lo quitáramos?

#### Paso 3 — Lee la guía integrada

1. Inicia sesión con cualquier usuario de prueba.
2. Ve a **http://localhost:3000/lesson-guide**.
3. Lee las 8 tarjetas (Middleware, Autenticación, Autorización, etc.).

#### Paso 4 — Prueba el middleware sin sesión

1. Abre una ventana de incógnito.
2. Intenta entrar directamente a: `http://localhost:3000/dashboard`
3. **Resultado esperado:** te redirige a `/login`.

#### Paso 5 — Busca comentarios educativos

En tu editor, busca `// CLASE:` en todo el proyecto. Anota al menos 5 comentarios y qué concepto explican.

#### Entregable

Documento breve (½ página) con una tabla:

| Mecanismo | Archivo | Propósito |
|-----------|---------|-----------|
| Middleware | `src/middleware.ts` | ... |
| ... | ... | ... |

---

### Práctica 2 — Implementar y probar roles (RBAC)

**Objetivo:** Comprender la autorización basada en roles.

#### Paso 1 — Inicia sesión con los 3 usuarios

Cierra sesión entre cada prueba (botón **Cerrar sesión** en la navbar).

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Admin | admin@example.com | Admin123! |
| Profesor | teacher@example.com | Teacher123! |
| Estudiante | student@example.com | Student123! |

#### Paso 2 — Prueba cada ruta con cada rol

Para cada combinación rol + ruta, anota el resultado:

- **Permitido** — ves la página normalmente.
- **Unauthorized** — te lleva a `/unauthorized`.
- **Login** — te lleva a `/login` (sin sesión).

Rutas a probar:

- `/dashboard`
- `/admin`
- `/reports`
- `/profile`

> Tip: también observa qué enlaces aparecen en la **navbar** según tu rol.

#### Paso 3 — Compara con el código

Abre `src/lib/roles.ts` y verifica que la matriz de permisos coincida con lo que observaste.

#### Paso 4 — Modifica permisos (experimento)

1. En `src/lib/roles.ts`, cambia la línea de `/admin` para incluir también `"TEACHER"`.
2. Guarda el archivo (Next.js recarga automáticamente).
3. Inicia sesión como **teacher@example.com** e intenta entrar a `/admin`.
4. **Resultado esperado:** ahora sí puede entrar.
5. **Importante:** revierte el cambio al terminar.

#### Paso 5 — Prueba las APIs protegidas

Con sesión activa, abre la consola del navegador (F12 → Console) y ejecuta:

```javascript
// Debe funcionar si estás autenticado
fetch('/api/profile').then(r => r.json()).then(console.log)

// Solo funciona como ADMIN
fetch('/api/admin/users').then(r => r.json()).then(console.log)
```

Prueba como STUDENT la segunda petición. **Resultado esperado:** error 403.

#### Entregable

Tabla completa:

| Rol | Ruta | Resultado | ¿Por qué? (explica el middleware) |
|-----|------|-----------|-----------------------------------|
| ADMIN | /admin | Permitido | El rol ADMIN está en ROUTE_PERMISSIONS... |
| ... | ... | ... | ... |

---

### Práctica 3 — Validación segura con Zod

**Objetivo:** Entender por qué la validación debe ejecutarse en el servidor.

#### Paso 1 — Abre el formulario de registro

Ve a **http://localhost:3000/register**

#### Paso 2 — Envía datos válidos

Completa el formulario con:

| Campo | Valor |
|-------|-------|
| Nombre | Ana García |
| Email | ana@uni.edu |
| Contraseña | Segura123 |
| Edad | 20 |

**Resultado esperado:** mensaje verde de registro exitoso.

#### Paso 3 — Envía datos inválidos (uno a la vez)

Repite el envío cambiando solo un campo cada vez:

| Campo erróneo | Valor | Error esperado |
|---------------|-------|----------------|
| Nombre | AB | Mínimo 3 caracteres |
| Email | no-es-email | Formato inválido |
| Contraseña | corta | Mínimo 8, mayúscula, número |
| Edad | 16 | Mínimo 18 años |

Observa que los errores aparecen en rojo, campo por campo.

#### Paso 4 — Bypass del formulario (prueba importante)

1. Abre DevTools → pestaña **Network**.
2. En la consola, envía una petición directa sin usar el formulario:

```javascript
fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'X', email: 'mal', password: '1', age: 10 })
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** respuesta 400 con lista de errores de validación.

Esto demuestra que **aunque modifiques el HTML del formulario**, el servidor sigue rechazando datos inválidos.

#### Paso 5 — Lee el esquema Zod

Abre `src/app/api/register/route.ts` y localiza `registerSchema`. Explica cada regla:

- `name`: mínimo 3 caracteres
- `email`: formato válido
- `password`: mínimo 8, 1 mayúscula, 1 número
- `age`: mínimo 18

#### Entregable

Responde por escrito:

1. ¿Por qué el paso 4 sigue fallando aunque modifiques el formulario en el navegador?
2. ¿Qué pasaría si quitáramos la validación Zod del servidor y solo validáramos en el frontend?

---

### Práctica 4 — Gestión segura de secretos

**Objetivo:** Diferenciar variables públicas y privadas; evitar hardcoding.

#### Paso 1 — Revisa ejemplos inseguros

Abre `src/security-lab/insecure-examples.ts`.

Identifica los **5 ejemplos** de malas prácticas y su corrección:

1. Password hardcodeado
2. API key hardcodeada
3. Uso de `eval`
4. Validación débil solo en cliente
5. Secreto en variable `NEXT_PUBLIC_`

#### Paso 2 — Estudia las variables de entorno

Abre `.env.example` y responde:

- ¿Qué significa que `APP_SECRET` **no** tenga prefijo `NEXT_PUBLIC_`?
- ¿Por qué `NEXT_PUBLIC_APP_NAME` **sí** lo tiene?
- ¿Cuál de las dos es visible en el navegador del usuario?

#### Paso 3 — Sigue el flujo en el código

Abre `src/lib/env.ts` y observa cómo se leen las variables con `process.env`.

#### Paso 4 — Verifica en el navegador

1. Ejecuta `npm run build` y luego `npm run start` (modo producción).
2. Abre DevTools → **Sources** o busca en los archivos JS cargados.
3. Busca la cadena `APP_SECRET`.
4. Busca `Secure Framework Lab` (valor de `NEXT_PUBLIC_APP_NAME`).

**Resultado esperado:**

- `APP_SECRET` → **no debe aparecer** en el bundle del cliente.
- El nombre de la app → **sí puede aparecer** (es dato público).

#### Entregable

Lista con formato:

| # | Mala práctica | Riesgo | Corrección con `.env.local` |
|---|---------------|--------|----------------------------|
| 1 | Password en código | ... | Usar `process.env.ADMIN_PASSWORD` |
| ... | ... | ... | ... |

---

### Práctica 5 — SAST y DAST

**Objetivo:** Aplicar análisis estático (código) y dinámico (app en ejecución).

---

#### Parte A — SAST con Semgrep

##### Paso 1 — Instala Semgrep

```bash
pip install semgrep
```

##### Paso 2 — Ejecuta el análisis

Desde la raíz del proyecto:

```bash
semgrep --config auto src/
```

O enfocado en los ejemplos inseguros:

```bash
semgrep --config "p/javascript" src/security-lab/
```

##### Paso 3 — Documenta hallazgos

Revisa especialmente `src/security-lab/insecure-examples.ts`.

Anota al menos **3 hallazgos** con:

- Qué detectó Semgrep
- Por qué es un riesgo
- Cómo corregirlo (ya está comentado debajo de cada ejemplo)

---

#### Parte B — DAST con OWASP ZAP

##### Paso 1 — Prepara la app

```bash
npm run dev
```

##### Paso 2 — Escanea con OWASP ZAP

1. Descarga [OWASP ZAP](https://www.zaproxy.org/download/) si no lo tienes.
2. Configura un escaneo automatizado contra: `http://localhost:3000`
3. Espera a que termine el análisis.

##### Paso 3 — Compara con el panel interno

1. Inicia sesión en la app.
2. Ve a **http://localhost:3000/security-status**
3. Compara:
   - Headers configurados vs headers detectados
   - Estado de tu sesión y rol
   - Rutas permitidas para tu usuario

##### Paso 4 — Documenta alertas

Clasifica los hallazgos de ZAP en baja, media o alta severidad.

#### Entregable

Informe con esta tabla:

| Tipo | Herramienta | Hallazgo | Severidad | Corrección propuesta |
|------|-------------|----------|-----------|----------------------|
| SAST | Semgrep | Uso de eval() | Alta | Eliminar eval, usar validación con Zod |
| SAST | Semgrep | ... | ... | ... |
| DAST | OWASP ZAP | Header X faltante | Media | Configurar en next.config.ts |
| DAST | OWASP ZAP | ... | ... | ... |

---

## 8. Preguntas de reflexión (para cerrar el laboratorio)

Responde al final de todas las prácticas:

1. ¿Por qué la validación del frontend no es suficiente?
2. ¿Qué diferencia hay entre **autenticación** y **autorización**?
3. ¿Por qué las cookies de sesión deben ser `httpOnly`?
4. ¿Qué riesgo hay de poner secretos en variables `NEXT_PUBLIC_`?
5. ¿Qué detecta **SAST** que **DAST** no puede detectar, y viceversa?
6. ¿Cómo mejorarías la cookie de sesión simulada de esta app para un entorno real?
7. ¿Qué headers de seguridad podrían reforzarse en esta aplicación?

---

## 9. Comandos útiles de referencia

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run start    # Servidor de producción
npm run lint     # Revisión ESLint

node scripts/test-practicas.mjs   # Verificación automática de las prácticas
```

---

## 10. Criterios de evaluación

Tu trabajo será evaluado considerando:

- **Comprensión conceptual** — ¿Explicas bien autenticación vs autorización, SAST vs DAST?
- **Reproducibilidad** — ¿Documentaste pasos y resultados con claridad?
- **Análisis de código** — ¿Identificaste correctamente dónde está cada mecanismo?
- **Propuestas de mejora** — ¿Tus correcciones son concretas y aplicables?

---

## 11. Notas importantes

- Esta app usa **datos mock en memoria**. Los registros del formulario no persisten al reiniciar el servidor.
- La sesión es una **cookie simulada**, no un JWT real. Es intencional para simplificar la clase.
- Los ejemplos en `insecure-examples.ts` **no deben copiarse a producción** — existen solo para aprendizaje.
- Si algo no funciona, revisa que `.env.local` exista y que el servidor esté corriendo en el puerto correcto.

---

**¡Buen trabajo!** El objetivo no es hackear la app, sino entender cómo construir aplicaciones más seguras desde el código.
