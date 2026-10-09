export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'inactive';
export type UserGender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  phone: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  isVerified: boolean;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  gender: UserGender;
  phone: string;
  department: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  phone: string;
  department: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  data: User[];
  pagination: UserPagination;
}

export interface UserListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: 'id' | 'gender' | 'firstName' | 'lastName' | 'name' | 'email' |
    'phone' | 'department' | 'role' | 'status' | 'createdAt' | 'isVerified';
  sortOrder?: 'asc' | 'desc';
  role?: UserRole;
  status?: UserStatus;
  department?: string;
}