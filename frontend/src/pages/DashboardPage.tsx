import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../api/projects'
import { getTasks } from '../api/tasks'
import { getUsers, type UserSummary } from '../api/users'
import type { Project, Task } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { TaskPieChart } from '../components/TaskPieChart'
import { PageSpinner } from '../components/Spinner'
import { ProjectProgressBar } from '../components/ProjectProgressBar'

export default function DashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isAdmin = user?.role === 'Admin'

  const [projects, setProjects] = useState<Project[]>([])
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({})
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [fetchedProjects, fetchedUsers] = await Promise.all([
          getProjects(),
          isAdmin ? getUsers() : Promise.resolve([]),
        ])
        setProjects(fetchedProjects)
        setUsers(fetchedUsers)

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
  }, [showToast, isAdmin])

  const allTasks = Object.values(tasksByProject).flat()
  const myTasks = allTasks.filter((t) => t.assignedTo._id === user?.id)
  const overdueTasks = allTasks.filter((t) => t.isOverdue)
  const doneTasks = allTasks.filter((t) => t.status === 'Done')
  const inProgressTasks = allTasks.filter((t) => t.status === 'In Progress')

  if (loading) return <PageSpinner />

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`} />
          {user?.role}
        </span>
      </div>

      {/* Stat cards — Admin sees 5, Member sees 3 */}
      <div className={`grid grid-cols-2 gap-4 ${isAdmin ? 'sm:grid-cols-5' : 'sm:grid-cols-3'}`}>
        <StatCard label="Total Tasks" value={allTasks.length} colour="blue"
          icon={<TaskIcon />} />
        <StatCard label="In Progress" value={inProgressTasks.length} colour="yellow"
          icon={<ClockIcon />} />
        <StatCard label="Completed" value={doneTasks.length} colour="green"
          icon={<CheckIcon />} />
        <StatCard label="Overdue" value={overdueTasks.length} colour="red"
          icon={<AlertIcon />} />
        {isAdmin && (
          <StatCard label="Projects" value={projects.length} colour="purple"
            icon={<FolderIcon />} />
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Task Status Distribution</h2>
          <TaskPieChart tasks={allTasks} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Project Progress</h2>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <FolderIcon />
              <p className="text-sm mt-2">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((p) => (
                <ProjectProgressBar key={p._id} projectTitle={p.title}
                  tasks={tasksByProject[p._id] ?? []} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Admin-only: Member Tracker */}
      {isAdmin && users.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            👥 Member Task Tracker
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-center pb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-center pb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Todo</th>
                  <th className="text-center pb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">In Progress</th>
                  <th className="text-center pb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Done</th>
                  <th className="text-center pb-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Overdue</th>
                  <th className="text-left pb-3 pl-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const memberTasks = allTasks.filter((t) => t.assignedTo._id === u._id)
                  const todo = memberTasks.filter((t) => t.status === 'Todo').length
                  const inProg = memberTasks.filter((t) => t.status === 'In Progress').length
                  const done = memberTasks.filter((t) => t.status === 'Done').length
                  const overdue = memberTasks.filter((t) => t.isOverdue).length
                  const pct = memberTasks.length === 0 ? 0 : Math.round((done / memberTasks.length) * 100)

                  return (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            u.role === 'Admin' ? 'bg-purple-500' : 'bg-blue-500'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-gray-700">{memberTasks.length}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{todo}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{inProg}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{done}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {overdue > 0 ? (
                          <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">⚠️ {overdue}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Overdue tasks alert — Admin sees all, Member sees own */}
      {overdueTasks.length > 0 && (
        <section className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertIcon /> Overdue Tasks ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map((task) => {
              const proj = projects.find((p) => p._id === task.projectId)
              return (
                <div key={task._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-100">
                  <div className="flex items-center gap-3">
                    <span className="text-red-500 text-sm">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-400">
                        {task.assignedTo.name} · {proj ? proj.title : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-red-600 font-medium">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    {proj && (
                      <Link to={`/projects/${proj._id}`}
                        className="text-xs text-blue-600 hover:underline font-medium">
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
            {overdueTasks.length > 5 && (
              <p className="text-xs text-red-500 text-center pt-1">
                +{overdueTasks.length - 5} more overdue tasks
              </p>
            )}
          </div>
        </section>
      )}

      {/* My assigned tasks */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          {isAdmin ? '📋 All Tasks Overview' : '📋 My Assigned Tasks'}
        </h2>
        {(isAdmin ? allTasks : myTasks).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No tasks yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-2 pr-4">Title</th>
                  {isAdmin && <th className="pb-2 pr-4">Assignee</th>}
                  <th className="pb-2 pr-4">Project</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Due</th>
                  <th className="pb-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {(isAdmin ? allTasks : myTasks).slice(0, 20).map((task) => {
                  const proj = projects.find((p) => p._id === task.projectId)
                  return (
                    <tr key={task._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-gray-800 max-w-[200px] truncate">
                        {task.isOverdue && <span className="mr-1 text-red-500">⚠️</span>}
                        {task.title}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 pr-4 text-gray-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                              {task.assignedTo.name.charAt(0)}
                            </div>
                            {task.assignedTo.name}
                          </div>
                        </td>
                      )}
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">
                        {proj ? (
                          <Link to={`/projects/${proj._id}`} className="text-blue-600 hover:underline">
                            {proj.title}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 pr-4"><StatusBadge status={task.status} /></td>
                      <td className={`py-2.5 pr-4 text-xs ${task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5"><PriorityBadge level={task.priorityLevel} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {(isAdmin ? allTasks : myTasks).length > 20 && (
              <p className="text-xs text-gray-400 text-center pt-3">
                Showing 20 of {(isAdmin ? allTasks : myTasks).length} tasks. Open a project to see all.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, colour, icon }: {
  label: string; value: number
  colour: 'blue' | 'red' | 'green' | 'yellow' | 'purple'
  icon: React.ReactNode
}) {
  const map = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-400'   },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'text-red-400'    },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-400'  },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-400' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-400' },
  }[colour]

  return (
    <div className={`rounded-2xl p-5 ${map.bg} flex flex-col gap-3`}>
      <div className={`w-8 h-8 ${map.icon}`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${map.text}`}>{value}</p>
        <p className={`text-xs font-medium mt-0.5 ${map.text} opacity-70`}>{label}</p>
      </div>
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

// ── Icons ────────────────────────────────────────────────────────────────────

function TaskIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}
