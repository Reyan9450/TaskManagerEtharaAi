import axiosClient from './axiosClient'

export interface UserSummary {
  _id: string
  name: string
  email: string
  role: 'Admin' | 'Member'
}

export async function getUsers(): Promise<UserSummary[]> {
  const response = await axiosClient.get<UserSummary[]>('/api/users')
  return Array.isArray(response.data) ? response.data : []
}
