export type UserRole = "ADMIN" | "MEMBER" | "GUEST";

export interface TablePolicyDefinition {
  tableName: string;
  readRoles: UserRole[];
  writeRoles: UserRole[];
  deleteRoles: UserRole[];
  ownerOnly?: boolean;
}
