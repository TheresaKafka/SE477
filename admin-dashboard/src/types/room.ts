import type { Property } from './property';

export interface Room {
  room_id: number;
  name?: string;
  price?: number;
  quantity?: number;
  status?: string;
  property?: Property;
}