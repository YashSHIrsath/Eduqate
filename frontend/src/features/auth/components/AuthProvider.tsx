import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken } from '../../../lib/api-client';
import type { User, Organization, Role, AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async () => {
    try {
      // 1. Fetch profile bootstrap data
      const meResponse = await apiClient.get('/api/v1/auth/me');
      const { user: userData, organization: orgData, roles: rolesData } = meResponse.data;
      
      setUser(userData);
      setOrganization(orgData);
      setRoles(rolesData);

      // 2. Fetch effective permission names
      const permsResponse = await apiClient.get('/api/v1/auth/permissions');
      setPermissions(permsResponse.data);
    } catch (error) {
      console.error('Failed to fetch authenticated user metadata:', error);
      // Clear session state on bootstrap failure
      setUser(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setAccessToken(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      // Execute silent refresh request. secure httpOnly cookie sent automatically by browser.
      const response = await apiClient.post('/api/v1/auth/refresh');
      const { access_token } = response.data;
      
      setAccessToken(access_token);
      
      // Load user profile & permissions with the new access token
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
      
      // Store access token in memory
      setAccessToken(access_token);

      // Fetch bootstrap profile data
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
      // Server will delete the secure cookie automatically
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Failed to execute backend logout:', error);
    } finally {
      // Ensure local state is wiped regardless of backend response status
      setUser(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback((permissionName: string): boolean => {
    // Super Admin role bypasses permission checks (has full access)
    const isSuperAdmin = roles.some(role => role.name === 'Super Admin');
    if (isSuperAdmin) return true;
    
    return permissions.includes(permissionName);
  }, [roles, permissions]);

  // Execute silent refresh on application mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Clean up session if an expired token is intercepted
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
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
