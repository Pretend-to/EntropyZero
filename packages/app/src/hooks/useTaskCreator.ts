import { useCallback } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useI18n } from './useI18n'
import { TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from './useVirtualizedCanvas'
import type { Position } from '../types'

interface CreateTaskOptions {
  position?: Position
  title?: string
  description?: string
  status?: 'todo' | 'inProgress' | 'waiting' | 'done' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
}

/**
 * 统一的任务创建 Hook
 * 提供一致的任务创建逻辑和默认值
 */
export const useTaskCreator = () => {
  const { addTask } = useTaskStore()
  const { t } = useI18n()

  /**
   * 创建新任务
   * @param options 任务创建选项
   * @returns 创建的任务ID
   */
  const createTask = useCallback((options: CreateTaskOptions = {}) => {
    const {
      position = { x: 200, y: 200 }, // 默认位置
      title = t('task:placeholders.taskTitle'), // 统一翻译键
      description,
      status = 'todo',
      priority = 'medium',
      tags = [],
    } = options

    const taskId = addTask({
      title,
      description,
      status,
      priority,
      position,
      tags,
    })

    return taskId
  }, [addTask, t])

  /**
   * 在指定位置创建任务（用于双击画布）
   */
  const createTaskAtPosition = useCallback((position: Position, options: Omit<CreateTaskOptions, 'position'> = {}) => {
    return createTask({ ...options, position })
  }, [createTask])

  /**
   * 在画布中心创建任务（用于快捷键和按钮）
   */
  const createTaskAtCenter = useCallback((canvasState?: { pan: Position; zoom: number }, options: CreateTaskOptions = {}) => {
    let position = { x: 200, y: 200 } // 默认位置

    // 如果提供了画布状态，计算画布中心位置
    if (canvasState) {
      const centerX = (window.innerWidth / 2 - canvasState.pan.x) / canvasState.zoom
      const centerY = (window.innerHeight / 2 - canvasState.pan.y) / canvasState.zoom
      position = { x: centerX - TASK_NODE_WIDTH / 2, y: centerY - TASK_NODE_HEIGHT / 2 } // 减去任务节点的一半尺寸
    }

    return createTask({ ...options, position })
  }, [createTask])

  /**
   * 基于现有任务创建相关任务（用于任务拆解等）
   */
  const createRelatedTask = useCallback((baseTask: { position: Position; tags?: string[] }, options: CreateTaskOptions = {}) => {
    // 在基础任务旁边创建新任务
    const offset = TASK_NODE_WIDTH + 40 // 任务节点宽度 + 间距
    const newPosition = {
      x: baseTask.position.x + offset,
      y: baseTask.position.y,
    }

    return createTask({
      ...options,
      position: newPosition,
      tags: options.tags || baseTask.tags || [],
    })
  }, [createTask])

  return {
    createTask,
    createTaskAtPosition,
    createTaskAtCenter,
    createRelatedTask,
  }
}