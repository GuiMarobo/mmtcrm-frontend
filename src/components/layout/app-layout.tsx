import { Outlet } from 'react-router-dom'
import { Topbar } from './topbar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Topbar />
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-[#D2D2D7]/40 py-6 text-center text-xs text-[#A1A1A6]">
        &copy; MMT Urbana Serviços Digitais LTDA, 2026
      </footer>
    </div>
  )
}
