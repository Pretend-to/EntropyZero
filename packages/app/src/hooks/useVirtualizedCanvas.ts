import { useMemo, useCallback, useRef } from 'react'
import type { Task, ViewportBounds, Position } from '../types'

// 任务节点的默认尺寸
export const TASK_NODE_WIDTH = 280
export const TASK_NODE_HEIGHT = 120
export const TASK_NODE_PADDING = 20

/**
 * 虚拟化渲染 Hook
 * 只渲染视口内可见的任务节点，提升大量节点场景下的性能
 */
export const useVirtualizedCanvas = (
  tasks: Task[],
  viewport: ViewportBounds,
  zoom: number
) => {
  const prevVisibleTaskCountRef = useRef<number>(-1)
  const isInitialRenderRef = useRef<boolean>(true)

  // 计算扩展的视口边界，包含缓冲区以提供平滑滚动
  const extendedViewport = useMemo(() => {
    const buffer = Math.max(1000, Math.min(2000, 1000 / zoom)) // 增加缓冲区大小，解决新任务不显示的问题
    return {
      left: viewport.left - buffer,
      top: viewport.top - buffer,
      right: viewport.right + buffer,
      bottom: viewport.bottom + buffer,
    }
  }, [viewport, zoom])

  // 检查是否是初始状态（容器还没准备好）
  const isInitialState = viewport.left === -5000 && viewport.top === -5000

  // 过滤可见的任务节点
  const visibleTasks = useMemo(() => {
    // 如果是初始状态，显示所有任务以避免闪烁
    if (isInitialState) {
      return tasks
    }

    const filtered = tasks.filter(task => {
      const taskBounds = {
        left: task.position.x,
        top: task.position.y,
        right: task.position.x + TASK_NODE_WIDTH,
        bottom: task.position.y + TASK_NODE_HEIGHT,
      }

      // 检查任务节点是否与扩展视口相交
      const isVisible = !(
        taskBounds.right < extendedViewport.left ||
        taskBounds.left > extendedViewport.right ||
        taskBounds.bottom < extendedViewport.top ||
        taskBounds.top > extendedViewport.bottom
      )

      return isVisible
    })

    // 只在可见任务数量发生变化时打印调试信息
    if (process.env.NODE_ENV === 'development') {
      const currentVisibleCount = filtered.length
      const shouldLog = isInitialRenderRef.current || currentVisibleCount !== prevVisibleTaskCountRef.current

      if (shouldLog) {
        console.log('[Virtualization Debug]', {
          totalTasks: tasks.length,
          visibleTasks: filtered.length,
          culledTasks: tasks.length - filtered.length,
          cullingRatio: `${((tasks.length - filtered.length) / tasks.length * 100).toFixed(1)}%`,
          viewport,
          extendedViewport,
        })
        
        prevVisibleTaskCountRef.current = currentVisibleCount
        isInitialRenderRef.current = false
      }
    }

    return filtered
  }, [tasks, extendedViewport, viewport, isInitialState])

  // 计算渲染统计信息
  const renderStats = useMemo(() => ({
    totalTasks: tasks.length,
    visibleTasks: visibleTasks.length,
    culledTasks: tasks.length - visibleTasks.length,
    cullingRatio: tasks.length > 0 ? (tasks.length - visibleTasks.length) / tasks.length : 0,
  }), [tasks.length, visibleTasks.length])

  // 检查任务是否在视口内
  const isTaskVisible = useCallback((task: Task): boolean => {
    const taskBounds = {
      left: task.position.x,
      top: task.position.y,
      right: task.position.x + TASK_NODE_WIDTH,
      bottom: task.position.y + TASK_NODE_HEIGHT,
    }

    return !(
      taskBounds.right < viewport.left ||
      taskBounds.left > viewport.right ||
      taskBounds.bottom < viewport.top ||
      taskBounds.top > viewport.bottom
    )
  }, [viewport])

  // 获取指定区域内的任务
  const getTasksInRegion = useCallback((bounds: ViewportBounds): Task[] => {
    return tasks.filter(task => {
      const taskBounds = {
        left: task.position.x,
        top: task.position.y,
        right: task.position.x + TASK_NODE_WIDTH,
        bottom: task.position.y + TASK_NODE_HEIGHT,
      }

      return !(
        taskBounds.right < bounds.left ||
        taskBounds.left > bounds.right ||
        taskBounds.bottom < bounds.top ||
        taskBounds.top > bounds.bottom
      )
    })
  }, [tasks])

  return {
    visibleTasks,
    renderStats,
    isTaskVisible,
    getTasksInRegion,
    extendedViewport,
  }
}

/**
 * 计算视口边界
 */
export const useViewportBounds = (
  containerRef: React.RefObject<HTMLElement>,
  pan: Position,
  zoom: number
) => {
  return useMemo((): ViewportBounds => {
    if (!containerRef.current) {
      // 如果容器还没准备好，返回一个大的默认视口以确保初始渲染
      return { left: -5000, top: -5000, right: 5000, bottom: 5000 }
    }

    const rect = containerRef.current.getBoundingClientRect()
    
    // 如果容器尺寸为0，也返回默认视口
    if (rect.width === 0 || rect.height === 0) {
      return { left: -5000, top: -5000, right: 5000, bottom: 5000 }
    }
    
    // 将屏幕坐标转换为画布坐标
    // tasks-layer 的变换: translate(pan.x, pan.y) scale(zoom)
    // 屏幕坐标到画布坐标的逆变换: (screen - pan) / zoom
    const left = (0 - pan.x) / zoom
    const top = (0 - pan.y) / zoom
    const right = (rect.width - pan.x) / zoom
    const bottom = (rect.height - pan.y) / zoom

    return { left, top, right, bottom }
  }, [containerRef, pan, zoom])
}

/**
 * 性能监控 Hook
 */
export const useCanvasPerformance = () => {
  const measureRenderTime = useCallback(<T>(_label: string, fn: () => T): T => {
    // 移除性能日志输出，只保留测量功能
    return fn()
  }, [])

  const logRenderStats = useCallback((_stats: {
    totalTasks: number
    visibleTasks: number
    culledTasks: number
    cullingRatio: number
  }) => {
    // 移除渲染统计日志输出
  }, [])

  return {
    measureRenderTime,
    logRenderStats,
  }
}