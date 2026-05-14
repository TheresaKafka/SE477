import type { User } from './user';

export interface Order {
  order_id: number;
  total_price?: number;
  status?: string;
  created_at?: string;
  user?: User;
}