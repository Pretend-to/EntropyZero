import { create } from 'zustand'
import type { Task, Connection } from '../types'

// 操作类型定义
export type OperationType = 
  | 'CREATE_TASK'
  | 'UPDATE_TASK' 
  | 'DELETE_TASK'
  | 'MOVE_TASK'
  | 'CREATE_CONNECTION'
  | 'UPDATE_CONNECTION'
  | 'DELETE_CONNECTION'
  | 'BATCH_OPERATION'

// 单个操作记录
export interface Operation {
  id: string
  type: OperationType
  timestamp: number
  data: {
    // 任务相关操作
    task?: Task
    taskId?: string
    oldTask?: Task
    newTask?: Task
    position?: { x: number; y: number }
    oldPosition?: { x: number; y: number }
    
    // 连接相关操作
    connection?: Connection
    connectionId?: string
    oldConnection?: Connection
    newConnection?: Connection
    
    // 批量操作
    operations?: Operation[]
  }
  description: string // 用于调试和用户提示
}

// 历史状态接口
interface HistoryState {
  // 历史栈
  undoStack: Operation[]
  redoStack: Operation[]
  
  // 配置
  maxHistorySize: number
  isRecording: boolean
  
  // 状态
  canUndo: boolean
  canRedo: boolean
  
  // 操作方法
  recordOperation: (operation: Omit<Operation, 'id' | 'timestamp'>) => void
  undo: () => Operation | null
  redo: () => Operation | null
  clear: () => void
  
  // 批量操作支持
  startBatch: () => void
  endBatch: (description: string) => void
  
  // 暂停/恢复记录
  pauseRecording: () => void
  resumeRecording: () => void
  
  // 获取历史信息
  getUndoDescription: () => string | null
  getRedoDescription: () => string | null
}

// 生成操作ID
const generateOperationId = () => `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

export const useHistoryStore = create<HistoryState>((set, get) => {
  let batchOperations: Operation[] = []
  let isBatching = false
  
  return {
    // 初始状态
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50, // 最多保存50个操作
    isRecording: true,
    canUndo: false,
    canRedo: false,
    
    // 记录操作
    recordOperation: (operationData) => {
      const state = get()
      
      // 如果暂停记录，直接返回
      if (!state.isRecording) return
      
      const operation: Operation = {
        id: generateOperationId(),
        timestamp: Date.now(),
        ...operationData
      }
      
      // 如果在批量操作中，添加到批量操作数组
      if (isBatching) {
        batchOperations.push(operation)
        return
      }
      
      set((state) => {
        const newUndoStack = [...state.undoStack, operation]
        
        // 限制历史栈大小
        if (newUndoStack.length > state.maxHistorySize) {
          newUndoStack.shift() // 移除最旧的操作
        }
        
        return {
          undoStack: newUndoStack,
          redoStack: [], // 新操作会清空重做栈
          canUndo: true,
          canRedo: false
        }
      })
      
      console.log('记录操作:', operation.type, operation.description)
    },
    
    // 撤销操作
    undo: () => {
      const state = get()
      
      if (state.undoStack.length === 0) {
        return null
      }
      
      const operation = state.undoStack[state.undoStack.length - 1]
      
      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, operation],
        canUndo: state.undoStack.length > 1,
        canRedo: true
      }))
      
      console.log('撤销操作:', operation.type, operation.description)
      return operation
    },
    
    // 重做操作
    redo: () => {
      const state = get()
      
      if (state.redoStack.length === 0) {
        return null
      }
      
      const operation = state.redoStack[state.redoStack.length - 1]
      
      set((state) => ({
        undoStack: [...state.undoStack, operation],
        redoStack: state.redoStack.slice(0, -1),
        canUndo: true,
        canRedo: state.redoStack.length > 1
      }))
      
      console.log('重做操作:', operation.type, operation.description)
      return operation
    },
    
    // 清空历史
    clear: () => {
      set({
        undoStack: [],
        redoStack: [],
        canUndo: false,
        canRedo: false
      })
      console.log('清空操作历史')
    },
    
    // 开始批量操作
    startBatch: () => {
      isBatching = true
      batchOperations = []
      console.log('开始批量操作')
    },
    
    // 结束批量操作
    endBatch: (description) => {
      if (!isBatching || batchOperations.length === 0) {
        isBatching = false
        batchOperations = []
        return
      }
      
      const batchOperation: Operation = {
        id: generateOperationId(),
        timestamp: Date.now(),
        type: 'BATCH_OPERATION',
        data: {
          operations: [...batchOperations]
        },
        description
      }
      
      set((state) => {
        const newUndoStack = [...state.undoStack, batchOperation]
        
        // 限制历史栈大小
        if (newUndoStack.length > state.maxHistorySize) {
          newUndoStack.shift()
        }
        
        return {
          undoStack: newUndoStack,
          redoStack: [],
          canUndo: true,
          canRedo: false
        }
      })
      
      isBatching = false
      batchOperations = []
      console.log('结束批量操作:', description, `包含${batchOperations.length}个操作`)
    },
    
    // 暂停记录
    pauseRecording: () => {
      set({ isRecording: false })
      console.log('暂停操作记录')
    },
    
    // 恢复记录
    resumeRecording: () => {
      set({ isRecording: true })
      console.log('恢复操作记录')
    },
    
    // 获取撤销描述
    getUndoDescription: () => {
      const state = get()
      if (state.undoStack.length === 0) return null
      return state.undoStack[state.undoStack.length - 1].description
    },
    
    // 获取重做描述
    getRedoDescription: () => {
      const state = get()
      if (state.redoStack.length === 0) return null
      return state.redoStack[state.redoStack.length - 1].description
    }
  }
})