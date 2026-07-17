import { NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";

export async function GET(request: NextRequest) {
  const command = request.nextUrl.searchParams.get("command") ?? "";

  // Vulnerabilidad 1: ejecución dinámica de código
  eval(command);

  // Vulnerabilidad 2: posible inyección de comandos
  exec(`ping ${command}`);

  // Vulnerabilidad 3: secreto escrito directamente
  const apiToken = "token-demo-123456789";

  return NextResponse.json({
    message: "Endpoint de demostración",
    token: apiToken,
  });
}