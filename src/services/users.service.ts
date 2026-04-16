import { api } from '@/lib/api'
import type { User, CreateUserDto, UpdateUserDto } from '@/types'

export const usersService = {
    findAll(): Promise<User[]> {
        return api.get<User[]>('/users').then((r) => r.data)
    },

    create(dto: CreateUserDto): Promise<User> {
        return api.post<User>('/users', dto).then((r) => r.data)
    },

    update(id: number, dto: UpdateUserDto): Promise<User> {
        return api.patch<User>(`/users/${id}`, dto).then((r) => r.data)
    },

    remove(id: number): Promise<User> {
        return api.delete<User>(`/users/${id}`).then((r) => r.data)
    },
}