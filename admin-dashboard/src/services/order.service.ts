import { api } from './api';
import { Order } from '../types/order';

export const orderService = {
  getAll: () => api.get<Order[]>('/orders').then(res => res.data),
  getById: (id: string | number) => api.get<Order>(`/orders/${id}`).then(res => res.data),
  create: (data: Partial<Order>) => api.post<Order>('/orders', data).then(res => res.data),
  update: (id: string | number, data: Partial<Order>) => api.patch<Order>(`/orders/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/orders/${id}`).then(res => res.data),
};