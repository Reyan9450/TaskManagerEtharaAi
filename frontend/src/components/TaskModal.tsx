import React, { useEffect, useState } from 'react'
import type { Task, Project, CreateTaskData, UpdateTaskData } from '../types'
import { useTaskContext } from '../context/TaskContext'
import { useToast } from '../context/ToastContext'
import { getUsers, type UserSummary } from '../api/users'

interface TaskModalProps {
  projectId: string
  project: Project
  task?: Task | null
  onClose: () => void
}

interface FieldErrors {
  title?: string
  assignedTo?: string
  dueDate?: string
}

const STATUS_OPTIONS: Task['status'][] = ['Todo', 'In Progress', 'Done']

export function TaskModal({ projectId, project, task, onClose }: TaskModalProps) {
  const { addTask, updateTask } = useTaskContext()
  const { showToast } = useToast()

  const isEdit = task != null

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo._id ?? '')
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'Todo')
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<UserSummary[]>([])

  // Load user details for the assignee dropdown
  useEffect(() => {
    const assignableIds = [project.admin, ...project.members]
    getUsers()
      .then((all) => setMembers(all.filter((u) => assignableIds.includes(u._id))))
      .catch(() => {/* silently fall back to IDs */})
  }, [project])

  useEffect(() => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setAssignedTo(task?.assignedTo._id ?? '')
    setStatus(task?.status ?? 'Todo')
    setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : '')
    setErrors({})
  }, [task])

  function validate(): boolean {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!assignedTo) next.assignedTo = 'Please select an assignee.'
    if (!dueDate) next.dueDate = 'Due date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit && task) {
        const data: UpdateTaskData = {
          title: title.trim(),
          description: description.trim() || undefined,
          assignedTo, status,
          dueDate: new Date(dueDate).toISOString(),
        }
        await updateTask(task._id, projectId, data)
        showToast('Task updated successfully', 'success')
      } else {
        const data: CreateTaskData = {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId, assignedTo, status,
          dueDate: new Date(dueDate).toISOString(),
        }
        await addTask(data)
        showToast('Task created successfully', 'success')
      }
      onClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? (isEdit ? 'Failed to update task.' : 'Failed to create task.')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fall back to raw IDs if user fetch failed
  const assignableIds = [project.admin, ...project.members]

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isEdit ? 'bg-yellow-500' : 'bg-blue-500'}`} />
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none focus:outline-none">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="What needs to be done?" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add more details…" />
          </div>

          {/* Two-column row: Assignee + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To <span className="text-red-500">*</span>
              </label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.assignedTo ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select member…</option>
                {members.length > 0
                  ? members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.role})
                      </option>
                    ))
                  : assignableIds.map((id) => <option key={id} value={id}>{id}</option>)
                }
              </select>
              {errors.assignedTo && <p className="mt-1 text-xs text-red-600">{errors.assignedTo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dueDate ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
