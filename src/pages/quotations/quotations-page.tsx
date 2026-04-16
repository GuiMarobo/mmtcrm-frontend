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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { quotationsService } from '@/services/quotations.service'
import { clientsService } from '@/services/clients.service'
import { productsService } from '@/services/products.service'
import { usersService } from '@/services/users.service'
import { formatCurrency } from '@/lib/format-currency'
import { QuotationStatus } from '@/types'
import type { Quotation, Client, Product, User } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, Calculator, Pencil, Trash2, X } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [QuotationStatus.RASCUNHO]: { label: 'Rascunho', variant: 'gray' },
  [QuotationStatus.EMITIDO]: { label: 'Emitido', variant: 'blue' },
  [QuotationStatus.APROVADO]: { label: 'Aprovado', variant: 'green' },
  [QuotationStatus.RECUSADO]: { label: 'Recusado', variant: 'red' },
  [QuotationStatus.EXPIRADO]: { label: 'Expirado', variant: 'orange' },
}

interface SimulatorState {
  items: { productId: string; quantity: number; unitPrice: number }[]
  usedDeviceValue: number
  downPayment: number
  installments: number
  interestRate: number
}

const defaultSimulator: SimulatorState = {
  items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  usedDeviceValue: 0, downPayment: 0, installments: 1, interestRate: 0,
}

function calculateQuotation(sim: SimulatorState) {
  const subtotal = sim.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
  const totalValue = subtotal
  const remainingBalance = totalValue - sim.usedDeviceValue - sim.downPayment
  const balance = Math.max(0, remainingBalance)
  let installmentValue = 0
  if (sim.installments > 0) {
    if (sim.interestRate > 0) {
      const r = sim.interestRate / 100
      installmentValue = balance * (r * Math.pow(1 + r, sim.installments)) / (Math.pow(1 + r, sim.installments) - 1)
    } else {
      installmentValue = balance / sim.installments
    }
  }
  return { subtotal, usedDeviceDiscount: sim.usedDeviceValue, downPayment: sim.downPayment, totalValue, remainingBalance: balance, installments: sim.installments, installmentValue: Math.round(installmentValue * 100) / 100, interestRate: sim.interestRate }
}

interface QuotForm {
  clientId: string
  vendedorId: string
  status: QuotationStatus
  notes: string
  simulator: SimulatorState
}

const emptyForm: QuotForm = {
  clientId: '', vendedorId: '', status: QuotationStatus.RASCUNHO, notes: '', simulator: { ...defaultSimulator },
}

