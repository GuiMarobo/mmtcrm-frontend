import type { Role, UserStatus } from './enums'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: Role
  status: UserStatus
}

export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
  role?: Role
  status?: UserStatus
}
