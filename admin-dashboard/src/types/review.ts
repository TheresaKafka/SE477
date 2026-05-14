import type { User } from './user';
import type { Room } from './room';

export interface Review {
  review_id: number;
  rating?: number;
  comment?: string;
  user?: User;
  room?: Room;
}