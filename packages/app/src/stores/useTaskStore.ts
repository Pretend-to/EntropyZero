import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Connection, TaskStatus, TaskPriority, Position } from '../types'

interface TaskState {
  tasks: Task[]
  connections: Connection[]
  selectedTaskIds: string[]
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  moveTask: (taskId: string, position: Position) => void
  setTaskStatus: (taskId: string, status: TaskStatus) => void
  setTaskPriority: (taskId: string, priority: TaskPriority) => void
  
  // Connection actions
  addConnection: (connection: Omit<Connection, 'id'>) => void
  removeConnection: (connectionId: string) => void
  
  // Selection actions
  selectTask: (taskId: string) => void
  selectMultipleTasks: (taskIds: string[]) => void
  deselectTask: (taskId: string) => void
  clearSelection: () => void
  
  // Utility functions
  getTask: (taskId: string) => Task | undefined
  getTasksByStatus: (status: TaskStatus) => Task[]
  getConnectedTasks: (taskId: string) => Task[]
}

const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const generateConnectionId = () => `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [
        {
          id: 'task-1',
          title: '完成 UI/UX 设计文档',
          description: '编写详细的界面设计规范，包括组件库、交互流程和视觉风格指南',
          status: 'inProgress',
          priority: 'high',
          position: { x: 150, y: 100 },
          tags: ['设计', '文档'],
          createdAt: new Date('2024-01-10T10:00:00Z'),
          updatedAt: new Date('2024-01-15T14:30:00Z'),
          progress: 75,
        },
        {
          id: 'task-2',
          title: '实现画布渲染引擎',
          description: '基于 Canvas API 实现无限画布，支持缩放、平移和高性能渲染',
          status: 'todo',
          priority: 'high',
          position: { x: 450, y: 100 },
          tags: ['开发', '核心功能'],
          createdAt: new Date('2024-01-12T09:00:00Z'),
          updatedAt: new Date('2024-01-15T16:45:00Z'),
          dueDate: new Date('2024-01-18T23:59:59Z'),
        },
        {
          id: 'task-3',
          title: '搭建项目架构',
          description: '配置 TypeScript、Vite、pnpm monorepo 等开发环境',
          status: 'done',
          priority: 'medium',
          position: { x: 300, y: 300 },
          tags: ['工程化'],
          createdAt: new Date('2024-01-08T08:00:00Z'),
          updatedAt: new Date('2024-01-12T17:20:00Z'),
          progress: 100,
        },
      ],
      connections: [
        {
          id: 'conn-1',
          from: 'task-3',
          to: 'task-1',
          type: 'strong',
        },
        {
          id: 'conn-2',
          from: 'task-1',
          to: 'task-2',
          type: 'weak',
        },
      ],
      selectedTaskIds: [],

      // Task actions
      addTask: (taskData) =>
        set((state) => {
          const newTask: Task = {
            ...taskData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          return {
            tasks: [...state.tasks, newTask],
          }
        }),

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        })),

      removeTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          connections: state.connections.filter(
            (conn) => conn.from !== taskId && conn.to !== taskId
          ),
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        })),

      moveTask: (taskId, position) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, position, updatedAt: new Date() }
              : task
          ),
        })),

      setTaskStatus: (taskId, status) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, status, updatedAt: new Date() }
              : task
          ),
        })),

      setTaskPriority: (taskId, priority) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, priority, updatedAt: new Date() }
              : task
          ),
        })),

      // Connection actions
      addConnection: (connectionData) =>
        set((state) => {
          const newConnection: Connection = {
            ...connectionData,
            id: generateConnectionId(),
          }
          return {
            connections: [...state.connections, newConnection],
          }
        }),

      removeConnection: (connectionId) =>
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== connectionId),
        })),

      // Selection actions
      selectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(taskId)
            ? state.selectedTaskIds
            : [...state.selectedTaskIds, taskId],
        })),

      selectMultipleTasks: (taskIds) =>
        set({ selectedTaskIds: taskIds }),

      deselectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        })),

      clearSelection: () =>
        set({ selectedTaskIds: [] }),

      // Utility functions
      getTask: (taskId) => {
        const state = get()
        return state.tasks.find((task) => task.id === taskId)
      },

      getTasksByStatus: (status) => {
        const state = get()
        return state.tasks.filter((task) => task.status === status)
      },

      getConnectedTasks: (taskId) => {
        const state = get()
        const connectedTaskIds = state.connections
          .filter((conn) => conn.from === taskId || conn.to === taskId)
          .map((conn) => (conn.from === taskId ? conn.to : conn.from))
        
        return state.tasks.filter((task) => connectedTaskIds.includes(task.id))
      },
    }),
    {
      name: 'entropy-zero-tasks',
      partialize: (state) => ({
        tasks: state.tasks,
        connections: state.connections,
      }),
      // Handle Date serialization/deserialization
      serialize: (state) => {
        return JSON.stringify(state, (_key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() }
          }
          return value
        })
      },
      deserialize: (str) => {
        return JSON.parse(str, (_key, value) => {
          if (value && typeof value === 'object' && value.__type === 'Date') {
            return new Date(value.value)
          }
          return value
        })
      },
    }
  )
)
