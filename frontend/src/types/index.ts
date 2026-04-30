export interface AssignedUser {
  _id: string
  name: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  projectId: string
  assignedTo: AssignedUser
  status: 'Todo' | 'In Progress' | 'Done'
  dueDate: string
  createdAt: string
  priorityScore: number
  priorityLevel: 'High' | 'Medium' | 'Low'
  isOverdue: boolean
}

export interface Project {
  _id: string
  title: string
  description?: string
  admin: string
  members: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateTaskData {
  title: string
  description?: string
  projectId: string
  assignedTo: string
  status?: 'Todo' | 'In Progress' | 'Done'
  dueDate: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  assignedTo?: string
  status?: 'Todo' | 'In Progress' | 'Done'
  dueDate?: string
}
