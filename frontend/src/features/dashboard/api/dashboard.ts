import { apiClient } from '../../../lib/api-client';

export interface DashboardStats {
  total_users: number;
  active_users: number;
  roles: number;
  permissions: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/api/v1/admin/dashboard/stats');
  return response.data;
};
