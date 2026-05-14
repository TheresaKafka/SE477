import { api } from './api';
import { Room } from '../types/room';

export const roomService = {
  getAll: () => api.get<Room[]>('/rooms').then(res => res.data),
  getById: (id: string | number) => api.get<Room>(`/rooms/${id}`).then(res => res.data),
  create: (data: Partial<Room>) => api.post<Room>('/rooms', data).then(res => res.data),
  update: (id: string | number, data: Partial<Room>) => api.patch<Room>(`/rooms/${id}`, data).then(res => res.data),
  delete: (id: string | number) => api.delete(`/rooms/${id}`).then(res => res.data),
};