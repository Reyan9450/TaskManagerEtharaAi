import axiosClient from './axiosClient'
import type { Task, CreateTaskData, UpdateTaskData } from '../types'

/**
 * Fetch all tasks for a project visible to the current user.
 * Admin sees all tasks; Member sees only assigned tasks.
 * Requirements: 6.1
 */
export async function getTasks(projectId: string): Promise<Task[]> {
  const response = await axiosClient.get<Task[]>(
    `/api/tasks/project/${projectId}`
  )
  return Array.isArray(response.data) ? response.data : []
}

/**
 * Create a new task (Admin only).
 * Requirements: 6.1
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await axiosClient.post<Task>('/api/tasks', data)
  return response.data
}

/**
 * Perform a full update on a task (Admin only).
 * Requirements: 6.3
 */
export async function updateTask(
  id: string,
  data: UpdateTaskData
): Promise<Task> {
  const response = await axiosClient.put<Task>(`/api/tasks/${id}`, data)
  return response.data
}

/**
 * Update only the status field of a task (Member or Admin).
 * Requirements: 6.4
 */
export async function updateTaskStatus(
  id: string,
  status: 'Todo' | 'In Progress' | 'Done'
): Promise<Task> {
  const response = await axiosClient.patch<Task>(`/api/tasks/${id}/status`, {
    status,
  })
  return response.data
}

/**
 * Delete a task (Admin only).
 * Requirements: 6.5
 */
export async function deleteTask(id: string): Promise<void> {
  await axiosClient.delete(`/api/tasks/${id}`)
}
