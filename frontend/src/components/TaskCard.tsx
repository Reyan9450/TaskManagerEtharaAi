import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../types'
import { useAuth } from '../context/AuthContext'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const priorityBadgeClass: Record<Task['priorityLevel'], string> = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low:    'bg-green-100 text-green-700',
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { user } = useAuth()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const showActions =
    user?.role !== 'Member' && (onEdit !== undefined || onDelete !== undefined)

  const borderClass = task.isOverdue
    ? 'border-2 border-red-500'
    : 'border border-gray-200'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm p-4 cursor-grab active:cursor-grabbing ${borderClass}`}
    >
      <p className="font-bold text-gray-800 mb-1 leading-snug">{task.title}</p>

      <p className="text-sm text-gray-500 mb-1">
        Assigned to:{' '}
        <span className="font-medium text-gray-700">{task.assignedTo.name}</span>
      </p>

      <p className="text-sm text-gray-500 mb-2">
        Due:{' '}
        <span className="font-medium text-gray-700">
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadgeClass[task.priorityLevel]}`}>
          {task.priorityLevel}
        </span>
        {task.isOverdue && (
          <span className="inline-block text-xs font-semibold text-red-600">⚠️ Overdue</span>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2 mt-3">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(task) }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(task._id) }}
              className="text-xs text-red-600 hover:text-red-800 font-medium focus:outline-none"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
