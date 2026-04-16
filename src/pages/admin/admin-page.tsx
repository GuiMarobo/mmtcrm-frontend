import { useState, useCallback, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usersService } from '@/services/users.service'
import { formatDate } from '@/lib/format-date'
import { Role, UserStatus } from '@/types'
import type { User, CreateUserDto, UpdateUserDto } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, Settings, Pencil, Trash2 } from 'lucide-react'

const roleMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [Role.ADMIN]: { label: 'Administrador', variant: 'purple' },
  [Role.VENDEDOR]: { label: 'Vendedor', variant: 'blue' },
  [Role.ATENDENTE]: { label: 'Atendente', variant: 'green' },
  [Role.TECNICO]: { label: 'Técnico', variant: 'orange' },
}

const statusColors: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [UserStatus.ATIVO]: { label: 'Ativo', variant: 'green' },
  [UserStatus.INATIVO]: { label: 'Inativo', variant: 'gray' },
}

const emptyForm: CreateUserDto = {
  name: '', email: '', password: '', role: Role.VENDEDOR, status: UserStatus.ATIVO,
}

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateUserDto>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    usersService.findAll()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((user: User) => {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, status: user.status })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
  if (!form.name.trim() || !form.email.trim()) return
  try {
    if (editingId) {
      const dto: UpdateUserDto = { name: form.name, email: form.email, role: form.role, status: form.status }
      if (form.password) dto.password = form.password
      const updated = await usersService.update(editingId, dto)
      setUsers((prev) => prev.map((u) => u.id === editingId ? updated : u))
    } else {
      if (!form.password) return
      const created = await usersService.create(form)
      setUsers((prev) => [created, ...prev])
    }
    setDialogOpen(false)
  } catch (err: any) {
    const msg = err?.response?.data?.message
    if (msg === 'E-mail already exists') alert('E-mail já está em uso.')
    else alert('Erro ao salvar usuário.')
  }
}, [form, editingId])


  const handleDelete = useCallback(async (id: number) => {
    try {
      await usersService.remove(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert('Erro ao excluir usuário.')
    }
    setDeleteConfirm(null)
  }, [])

  const columns: Column<User>[] = [
    { header: 'Nome', accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #0071E3, #00C7BE)' }}>
          {row.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-[#1D1D1F]">{row.name}</p>
          <p className="text-[11px] text-[#86868B]">{row.email}</p>
        </div>
      </div>
    ), searchable: false },
    { header: 'Email', accessor: 'email', searchable: true, className: 'hidden' },
    { header: 'NomeBusca', accessor: 'name', searchable: true, className: 'hidden' },
    { header: 'Função', accessor: (row) => {
      const r = roleMap[row.role]
      return <StatusBadge variant={r.variant}>{r.label}</StatusBadge>
    }},
    { header: 'Status', accessor: (row) => {
      const s = statusColors[row.status]
      return <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
    }},
    { header: 'Criado em', accessor: (row) => formatDate(row.createdAt) },
    { header: 'Ações', accessor: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#0071E3] transition-colors cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#FFEBEE] hover:text-[#FF3B30] transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    ), className: 'w-[80px]' },
  ]

  const filters: FilterConfig[] = [
    { key: 'role', label: 'Função', options: Object.entries(roleMap).map(([k, v]) => ({ label: v.label, value: k })) },
    { key: 'status', label: 'Status', options: [
      { label: 'Ativo', value: UserStatus.ATIVO },
      { label: 'Inativo', value: UserStatus.INATIVO },
    ]},
  ]

  return (
    <div>
      <PageHeader
        title="Administração"
        subtitle={`${users.length} usuários no sistema`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Novo Usuário
          </Button>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-[#86868B]">Carregando usuários...</p>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          filters={filters}
          searchPlaceholder="Buscar por nome ou e-mail..."
          onRowClick={openEdit}
          emptyState={<EmptyState icon={Settings} title="Nenhum usuário" description="Adicione o primeiro usuário ao sistema." actionLabel="Novo Usuário" onAction={openCreate} />}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@mmt.com" className="rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">{editingId ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={editingId ? 'Manter senha atual' : 'Senha do usuário'} className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Função</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(roleMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as UserStatus }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserStatus.ATIVO}>Ativo</SelectItem>
                    <SelectItem value={UserStatus.INATIVO}>Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.email.trim() || (!editingId && !form.password)} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir este usuário?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
