import { api } from './api';
import { Payment } from '../types/payment';

export const paymentService = {
  getAll: () => api.get<Payment[]>('/payments').then(res => res.data),
  getById: (id: string | number) => api.get<Payment>(`/payments/${id}`).then(res => res.data),
  create: (data: Partial<Payment>) => api.post<Payment>('/payments', data).then(res => res.data),
  update: (id: string | number, data: Partial<Payment>) => api.patch<Payment>(`/payments/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/payments/${id}`).then(res => res.data),
};