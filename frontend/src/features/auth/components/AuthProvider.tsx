import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken } from '../../../lib/api-client';
import type { User, Organization, Role, AuthContextType, PersonaType } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async () => {
    try {
      const meResponse = await apiClient.get('/api/v1/auth/me');
      const { user: userData, organization: orgData, roles: rolesData } = meResponse.data;

      setUser(userData);
      setOrganization(orgData);
      setRoles(rolesData);

      const permsResponse = await apiClient.get('/api/v1/auth/permissions');
      setPermissions(permsResponse.data);
    } catch (error) {
      console.error('Failed to fetch authenticated user metadata:', error);
      setUser(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setAccessToken(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await apiClient.post('/api/v1/auth/refresh');
      const { access_token } = response.data;
      setAccessToken(access_token);
      await fetchUserData();
    } catch (error) {
      // Catch expected 401s for unauthenticated users silently on boot
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  const login = async (email: string, password: string, organizationSlug: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password,
        organization_slug: organizationSlug,
      });
      const { access_token } = response.data;
      setAccessToken(access_token);
      await fetchUserData();
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Failed to execute backend logout:', error);
    } finally {
      setUser(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback((permissionName: string): boolean => {
    const isSuperAdmin = user?.persona_type === 'super_admin';
    if (isSuperAdmin) return true;
    return permissions.includes(permissionName);
  }, [user, permissions]);

  const hasPersona = useCallback((...personas: PersonaType[]): boolean => {
    if (!user) return false;
    return personas.includes(user.persona_type);
  }, [user]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setAccessToken(null);
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, []);

  const value: AuthContextType = {
    user,
    organization,
    roles,
    permissions,
    persona: user?.persona_type ?? null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasPersona,
    refreshSession,
    refreshProfile: fetchUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
