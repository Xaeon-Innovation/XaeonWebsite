import type { UserRole } from "../models/user.model";

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string;
  name: string;
};
