import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('mmt-crm-auth')
  if (stored) {
    try {
      const user = JSON.parse(stored)
      if (user?.id) {
        config.headers.Authorization = `Bearer mock-token-${user.id}`
      }
    } catch { /* ignore */ }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mmt-crm-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
