import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react'
import type { Task, CreateTaskData, UpdateTaskData } from '../types'
import {
  getTasks as getTasksApi,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  updateTaskStatus as updateTaskStatusApi,
  deleteTask as deleteTaskApi,
} from '../api/tasks'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface TaskState {
  tasksByProject: Record<string, Task[]>
  loading: boolean
  error: string | null
}

const initialState: TaskState = {
  tasksByProject: {},
  loading: false,
  error: null,
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_TASKS'; payload: { projectId: string; tasks: Task[] } }
  | { type: 'ADD_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } }
  | {
      type: 'UPDATE_TASK_STATUS_OPTIMISTIC'
      payload: {
        projectId: string
        taskId: string
        status: Task['status']
        previousTasks: Task[]
      }
    }
  | { type: 'ROLLBACK_TASKS'; payload: { projectId: string; tasks: Task[] } }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'LOAD_TASKS':
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.payload.projectId]: action.payload.tasks,
        },
      }

    case 'ADD_TASK': {
      const existing = state.tasksByProject[action.payload.projectId] ?? []
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.payload.projectId]: [...existing, action.payload.task],
        },
      }
    }

    case 'UPDATE_TASK': {
      const existing = state.tasksByProject[action.payload.projectId] ?? []
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.payload.projectId]: existing.map((t) =>
            t._id === action.payload.task._id ? action.payload.task : t
          ),
        },
      }
    }

    case 'DELETE_TASK': {
      const existing = state.tasksByProject[action.payload.projectId] ?? []
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.payload.projectId]: existing.filter(
            (t) => t._id !== action.payload.taskId
          ),
        },
      }
    }

    case 'UPDATE_TASK_STATUS_OPTIMISTIC': {
      const existing = state.tasksByProject[action.payload.projectId] ?? []
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.payload.projectId]: existing.map((t) =>
            t._id === action.payload.taskId
              ? { ...t, status: action.payload.status }
              : t
          ),
        },
      }
    }

    case 'ROLLBACK_TASKS':
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.payload.projectId]: action.payload.tasks,
        },
      }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context value interface
// ---------------------------------------------------------------------------

interface TaskContextValue {
  tasksByProject: Record<string, Task[]>
  loading: boolean
  error: string | null
  loadTasks(projectId: string): Promise<void>
  addTask(data: CreateTaskData): Promise<Task>
  updateTask(id: string, projectId: string, data: UpdateTaskData): Promise<Task>
  deleteTask(id: string, projectId: string): Promise<void>
  updateTaskStatus(
    id: string,
    projectId: string,
    status: Task['status']
  ): Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const TaskContext = createContext<TaskContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  const loadTasks = useCallback(async (projectId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const tasks = await getTasksApi(projectId)
      dispatch({ type: 'LOAD_TASKS', payload: { projectId, tasks } })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load tasks'
      dispatch({ type: 'SET_ERROR', payload: message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const addTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      const task = await createTaskApi(data)
      dispatch({
        type: 'ADD_TASK',
        payload: { projectId: task.projectId, task },
      })
      return task
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create task'
      dispatch({ type: 'SET_ERROR', payload: message })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const updateTask = useCallback(
    async (
      id: string,
      projectId: string,
      data: UpdateTaskData
    ): Promise<Task> => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        const task = await updateTaskApi(id, data)
        dispatch({ type: 'UPDATE_TASK', payload: { projectId, task } })
        return task
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update task'
        dispatch({ type: 'SET_ERROR', payload: message })
        throw err
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    []
  )

  const deleteTask = useCallback(
    async (id: string, projectId: string): Promise<void> => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      try {
        await deleteTaskApi(id)
        dispatch({ type: 'DELETE_TASK', payload: { projectId, taskId: id } })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete task'
        dispatch({ type: 'SET_ERROR', payload: message })
        throw err
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    []
  )

  /**
   * Optimistic status update:
   * 1. Snapshot previous tasks for potential rollback
   * 2. Immediately update status in state (optimistic)
   * 3. Call API; on success replace with server-returned task (fresh computed fields)
   * 4. On error, rollback to previous state and re-throw
   * Requirements: 6.2, 9.3, 9.4
   */
  const updateTaskStatus = useCallback(
    async (
      id: string,
      projectId: string,
      status: Task['status']
    ): Promise<void> => {
      const previousTasks = state.tasksByProject[projectId] ?? []

      dispatch({
        type: 'UPDATE_TASK_STATUS_OPTIMISTIC',
        payload: { projectId, taskId: id, status, previousTasks },
      })

      try {
        const updatedTask = await updateTaskStatusApi(id, status)
        dispatch({
          type: 'UPDATE_TASK',
          payload: { projectId, task: updatedTask },
        })
      } catch (err) {
        dispatch({
          type: 'ROLLBACK_TASKS',
          payload: { projectId, tasks: previousTasks },
        })
        throw err
      }
    },
    [state.tasksByProject]
  )

  const value: TaskContextValue = {
    tasksByProject: state.tasksByProject,
    loading: state.loading,
    error: state.error,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return ctx
}
