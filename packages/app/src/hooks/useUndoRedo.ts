import { useCallback } from 'react'
import { useHistoryStore, type Operation } from '../stores/useHistoryStore'
import { useTaskStore } from '../stores/useTaskStore'

export const useUndoRedo = () => {
  const { 
    undo: undoOperation, 
    redo: redoOperation, 
    canUndo, 
    canRedo,
    getUndoDescription,
    getRedoDescription,
    pauseRecording,
    resumeRecording
  } = useHistoryStore()
  
  const { 
    updateTask, 
    removeTask, 
    moveTask,
    updateConnection,
    removeConnection
  } = useTaskStore()

  // 执行撤销
  const undo = useCallback(() => {
    const operation = undoOperation()
    if (!operation) return false

    // 暂停记录，避免撤销操作本身被记录
    pauseRecording()
    
    try {
      executeReverseOperation(operation)
      return true
    } catch (error) {
      console.error('撤销操作失败:', error)
      return false
    } finally {
      resumeRecording()
    }
  }, [undoOperation, pauseRecording, resumeRecording])

  // 执行重做
  const redo = useCallback(() => {
    const operation = redoOperation()
    if (!operation) return false

    // 暂停记录，避免重做操作本身被记录
    pauseRecording()
    
    try {
      executeOperation(operation)
      return true
    } catch (error) {
      console.error('重做操作失败:', error)
      return false
    } finally {
      resumeRecording()
    }
  }, [redoOperation, pauseRecording, resumeRecording])

  // 执行操作（用于重做）
  const executeOperation = (operation: Operation) => {
    switch (operation.type) {
      case 'CREATE_TASK':
        if (operation.data.task) {
          // 重新创建任务，使用原始ID
          const taskData = { ...operation.data.task }
          delete (taskData as any).id
          delete (taskData as any).createdAt
          delete (taskData as any).updatedAt
          
          // 直接添加任务，保持原始ID
          useTaskStore.setState((state) => ({
            tasks: [...state.tasks, operation.data.task!]
          }))
        }
        break

      case 'UPDATE_TASK':
        if (operation.data.newTask) {
          updateTask(operation.data.newTask.id, operation.data.newTask)
        }
        break

      case 'DELETE_TASK':
        if (operation.data.taskId) {
          removeTask(operation.data.taskId)
        }
        break

      case 'MOVE_TASK':
        if (operation.data.taskId && operation.data.position) {
          moveTask(operation.data.taskId, operation.data.position)
        }
        break

      case 'CREATE_CONNECTION':
        if (operation.data.connection) {
          // 直接添加连接，保持原始ID
          useTaskStore.setState((state) => ({
            connections: [...state.connections, operation.data.connection!]
          }))
        }
        break

      case 'UPDATE_CONNECTION':
        if (operation.data.newConnection) {
          updateConnection(operation.data.newConnection.id, operation.data.newConnection)
        }
        break

      case 'DELETE_CONNECTION':
        if (operation.data.connectionId) {
          removeConnection(operation.data.connectionId)
        }
        break

      case 'BATCH_OPERATION':
        if (operation.data.operations) {
          operation.data.operations.forEach(executeOperation)
        }
        break

      default:
        console.warn('未知的操作类型:', operation.type)
    }
  }

  // 执行反向操作（用于撤销）
  const executeReverseOperation = (operation: Operation) => {
    switch (operation.type) {
      case 'CREATE_TASK':
        // 撤销创建 = 删除
        if (operation.data.task) {
          removeTask(operation.data.task.id)
        }
        break

      case 'UPDATE_TASK':
        // 撤销更新 = 恢复旧值
        if (operation.data.oldTask) {
          updateTask(operation.data.oldTask.id, operation.data.oldTask)
        }
        break

      case 'DELETE_TASK':
        // 撤销删除 = 重新创建
        if (operation.data.task) {
          useTaskStore.setState((state) => ({
            tasks: [...state.tasks, operation.data.task!]
          }))
        }
        break

      case 'MOVE_TASK':
        // 撤销移动 = 移回原位置
        if (operation.data.taskId && operation.data.oldPosition) {
          moveTask(operation.data.taskId, operation.data.oldPosition)
        }
        break

      case 'CREATE_CONNECTION':
        // 撤销创建连接 = 删除连接
        if (operation.data.connection) {
          removeConnection(operation.data.connection.id)
        }
        break

      case 'UPDATE_CONNECTION':
        // 撤销更新连接 = 恢复旧值
        if (operation.data.oldConnection) {
          updateConnection(operation.data.oldConnection.id, operation.data.oldConnection)
        }
        break

      case 'DELETE_CONNECTION':
        // 撤销删除连接 = 重新创建
        if (operation.data.connection) {
          useTaskStore.setState((state) => ({
            connections: [...state.connections, operation.data.connection!]
          }))
        }
        break

      case 'BATCH_OPERATION':
        // 撤销批量操作 = 反向执行所有操作
        if (operation.data.operations) {
          // 反向顺序执行
          [...operation.data.operations].reverse().forEach(executeReverseOperation)
        }
        break

      default:
        console.warn('未知的操作类型:', operation.type)
    }
  }

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription
  }
}