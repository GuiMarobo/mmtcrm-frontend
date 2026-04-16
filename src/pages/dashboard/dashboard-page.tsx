import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { StatusBadge } from '@/components/status-badge'
import { useAuth } from '@/hooks/use-auth'
import { clientsService } from '@/services/clients.service'
import { negotiationsService } from '@/services/negotiations.service'
import { ordersService } from '@/services/orders.service'
import { productsService } from '@/services/products.service'
import { formatCurrency } from '@/lib/format-currency'
import { getRelativeTime } from '@/lib/format-date'
import { NegotiationStatus, ClientStatus, OrderStatus, LeadQualification } from '@/types'
import type { Client, Negotiation, Order, Product } from '@/types'
import { TrendingUp, Users, Handshake, Package, ArrowUpRight, Clock, DollarSign, ShoppingBag } from 'lucide-react'

const negotiationStatusMap: Record<string, { label: string; variant: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray' }> = {
  [NegotiationStatus.EM_ANDAMENTO]: { label: 'Em Andamento', variant: 'blue' },
  [NegotiationStatus.AGUARDANDO_AVALIACAO]: { label: 'Aguard. Avaliação', variant: 'yellow' },
  [NegotiationStatus.ORCAMENTO_ENVIADO]: { label: 'Orçamento Enviado', variant: 'purple' },
  [NegotiationStatus.CONCLUIDA]: { label: 'Concluída', variant: 'green' },
  [NegotiationStatus.CANCELADA]: { label: 'Cancelada', variant: 'red' },
}

