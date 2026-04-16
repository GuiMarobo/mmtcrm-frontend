import type { DeviceCondition } from './enums'

export interface UsedDevice {
  id: string
  deviceName: string
  brand: string
  model: string | null
  storage: string | null
  color: string | null
  serialNumber: string | null
  condition: DeviceCondition
  estimatedValue: number
  technicalNotes: string | null
  evaluatedById: string | null
  evaluatedByName: string | null
  evaluatedAt: string | null
  negotiationId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUsedDeviceDto {
  deviceName: string
  brand: string
  condition: DeviceCondition
  estimatedValue: number
  model?: string
  storage?: string
  color?: string
  serialNumber?: string
  technicalNotes?: string
}

export type UpdateUsedDeviceDto = Partial<CreateUsedDeviceDto>
