import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// CLASE: API protegida — requiere sesión activa (el middleware ya validó)
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({
    email: session.email,
    name: session.name,
    role: session.role,
    message: "Perfil obtenido correctamente desde API protegida",
  });
}
