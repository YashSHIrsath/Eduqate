import { apiClient } from '../../../lib/api-client';

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ── Academic Years ───────────────────────────────────────────────────────────
export const getAcademicYears = async (params?: PaginationParams) => {
  const response = await apiClient.get('/api/v1/academic/years', { params });
  return response.data;
};

export const getAcademicYear = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/years/${id}`);
  return response.data;
};

export const createAcademicYear = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/years/', payload);
  return response.data;
};

export const updateAcademicYear = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/years/${id}`, payload);
  return response.data;
};

export const deleteAcademicYear = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/years/${id}`);
  return response.data;
};

// ── Academic Terms ───────────────────────────────────────────────────────────
export interface GetTermsParams extends PaginationParams {
  academic_year_id?: string;
}

export const getAcademicTerms = async (params?: GetTermsParams) => {
  const response = await apiClient.get('/api/v1/academic/terms', { params });
  return response.data;
};

export const getAcademicTerm = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/terms/${id}`);
  return response.data;
};

export const createAcademicTerm = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/terms/', payload);
  return response.data;
};

export const updateAcademicTerm = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/terms/${id}`, payload);
  return response.data;
};

export const deleteAcademicTerm = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/terms/${id}`);
  return response.data;
};

// ── Departments ──────────────────────────────────────────────────────────────
export const getDepartments = async (params?: PaginationParams) => {
  const response = await apiClient.get('/api/v1/academic/departments', { params });
  return response.data;
};

export const getDepartment = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/departments/${id}`);
  return response.data;
};

export const createDepartment = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/departments/', payload);
  return response.data;
};

export const updateDepartment = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/departments/${id}`, payload);
  return response.data;
};

export const deleteDepartment = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/departments/${id}`);
  return response.data;
};

// ── Classes ──────────────────────────────────────────────────────────────────
export interface GetClassesParams extends PaginationParams {
  department_id?: string;
}

export const getClasses = async (params?: GetClassesParams) => {
  const response = await apiClient.get('/api/v1/academic/classes', { params });
  return response.data;
};

export const getClass = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/classes/${id}`);
  return response.data;
};

export const createClass = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/classes/', payload);
  return response.data;
};

export const updateClass = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/classes/${id}`, payload);
  return response.data;
};

export const deleteClass = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/classes/${id}`);
  return response.data;
};

export const getClassSubjects = async (classId: string, academicYearId?: string) => {
  const response = await apiClient.get(`/api/v1/academic/classes/${classId}/subjects`, {
    params: academicYearId ? { academic_year_id: academicYearId } : undefined,
  });
  return response.data;
};

export const assignClassSubjects = async (classId: string, payload: { subject_ids: string[]; academic_year_id: string }) => {
  const response = await apiClient.post(`/api/v1/academic/classes/${classId}/subjects`, payload);
  return response.data;
};

export const unassignClassSubject = async (classId: string, subjectId: string, academicYearId: string) => {
  const response = await apiClient.delete(`/api/v1/academic/classes/${classId}/subjects/${subjectId}`, {
    params: { academic_year_id: academicYearId },
  });
  return response.data;
};

// ── Sections ─────────────────────────────────────────────────────────────────
export interface GetSectionsParams extends PaginationParams {
  class_id?: string;
}

export const getSections = async (params?: GetSectionsParams) => {
  const response = await apiClient.get('/api/v1/academic/sections', { params });
  return response.data;
};

export const getSection = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/sections/${id}`);
  return response.data;
};

export const createSection = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/sections/', payload);
  return response.data;
};

export const updateSection = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/sections/${id}`, payload);
  return response.data;
};

export const deleteSection = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/sections/${id}`);
  return response.data;
};

// ── Subjects ─────────────────────────────────────────────────────────────────
export interface GetSubjectsParams extends PaginationParams {
  department_id?: string;
}

export const getSubjects = async (params?: GetSubjectsParams) => {
  const response = await apiClient.get('/api/v1/academic/subjects', { params });
  return response.data;
};

export const getSubject = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/subjects/${id}`);
  return response.data;
};

export const createSubject = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/subjects/', payload);
  return response.data;
};

export const updateSubject = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/subjects/${id}`, payload);
  return response.data;
};

export const deleteSubject = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/subjects/${id}`);
  return response.data;
};

// ── Teacher Assignments ──────────────────────────────────────────────────────
export interface GetAssignmentsParams extends PaginationParams {
  teacher_id?: string;
  academic_year_id?: string;
}

export const getTeacherAssignments = async (params?: GetAssignmentsParams) => {
  const response = await apiClient.get('/api/v1/academic/teachers/assignments', { params });
  return response.data;
};

export const getTeacherAssignment = async (id: string) => {
  const response = await apiClient.get(`/api/v1/academic/teachers/assignments/${id}`);
  return response.data;
};

export const createTeacherAssignment = async (payload: any) => {
  const response = await apiClient.post('/api/v1/academic/teachers/assignments/', payload);
  return response.data;
};

export const updateTeacherAssignment = async (id: string, payload: any) => {
  const response = await apiClient.put(`/api/v1/academic/teachers/assignments/${id}`, payload);
  return response.data;
};

export const deleteTeacherAssignment = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/academic/teachers/assignments/${id}`);
  return response.data;
};
