import { useState, useCallback } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { validateConnection } from '../utils/connectionValidator'
import type { Position, ConnectionType } from '../types'

interface ConnectionCreationState {
  isCreating: boolean
  sourceTaskId: string | null
  sourceConnectionPoint: 'top' | 'right' | 'bottom' | 'left' | null
  sourcePosition: Position
  currentPosition: Position
}

export const useConnectionCreator = () => {
  const { addConnection, updateConnection, tasks, connections } = useTaskStore()
  const [creationState, setCreationState] = useState<ConnectionCreationState>({
    isCreating: false,
    sourceTaskId: null,
    sourceConnectionPoint: null,
    sourcePosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  })

  // 显示验证消息的状态
  const [validationMessage, setValidationMessage] = useState<{
    type: 'error' | 'warning'
    message: string
  } | null>(null)

  // 开始创建连接
  const startConnection = useCallback((
    taskId: string, 
    connectionPoint: 'top' | 'right' | 'bottom' | 'left',
    domPosition: Position // 直接使用DOM元素提供的屏幕坐标
  ) => {
    const sourceTask = tasks.find(t => t.id === taskId)
    if (!sourceTask) return

    console.log('开始连接创建:', {
      taskId,
      connectionPoint,
      domPosition,
      taskPosition: sourceTask.position
    })
    
    setCreationState({
      isCreating: true,
      sourceTaskId: taskId,
      sourceConnectionPoint: connectionPoint,
      sourcePosition: domPosition, // 直接使用DOM提供的屏幕坐标
      currentPosition: domPosition, // 初始位置也是连接点位置
    })
  }, [tasks])

  // 更新连接预览
  const updateConnectionPreview = useCallback((currentPosition: Position) => {
    if (!creationState.isCreating) return

    setCreationState(prev => ({
      ...prev,
      currentPosition, // 屏幕坐标系中的鼠标位置
    }))
  }, [creationState.isCreating])

  // 取消连接创建
  const cancelConnection = useCallback(() => {
    console.log('取消连接创建')
    setCreationState({
      isCreating: false,
      sourceTaskId: null,
      sourceConnectionPoint: null,
      sourcePosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })
  }, [])

  // 完成连接创建
  const completeConnection = useCallback((
    targetTaskId: string,
    _targetConnectionPoint: 'top' | 'right' | 'bottom' | 'left', // 暂时不使用，但保留接口兼容性
    connectionType: ConnectionType = 'strong'
  ) => {
    if (!creationState.isCreating || !creationState.sourceTaskId) return false

    console.log('尝试创建连接:', {
      from: creationState.sourceTaskId,
      to: targetTaskId,
      type: connectionType
    })

    // 验证连接
    const validation = validateConnection(
      creationState.sourceTaskId,
      targetTaskId,
      connectionType,
      connections,
      tasks
    )

    if (!validation.isValid) {
      console.log('连接验证失败:', validation.error)
      setValidationMessage({
        type: 'error',
        message: validation.error || '连接创建失败'
      })
      
      // 3秒后清除错误消息
      setTimeout(() => setValidationMessage(null), 3000)
      
      cancelConnection()
      return false
    }

    // 如果有警告，显示警告但继续创建
    if (validation.warning) {
      console.log('连接警告:', validation.warning)
      setValidationMessage({
        type: 'warning',
        message: validation.warning
      })
      
      // 5秒后清除警告消息
      setTimeout(() => setValidationMessage(null), 5000)
    }

    // 检查是否需要替换现有连接
    const existingConnection = connections.find(
      conn => conn.from === creationState.sourceTaskId && conn.to === targetTaskId
    )

    if (existingConnection && existingConnection.type !== connectionType) {
      // 更新现有连接的类型
      console.log('更新现有连接类型:', existingConnection.id, connectionType)
      updateConnection(existingConnection.id, { type: connectionType })
    } else if (!existingConnection) {
      // 创建新连接
      console.log('创建新连接')
      addConnection({
        from: creationState.sourceTaskId,
        to: targetTaskId,
        type: connectionType,
      })
    }

    console.log('连接创建/更新成功')

    // 重置状态
    setCreationState({
      isCreating: false,
      sourceTaskId: null,
      sourceConnectionPoint: null,
      sourcePosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })

    return true
  }, [creationState.isCreating, creationState.sourceTaskId, addConnection, updateConnection, connections, tasks, cancelConnection])

  return {
    creationState,
    validationMessage,
    startConnection,
    updateConnectionPreview,
    completeConnection,
    cancelConnection,
  }
}