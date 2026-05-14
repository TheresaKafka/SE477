import { api } from './api';
import { Review } from '../types/review';

export const reviewService = {
  getAll: () => api.get<Review[]>('/reviews').then(res => res.data),
  getById: (id: string | number) => api.get<Review>(`/reviews/${id}`).then(res => res.data),
  create: (data: Partial<Review>) => api.post<Review>('/reviews', data).then(res => res.data),
  update: (id: string | number, data: Partial<Review>) => api.patch<Review>(`/reviews/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/reviews/${id}`).then(res => res.data),
};