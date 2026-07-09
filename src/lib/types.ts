export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export interface MockUser {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface Session {
  email: string;
  name: string;
  role: Role;
}
