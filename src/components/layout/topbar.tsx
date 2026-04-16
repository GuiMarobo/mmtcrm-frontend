import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Handshake, Users, Package, Calculator, ClipboardList, Smartphone, Settings, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Role } from '@/types'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface NavItem { label: string; href: string; icon: React.ElementType; roles?: Role[] }

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.VENDEDOR, Role.ATENDENTE] },
  { label: 'Negociações', href: '/negotiations', icon: Handshake, roles: [Role.ADMIN, Role.VENDEDOR, Role.ATENDENTE] },
  { label: 'Clientes', href: '/clients', icon: Users, roles: [Role.ADMIN, Role.VENDEDOR, Role.ATENDENTE] },
  { label: 'Produtos', href: '/products', icon: Package },
  { label: 'Orçamentos', href: '/quotations', icon: Calculator, roles: [Role.ADMIN, Role.VENDEDOR, Role.ATENDENTE] },
  { label: 'Pedidos', href: '/orders', icon: ClipboardList, roles: [Role.ADMIN, Role.VENDEDOR, Role.ATENDENTE] },
  { label: 'Dispositivos', href: '/used-devices', icon: Smartphone, roles: [Role.ADMIN, Role.TECNICO] },
  { label: 'Admin', href: '/admin', icon: Settings, roles: [Role.ADMIN] },
]

const roleLabel: Record<string, string> = { ADMIN: 'Administrador', VENDEDOR: 'Vendedor', ATENDENTE: 'Atendente', TECNICO: 'Técnico' }

export function Topbar() {
  const { user, logout, hasRole } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const visibleItems = navItems.filter((item) => !item.roles || hasRole(...item.roles))
  const isActive = (href: string) => location.pathname.startsWith(href)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16" style={{ background: 'linear-gradient(180deg, #1D1D1F 0%, #2C2C2E 100%)' }}>
      <div className="flex h-full items-center justify-between px-6 max-w-[1440px] mx-auto">
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <span className="text-lg font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">MMT URBANA</span>
          <span className="rounded-md bg-[#0071E3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">CRM</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} to={item.href} className={cn('relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200', active ? 'text-white' : 'text-[#A1A1A6] hover:text-white hover:bg-white/[0.06]')}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {active && <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#0071E3]" />}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10 cursor-pointer"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="top" className="bg-[#1D1D1F] border-[#2D2D2F] pt-12">
              <nav className="flex flex-col gap-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer', isActive(item.href) ? 'bg-[#0071E3]/10 text-white' : 'text-[#A1A1A6] hover:text-white hover:bg-white/5')}>
                      <Icon className="h-4 w-4" /><span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.08] cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0071E3, #00C7BE)' }}>
                  {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-medium text-white leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-[#A1A1A6] leading-tight">{roleLabel[user?.role || '']}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
