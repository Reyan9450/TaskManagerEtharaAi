import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type RoleTab = 'Admin' | 'Member'

const ROLE_PRESETS: Record<RoleTab, { email: string; password: string }> = {
  Admin:  { email: 'admin@example.com',  password: 'Admin1234!'  },
  Member: { email: 'member@example.com', password: 'Member1234!' },
}

const TAB_STYLES: Record<RoleTab, { active: string; badge: string; button: string }> = {
  Admin: {
    active: 'border-b-2 border-purple-600 text-purple-700 font-semibold',
    badge:  'bg-purple-100 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
  },
  Member: {
    active: 'border-b-2 border-blue-600 text-blue-700 font-semibold',
    badge:  'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
}

export default function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<RoleTab>('Admin')
  const [email, setEmail] = useState(ROLE_PRESETS.Admin.email)
  const [password, setPassword] = useState(ROLE_PRESETS.Admin.password)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  function switchTab(tab: RoleTab) {
    setActiveTab(tab)
    setEmail(ROLE_PRESETS[tab].email)
    setPassword(ROLE_PRESETS[tab].password)
    setErrors({})
  }

  function validate(): boolean {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'Email is required.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Login failed. Please try again.'
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const styles = TAB_STYLES[activeTab]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Role tabs */}
        <div className="flex border-b border-gray-200">
          {(['Admin', 'Member'] as RoleTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchTab(tab)}
              className={`flex-1 py-3 text-sm transition-colors focus:outline-none ${
                activeTab === tab ? TAB_STYLES[tab].active : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge}`}>
              {activeTab}
            </span>
            <h1 className="text-xl font-bold text-gray-800">Sign in</h1>
          </div>

          <div className="mb-5 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Test credentials pre-filled.</span>
            {' '}Change them to log in as a different user.
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email" type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full rounded-lg py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${styles.button}`}
            >
              {loading ? 'Signing in…' : `Sign in as ${activeTab}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
