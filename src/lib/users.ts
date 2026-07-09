import type { MockUser } from "./types";

// CLASE: datos mock en memoria — sin base de datos real para facilitar la práctica
export const MOCK_USERS: MockUser[] = [
  {
    email: "admin@example.com",
    password: "Admin123!",
    name: "Administrador",
    role: "ADMIN",
  },
  {
    email: "teacher@example.com",
    password: "Teacher123!",
    name: "Profesor",
    role: "TEACHER",
  },
  {
    email: "student@example.com",
    password: "Student123!",
    name: "Estudiante",
    role: "STUDENT",
  },
];

export function findUserByEmail(email: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function validateCredentials(
  email: string,
  password: string
): MockUser | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return null;
  return user;
}
