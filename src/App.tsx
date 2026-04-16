import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { AppLayout } from '@/components/layout'
import { Role } from '@/types'
import { LoginPage } from '@/pages/login/login-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { ClientsPage } from '@/pages/clients/clients-page'
import { ProductsPage } from '@/pages/products/products-page'
import { NegotiationsPage } from '@/pages/negotiations/negotiations-page'
import { QuotationsPage } from '@/pages/quotations/quotations-page'
import { OrdersPage } from '@/pages/orders/orders-page'
import { UsedDevicesPage } from '@/pages/used-devices/used-devices-page'
import { AdminPage } from '@/pages/admin/admin-page'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="negotiations" element={<NegotiationsPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="used-devices" element={
              <ProtectedRoute roles={[Role.ADMIN, Role.TECNICO]}>
                <UsedDevicesPage />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute roles={[Role.ADMIN]}>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
