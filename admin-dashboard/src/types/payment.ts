import type { Order } from './order';

export interface Payment {
  payment_id: number;
  amount?: number;
  payment_method?: string;
  status?: string;
  payment_date?: string;
  order?: Order;
}