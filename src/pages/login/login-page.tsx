import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('E-mail ou senha incorretos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1D1D1F 0%, #0D0D0F 60%, #0A1628 100%)' }}>
        {/* Ambient glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #0071E3 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #00C7BE 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #5E5CE6 0%, transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight text-white">MMT URBANA</span>
              <span className="rounded-md bg-[#0071E3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">CRM</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-tight text-white">
              Gerencie seu negócio com
              <span className="block" style={{ background: 'linear-gradient(135deg, #0071E3, #00C7BE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> inteligência.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#86868B]">
              Plataforma completa para gestão de vendas, clientes e negociações de dispositivos Apple.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <p className="text-2xl font-semibold text-white">500+</p>
              <p className="text-xs text-[#86868B] mt-0.5">Clientes ativos</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-2xl font-semibold text-white">R$ 2M+</p>
              <p className="text-xs text-[#86868B] mt-0.5">Em negociações</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-2xl font-semibold text-white">98%</p>
              <p className="text-xs text-[#86868B] mt-0.5">Satisfação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 items-center justify-center bg-[#FAFAFA] px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight text-[#1D1D1F]">MMT URBANA</span>
            <span className="rounded-md bg-[#0071E3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">CRM</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[26px] font-semibold tracking-tight text-[#1D1D1F]">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-[#6E6E73]">Entre com suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-[#1D1D1F]">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl border-[#D2D2D7] bg-white px-4 text-sm text-[#1D1D1F] placeholder:text-[#A1A1A6] focus-visible:border-[#0071E3] focus-visible:ring-[#0071E3]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#1D1D1F]">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-[#D2D2D7] bg-white px-4 pr-11 text-sm text-[#1D1D1F] placeholder:text-[#A1A1A6] focus-visible:border-[#0071E3] focus-visible:ring-[#0071E3]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1A6] hover:text-[#6E6E73] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FF3B30]/8 px-4 py-3 text-sm text-[#FF3B30]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-[#0071E3] text-sm font-semibold text-white hover:bg-[#0077ED] active:bg-[#006ADB] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-[#D2D2D7]/60 bg-white p-4">
            <p className="text-xs font-medium text-[#6E6E73] mb-2.5">Credenciais de demonstração:</p>
            <div className="space-y-1.5 text-xs text-[#86868B]">
              <p><span className="font-medium text-[#1D1D1F]">Admin:</span> admin@mmt.com</p>
              <p><span className="font-medium text-[#1D1D1F]">Vendedor:</span> vendedor@mmt.com</p>
              <p><span className="font-medium text-[#1D1D1F]">Atendente:</span> atendente@mmt.com</p>
              <p><span className="font-medium text-[#1D1D1F]">Técnico:</span> tecnico@mmt.com</p>
              <p className="mt-2 pt-2 border-t border-[#D2D2D7]/40"><span className="font-medium text-[#1D1D1F]">Senha:</span> 123456</p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-[#A1A1A6]">
            &copy; MMT Urbana Serviços Digitais LTDA, 2026
          </p>
        </div>
      </div>
    </div>
  )
}
