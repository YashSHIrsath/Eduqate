export type PersonaType = 'super_admin' | 'headmaster' | 'teacher' | 'student';

export interface User {
  id: string;
  organization_id: string | null;
  email: string;
  persona_type: PersonaType;
  status: string;
  must_change_password: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  slug: string;
  status: string;
}

export interface Role {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  persona_type: PersonaType;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_system_permission: boolean;
}

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  roles: Role[];
  permissions: string[];
  persona: PersonaType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, organizationSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasPersona: (...personas: PersonaType[]) => boolean;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
