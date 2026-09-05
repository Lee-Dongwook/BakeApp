export type SystemRole = "USER" | "ADMIN";

export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

export interface AuthUser {
  id: string;
  email: string;
  role: SystemRole;
}

export interface ProjectMemeber {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export interface AuthCredentialsDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

export interface RefreshTokenRow {
  id: string;
  userId: string;
  email: string;
  role: string;
}
