// core/models/auth-response.ts

export interface AuthResponseDto {
  token: string;
  userId: string;
  email: string;

  // ✅ ajoutés pour éviter les incohérences
  username?: string;
  role: 'User' | 'Manager' | 'Admin';

  // ✅ optionnel selon backend
  expiresAt?: string;
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

  // ✅ cohérence des rôles partout
  role: 'User' | 'Manager' | 'Admin';

  createdAt: string;

  // ✅ utile pour UI/navbar/chat/etc
  username?: string;
}

export interface UpdateUserRoleRequest {
  role: 'User' | 'Manager' | 'Admin';
} 
