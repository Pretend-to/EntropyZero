import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useHistoryStore } from './useHistoryStore'
import type { Task, Connection, TaskStatus, TaskPriority, Position } from '../types'

interface TaskState {
  tasks: Task[]
  connections: Connection[]
  selectedTaskIds: string[]
  selectedConnectionIds: string[] // 新增：选中的连接线ID
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  moveTask: (taskId: string, position: Position) => void
  setTaskStatus: (taskId: string, status: TaskStatus) => void
  setTaskPriority: (taskId: string, priority: TaskPriority) => void
  
  // Connection actions
  addConnection: (connection: Omit<Connection, 'id'>) => void
  updateConnection: (connectionId: string, updates: Partial<Connection>) => void // 新增：更新连接
  removeConnection: (connectionId: string) => void
  
  // Selection actions
  selectTask: (taskId: string, multiSelect?: boolean) => void
  selectMultipleTasks: (taskIds: string[]) => void
  deselectTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string) => void
  clearSelection: () => void
  
  // Connection selection actions - 新增
  selectConnection: (connectionId: string, multiSelect?: boolean) => void
  deselectConnection: (connectionId: string) => void
  toggleConnectionSelection: (connectionId: string) => void
  clearConnectionSelection: () => void
  
  // Utility functions
  getTask: (taskId: string) => Task | undefined
  getConnection: (connectionId: string) => Connection | undefined // 新增
  getTasksByStatus: (status: TaskStatus) => Task[]
  getConnectedTasks: (taskId: string) => Task[]
  
  // Data management
  importData: (tasks: Task[], connections: Connection[]) => void
  clearAllData: () => void
}

