export interface AuthResponseDto {
  token: string;    
  userId: string;    
  email: string;
  role: string;      
}


export interface LoginRequestDto {
  email: string;
  password: string;
}


export interface RegisterRequestDto {
  email: string;
  password: string;
  role: 'User' | 'Manager' | 'Admin';
}

export interface UserDto {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}


export interface UpdateUserRoleRequest {
  role: 'User' | 'Manager' | 'Admin';
}