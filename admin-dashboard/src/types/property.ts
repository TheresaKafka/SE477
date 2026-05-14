import type { User } from './user';

export interface Property {
  property_id: number;
  name?: string;
  address?: string;
  city?: string;
  status?: string;
  owner?: User;
}