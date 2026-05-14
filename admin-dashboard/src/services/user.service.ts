import { api } from './api';
import { User } from '../types/user';

export const userService = {
  getAll: () => api.get<User[]>('/users').then(res => res.data),
  getById: (id: string | number) => api.get<User>(`/users/${id}`).then(res => res.data),
  create: (data: Partial<User>) => api.post<User>('/users', data).then(res => res.data),
  update: (id: string | number, data: Partial<User>) => api.patch<User>(`/users/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/users/${id}`).then(res => res.data),
};