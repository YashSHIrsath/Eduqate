export interface User {
  id: string;
  organization_id: string | null;
  email: string;
  status: string;
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
  permissions: string[]; // effective permission strings (e.g. ['users:view'])
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, organizationSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
}
