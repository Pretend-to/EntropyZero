// 任务相关类型定义
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  position: Position
  tags: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  progress?: number
  subtasks?: Subtask[]
  dependencies?: string[] // 依赖的任务 ID
  metadata?: Record<string, any>
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

export type TaskStatus = 'todo' | 'inProgress' | 'waiting' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Position {
  x: number
  y: number
}

// 连接线类型定义
export interface Connection {
  id: string
  from: string // 源任务 ID
  to: string   // 目标任务 ID
  type: ConnectionType
  style?: ConnectionStyle
}

export type ConnectionType = 'strong' | 'weak' | 'related'

export interface ConnectionStyle {
  color?: string
  width?: number
  dashArray?: string
}

// 项目相关类型
export interface Project {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
  taskIds: string[]
  isArchived: boolean
}

// 标签类型
export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
}

// 画布相关类型
export interface CanvasState {
  zoom: number
  pan: Position
  selectedTaskIds: string[]
  isDragging: boolean
  dragTarget?: string
}

export interface ViewportBounds {
  left: number
  top: number
  right: number
  bottom: number
}

// UI 状态类型
export interface UIState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  activeView: ViewType
  theme: ThemeType
  language: string
}

export type ViewType = 'canvas' | 'list' | 'calendar' | 'gantt'
export type ThemeType = 'dark' | 'light' | 'auto'

// 设置类型
export interface Settings {
  theme: ThemeType
  language: string
  autoSave: boolean
  autoSaveInterval: number
  defaultTaskPriority: TaskPriority
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  maxZoom: number
  minZoom: number
  panSensitivity: number
  zoomSensitivity: number
}

// 事件类型
export interface TaskEvent {
  type: 'create' | 'update' | 'delete' | 'move' | 'connect'
  taskId: string
  timestamp: Date
  data?: any
}

// 搜索和过滤类型
export interface SearchFilters {
  query?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  projectId?: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 错误类型
export interface AppError {
  code: string
  message: string
  details?: any
}

// 快捷键类型
export interface Shortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: string
  description: string
}

// 命令面板类型
export interface Command {
  id: string
  title: string
  description?: string
  icon?: string
  shortcut?: string
  category: CommandCategory
  action: () => void | Promise<void>
}

export type CommandCategory = 'task' | 'navigation' | 'view' | 'ai' | 'settings'

// AI 相关类型
export interface AIRequest {
  type: 'taskBreakdown' | 'projectPlanning' | 'prioritySuggestion'
  input: string
  context?: any
}

export interface AIResponse {
  type: string
  suggestions: AISuggestion[]
  confidence: number
}

export interface AISuggestion {
  id: string
  title: string
  description: string
  action?: () => void
  data?: any
}