export function DashboardPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    clientsService.findAll().then(setClients).catch(() => {})
    negotiationsService.findAll().then(setNegotiations).catch(() => {})
    ordersService.findAll().then(setOrders).catch(() => {})
    productsService.findAll().then(setProducts).catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const activeNegotiations = negotiations.filter((n) => n.status !== NegotiationStatus.CONCLUIDA && n.status !== NegotiationStatus.CANCELADA)
    const completedOrders = orders.filter((o) => o.status === OrderStatus.CONCLUIDO)
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalValue, 0)
    const activeClients = clients.filter((c) => c.status === ClientStatus.ATIVO).length
    const lowStock = products.filter((p) => p.stock <= 2 && p.stock > 0).length
    const concludedNeg = negotiations.filter((n) => n.status === NegotiationStatus.CONCLUIDA).length
    const conversionRate = negotiations.length > 0 ? Math.round((concludedNeg / negotiations.length) * 100) : 0

    return {
      activeNegotiations: activeNegotiations.length,
      totalRevenue,
      activeClients,
      totalClients: clients.length,
      totalProducts: products.length,
      lowStock,
      pendingOrders: orders.filter((o) => o.status === OrderStatus.PROCESSANDO || o.status === OrderStatus.AGUARDANDO_PAGAMENTO).length,
      totalOrders: orders.length,
      leads: clients.filter((c) => c.status === ClientStatus.LEAD).length,
      availableProducts: products.filter((p) => p.status === 'DISPONIVEL').length,
      conversionRate,
    }
  }, [clients, negotiations, orders, products])

  const recentNegotiations = useMemo(() => {
    return [...negotiations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)
  }, [negotiations])

  const recentLeads = useMemo(() => {
    return clients
      .filter((c) => c.status === ClientStatus.LEAD)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [clients])

  const kpis = [
    { label: 'Receita Total', value: formatCurrency(stats.totalRevenue), icon: DollarSign, change: `${stats.totalOrders} pedidos`, color: '#28A745', bgColor: '#E8F8EF' },
    { label: 'Negociações Ativas', value: String(stats.activeNegotiations), icon: Handshake, change: `${stats.activeNegotiations} abertas`, color: '#0071E3', bgColor: '#EBF5FF' },
    { label: 'Clientes Ativos', value: String(stats.activeClients), icon: Users, change: `${stats.totalClients} total`, color: '#8B5CF6', bgColor: '#F3E8FF' },
    { label: 'Pedidos Pendentes', value: String(stats.pendingOrders), icon: ShoppingBag, change: `${stats.totalOrders} total`, color: '#F5A623', bgColor: '#FFF8E6' },
  ]

  const getQualificationLabel = useCallback((qualification: string) => {
    if (qualification === LeadQualification.QUALIFICADO) return { label: 'Qualificado', variant: 'green' as const }
    if (qualification === LeadQualification.ALTA_INTENCAO) return { label: 'Alta Intenção', variant: 'blue' as const }
    return { label: 'Não Qualif.', variant: 'gray' as const }
  }, [])

  return (
    <div>
      <PageHeader
        title={`Olá, ${user?.name?.split(' ')[0]}`}
        subtitle="Aqui está o resumo do seu dia"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="group relative overflow-hidden rounded-2xl border border-[#D2D2D7]/40 bg-white p-5 transition-all duration-200 hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:border-[#D2D2D7]/70">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[#6E6E73]">{kpi.label}</p>
                  <p className="mt-2 text-[28px] font-semibold tracking-tight text-[#1D1D1F] leading-none">{kpi.value}</p>
                  <p className="mt-2 text-[12px] font-medium" style={{ color: kpi.color }}>{kpi.change}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: kpi.bgColor }}>
                  <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, ${kpi.color}, transparent)` }} />
            </div>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Negotiations - 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-[#D2D2D7]/40 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#D2D2D7]/30">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-[#0071E3]" />
              <h3 className="text-[15px] font-semibold text-[#1D1D1F]">Negociações Recentes</h3>
            </div>
            <Link to="/negotiations" className="flex items-center gap-1 text-[12px] font-medium text-[#0071E3] hover:text-[#0077ED] transition-colors cursor-pointer">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#D2D2D7]/20">
            {recentNegotiations.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#86868B]">Nenhuma negociação recente</div>
            ) : (
              recentNegotiations.map((neg) => {
                const statusInfo = negotiationStatusMap[neg.status]
                return (
                  <div key={neg.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F5F5F7]/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-[11px] font-bold text-[#6E6E73]">
                        {neg.clientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{neg.clientName}</p>
                        <p className="text-[11px] text-[#86868B] truncate">{neg.items.map((i) => i.productName).join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <StatusBadge variant={statusInfo.variant}>{statusInfo.label}</StatusBadge>
                      <div className="text-right hidden sm:block">
                        <p className="text-[13px] font-semibold text-[#1D1D1F]">{formatCurrency(neg.totalValue)}</p>
                        <p className="text-[11px] text-[#86868B] flex items-center justify-end gap-1"><Clock className="h-3 w-3" />{getRelativeTime(neg.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Leads - 1 column */}
        <div className="rounded-2xl border border-[#D2D2D7]/40 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#D2D2D7]/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#8B5CF6]" />
              <h3 className="text-[15px] font-semibold text-[#1D1D1F]">Novos Leads</h3>
            </div>
            <Link to="/clients" className="flex items-center gap-1 text-[12px] font-medium text-[#0071E3] hover:text-[#0077ED] transition-colors cursor-pointer">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#D2D2D7]/20">
            {recentLeads.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#86868B]">Nenhum lead recente</div>
            ) : (
              recentLeads.map((lead) => {
                const qual = getQualificationLabel(lead.qualification)
                return (
                  <div key={lead.id} className="px-5 py-3.5 hover:bg-[#F5F5F7]/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{lead.name}</p>
                        <p className="text-[11px] text-[#86868B]">{lead.origin} &middot; {getRelativeTime(lead.createdAt)}</p>
                      </div>
                      <StatusBadge variant={qual.variant}>{qual.label}</StatusBadge>
                    </div>
                    {lead.notes && <p className="mt-1.5 text-[11px] text-[#86868B] line-clamp-2">{lead.notes}</p>}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#D2D2D7]/40 bg-white px-4 py-3">
          <Package className="h-4 w-4 text-[#F5A623]" />
          <div>
            <p className="text-[11px] text-[#86868B]">Estoque Baixo</p>
            <p className="text-[15px] font-semibold text-[#1D1D1F]">{stats.lowStock} produtos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#D2D2D7]/40 bg-white px-4 py-3">
          <TrendingUp className="h-4 w-4 text-[#28A745]" />
          <div>
            <p className="text-[11px] text-[#86868B]">Taxa Conversão</p>
            <p className="text-[15px] font-semibold text-[#1D1D1F]">{stats.conversionRate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#D2D2D7]/40 bg-white px-4 py-3">
          <Users className="h-4 w-4 text-[#8B5CF6]" />
          <div>
            <p className="text-[11px] text-[#86868B]">Leads este mês</p>
            <p className="text-[15px] font-semibold text-[#1D1D1F]">{stats.leads}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#D2D2D7]/40 bg-white px-4 py-3">
          <Package className="h-4 w-4 text-[#0071E3]" />
          <div>
            <p className="text-[11px] text-[#86868B]">Produtos Ativos</p>
            <p className="text-[15px] font-semibold text-[#1D1D1F]">{stats.availableProducts}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
