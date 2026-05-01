import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProjects, deleteProject } from '../api/projects'
import type { Project, Task } from '../types'
import { useTaskContext } from '../context/TaskContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { KanbanBoard } from '../components/KanbanBoard'
import { PageSpinner, Spinner } from '../components/Spinner'
import { TaskModal } from '../components/TaskModal'

export default function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loadTasks, loading: tasksLoading, tasksByProject } = useTaskContext()
  const { showToast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingProject, setDeletingProject] = useState(false)

  const isAdmin = user?.role === 'Admin'
  const tasks = projectId ? (tasksByProject[projectId] ?? []) : []

  useEffect(() => {
    if (!projectId) return
    setProjectLoading(true)
    getProjects()
      .then((projects) => {
        const found = projects.find((p) => p._id === projectId)
        if (!found) { showToast('Project not found', 'error'); navigate('/dashboard'); return }
        setProject(found)
      })
      .catch(() => { showToast('Failed to load project', 'error'); navigate('/dashboard') })
      .finally(() => setProjectLoading(false))
  }, [projectId, navigate, showToast])

  useEffect(() => {
    if (!projectId) return
    loadTasks(projectId).catch(() => showToast('Failed to load tasks', 'error'))
  }, [projectId, loadTasks, showToast])

  async function handleDeleteProject() {
    if (!project) return
    const confirmed = window.confirm(
      `Delete "${project.title}"? This will permanently remove the project and all its tasks.`
    )
    if (!confirmed) return
    setDeletingProject(true)
    try {
      await deleteProject(project._id)
      showToast('Project deleted', 'success')
      navigate('/dashboard')
    } catch {
      showToast('Failed to delete project', 'error')
      setDeletingProject(false)
    }
  }

  if (projectLoading) return <PageSpinner />
  if (!project) return null

  const todo = tasks.filter((t) => t.status === 'Todo').length
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length
  const done = tasks.filter((t) => t.status === 'Done').length
  const overdue = tasks.filter((t) => t.isOverdue).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {project.members.length} member{project.members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setEditingTask(null); setModalOpen(true) }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              + New Task
            </button>
            <button
              type="button"
              onClick={handleDeleteProject}
              disabled={deletingProject}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none transition-colors disabled:opacity-50"
              title="Delete project"
            >
              {deletingProject ? '…' : '🗑'}
            </button>
          </div>
        )}
      </div>

      {/* Task summary bar */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <SummaryPill label="Total" value={tasks.length} colour="gray" />
          <SummaryPill label="Todo" value={todo} colour="gray" />
          <SummaryPill label="In Progress" value={inProgress} colour="blue" />
          <SummaryPill label="Done" value={done} colour="green" />
          {overdue > 0 && <SummaryPill label="Overdue" value={overdue} colour="red" />}
        </div>
      )}

      {/* Kanban board */}
      {tasksLoading ? (
        <div className="flex items-center justify-center h-40"><Spinner /></div>
      ) : (
        <KanbanBoard
          projectId={project._id}
          onEditTask={isAdmin ? (task) => { setEditingTask(task); setModalOpen(true) } : undefined}
        />
      )}

      {/* Task Modal */}
      {isAdmin && modalOpen && (
        <TaskModal
          projectId={project._id}
          project={project}
          task={editingTask}
          onClose={() => { setModalOpen(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}

function SummaryPill({ label, value, colour }: {
  label: string; value: number; colour: 'gray' | 'blue' | 'green' | 'red'
}) {
  const cls = {
    gray:  'bg-gray-100 text-gray-600',
    blue:  'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red:   'bg-red-100 text-red-700',
  }[colour]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  )
}
