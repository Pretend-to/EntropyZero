import { useState, useCallback, useRef, useEffect } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import type { Task } from '../types'

interface EditingState {
  taskId: string | null
  field: 'title' | 'description' | null
  originalValue: string
}

/**
 * 任务编辑 Hook - 使用 contenteditable 实现无感编辑
 * 支持无感编辑：单击进入编辑，点击外部自动保存
 */
export const useTaskEditor = () => {
  const { updateTask } = useTaskStore()
  const [editingState, setEditingState] = useState<EditingState>({
    taskId: null,
    field: null,
    originalValue: '',
  })

  const editingRef = useRef<HTMLDivElement>(null)

  // 开始编辑
  const startEditing = useCallback((task: Task, field: 'title' | 'description') => {
    const value = field === 'title' ? task.title : (task.description || '')
    setEditingState({
      taskId: task.id,
      field,
      originalValue: value,
    })
  }, [])

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (!editingState.taskId || !editingState.field || !editingRef.current) return

    const currentValue = editingRef.current.textContent || ''
    const trimmedValue = currentValue.trim()
    
    // 如果值没有变化，直接取消编辑
    if (trimmedValue === editingState.originalValue) {
      cancelEdit()
      return
    }

    // 标题不能为空
    if (editingState.field === 'title' && !trimmedValue) {
      // 恢复原值
      editingRef.current.textContent = editingState.originalValue
      return
    }

    // 更新任务
    updateTask(editingState.taskId, {
      [editingState.field]: trimmedValue || undefined,
    })

    // 结束编辑
    setEditingState({
      taskId: null,
      field: null,
      originalValue: '',
    })
  }, [editingState, updateTask])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    if (editingRef.current && editingState.originalValue !== null) {
      editingRef.current.textContent = editingState.originalValue
    }
    setEditingState({
      taskId: null,
      field: null,
      originalValue: '',
    })
  }, [editingState.originalValue])

  // 检查是否正在编辑指定任务的指定字段
  const isEditing = useCallback((taskId: string, field: 'title' | 'description') => {
    return editingState.taskId === taskId && editingState.field === field
  }, [editingState])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }, [saveEdit, cancelEdit])

  // 处理失去焦点
  const handleBlur = useCallback(() => {
    // 延迟保存，让其他事件有机会处理
    setTimeout(() => {
      if (editingState.taskId && editingState.field) {
        saveEdit()
      }
    }, 100)
  }, [editingState.taskId, editingState.field, saveEdit])

  // 全局点击监听器 - 点击外部保存
  useEffect(() => {
    if (!editingState.taskId) return

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // 如果点击的是当前编辑的元素，不处理
      if (editingRef.current && editingRef.current.contains(target)) {
        return
      }
      
      // 如果点击的是当前编辑的任务节点内的其他元素，不处理
      const taskNode = target.closest(`[data-task-id="${editingState.taskId}"]`)
      if (taskNode) {
        // 检查是否点击了同一个任务的其他可编辑区域
        const isOtherEditableArea = target.classList.contains('task-node__title') || 
                                   target.classList.contains('task-node__description') ||
                                   target.classList.contains('task-node__description-placeholder')
        
        if (isOtherEditableArea) {
          // 如果点击了同一个任务的其他可编辑区域，先保存当前编辑
          saveEdit()
        }
        return
      }
      
      // 点击外部，保存编辑
      saveEdit()
    }

    // 使用 capture 阶段监听，确保在其他事件处理之前执行
    document.addEventListener('mousedown', handleGlobalClick, true)
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick, true)
    }
  }, [editingState.taskId, saveEdit])

  // 自动聚焦到编辑元素
  useEffect(() => {
    if (editingState.taskId && editingRef.current) {
      editingRef.current.focus()
      
      // 选中所有文本
      const range = document.createRange()
      range.selectNodeContents(editingRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [editingState.taskId, editingState.field])

  return {
    // 状态
    editingState,
    isEditing,
    
    // 操作
    startEditing,
    saveEdit,
    cancelEdit,
    
    // 事件处理
    handleKeyDown,
    handleBlur,
    
    // Ref
    editingRef,
  }
}