/**
 * Script de verificación del flujo de prácticas
 * Ejecutar con: node scripts/test-practicas.mjs
 */
const BASE = "http://localhost:3000";

const USERS = {
  admin: { email: "admin@example.com", password: "Admin123!" },
  teacher: { email: "teacher@example.com", password: "Teacher123!" },
  student: { email: "student@example.com", password: "Student123!" },
};

const ROUTES = ["/dashboard", "/admin", "/reports", "/profile"];

// Matriz esperada según roles.ts
const EXPECTED = {
  ADMIN: { "/dashboard": "ok", "/admin": "ok", "/reports": "ok", "/profile": "ok" },
  TEACHER: { "/dashboard": "ok", "/admin": "unauthorized", "/reports": "ok", "/profile": "ok" },
  STUDENT: { "/dashboard": "ok", "/admin": "unauthorized", "/reports": "unauthorized", "/profile": "ok" },
};

function parseCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/sfl-session=([^;]+)/);
  return match ? `sfl-session=${match[1]}` : null;
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookie = parseCookie(res.headers.get("set-cookie"));
  return { ok: res.ok, data, cookie, status: res.status };
}

async function getRoute(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { Cookie: cookie } : {},
  });
  const location = res.headers.get("location") || "";
  let result = "ok";
  if (res.status === 307 || res.status === 308 || res.status === 302 || res.status === 301) {
    if (location.includes("/login")) result = "login";
    else if (location.includes("/unauthorized")) result = "unauthorized";
    else result = `redirect:${location}`;
  } else if (res.status === 401) result = "login";
  else if (res.status === 403) result = "unauthorized";
  else if (res.status === 200) result = "ok";
  else result = `status:${res.status}`;
  return { status: res.status, result, location };
}

