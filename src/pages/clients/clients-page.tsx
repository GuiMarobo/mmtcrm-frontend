import { useState, useCallback, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientsService } from '@/services/clients.service'
import { getRelativeTime } from '@/lib/format-date'
import { ClientStatus, LeadQualification, LeadOrigin } from '@/types'
import type { Client, CreateClientDto } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [ClientStatus.LEAD]: { label: 'Lead', variant: 'purple' },
  [ClientStatus.ATIVO]: { label: 'Ativo', variant: 'green' },
  [ClientStatus.INATIVO]: { label: 'Inativo', variant: 'gray' },
}

const qualificationMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [LeadQualification.NAO_QUALIFICADO]: { label: 'Não Qualificado', variant: 'gray' },
  [LeadQualification.QUALIFICADO]: { label: 'Qualificado', variant: 'green' },
  [LeadQualification.ALTA_INTENCAO]: { label: 'Alta Intenção', variant: 'blue' },
}

const originLabels: Record<string, string> = {
  [LeadOrigin.WHATSAPP]: 'WhatsApp',
  [LeadOrigin.INSTAGRAM]: 'Instagram',
  [LeadOrigin.SITE]: 'Site',
  [LeadOrigin.INDICACAO]: 'Indicação',
  [LeadOrigin.OUTRO]: 'Outro',
}

const emptyForm: CreateClientDto = {
  name: '', email: '', phone: '', cpf: '', address: '',
  status: ClientStatus.LEAD, qualification: LeadQualification.NAO_QUALIFICADO,
  origin: LeadOrigin.WHATSAPP, notes: '',
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateClientDto>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    clientsService.findAll()
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((client: Client) => {
    setEditingId(client.id)
    setForm({
      name: client.name, email: client.email || '', phone: client.phone || '',
      cpf: client.cpf || '', address: client.address || '',
      status: client.status, qualification: client.qualification,
      origin: client.origin || LeadOrigin.OUTRO, notes: client.notes || '',
    })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return
    try {
      if (editingId) {
        const updated = await clientsService.update(editingId, form)
        setClients((prev) => prev.map((c) => c.id === editingId ? updated : c))
      } else {
        const created = await clientsService.create(form)
        setClients((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch {
      alert('Erro ao salvar cliente.')
    }
  }, [form, editingId])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await clientsService.remove(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('Erro ao excluir cliente.')
    }
    setDeleteConfirm(null)
  }, [])

  const columns: Column<Client>[] = [
    { header: 'Nome', accessor: 'name', searchable: true, className: 'font-medium' },
    { header: 'E-mail', accessor: (row) => row.email || '\u2014', searchable: true },
    { header: 'Telefone', accessor: (row) => row.phone || '\u2014' },
    { header: 'Status', accessor: (row) => {
      const s = statusMap[row.status]
      return <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
    }},
    { header: 'Qualificação', accessor: (row) => {
      const q = qualificationMap[row.qualification]
      return <StatusBadge variant={q.variant}>{q.label}</StatusBadge>
    }},
    { header: 'Origem', accessor: (row) => row.origin ? originLabels[row.origin] || row.origin : '\u2014' },
    { header: 'Último Contato', accessor: (row) => row.lastContactAt ? getRelativeTime(row.lastContactAt) : '\u2014' },
    { header: 'Ações', accessor: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#0071E3] transition-colors cursor-pointer">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#FFEBEE] hover:text-[#FF3B30] transition-colors cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    ), className: 'w-[80px]' },
  ]

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { label: 'Lead', value: ClientStatus.LEAD },
      { label: 'Ativo', value: ClientStatus.ATIVO },
      { label: 'Inativo', value: ClientStatus.INATIVO },
    ]},
    { key: 'qualification', label: 'Qualificação', options: [
      { label: 'Não Qualificado', value: LeadQualification.NAO_QUALIFICADO },
      { label: 'Qualificado', value: LeadQualification.QUALIFICADO },
      { label: 'Alta Intenção', value: LeadQualification.ALTA_INTENCAO },
    ]},
  ]

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes cadastrados`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Novo Cliente
          </Button>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-[#86868B]">Carregando clientes...</p>
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          filters={filters}
          searchPlaceholder="Buscar por nome ou e-mail..."
          onRowClick={openEdit}
          emptyState={<EmptyState icon={Users} title="Nenhum cliente" description="Comece adicionando seu primeiro cliente ao sistema." actionLabel="Novo Cliente" onAction={openCreate} />}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">E-mail</Label>
                <Input type="email" value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Telefone</Label>
                <Input value={form.phone || ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" className="rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">CPF</Label>
                <Input value={form.cpf || ''} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Origem</Label>
                <Select value={form.origin || ''} onValueChange={(v) => setForm((f) => ({ ...f, origin: v as LeadOrigin }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(originLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Endereço</Label>
              <Input value={form.address || ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Rua, número - Cidade/UF" className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClientStatus.LEAD}>Lead</SelectItem>
                    <SelectItem value={ClientStatus.ATIVO}>Ativo</SelectItem>
                    <SelectItem value={ClientStatus.INATIVO}>Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Qualificação</Label>
                <Select value={form.qualification} onValueChange={(v) => setForm((f) => ({ ...f, qualification: v as LeadQualification }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LeadQualification.NAO_QUALIFICADO}>Não Qualificado</SelectItem>
                    <SelectItem value={LeadQualification.QUALIFICADO}>Qualificado</SelectItem>
                    <SelectItem value={LeadQualification.ALTA_INTENCAO}>Alta Intenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Observações</Label>
              <Textarea value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anotações sobre o cliente..." rows={3} className="rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
