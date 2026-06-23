import { apiClient } from '../../../lib/api-client';

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  persona_type?: string;
  role_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const getUsers = async (params: GetUsersParams) => {
  const response = await apiClient.get('/api/v1/admin/users', { params });
  return response.data;
};

export const getUserSummary = async () => {
  const response = await apiClient.get('/api/v1/admin/users/summary');
  return response.data;
};

export const getUser = async (id: string) => {
  const response = await apiClient.get(`/api/v1/admin/users/${id}`);
  return response.data;
};

export const createUser = async (payload: { email: string; full_name: string; persona_type: string; role_ids: string[] }) => {
  const response = await apiClient.post('/api/v1/admin/users', payload);
  return response.data;
};

export const updateUser = async (id: string, payload: { email?: string; full_name?: string; persona_type?: string }) => {
  const response = await apiClient.put(`/api/v1/admin/users/${id}`, payload);
  return response.data;
};

export const updateUserStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/api/v1/admin/users/${id}/status`, { status });
  return response.data;
};

export const updateUserRoles = async (id: string, roleIds: string[]) => {
  const response = await apiClient.post(`/api/v1/admin/users/${id}/roles`, { role_ids: roleIds });
  return response.data;
};

export const updateUserPermissions = async (id: string, permissionIds: string[]) => {
  const response = await apiClient.post(`/api/v1/admin/users/${id}/permissions`, { permission_ids: permissionIds });
  return response.data;
};

export const changePassword = async (payload: { current_password: string; new_password: string }) => {
  const response = await apiClient.post('/api/v1/auth/change-password', payload);
  return response.data;
};

export const getRolesList = async () => {
  const response = await apiClient.get('/api/v1/admin/roles');
  return response.data;
};

export const getPermissionsCatalog = async () => {
  const response = await apiClient.get('/api/v1/admin/permissions');
  return response.data;
};
