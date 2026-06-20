import { apiClient } from '../../../lib/api-client';

export const getRoles = async () => {
  const response = await apiClient.get('/api/v1/roles');
  return response.data;
};

export const getRole = async (id: string) => {
  const response = await apiClient.get(`/api/v1/roles/${id}`);
  return response.data;
};

export const createRole = async (payload: { name: string; description?: string }) => {
  const response = await apiClient.post('/api/v1/roles', payload);
  return response.data;
};

export const updateRole = async (id: string, payload: { name?: string; description?: string }) => {
  const response = await apiClient.put(`/api/v1/roles/${id}`, payload);
  return response.data;
};

export const deleteRole = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/roles/${id}`);
  return response.data;
};

export const assignPermissionsToRole = async (roleId: string, permissionIds: string[]) => {
  const response = await apiClient.post(`/api/v1/roles/${roleId}/permissions`, { permission_ids: permissionIds });
  return response.data;
};
