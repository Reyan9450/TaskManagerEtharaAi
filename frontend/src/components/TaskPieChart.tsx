import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Task } from '../types'

interface TaskPieChartProps {
  tasks: Task[]
}

const STATUS_COLOURS: Record<string, string> = {
  Todo: '#6b7280',       // gray-500
  'In Progress': '#3b82f6', // blue-500
  Done: '#22c55e',       // green-500
}

export function TaskPieChart({ tasks }: TaskPieChartProps) {
  const counts = tasks.reduce<Record<string, number>>(
    (acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1
      return acc
    },
    { Todo: 0, 'In Progress': 0, Done: 0 }
  )

  const data = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No tasks yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_COLOURS[entry.name] ?? '#9ca3af'}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value} tasks`, '']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
