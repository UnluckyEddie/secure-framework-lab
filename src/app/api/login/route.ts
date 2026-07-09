import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCredentials } from "@/lib/users";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";
// CLASE: importamos el logger de seguridad para registrar los intentos de login.
import { logSecurityEvent, getRequestMeta } from "@/lib/securityLogger";
// CLASE: detección de ataques (patrones en el input y fuerza bruta por IP).
import {
  scanForAttacks,
  attackLabel,
  registerFailedLogin,
  resetFailedLogin,
} from "@/lib/attackDetection";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

// CLASE: autenticación básica — validar credenciales y crear cookie de sesión
export async function POST(request: Request) {
  // CLASE: metadata de la petición (IP, navegador, referer...) para el log.
  const meta = getRequestMeta(request.headers);
  const ip = meta.ip;

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      // CLASE: log de datos inválidos en el formulario de login.
      logSecurityEvent({
        category: "AUTH",
        severity: "WARNING",
        user: "anónimo",
        ...meta,
        method: "POST",
        resource: "/api/login",
        statusCode: 400,
        message: "Intento de login con datos inválidos",
      });
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // CLASE: DETECCIÓN DE ATAQUE — revisamos si el email contiene patrones
    // maliciosos (por ejemplo alguien escribiendo ' OR 1=1 en el campo email).
    const attacks = scanForAttacks(email);
    if (attacks.length > 0) {
      logSecurityEvent({
        category: "ATTACK",
        severity: "ERROR",
        user: "anónimo",
        ...meta,
        method: "POST",
        resource: "/api/login",
        statusCode: 400,
        attackTypes: attacks.map(attackLabel),
        message: `Posible ataque en login: ${attacks
          .map(attackLabel)
          .join(", ")}`,
      });
    }

    const user = validateCredentials(email, password);

    if (!user) {
      // CLASE: LOGIN FALLIDO — guardamos el email pero NUNCA la contraseña.
      logSecurityEvent({
        category: "AUTH",
        severity: "WARNING",
        user: email,
        ...meta,
        method: "POST",
        resource: "/api/login",
        statusCode: 401,
        message: "Login fallido: credenciales incorrectas",
      });

      // CLASE: FUERZA BRUTA — contamos los fallos por IP. Si pasa el umbral,
      // registramos un evento de ataque de alta severidad.
      const bruteForce = registerFailedLogin(ip);
      if (bruteForce) {
        logSecurityEvent({
          category: "ATTACK",
          severity: "ERROR",
          user: email,
          ...meta,
          method: "POST",
          resource: "/api/login",
          statusCode: 429,
          attackTypes: ["Fuerza bruta"],
          message: "Posible ataque de fuerza bruta (demasiados intentos fallidos)",
        });
      }

      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // CLASE: login correcto — limpiamos el contador de fuerza bruta de esa IP.
    resetFailedLogin(ip);

    const session = { email: user.email, name: user.name, role: user.role };
    const token = createSessionToken(session);

    const response = NextResponse.json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role },
    });

  // CLASE: cookie con opciones seguras — httpOnly, sameSite, secure
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());

    // CLASE: LOGIN EXITOSO — evento informativo.
    logSecurityEvent({
      category: "AUTH",
      severity: "INFO",
      user: user.email,
      role: user.role,
      ...meta,
      method: "POST",
      resource: "/api/login",
      statusCode: 200,
      message: `Login exitoso (rol: ${user.role})`,
    });

    return response;
  } catch {
    // CLASE: ERROR de aplicación al procesar el login.
    logSecurityEvent({
      category: "ERROR",
      severity: "ERROR",
      user: "desconocido",
      ...meta,
      method: "POST",
      resource: "/api/login",
      statusCode: 500,
      message: "Error en el servidor durante el login",
    });
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
