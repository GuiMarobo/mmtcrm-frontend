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
import { ordersService } from '@/services/orders.service'
import { clientsService } from '@/services/clients.service'
import { productsService } from '@/services/products.service'
import { usersService } from '@/services/users.service'
import { formatCurrency } from '@/lib/format-currency'
import { formatDate } from '@/lib/format-date'
import { OrderStatus, PaymentMethod } from '@/types'
import type { Order, Client, Product, User } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, ClipboardList, Pencil, Trash2, X } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [OrderStatus.PROCESSANDO]: { label: 'Processando', variant: 'blue' },
  [OrderStatus.CONCLUIDO]: { label: 'Concluído', variant: 'green' },
  [OrderStatus.AGUARDANDO_PAGAMENTO]: { label: 'Aguard. Pagamento', variant: 'yellow' },
  [OrderStatus.CANCELADO]: { label: 'Cancelado', variant: 'red' },
}

const paymentLabels: Record<string, string> = {
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.CARTAO_CREDITO]: 'Cartão de Crédito',
  [PaymentMethod.CARTAO_DEBITO]: 'Cartão de Débito',
  [PaymentMethod.BOLETO]: 'Boleto',
  [PaymentMethod.TRANSFERENCIA]: 'Transferência',
  [PaymentMethod.DINHEIRO]: 'Dinheiro',
}

interface OrderForm {
  clientId: string
  vendedorId: string
  status: OrderStatus
  paymentMethod: PaymentMethod | ''
  notes: string
  items: { productId: string; quantity: number; unitPrice: number }[]
}

const emptyForm: OrderForm = {
  clientId: '', vendedorId: '', status: OrderStatus.PROCESSANDO, paymentMethod: '',
  notes: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }],
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendedores, setVendedores] = useState<User[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    ordersService.findAll()
      .then(setOrders)
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

  const openEdit = useCallback((order: Order) => {
    setEditingId(order.id)
    setForm({
      clientId: order.clientId, vendedorId: order.vendedorId, status: order.status,
      paymentMethod: order.paymentMethod || '', notes: order.notes || '',
      items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
    })
    setDialogOpen(true)
  }, [])

  const calcTotal = (items: OrderForm['items']) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const handleProductChange = useCallback((index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    setForm((f) => {
      const items = [...f.items]
      items[index] = { ...items[index], productId, unitPrice: product?.price || 0 }
      return { ...f, items }
    })
  }, [products])

  const handleSave = useCallback(async () => {
    if (!form.clientId || !form.vendedorId || form.items.length === 0) return
    try {
      const dto = {
        clientId: form.clientId, vendedorId: form.vendedorId, status: form.status,
        paymentMethod: (form.paymentMethod as PaymentMethod) || undefined,
        totalValue: calcTotal(form.items),
        notes: form.notes || undefined,
        items: form.items.filter((i) => i.productId),
      }
      if (editingId) {
        const updated = await ordersService.update(editingId, dto)
        setOrders((prev) => prev.map((o) => o.id === editingId ? updated : o))
      } else {
        const created = await ordersService.create(dto)
        setOrders((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch {
      alert('Erro ao salvar pedido.')
    }
  }, [form, editingId])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await ordersService.remove(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } catch {
      alert('Erro ao excluir pedido.')
    }
    setDeleteConfirm(null)
  }, [])

  const columns: Column<Order>[] = [
    { header: 'Código', accessor: (row) => <span className="font-mono text-[13px] font-semibold text-[#0071E3]">{row.code}</span> },
    { header: 'Cliente', accessor: 'clientName', searchable: true, className: 'font-medium' },
    { header: 'Itens', accessor: (row) => <span className="text-[12px] text-[#6E6E73] line-clamp-1">{row.items.map((i) => i.productName).join(', ')}</span> },
    { header: 'Valor', accessor: (row) => <span className="font-semibold">{formatCurrency(row.totalValue)}</span> },
    { header: 'Pagamento', accessor: (row) => row.paymentMethod ? paymentLabels[row.paymentMethod] : '\u2014' },
    { header: 'Status', accessor: (row) => {
      const s = statusMap[row.status]
      return <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
    }},
    { header: 'Data', accessor: (row) => formatDate(row.createdAt) },
    { header: 'Ações', accessor: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#0071E3] transition-colors cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#FFEBEE] hover:text-[#FF3B30] transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    ), className: 'w-[80px]' },
  ]

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', options: Object.entries(statusMap).map(([k, v]) => ({ label: v.label, value: k })) },
  ]

  return (
    <div>
      <PageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedidos registrados`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Novo Pedido
          </Button>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-[#86868B]">Carregando pedidos...</p>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          filters={filters}
          searchPlaceholder="Buscar por cliente..."
          onRowClick={openEdit}
          emptyState={<EmptyState icon={ClipboardList} title="Nenhum pedido" description="Crie seu primeiro pedido de venda." actionLabel="Novo Pedido" onAction={openCreate} />}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Pedido' : 'Novo Pedido'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Cliente *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 && <SelectItem value="_empty" disabled>Nenhum cliente disponível</SelectItem>}
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Vendedor *</Label>
                <Select value={form.vendedorId} onValueChange={(v) => setForm((f) => ({ ...f, vendedorId: v }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {vendedores.length === 0 && <SelectItem value="_empty" disabled>Nenhum vendedor disponível</SelectItem>}
                    {vendedores.map((u) => <SelectItem key={String(u.id)} value={String(u.id)}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Forma de Pagamento</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{Object.entries(paymentLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium">Itens</Label>
                <button onClick={() => setForm((f) => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitPrice: 0 }] }))} className="text-[12px] font-medium text-[#0071E3] hover:text-[#0077ED] cursor-pointer">+ Adicionar item</button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-end gap-2 rounded-xl border border-[#D2D2D7]/60 bg-[#F5F5F7]/30 p-3">
                  <div className="flex-1 grid gap-1">
                    <Label className="text-[11px] text-[#86868B]">Produto</Label>
                    <Select value={item.productId} onValueChange={(v) => handleProductChange(idx, v)}>
                      <SelectTrigger className="rounded-lg bg-white cursor-pointer h-9 text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {products.length === 0 && <SelectItem value="_empty" disabled>Nenhum produto disponível</SelectItem>}
                        {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 grid gap-1">
                    <Label className="text-[11px] text-[#86868B]">Qtd</Label>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 1 }; return { ...f, items } })} className="rounded-lg h-9 text-[13px]" />
                  </div>
                  <div className="w-28 grid gap-1">
                    <Label className="text-[11px] text-[#86868B]">Preço</Label>
                    <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], unitPrice: parseFloat(e.target.value) || 0 }; return { ...f, items } })} className="rounded-lg h-9 text-[13px]" />
                  </div>
                  {form.items.length > 1 && (
                    <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} className="shrink-0 rounded-lg p-1.5 text-[#A1A1A6] hover:text-[#FF3B30] cursor-pointer"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <p className="text-[14px] font-semibold text-[#1D1D1F]">Total: {formatCurrency(calcTotal(form.items))}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Observações do pedido..." rows={2} className="rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.clientId || !form.vendedorId} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Criar Pedido'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir este pedido?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
