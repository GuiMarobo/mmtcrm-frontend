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
import { productsService } from '@/services/products.service'
import { formatCurrency } from '@/lib/format-currency'
import { ProductCategory, ProductStatus } from '@/types'
import type { Product, CreateProductDto } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, Package, Pencil, Trash2 } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [ProductStatus.DISPONIVEL]: { label: 'Disponível', variant: 'green' },
  [ProductStatus.INDISPONIVEL]: { label: 'Indisponível', variant: 'red' },
  [ProductStatus.DESCONTINUADO]: { label: 'Descontinuado', variant: 'gray' },
}

const categoryLabels: Record<string, string> = {
  [ProductCategory.IPHONE]: 'iPhone',
  [ProductCategory.MACBOOK]: 'MacBook',
  [ProductCategory.IPAD]: 'iPad',
  [ProductCategory.WATCH]: 'Apple Watch',
  [ProductCategory.AIRPODS]: 'AirPods',
  [ProductCategory.ACESSORIO]: 'Acessório',
  [ProductCategory.SERVICO]: 'Serviço',
}

const emptyForm: CreateProductDto = {
  name: '', category: ProductCategory.IPHONE, brand: 'Apple', model: '',
  storage: '', color: '', price: 0, stock: 0, status: ProductStatus.DISPONIVEL, description: '',
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateProductDto>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    productsService.findAll()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name, category: product.category, brand: product.brand,
      model: product.model || '', storage: product.storage || '', color: product.color || '',
      price: product.price, stock: product.stock, status: product.status,
      description: product.description || '',
    })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return
    try {
      if (editingId) {
        const updated = await productsService.update(editingId, form)
        setProducts((prev) => prev.map((p) => p.id === editingId ? updated : p))
      } else {
        const created = await productsService.create(form)
        setProducts((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch {
      alert('Erro ao salvar produto.')
    }
  }, [form, editingId])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await productsService.remove(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('Erro ao excluir produto.')
    }
    setDeleteConfirm(null)
  }, [])

  const columns: Column<Product>[] = [
    { header: 'Produto', accessor: (row) => (
      <div>
        <p className="font-medium text-[#1D1D1F]">{row.name}</p>
        <p className="text-[11px] text-[#86868B]">{row.model || ''} {row.color ? `· ${row.color}` : ''}</p>
      </div>
    ), searchable: false },
    { header: 'Nome', accessor: 'name', searchable: true, className: 'hidden' },
    { header: 'Categoria', accessor: (row) => (
      <span className="text-[13px]">{categoryLabels[row.category]}</span>
    )},
    { header: 'Preço', accessor: (row) => (
      <span className="font-semibold text-[#1D1D1F]">{formatCurrency(row.price)}</span>
    )},
    { header: 'Estoque', accessor: (row) => (
      <span className={row.stock <= 2 ? 'font-semibold text-[#FF3B30]' : 'text-[#1D1D1F]'}>
        {row.stock}
      </span>
    )},
    { header: 'Status', accessor: (row) => {
      const s = statusMap[row.status]
      return <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
    }},
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
    { key: 'category', label: 'Categoria', options: Object.entries(categoryLabels).map(([k, v]) => ({ label: v, value: k })) },
    { key: 'status', label: 'Status', options: [
      { label: 'Disponível', value: ProductStatus.DISPONIVEL },
      { label: 'Indisponível', value: ProductStatus.INDISPONIVEL },
      { label: 'Descontinuado', value: ProductStatus.DESCONTINUADO },
    ]},
  ]

  return (
    <div>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produtos no catálogo`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Novo Produto
          </Button>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-[#86868B]">Carregando produtos...</p>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          filters={filters}
          searchPlaceholder="Buscar por nome do produto..."
          onRowClick={openEdit}
          emptyState={<EmptyState icon={Package} title="Nenhum produto" description="Adicione produtos ao catálogo para começar." actionLabel="Novo Produto" onAction={openCreate} />}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: iPhone 15 Pro Max 256GB" className="rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ProductCategory }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Marca</Label>
                <Input value={form.brand || ''} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Apple" className="rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Modelo</Label>
                <Input value={form.model || ''} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="A3106" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Armazenamento</Label>
                <Input value={form.storage || ''} onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))} placeholder="256GB" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Cor</Label>
                <Input value={form.color || ''} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="Titanio Natural" className="rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Preço (R$) *</Label>
                <Input type="number" min={0} step={0.01} value={form.price || ''} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} placeholder="0,00" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Estoque</Label>
                <Input type="number" min={0} value={form.stock || ''} onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))} placeholder="0" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProductStatus }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProductStatus.DISPONIVEL}>Disponível</SelectItem>
                    <SelectItem value={ProductStatus.INDISPONIVEL}>Indisponível</SelectItem>
                    <SelectItem value={ProductStatus.DESCONTINUADO}>Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Descrição</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição do produto..." rows={3} className="rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
