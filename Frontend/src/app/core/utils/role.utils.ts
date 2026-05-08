export function normalizeRole(role: string | number): 'Admin' | 'Manager' | 'User' {
  if (typeof role === 'string' && ['Admin', 'Manager', 'User'].includes(role)) {
    return role as 'Admin' | 'Manager' | 'User';
  }
  const map: Record<number, 'Admin' | 'Manager' | 'User'> = {
    0: 'Admin', 1: 'Manager', 2: 'User'
  };
  return map[role as number] ?? 'User';
}
 