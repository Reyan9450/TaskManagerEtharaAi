import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getProjects, createProject } from '../api/projects'
import type { Project } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()

  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => showToast('Failed to load projects', 'error'))
  }, [showToast])

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const project = await createProject({ title: newTitle.trim() })
      setProjects((prev) => [...prev, project])
      setNewTitle('')
      setShowCreateForm(false)
      showToast('Project created', 'success')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Failed to create project'
      showToast(message, 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-gray-100 shrink-0">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-700">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          onClick={onClose}
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white text-sm font-bold">
            T
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Taskify</span>
        </Link>
        {user && (
          <p className="text-xs text-gray-400 mt-1.5 truncate">
            {user.name}
            <span className={`ml-1.5 inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${
              user.role === 'Admin' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
            }`}>
              {user.role}
            </span>
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          label="Dashboard"
          active={location.pathname === '/dashboard'}
          onClick={onClose}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />

        {/* Projects section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Projects
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateForm((v) => !v)}
                title="New project"
                className="text-gray-400 hover:text-white text-lg leading-none focus:outline-none transition-colors"
              >
                +
              </button>
            )}
          </div>

          {isAdmin && showCreateForm && (
            <form onSubmit={handleCreateProject} className="px-2 mb-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Project name…"
                className="w-full rounded bg-gray-800 border border-gray-600 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="flex-1 rounded bg-blue-600 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewTitle('') }}
                  className="flex-1 rounded bg-gray-700 py-1 text-xs text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {projects.map((p) => (
            <NavLink
              key={p._id}
              to={`/projects/${p._id}`}
              label={p.title}
              active={location.pathname === `/projects/${p._id}`}
              onClick={onClose}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              }
            />
          ))}

          {projects.length === 0 && !showCreateForm && (
            <p className="px-2 text-xs text-gray-600 mt-1">No projects yet.</p>
          )}
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white text-left transition-colors focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}

function NavLink({
  to, label, active, onClick, icon,
}: {
  to: string; label: string; active: boolean; onClick?: () => void; icon?: React.ReactNode
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium truncate transition-colors focus:outline-none ${
        active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </Link>
  )
}
