import { NextResponse } from "next/server";
import { z } from "zod";
// CLASE: logger para registrar errores de aplicación durante el registro.
import { logSecurityEvent, getRequestMeta } from "@/lib/securityLogger";
// CLASE: detección de patrones de ataque en los campos del formulario.
import { scanForAttacks, attackLabel } from "@/lib/attackDetection";

// CLASE: aquí se explica validación del lado servidor con Zod
const registerSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("El email no tiene un formato válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe incluir al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe incluir al menos un número"),
  age: z.coerce
    .number({ error: "La edad debe ser un número" })
    .min(18, "Debes tener al menos 18 años"),
});

// Registros mock en memoria (solo para demostración)
const registrations: Array<z.infer<typeof registerSchema>> = [];

export async function POST(request: Request) {
  const meta = getRequestMeta(request.headers);

  try {
    const body = await request.json();

    // CLASE: DETECCIÓN DE ATAQUE — revisamos nombre y email por si traen
    // patrones de inyección o XSS antes de validar con Zod.
    const suspectText = `${body?.name ?? ""} ${body?.email ?? ""}`;
    const attacks = scanForAttacks(suspectText);
    if (attacks.length > 0) {
      logSecurityEvent({
        category: "ATTACK",
        severity: "ERROR",
        user: "anónimo",
        ...meta,
        method: "POST",
        resource: "/api/register",
        statusCode: 400,
        attackTypes: attacks.map(attackLabel),
        message: `Posible ataque en registro: ${attacks
          .map(attackLabel)
          .join(", ")}`,
      });
    }

    // CLASE: validación del lado servidor — NUNCA confiar solo en el frontend
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Validación fallida",
          details: errors,
        },
        { status: 400 }
      );
    }

    registrations.push(parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Registro exitoso (datos guardados en memoria)",
        user: {
          name: parsed.data.name,
          email: parsed.data.email,
          age: parsed.data.age,
        },
      },
      { status: 201 }
    );
  } catch {
    // CLASE: ERROR DE APLICACIÓN — se registra sin exponer datos sensibles.
    logSecurityEvent({
      category: "ERROR",
      severity: "ERROR",
      user: "anónimo",
      ...meta,
      method: "POST",
      resource: "/api/register",
      statusCode: 500,
      message: "Error al procesar la solicitud de registro",
    });
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    total: registrations.length,
    message: "Endpoint de registro — usa POST para registrar usuarios",
  });
}
