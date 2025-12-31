import { useEffect } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import type { TaskStatus, TaskPriority } from '../types'

/**
 * 键盘快捷键 Hook
 * 处理任务相关的键盘快捷键
 */
export const useKeyboardShortcuts = () => {
  const { selectedTaskIds, removeTask, setTaskStatus, setTaskPriority, clearSelection } = useTaskStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在输入或编辑，不处理快捷键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      // 如果没有选中的任务，不处理任务相关快捷键
      if (selectedTaskIds.length === 0) {
        return
      }

      // Delete 键删除选中任务
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        selectedTaskIds.forEach(taskId => removeTask(taskId))
        return
      }

      // Escape 键取消选择
      if (e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
        return
      }

      // 数字键切换状态 (1-5)
      if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        const statusMap: Record<string, TaskStatus> = {
          '1': 'todo',
          '2': 'inProgress', 
          '3': 'waiting',
          '4': 'done',
          '5': 'blocked',
        }
        const status = statusMap[e.key]
        if (status) {
          selectedTaskIds.forEach(taskId => setTaskStatus(taskId, status))
        }
        return
      }

      // Shift + 数字键切换优先级 (1-4)
      if (e.shiftKey && e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        const priorityMap: Record<string, TaskPriority> = {
          '1': 'low',
          '2': 'medium',
          '3': 'high', 
          '4': 'urgent',
        }
        const priority = priorityMap[e.key]
        if (priority) {
          selectedTaskIds.forEach(taskId => setTaskPriority(taskId, priority))
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTaskIds, removeTask, setTaskStatus, setTaskPriority, clearSelection])

  return {
    // 返回快捷键说明，用于显示帮助信息
    shortcuts: {
      delete: 'Delete/Backspace - 删除选中任务',
      escape: 'Escape - 取消选择',
      status: '1-5 - 切换状态 (待办/进行中/等待/完成/阻塞)',
      priority: 'Shift+1-4 - 切换优先级 (低/中/高/紧急)',
    }
  }
}