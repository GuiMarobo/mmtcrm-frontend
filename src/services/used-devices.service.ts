import { api } from '@/lib/api'
import type { UsedDevice, CreateUsedDeviceDto, UpdateUsedDeviceDto } from '@/types'

export const usedDevicesService = {
  findAll(): Promise<UsedDevice[]> {
    return api.get<UsedDevice[]>('/used-devices').then((r) => r.data)
  },
  create(dto: CreateUsedDeviceDto): Promise<UsedDevice> {
    return api.post<UsedDevice>('/used-devices', dto).then((r) => r.data)
  },
  update(id: string, dto: UpdateUsedDeviceDto): Promise<UsedDevice> {
    return api.patch<UsedDevice>(`/used-devices/${id}`, dto).then((r) => r.data)
  },
  remove(id: string): Promise<UsedDevice> {
    return api.delete<UsedDevice>(`/used-devices/${id}`).then((r) => r.data)
  },
}
