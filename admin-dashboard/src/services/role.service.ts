import { api } from './api';
import { Role } from '../types/role';

export const roleService = {
  getAll: () => api.get<Role[]>('/roles').then(res => res.data),
  getById: (id: string | number) => api.get<Role>(`/roles/${id}`).then(res => res.data),
  create: (data: Partial<Role>) => api.post<Role>('/roles', data).then(res => res.data),
  update: (id: string | number, data: Partial<Role>) => api.patch<Role>(`/roles/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/roles/${id}`).then(res => res.data),
};