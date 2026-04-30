import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../api/projects'
import { getTasks } from '../api/tasks'
import type { Project, Task } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { TaskPieChart } from '../components/TaskPieChart'
import { PageSpinner } from '../components/Spinner'
import { ProjectProgressBar } from '../components/ProjectProgressBar'

export default function DashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [projects, setProjects] = useState<Project[]>([])
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const fetchedProjects = await getProjects()
        setProjects(fetchedProjects)
        const entries = await Promise.all(
          fetchedProjects.map(async (p) => {
            try {
              const tasks = await getTasks(p._id)
              return [p._id, tasks] as [string, Task[]]
            } catch {
              return [p._id, []] as [string, Task[]]
            }
          })
        )
        setTasksByProject(Object.fromEntries(entries))
      } catch {
        showToast('Failed to load dashboard data', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [showToast])

  const allTasks = Object.values(tasksByProject).flat()
  const myTasks = allTasks.filter((t) => t.assignedTo._id === user?.id)
  const overdueTasks = allTasks.filter((t) => t.isOverdue)

  if (loading) return <PageSpinner />

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Tasks" value={allTasks.length} colour="blue" />
        <StatCard label="Overdue Tasks" value={overdueTasks.length} colour="red" />
        <StatCard label="My Tasks" value={myTasks.length} colour="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Task Status Distribution</h2>
          <TaskPieChart tasks={allTasks} />
        </section>

        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Project Progress</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400">No projects yet.</p>
          ) : (
            projects.map((p) => (
              <ProjectProgressBar key={p._id} projectTitle={p.title} tasks={tasksByProject[p._id] ?? []} />
            ))
          )}
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">My Assigned Tasks</h2>
        {myTasks.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks assigned to you.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Project</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Due</th>
                  <th className="pb-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.map((task) => {
                  const proj = projects.find((p) => p._id === task.projectId)
                  return (
                    <tr key={task._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2 pr-4 font-medium text-gray-800">
                        {task.isOverdue && <span className="mr-1 text-red-500">⚠️</span>}
                        {task.title}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {proj ? (
                          <Link to={`/projects/${proj._id}`} className="text-blue-600 hover:underline">
                            {proj.title}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4"><StatusBadge status={task.status} /></td>
                      <td className="py-2 pr-4 text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td className="py-2"><PriorityBadge level={task.priorityLevel} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, colour }: { label: string; value: number; colour: 'blue' | 'red' | 'green' }) {
  const colourMap = {
    blue:  'bg-blue-50 text-blue-700',
    red:   'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  }
  return (
    <div className={`rounded-2xl p-5 ${colourMap[colour]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: Task['status'] }) {
  const cls = {
    Todo:         'bg-gray-100 text-gray-600',
    'In Progress':'bg-blue-100 text-blue-700',
    Done:         'bg-green-100 text-green-700',
  }[status]
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>
}

function PriorityBadge({ level }: { level: Task['priorityLevel'] }) {
  const cls = {
    High:   'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low:    'bg-green-100 text-green-700',
  }[level]
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{level}</span>
}
