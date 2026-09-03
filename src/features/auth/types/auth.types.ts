export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthUserRole {
  id: string;
  name: string;
}

export interface AuthSubscription {
  id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  days_remaining: number;
}

/** Matches backend MeResponse from GET /auth/me */
export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string | null;
  national_id?: string | null;
  is_active: boolean;
  permissions: string[];
  roles?: AuthUserRole[] | string[];
  is_super_admin?: boolean;
  subscription?: AuthSubscription | null;
}

export function isSuperAdmin(user?: AuthUser | null): boolean {
  if (!user) return false;
  if (user.is_super_admin) return true;
  const roles = user.roles ?? [];
  return roles.some((role) => (typeof role === 'string' ? role : role.name) === 'super_admin');
}
