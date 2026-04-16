import { useState, useCallback, useMemo, useEffect } from 'react'
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
import { negotiationsService } from '@/services/negotiations.service'
import { clientsService } from '@/services/clients.service'
import { productsService } from '@/services/products.service'
import { usersService } from '@/services/users.service'
import { formatCurrency } from '@/lib/format-currency'
import { getRelativeTime } from '@/lib/format-date'
import { NegotiationStatus } from '@/types'
import type { Negotiation, NegotiationItem, Client, Product, User } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, Handshake, Pencil, Trash2, X } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [NegotiationStatus.EM_ANDAMENTO]: { label: 'Em Andamento', variant: 'blue' },
  [NegotiationStatus.AGUARDANDO_AVALIACAO]: { label: 'Aguard. Avaliação', variant: 'yellow' },
  [NegotiationStatus.ORCAMENTO_ENVIADO]: { label: 'Orçamento Enviado', variant: 'purple' },
  [NegotiationStatus.CONCLUIDA]: { label: 'Concluída', variant: 'green' },
  [NegotiationStatus.CANCELADA]: { label: 'Cancelada', variant: 'red' },
}

interface NegForm {
  clientId: string
  vendedorId: string
  status: NegotiationStatus
  notes: string
  items: { productId: string; quantity: number; unitPrice: number }[]
}

const emptyForm: NegForm = {
  clientId: '', vendedorId: '', status: NegotiationStatus.EM_ANDAMENTO, notes: '',
  items: [{ productId: '', quantity: 1, unitPrice: 0 }],
}

export function NegotiationsPage() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendedores, setVendedores] = useState<User[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<NegForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    negotiationsService.findAll()
      .then(setNegotiations)
      .catch(() => {})
      .finally(() => setLoading(false))
    clientsService.findAll().then(setClients).catch(() => {})
    productsService.findAll().then(setProducts).catch(() => {})
    usersService.findAll()
      .then((users) => setVendedores(users.filter((u) => u.role === 'VENDEDOR' || u.role === 'ADMIN')))
      .catch(() => {})
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((neg: Negotiation) => {
    setEditingId(neg.id)
    setForm({
      clientId: neg.clientId, vendedorId: neg.vendedorId, status: neg.status,
      notes: neg.notes || '',
      items: neg.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
    })
    setDialogOpen(true)
  }, [])

  const calcTotal = useCallback((items: NegForm['items']) => {
    return items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)
  }, [])

  const handleProductChange = useCallback((index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    setForm((f) => {
      const items = [...f.items]
      items[index] = { ...items[index], productId, unitPrice: product?.price || 0 }
      return { ...f, items }
    })
  }, [products])

  const addItem = useCallback(() => {
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitPrice: 0 }] }))
  }, [])

  const removeItem = useCallback((index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.clientId || !form.vendedorId || form.items.length === 0) return
    try {
      const dto = {
        clientId: form.clientId, vendedorId: form.vendedorId,
        status: form.status, notes: form.notes || undefined,
        totalValue: calcTotal(form.items),
        items: form.items.filter((i) => i.productId),
      }
      if (editingId) {
        const updated = await negotiationsService.update(editingId, dto)
        setNegotiations((prev) => prev.map((n) => n.id === editingId ? updated : n))
      } else {
        const created = await negotiationsService.create(dto)
        setNegotiations((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch {
      alert('Erro ao salvar negociação.')
    }
  }, [form, editingId, calcTotal])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await negotiationsService.remove(id)
      setNegotiations((prev) => prev.filter((n) => n.id !== id))
    } catch {
      alert('Erro ao excluir negociação.')
    }
    setDeleteConfirm(null)
  }, [])

  const columns: Column<Negotiation>[] = [
    { header: 'Cliente', accessor: 'clientName', searchable: true, className: 'font-medium' },
    { header: 'Vendedor', accessor: 'vendedorName' },
    { header: 'Produtos', accessor: (row) => (
      <span className="text-[12px] text-[#6E6E73] line-clamp-1">{row.items.map((i) => i.productName).join(', ')}</span>
    )},
    { header: 'Valor', accessor: (row) => (
      <span className="font-semibold text-[#1D1D1F]">{row.totalValue ? formatCurrency(row.totalValue) : '\u2014'}</span>
    )},
    { header: 'Status', accessor: (row) => {
      const s = statusMap[row.status]
      return <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
    }},
    { header: 'Atualizado', accessor: (row) => getRelativeTime(row.updatedAt) },
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
    { key: 'status', label: 'Status', options: Object.entries(statusMap).map(([k, v]) => ({ label: v.label, value: k })) },
  ]

  return (
    <div>
      <PageHeader
        title="Negociações"
        subtitle={`${negotiations.length} negociações registradas`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Nova Negociação
          </Button>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-[#86868B]">Carregando negociações...</p>
      ) : (
        <DataTable
          columns={columns}
          data={negotiations}
          filters={filters}
          searchPlaceholder="Buscar por cliente..."
          onRowClick={openEdit}
          emptyState={<EmptyState icon={Handshake} title="Nenhuma negociação" description="Inicie uma nova negociação com um cliente." actionLabel="Nova Negociação" onAction={openCreate} />}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Negociação' : 'Nova Negociação'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Cliente *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 && <SelectItem value="_empty" disabled>Nenhum cliente disponível</SelectItem>}
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Vendedor *</Label>
                <Select value={form.vendedorId} onValueChange={(v) => setForm((f) => ({ ...f, vendedorId: v }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue placeholder="Selecione o vendedor" /></SelectTrigger>
                  <SelectContent>
                    {vendedores.length === 0 && <SelectItem value="_empty" disabled>Nenhum vendedor disponível</SelectItem>}
                    {vendedores.map((u) => <SelectItem key={String(u.id)} value={String(u.id)}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as NegotiationStatus }))}>
                <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium">Itens</Label>
                <button onClick={addItem} className="text-[12px] font-medium text-[#0071E3] hover:text-[#0077ED] transition-colors cursor-pointer">
                  + Adicionar item
                </button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-end gap-3 rounded-xl border border-[#D2D2D7]/60 bg-[#F5F5F7]/30 p-3">
                  <div className="flex-1 grid gap-1.5">
                    <Label className="text-[11px] text-[#86868B]">Produto</Label>
                    <Select value={item.productId} onValueChange={(v) => handleProductChange(idx, v)}>
                      <SelectTrigger className="rounded-lg bg-white cursor-pointer h-9 text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {products.length === 0 && <SelectItem value="_empty" disabled>Nenhum produto disponível</SelectItem>}
                        {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 grid gap-1.5">
                    <Label className="text-[11px] text-[#86868B]">Qtd</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 1 }; return { ...f, items } })} className="rounded-lg h-9 text-[13px]" />
                  </div>
                  <div className="w-32 grid gap-1.5">
                    <Label className="text-[11px] text-[#86868B]">Preço Unit.</Label>
                    <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], unitPrice: parseFloat(e.target.value) || 0 }; return { ...f, items } })} className="rounded-lg h-9 text-[13px]" />
                  </div>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="shrink-0 rounded-lg p-1.5 text-[#A1A1A6] hover:bg-[#FFEBEE] hover:text-[#FF3B30] transition-colors cursor-pointer mb-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <p className="text-[14px] font-semibold text-[#1D1D1F]">Total: {formatCurrency(calcTotal(form.items))}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Detalhes da negociação..." rows={3} className="rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.clientId || !form.vendedorId} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Criar Negociação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
