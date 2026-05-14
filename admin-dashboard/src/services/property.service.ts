import { api } from './api';
import { Property } from '../types/property';

export const propertyService = {
  getAll: () => api.get<Property[]>('/properties').then(res => res.data),
  getById: (id: string | number) => api.get<Property>(`/properties/${id}`).then(res => res.data),
  create: (data: Partial<Property>) => api.post<Property>('/properties', data).then(res => res.data),
  update: (id: string | number, data: Partial<Property>) => api.patch<Property>(`/properties/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/properties/${id}`).then(res => res.data),
};