const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
const generateConnectionId = () => `conn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

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
          updatedAt: new Date('2024-01-10T10:00:00Z'),
        },
        {
          id: 'task-2',
          title: '实现画布渲染引擎',
          description: '基于 Canvas API 实现无限画布，支持缩放、平移和虚拟化渲染',
          status: 'todo',
          priority: 'high',
          position: { x: 500, y: 150 },
          tags: ['开发', '核心功能'],
          createdAt: new Date('2024-01-10T11:00:00Z'),
          updatedAt: new Date('2024-01-10T11:00:00Z'),
        },
        {
          id: 'task-3',
          title: '搭建项目架构',
          description: '配置 TypeScript、Vite、pnpm workspace 和代码质量工具',
          status: 'done',
          priority: 'medium',
          position: { x: 200, y: 350 },
          tags: ['开发', '基础设施'],
          progress: 100,
          createdAt: new Date('2024-01-09T09:00:00Z'),
          updatedAt: new Date('2024-01-10T12:00:00Z'),
        },
      ],
      connections: [
        {
          id: 'conn-1',
          from: 'task-1',
          to: 'task-2',
          type: 'strong', // 修正类型名称
        },
      ],
      selectedTaskIds: [],
      selectedConnectionIds: [], // 新增初始状态

      // Task actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'CREATE_TASK',
          data: { task: newTask },
          description: `创建任务: ${newTask.title}`
        })
        
        return newTask.id
      },

      updateTask: (taskId, updates) => {
        const state = get()
        const oldTask = state.tasks.find(task => task.id === taskId)
        
        if (!oldTask) return
        
        const newTask = { ...oldTask, ...updates, updatedAt: new Date() }
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? newTask : task
          ),
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'UPDATE_TASK',
          data: { 
            taskId,
            oldTask,
            newTask
          },
          description: `更新任务: ${newTask.title}`
        })
      },

      removeTask: (taskId) => {
        const state = get()
        const taskToRemove = state.tasks.find(task => task.id === taskId)
        
        if (!taskToRemove) return
        
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          connections: state.connections.filter(
            (conn) => conn.from !== taskId && conn.to !== taskId
          ),
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'DELETE_TASK',
          data: { 
            taskId,
            task: taskToRemove
          },
          description: `删除任务: ${taskToRemove.title}`
        })
      },

      moveTask: (taskId, position) => {
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        
        if (!task) return
        
        const oldPosition = task.position
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, position, updatedAt: new Date() }
              : task
          ),
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'MOVE_TASK',
          data: { 
            taskId,
            position,
            oldPosition
          },
          description: `移动任务: ${task.title}`
        })
      },

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
      addConnection: (connectionData) => {
        const newConnection = { ...connectionData, id: generateConnectionId() }
        
        set((state) => ({
          connections: [...state.connections, newConnection],
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'CREATE_CONNECTION',
          data: { connection: newConnection },
          description: `创建连接: ${connectionData.from} → ${connectionData.to}`
        })
      },

      updateConnection: (connectionId, updates) => {
        const state = get()
        const oldConnection = state.connections.find(conn => conn.id === connectionId)
        
        if (!oldConnection) return
        
        const newConnection = { ...oldConnection, ...updates }
        
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId ? newConnection : conn
          ),
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'UPDATE_CONNECTION',
          data: { 
            connectionId,
            oldConnection,
            newConnection
          },
          description: `更新连接: ${newConnection.from} → ${newConnection.to}`
        })
      },

      removeConnection: (connectionId) => {
        const state = get()
        const connectionToRemove = state.connections.find(conn => conn.id === connectionId)
        
        if (!connectionToRemove) return
        
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== connectionId),
          selectedConnectionIds: state.selectedConnectionIds.filter((id) => id !== connectionId),
        }))
        
        // 记录操作历史
        useHistoryStore.getState().recordOperation({
          type: 'DELETE_CONNECTION',
          data: { 
            connectionId,
            connection: connectionToRemove
          },
          description: `删除连接: ${connectionToRemove.from} → ${connectionToRemove.to}`
        })
      },

      // Selection actions
      selectTask: (taskId, multiSelect = false) =>
        set((state) => {
          if (multiSelect) {
            // 多选模式：如果已选中则取消选中，否则添加到选中列表
            const isSelected = state.selectedTaskIds.includes(taskId)
            return {
              selectedTaskIds: isSelected
                ? state.selectedTaskIds.filter(id => id !== taskId)
                : [...state.selectedTaskIds, taskId]
            }
          } else {
            // 单选模式：只选中当前任务
            return {
              selectedTaskIds: [taskId]
            }
          }
        }),

      selectMultipleTasks: (taskIds) =>
        set(() => ({
          selectedTaskIds: taskIds,
        })),

      deselectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        })),

      toggleTaskSelection: (taskId) =>
        set((state) => {
          const isSelected = state.selectedTaskIds.includes(taskId)
          return {
            selectedTaskIds: isSelected
              ? state.selectedTaskIds.filter(id => id !== taskId)
              : [...state.selectedTaskIds, taskId]
          }
        }),

      clearSelection: () =>
        set(() => ({
          selectedTaskIds: [],
        })),

      // Connection selection actions
      selectConnection: (connectionId, multiSelect = false) =>
        set((state) => {
          if (multiSelect) {
            const isSelected = state.selectedConnectionIds.includes(connectionId)
            return {
              selectedConnectionIds: isSelected
                ? state.selectedConnectionIds.filter(id => id !== connectionId)
                : [...state.selectedConnectionIds, connectionId]
            }
          } else {
            return {
              selectedConnectionIds: [connectionId],
              selectedTaskIds: [], // 选择连接时清除任务选择
            }
          }
        }),

      deselectConnection: (connectionId) =>
        set((state) => ({
          selectedConnectionIds: state.selectedConnectionIds.filter((id) => id !== connectionId),
        })),

      toggleConnectionSelection: (connectionId) =>
        set((state) => {
          const isSelected = state.selectedConnectionIds.includes(connectionId)
          return {
            selectedConnectionIds: isSelected
              ? state.selectedConnectionIds.filter(id => id !== connectionId)
              : [...state.selectedConnectionIds, connectionId]
          }
        }),

      clearConnectionSelection: () =>
        set(() => ({
          selectedConnectionIds: [],
        })),

      // Utility functions
      getTask: (taskId) => {
        const state = get()
        return state.tasks.find((task) => task.id === taskId)
      },

      getConnection: (connectionId) => {
        const state = get()
        return state.connections.find((conn) => conn.id === connectionId)
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

      // Data management
      importData: (tasks, connections) =>
        set(() => ({
          tasks,
          connections,
          selectedTaskIds: [],
          selectedConnectionIds: [], // 重置连接选择
        })),

      clearAllData: () =>
        set(() => ({
          tasks: [],
          connections: [],
          selectedTaskIds: [],
          selectedConnectionIds: [], // 重置连接选择
        })),
    }),
    {
      name: 'entropy-zero-tasks',
      partialize: (state) => ({
        tasks: state.tasks,
        connections: state.connections,
        // 不持久化选择状态
      }),
    }
  )
)