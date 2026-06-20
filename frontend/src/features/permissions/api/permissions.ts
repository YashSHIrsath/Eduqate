import { apiClient } from '../../../lib/api-client';

export const getPermissionsCatalog = async () => {
  const response = await apiClient.get('/api/v1/permissions');
  return response.data;
};