async function testRegister(body) {
  const res = await fetch(`${BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function testApi(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function checkHeaders() {
  const res = await fetch(`${BASE}/`);
  const headers = [
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "content-security-policy",
  ];
  const found = {};
  for (const h of headers) {
    const v = res.headers.get(h);
    if (v) found[h] = v.substring(0, 40);
  }
  return found;
}

async function checkFiles() {
  const fs = await import("fs");
  const path = await import("path");
  const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
  const files = [
    "src/middleware.ts",
    ".env.example",
    "src/app/api/register/route.ts",
    "src/lib/roles.ts",
    "next.config.ts",
    "src/security-lab/insecure-examples.ts",
    "src/lib/env.ts",
  ];
  return files.map((f) => ({ file: f, exists: fs.existsSync(path.join(root, f)) }));
}

const results = { passed: 0, failed: 0, details: [] };

function pass(name, detail) {
  results.passed++;
  results.details.push({ status: "PASS", name, detail });
  console.log(`  ✅ ${name}: ${detail}`);
}

function fail(name, detail) {
  results.failed++;
  results.details.push({ status: "FAIL", name, detail });
  console.log(`  ❌ ${name}: ${detail}`);
}

console.log("\n=== PRÁCTICA 1: Mecanismos de seguridad ===\n");

const files = await checkFiles();
for (const f of files) {
  if (f.exists) pass(`Archivo ${f.file}`, "existe");
  else fail(`Archivo ${f.file}`, "NO encontrado");
}

const noSession = await getRoute("/dashboard", null);
if (noSession.result === "login") pass("Middleware sin sesión", "redirige a /login");
else fail("Middleware sin sesión", `esperado login, obtuvo ${noSession.result}`);

const publicHome = await getRoute("/", null);
if (publicHome.result === "ok") pass("Ruta pública /", "accesible sin sesión");
else fail("Ruta pública /", `status ${publicHome.status}`);

console.log("\n=== PRÁCTICA 2: Roles (RBAC) ===\n");

const cookies = {};
for (const [role, creds] of Object.entries(USERS)) {
  const loginRes = await login(creds.email, creds.password);
  if (loginRes.ok && loginRes.cookie) {
    cookies[role] = loginRes.cookie;
    pass(`Login ${role}`, `rol ${loginRes.data.user.role}`);
  } else {
    fail(`Login ${role}`, JSON.stringify(loginRes.data));
  }
}

const roleMap = { admin: "ADMIN", teacher: "TEACHER", student: "STUDENT" };

for (const [roleKey, roleName] of Object.entries(roleMap)) {
  const cookie = cookies[roleKey];
  if (!cookie) continue;
  console.log(`\n  --- ${roleName} ---`);
  for (const route of ROUTES) {
    const res = await getRoute(route, cookie);
    const expected = EXPECTED[roleName][route];
    if (res.result === expected) {
      pass(`${roleName} ${route}`, expected);
    } else {
      fail(`${roleName} ${route}`, `esperado ${expected}, obtuvo ${res.result} (HTTP ${res.status})`);
    }
  }
}

// API tests
const adminApi = await testApi("/api/admin/users", cookies.admin);
if (adminApi.status === 200) pass("API /api/admin/users como ADMIN", "200 OK");
else fail("API /api/admin/users como ADMIN", `status ${adminApi.status}`);

const studentAdminApi = await testApi("/api/admin/users", cookies.student);
if (studentAdminApi.status === 403) pass("API /api/admin/users como STUDENT", "403 Forbidden");
else fail("API /api/admin/users como STUDENT", `status ${studentAdminApi.status}`);

const studentProfileApi = await testApi("/api/profile", cookies.student);
if (studentProfileApi.status === 200) pass("API /api/profile como STUDENT", "200 OK");
else fail("API /api/profile como STUDENT", `status ${studentProfileApi.status}`);

console.log("\n=== PRÁCTICA 3: Validación Zod ===\n");

const validReg = await testRegister({
  name: "Ana García",
  email: "ana@uni.edu",
  password: "Segura123",
  age: 20,
});
if (validReg.status === 201) pass("Registro válido", "201 Created");
else fail("Registro válido", `status ${validReg.status}: ${JSON.stringify(validReg.data)}`);

const invalidCases = [
  { label: "nombre corto", body: { name: "AB", email: "a@b.com", password: "Segura123", age: 20 } },
  { label: "email inválido", body: { name: "Ana Test", email: "no-es-email", password: "Segura123", age: 20 } },
  { label: "contraseña débil", body: { name: "Ana Test", email: "a@b.com", password: "corta", age: 20 } },
  { label: "edad menor", body: { name: "Ana Test", email: "a@b.com", password: "Segura123", age: 16 } },
];

for (const c of invalidCases) {
  const res = await testRegister(c.body);
  if (res.status === 400 && res.data.details) {
    pass(`Registro inválido: ${c.label}`, `400 con ${res.data.details.length} error(es)`);
  } else {
    fail(`Registro inválido: ${c.label}`, `status ${res.status}`);
  }
}

// Bypass formulario (POST directo)
const bypass = await testRegister({ name: "X", email: "bad", password: "1", age: 10 });
if (bypass.status === 400) pass("Bypass formulario (POST directo)", "servidor rechaza con 400");
else fail("Bypass formulario", `status ${bypass.status}`);

console.log("\n=== PRÁCTICA 4: Secretos y variables ===\n");

const envExample = (await import("fs")).readFileSync(
  new URL("../.env.example", import.meta.url),
  "utf-8"
);
if (envExample.includes("APP_SECRET") && !envExample.includes("NEXT_PUBLIC_APP_SECRET")) {
  pass("APP_SECRET es privada", "sin prefijo NEXT_PUBLIC_");
} else fail("APP_SECRET", "configuración incorrecta en .env.example");

if (envExample.includes("NEXT_PUBLIC_APP_NAME")) {
  pass("NEXT_PUBLIC_APP_NAME", "variable pública documentada");
} else fail("NEXT_PUBLIC_APP_NAME", "no encontrada");

const insecure = (await import("fs")).readFileSync(
  new URL("../src/security-lab/insecure-examples.ts", import.meta.url),
  "utf-8"
);
const badPatterns = ["HARDCODED_PASSWORD", "API_KEY", "eval", "weakClientValidation", "NEXT_PUBLIC"];
let foundPatterns = 0;
for (const p of badPatterns) {
  if (insecure.includes(p)) foundPatterns++;
}
if (foundPatterns >= 5) pass("Ejemplos inseguros SAST", `${foundPatterns}/5 patrones encontrados`);
else fail("Ejemplos inseguros SAST", `solo ${foundPatterns}/5`);

console.log("\n=== PRÁCTICA 5: Headers y DAST ===\n");

const headers = await checkHeaders();
const headerCount = Object.keys(headers).length;
if (headerCount >= 4) pass("Headers de seguridad", `${headerCount} headers activos`);
else fail("Headers de seguridad", `solo ${headerCount}: ${JSON.stringify(headers)}`);

for (const [h, v] of Object.entries(headers)) {
  console.log(`    ${h}: ${v}...`);
}

// lesson-guide requiere auth
const lessonNoAuth = await getRoute("/lesson-guide", null);
if (lessonNoAuth.result === "login") pass("/lesson-guide sin sesión", "requiere login");
else fail("/lesson-guide sin sesión", lessonNoAuth.result);

const lessonAuth = await getRoute("/lesson-guide", cookies.student);
if (lessonAuth.result === "ok") pass("/lesson-guide con sesión", "accesible");
else fail("/lesson-guide con sesión", lessonAuth.result);

// logout
const logoutRes = await fetch(`${BASE}/api/logout`, { method: "POST", headers: { Cookie: cookies.admin } });
if (logoutRes.ok) pass("Logout", "POST /api/logout OK");
else fail("Logout", `status ${logoutRes.status}`);

console.log("\n=== RESUMEN ===\n");
console.log(`  Pasaron: ${results.passed}`);
console.log(`  Fallaron: ${results.failed}`);
console.log(`  Total:   ${results.passed + results.failed}\n`);

process.exit(results.failed > 0 ? 1 : 0);
