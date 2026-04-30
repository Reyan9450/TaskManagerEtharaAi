import type { Task } from '../types'

interface ProjectProgressBarProps {
  projectTitle: string
  tasks: Task[]
}

export function ProjectProgressBar({ projectTitle, tasks }: ProjectProgressBarProps) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'Done').length
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 truncate max-w-[70%]">
          {projectTitle}
        </span>
        <span className="text-sm font-semibold text-gray-600">
          {percentage}%
          <span className="ml-1 text-xs font-normal text-gray-400">({done}/{total})</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${projectTitle} progress: ${percentage}%`}
        />
      </div>
    </div>
  )
}
