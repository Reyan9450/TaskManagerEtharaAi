import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Task } from '../types'
import { useTaskContext } from '../context/TaskContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { KanbanColumn } from './KanbanColumn'

type ColumnStatus = 'Todo' | 'In Progress' | 'Done'

const VALID_STATUSES: ColumnStatus[] = ['Todo', 'In Progress', 'Done']

function isValidStatus(value: unknown): value is ColumnStatus {
  return VALID_STATUSES.includes(value as ColumnStatus)
}

interface KanbanBoardProps {
  projectId: string
  onEditTask?: (task: Task) => void
}

export function KanbanBoard({ projectId, onEditTask }: KanbanBoardProps) {
  const { tasksByProject, updateTaskStatus, deleteTask } = useTaskContext()
  const { user } = useAuth()
  const { showToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const allTasks: Task[] = tasksByProject[projectId] ?? []

  const tasksByStatus = (status: ColumnStatus): Task[] =>
    allTasks.filter((t) => t.status === status)

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const taskId = active.id as string
      const targetStatus = over.id

      if (!isValidStatus(targetStatus)) return

      const task = allTasks.find((t) => t._id === taskId)
      if (!task) return

      if (task.status === targetStatus) return

      // Members can only move tasks assigned to them
      if (user?.role === 'Member' && task.assignedTo._id !== user.id) {
        showToast('You can only move your own tasks', 'error')
        return
      }

      try {
        await updateTaskStatus(taskId, projectId, targetStatus)
      } catch {
        showToast('Failed to update task status', 'error')
      }
    },
    [allTasks, user, projectId, updateTaskStatus, showToast]
  )

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask(taskId, projectId)
        showToast('Task deleted', 'success')
      } catch {
        showToast('Failed to delete task', 'error')
      }
    },
    [deleteTask, projectId, showToast]
  )

  const isAdmin = user?.role === 'Admin'
  const editHandler = isAdmin ? onEditTask : undefined
  const deleteHandler = isAdmin ? handleDeleteTask : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start overflow-x-auto pb-4">
        {VALID_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus(status)}
            onEditTask={editHandler}
            onDeleteTask={deleteHandler}
          />
        ))}
      </div>
    </DndContext>
  )
}
