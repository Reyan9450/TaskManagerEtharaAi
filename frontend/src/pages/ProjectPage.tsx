import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProjects } from '../api/projects'
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
  const { loadTasks, loading: tasksLoading } = useTaskContext()
  const { showToast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const isAdmin = user?.role === 'Admin'

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

  if (projectLoading) return <PageSpinner />
  if (!project) return null

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
          {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => { setEditingTask(null); setModalOpen(true) }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            + New Task
          </button>
        )}
      </div>

      {tasksLoading ? (
        <div className="flex items-center justify-center h-40"><Spinner /></div>
      ) : (
        <KanbanBoard
          projectId={project._id}
          onEditTask={isAdmin ? (task) => { setEditingTask(task); setModalOpen(true) } : undefined}
        />
      )}

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
