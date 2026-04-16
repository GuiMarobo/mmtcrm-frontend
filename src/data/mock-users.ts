import { Role, UserStatus } from '@/types'
import type { User } from '@/types'

export const mockUsers: User[] = [
  { id: 'usr-001', name: 'Thiago Martins', email: 'admin@mmt.com', role: Role.ADMIN, status: UserStatus.ATIVO, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { id: 'usr-002', name: 'Lucas Oliveira', email: 'vendedor@mmt.com', role: Role.VENDEDOR, status: UserStatus.ATIVO, createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z' },
  { id: 'usr-003', name: 'Mariana Costa', email: 'atendente@mmt.com', role: Role.ATENDENTE, status: UserStatus.ATIVO, createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z' },
  { id: 'usr-004', name: 'Rafael Santos', email: 'tecnico@mmt.com', role: Role.TECNICO, status: UserStatus.ATIVO, createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z' },
  { id: 'usr-005', name: 'Fernanda Lima', email: 'fernanda@mmt.com', role: Role.VENDEDOR, status: UserStatus.INATIVO, createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z' },
]

export const mockPasswords: Record<string, string> = {
  'admin@mmt.com': '123456',
  'vendedor@mmt.com': '123456',
  'atendente@mmt.com': '123456',
  'tecnico@mmt.com': '123456',
}
