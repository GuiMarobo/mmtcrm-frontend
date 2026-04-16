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
import { usedDevicesService } from '@/services/used-devices.service'
import { formatCurrency } from '@/lib/format-currency'
import { formatDate } from '@/lib/format-date'
import { useAuth } from '@/hooks/use-auth'
import { DeviceCondition } from '@/types'
import type { UsedDevice, CreateUsedDeviceDto } from '@/types'
import type { Column, FilterConfig } from '@/components/data-table'
import { Plus, Smartphone, Pencil, Trash2 } from 'lucide-react'

const conditionMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [DeviceCondition.EXCELENTE]: { label: 'Excelente', variant: 'green' },
  [DeviceCondition.BOM]: { label: 'Bom', variant: 'blue' },
  [DeviceCondition.REGULAR]: { label: 'Regular', variant: 'yellow' },
  [DeviceCondition.RUIM]: { label: 'Ruim', variant: 'orange' },
  [DeviceCondition.DEFEITUOSO]: { label: 'Defeituoso', variant: 'red' },
}

const emptyForm: CreateUsedDeviceDto = {
  deviceName: '', brand: 'Apple', model: '', storage: '', color: '',
  serialNumber: '', condition: DeviceCondition.BOM, estimatedValue: 0, technicalNotes: '',
}

export function UsedDevicesPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<UsedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUsedDeviceDto>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    usedDevicesService.findAll()
      .then(setDevices)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((device: UsedDevice) => {
    setEditingId(device.id)
    setForm({
      deviceName: device.deviceName, brand: device.brand, model: device.model || '',
      storage: device.storage || '', color: device.color || '', serialNumber: device.serialNumber || '',
      condition: device.condition, estimatedValue: device.estimatedValue, technicalNotes: device.technicalNotes || '',
    })
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.deviceName.trim()) return
    try {
      if (editingId) {
        const updated = await usedDevicesService.update(editingId, form)
        setDevices((prev) => prev.map((d) => d.id === editingId ? updated : d))
      } else {
        const created = await usedDevicesService.create(form)
        setDevices((prev) => [created, ...prev])
      }
      setDialogOpen(false)
    } catch {
      alert('Erro ao salvar dispositivo.')
    }
  }, [form, editingId, user])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await usedDevicesService.remove(id)
      setDevices((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Erro ao excluir dispositivo.')
    }
    setDeleteConfirm(null)
  }, [])

  const columns: Column<UsedDevice>[] = [
    { header: 'Dispositivo', accessor: (row) => (
      <div>
        <p className="font-medium text-[#1D1D1F]">{row.deviceName}</p>
        <p className="text-[11px] text-[#86868B]">{row.storage || ''} {row.color ? `· ${row.color}` : ''}</p>
      </div>
    ), searchable: false },
    { header: 'Nome', accessor: 'deviceName', searchable: true, className: 'hidden' },
    { header: 'N/S', accessor: (row) => row.serialNumber ? <span className="font-mono text-[12px]">{row.serialNumber}</span> : '\u2014' },
    { header: 'Condição', accessor: (row) => {
      const c = conditionMap[row.condition]
      return <StatusBadge variant={c.variant}>{c.label}</StatusBadge>
    }},
    { header: 'Valor Estimado', accessor: (row) => <span className="font-semibold text-[#1D1D1F]">{formatCurrency(row.estimatedValue)}</span> },
    { header: 'Avaliado por', accessor: (row) => row.evaluatedByName || '\u2014' },
    { header: 'Data Avaliação', accessor: (row) => row.evaluatedAt ? formatDate(row.evaluatedAt) : '\u2014' },
    { header: 'Ações', accessor: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#0071E3] transition-colors cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id) }} className="rounded-lg p-1.5 text-[#6E6E73] hover:bg-[#FFEBEE] hover:text-[#FF3B30] transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    ), className: 'w-[80px]' },
  ]

  const filters: FilterConfig[] = [
    { key: 'condition', label: 'Condição', options: Object.entries(conditionMap).map(([k, v]) => ({ label: v.label, value: k })) },
  ]

  return (
    <div>
      <PageHeader
        title="Dispositivos Usados"
        subtitle={`${devices.length} dispositivos avaliados`}
        action={
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
            <Plus className="h-4 w-4" />Novo Dispositivo
          </Button>
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-[#86868B]">Carregando dispositivos...</p>
      ) : (
        <DataTable
          columns={columns}
          data={devices}
          filters={filters}
          searchPlaceholder="Buscar por nome do dispositivo..."
          onRowClick={openEdit}
          emptyState={<EmptyState icon={Smartphone} title="Nenhum dispositivo" description="Registre um dispositivo usado para avaliação." actionLabel="Novo Dispositivo" onAction={openCreate} />}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
              {editingId ? 'Editar Dispositivo' : 'Novo Dispositivo'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Nome do Dispositivo *</Label>
                <Input value={form.deviceName} onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))} placeholder="Ex: iPhone 13 Pro" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Apple" className="rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Modelo</Label>
                <Input value={form.model || ''} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="A2638" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Armazenamento</Label>
                <Input value={form.storage || ''} onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))} placeholder="256GB" className="rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Cor</Label>
                <Input value={form.color || ''} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="Grafite" className="rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Número de Série</Label>
                <Input value={form.serialNumber || ''} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))} placeholder="F2LX8K9QN0" className="rounded-lg font-mono" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] font-medium">Condição</Label>
                <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v as DeviceCondition }))}>
                  <SelectTrigger className="rounded-lg cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(conditionMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Valor Estimado (R$) *</Label>
              <Input type="number" min={0} step={0.01} value={form.estimatedValue || ''} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: parseFloat(e.target.value) || 0 }))} placeholder="0,00" className="rounded-lg" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] font-medium">Laudo Técnico</Label>
              <Textarea value={form.technicalNotes || ''} onChange={(e) => setForm((f) => ({ ...f, technicalNotes: e.target.value }))} placeholder="Descreva o estado do dispositivo: tela, bateria, botões, câmeras..." rows={4} className="rounded-lg resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.deviceName.trim()} className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] cursor-pointer">
              {editingId ? 'Salvar Alterações' : 'Registrar Dispositivo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6E6E73]">Tem certeza que deseja excluir este dispositivo?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-lg cursor-pointer">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg cursor-pointer">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
