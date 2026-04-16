import type { ClientStatus, LeadQualification, LeadOrigin } from './enums'

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  address: string | null
  status: ClientStatus
  qualification: LeadQualification
  origin: LeadOrigin | null
  notes: string | null
  createdAt: string
  updatedAt: string
  lastContactAt: string | null
  negotiationCount: number
}

export interface CreateClientDto {
  name: string
  email?: string
  phone?: string
  cpf?: string
  address?: string
  status: ClientStatus
  qualification: LeadQualification
  origin?: LeadOrigin
  notes?: string
}

export type UpdateClientDto = Partial<CreateClientDto>
