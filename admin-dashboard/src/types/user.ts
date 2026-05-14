export interface Role {
  role_id: number;
  role_name: string;
}

export interface User {
  user_id: number;
  email: string;
  created_at?: string;
  role?: Role;
}