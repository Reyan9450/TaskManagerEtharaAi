import axiosClient from './axiosClient'
import type { Project } from '../types'

/**
 * Fetch all projects visible to the current user (admin or member).
 * Requirements: 5.4
 */
export async function getProjects(): Promise<Project[]> {
  const response = await axiosClient.get<Project[]>('/api/projects')
  return Array.isArray(response.data) ? response.data : []
}

/**
 * Create a new project (Admin only).
 * Requirements: 5.1
 */
export async function createProject(data: {
  title: string
  description?: string
}): Promise<Project> {
  const response = await axiosClient.post<Project>('/api/projects', data)
  return response.data
}

/**
 * Delete a project and cascade-delete all its tasks (Admin only).
 * Requirements: 5.5
 */
export async function deleteProject(id: string): Promise<void> {
  await axiosClient.delete(`/api/projects/${id}`)
}

/**
 * Add a member to a project (Admin only).
 * Requirements: 5.2
 */
export async function addMember(
  projectId: string,
  userId: string
): Promise<Project> {
  const response = await axiosClient.post<Project>(
    `/api/projects/${projectId}/members`,
    { userId }
  )
  return response.data
}

/**
 * Remove a member from a project (Admin only).
 * Requirements: 5.3
 */
export async function removeMember(
  projectId: string,
  userId: string
): Promise<Project> {
  const response = await axiosClient.delete<Project>(
    `/api/projects/${projectId}/members/${userId}`
  )
  return response.data
}