export function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendedores, setVendedores] = useState<User[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuotForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  // Standalone simulator state
  const [simulator, setSimulator] = useState<SimulatorState>({ ...defaultSimulator })
  const simResult = useMemo(() => calculateQuotation(simulator), [simulator])

  useEffect(() => {
    quotationsService.findAll()
      .then(setQuotations)
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

  const openEdit = useCallback((quot: Quotation) => {
    setEditingId(quot.id)
    setForm({
      clientId: quot.clientId, vendedorId: quot.vendedorId, status: quot.status,
      notes: quot.notes || '',
      simulator: {
        items: quot.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
        usedDeviceValue: quot.usedDeviceDiscount, downPayment: quot.downPayment,
        installments: quot.installments, interestRate: quot.interestRate,
      },
    })
    setDialogOpen(true)
  }, [])

  const formResult = useMemo(() => calculateQuotation(form.simulator), [form.simulator])

  const handleSave = useCallback(async () => {
    if (!form.clientId || !form.vendedorId) return
    try {
      const result = formResult
      const dto = {
        clientId: form.clientId, vendedorId: form.vendedorId,
        status: form.status, notes: form.notes || undefined,
        items: form.simulator.items.filter((i) => i.productId),
        subtotal: result.subtotal,
        totalValue: result.totalValue,
        usedDeviceDiscount: result.usedDeviceDiscount,
        downPayment: result.downPayment,
        remainingBalance: result.remainingBalance,
        installments: result.installments,
        installmentValue: result.installmentValue,
        interestRate: result.interestRate,
      }
      if (editingId) {
        const updated = await quotationsService.update(editingId, dto)
        setQuotations((prev) => prev.map((q) => q.id === editingId ? updated : q))
      } else {
        const created = await quotationsService.create(dto)
        setQuotations((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch {
      alert('Erro ao salvar orçamento.')
    }
  }, [form, editingId, formResult])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await quotationsService.remove(id)
      setQuotations((prev) => prev.filter((q) => q.id !== id))
    } catch {
      alert('Erro ao excluir orçamento.')
    }
    setDeleteConfirm(null)
  }, [])

  const handleSimProductChange = useCallback((index: number, productId: string, target: 'simulator' | 'form') => {
    const product = products.find((p) => p.id === productId)
    if (target === 'simulator') {
      setSimulator((s) => {
        const items = [...s.items]
        items[index] = { ...items[index], productId, unitPrice: product?.price || 0 }
        return { ...s, items }
      })
    } else {
      setForm((f) => {
        const items = [...f.simulator.items]
        items[index] = { ...items[index], productId, unitPrice: product?.price || 0 }
        return { ...f, simulator: { ...f.simulator, items } }
      })
    }
  }, [products])

  const columns: Column<Quotation>[] = [
    { header: 'Código', accessor: (row) => <span className="font-mono text-[13px] font-semibold text-[#0071E3]">{row.code}</span> },
    { header: 'Cliente', accessor: 'clientName', searchable: true, className: 'font-medium' },
    { header: 'Itens', accessor: (row) => <span className="text-[12px] text-[#6E6E73]">{row.items.map((i) => i.productName).join(', ')}</span> },
    { header: 'Subtotal', accessor: (row) => formatCurrency(row.subtotal) },
    { header: 'Desconto', accessor: (row) => row.usedDeviceDiscount > 0 ? <span className="text-[#28A745]">-{formatCurrency(row.usedDeviceDiscount)}</span> : '\u2014' },
    { header: 'Parcelas', accessor: (row) => `${row.installments}x ${formatCurrency(row.installmentValue)}` },
    { header: 'Status', accessor: (row) => {
      const s = statusMap[row.status]
      return <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
    }},
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

  function renderItemsEditor(items: SimulatorState['items'], target: 'simulator' | 'form') {
    const updateItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
      const setter = target === 'simulator' ? setSimulator : (fn: (s: SimulatorState) => SimulatorState) => setForm((f) => ({ ...f, simulator: fn(f.simulator) }))
      setter((s: SimulatorState) => { const newItems = [...s.items]; newItems[index] = { ...newItems[index], [field]: value }; return { ...s, items: newItems } })
    }
    const addItem = () => {
      const setter = target === 'simulator' ? setSimulator : (fn: (s: SimulatorState) => SimulatorState) => setForm((f) => ({ ...f, simulator: fn(f.simulator) }))
      setter((s: SimulatorState) => ({ ...s, items: [...s.items, { productId: '', quantity: 1, unitPrice: 0 }] }))
    }
    const removeItem = (index: number) => {
      const setter = target === 'simulator' ? setSimulator : (fn: (s: SimulatorState) => SimulatorState) => setForm((f) => ({ ...f, simulator: fn(f.simulator) }))
      setter((s: SimulatorState) => ({ ...s, items: s.items.filter((_, i) => i !== index) }))
    }

    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-medium">Produtos</Label>
          <button onClick={addItem} className="text-[12px] font-medium text-[#0071E3] hover:text-[#0077ED] cursor-pointer">+ Adicionar</button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-end gap-2 rounded-xl border border-[#D2D2D7]/60 bg-[#F5F5F7]/30 p-3">
            <div className="flex-1 grid gap-1">
              <Label className="text-[11px] text-[#86868B]">Produto</Label>
              <Select value={item.productId} onValueChange={(v) => handleSimProductChange(idx, v, target)}>
                <SelectTrigger className="rounded-lg bg-white cursor-pointer h-9 text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {products.length === 0 && <SelectItem value="_empty" disabled>Nenhum produto disponível</SelectItem>}
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-16 grid gap-1">
              <Label className="text-[11px] text-[#86868B]">Qtd</Label>
              <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="rounded-lg h-9 text-[13px]" />
            </div>
            <div className="w-28 grid gap-1">
              <Label className="text-[11px] text-[#86868B]">Preço</Label>
              <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="rounded-lg h-9 text-[13px]" />
            </div>
            {items.length > 1 && (
              <button onClick={() => removeItem(idx)} className="shrink-0 rounded-lg p-1.5 text-[#A1A1A6] hover:text-[#FF3B30] cursor-pointer"><X className="h-4 w-4" /></button>
            )}
          </div>
        ))}
      </div>
    )
  }

  function renderFinancials(sim: SimulatorState, target: 'simulator' | 'form') {
    const setter = target === 'simulator'
      ? (fn: (s: SimulatorState) => SimulatorState) => setSimulator(fn)
      : (fn: (s: SimulatorState) => SimulatorState) => setForm((f) => ({ ...f, simulator: fn(f.simulator) }))
    const result = target === 'simulator' ? simResult : formResult

    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-[13px] font-medium">Desconto Dispositivo Usado (R$)</Label>
            <Input type="number" min={0} step={0.01} value={sim.usedDeviceValue || ''} onChange={(e) => setter((s) => ({ ...s, usedDeviceValue: parseFloat(e.target.value) || 0 }))} placeholder="0,00" className="rounded-lg" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px] font-medium">Entrada (R$)</Label>
            <Input type="number" min={0} step={0.01} value={sim.downPayment || ''} onChange={(e) => setter((s) => ({ ...s, downPayment: parseFloat(e.target.value) || 0 }))} placeholder="0,00" className="rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="text-[13px] font-medium">Parcelas</Label>
            <Select value={String(sim.installments)} onValueChange={(v) => setter((s) => ({ ...s, installments: parseInt(v) }))}>
              <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px] font-medium">Taxa de Juros (% a.m.)</Label>
            <Input type="number" min={0} step={0.01} value={sim.interestRate || ''} onChange={(e) => setter((s) => ({ ...s, interestRate: parseFloat(e.target.value) || 0 }))} placeholder="0" className="rounded-lg" />
          </div>
        </div>

        {/* Result Card */}
        <div className="rounded-xl border-2 border-[#0071E3]/20 bg-[#EBF5FF]/30 p-4 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6E6E73]">Subtotal</span>
            <span className="font-medium text-[#1D1D1F]">{formatCurrency(result.subtotal)}</span>
          </div>
          {result.usedDeviceDiscount > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6E6E73]">Desconto dispositivo</span>
              <span className="font-medium text-[#28A745]">-{formatCurrency(result.usedDeviceDiscount)}</span>
            </div>
          )}
          {result.downPayment > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6E6E73]">Entrada</span>
              <span className="font-medium text-[#1D1D1F]">-{formatCurrency(result.downPayment)}</span>
            </div>
          )}
          <div className="border-t border-[#0071E3]/10 pt-2 mt-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6E6E73]">Saldo restante</span>
              <span className="font-semibold text-[#1D1D1F]">{formatCurrency(result.remainingBalance)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#0071E3]/10 px-3 py-2 mt-1">
            <span className="text-[13px] font-medium text-[#0071E3]">{result.installments}x de</span>
            <span className="text-[18px] font-bold text-[#0071E3]">{formatCurrency(result.installmentValue)}</span>
          </div>
          {result.interestRate > 0 && (
            <p className="text-[11px] text-[#86868B] text-center">Juros de {result.interestRate}% a.m. aplicados (Price)</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle={`${quotations.length} orçamentos criados`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Novo Orçamento
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#F5F5F7] rounded-xl p-1 h-auto">
          <TabsTrigger value="list" className="rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer px-4 py-2">Lista de Orçamentos</TabsTrigger>
          <TabsTrigger value="simulator" className="rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer px-4 py-2">
            <Calculator className="h-4 w-4 mr-1.5" />Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {loading ? (
            <p className="py-10 text-center text-sm text-[#86868B]">Carregando orçamentos...</p>
          ) : (
            <DataTable
              columns={columns}
              data={quotations}
              filters={filters}
              searchPlaceholder="Buscar por cliente..."
              onRowClick={openEdit}
              emptyState={<EmptyState icon={Calculator} title="Nenhum orçamento" description="Crie seu primeiro orçamento ou use o simulador." actionLabel="Novo Orçamento" onAction={openCreate} />}
            />
          )}
        </TabsContent>

        <TabsContent value="simulator">
          <div className="rounded-2xl border border-[#D2D2D7]/40 bg-white p-6">
            <h3 className="text-[15px] font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#0071E3]" />
              Simulador de Orçamento
            </h3>
            <div className="grid lg:grid-cols-2 gap-6">
              <div>{renderItemsEditor(simulator.items, 'simulator')}</div>
              <div>{renderFinancials(simulator, 'simulator')}</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Orçamento' : 'Novo Orçamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-4">
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
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as QuotationStatus }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {renderItemsEditor(form.simulator.items, 'form')}
            {renderFinancials(form.simulator, 'form')}
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Observações do orçamento..." rows={2} className="rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.clientId || !form.vendedorId} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Criar Orçamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir este orçamento?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
