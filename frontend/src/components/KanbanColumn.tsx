import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task } from '../types'
import { TaskCard } from './TaskCard'

type ColumnStatus = 'Todo' | 'In Progress' | 'Done'

interface KanbanColumnProps {
  status: ColumnStatus
  tasks: Task[]
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
}

const headerColourClass: Record<ColumnStatus, string> = {
  Todo:         'bg-gray-100 text-gray-700',
  'In Progress':'bg-blue-100 text-blue-700',
  Done:         'bg-green-100 text-green-700',
}

export function KanbanColumn({ status, tasks, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col flex-1 min-w-[260px]">
      <div className={`rounded-t-lg px-4 py-2 font-semibold text-sm ${headerColourClass[status]}`}>
        {status}
        <span className="ml-2 text-xs font-normal opacity-70">({tasks.length})</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-lg p-3 flex flex-col gap-3 min-h-[200px] transition-colors ${
          isOver ? 'bg-blue-50' : 'bg-gray-50'
        }`}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4 select-none">No tasks</p>
        )}
      </div>
    </div>
  )
}
