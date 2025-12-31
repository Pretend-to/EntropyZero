import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useVirtualizedCanvas, useViewportBounds, useCanvasPerformance, TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from './useVirtualizedCanvas'
import { spatialIndex } from '../services/spatialIndexService'
import type { Task, Connection, CanvasState, Position } from '../types'

/**
 * 画布渲染器 Hook
 * 集成虚拟化渲染、空间索引和性能优化
 */
export const useCanvasRenderer = (
  tasks: Task[],
  connections: Connection[],
  canvasState: CanvasState,
  containerRef: React.RefObject<HTMLElement>
) => {
  const { measureRenderTime } = useCanvasPerformance()
  const isInitializedRef = useRef(false)

  // 计算视口边界
  const viewport = useViewportBounds(containerRef, canvasState.pan, canvasState.zoom)

  // 虚拟化渲染
  const {
    visibleTasks,
    renderStats,
    isTaskVisible,
    getTasksInRegion,
    extendedViewport,
  } = useVirtualizedCanvas(tasks, viewport, canvasState.zoom)

  // 临时禁用虚拟化渲染来调试任务创建问题
  const shouldUseVirtualization = false
  const finalVisibleTasks = shouldUseVirtualization ? visibleTasks : tasks

  // 初始化空间索引
  useEffect(() => {
    if (tasks.length > 0 && !isInitializedRef.current) {
      measureRenderTime('Spatial Index Initialization', () => {
        spatialIndex.initialize(tasks, connections)
      })
      isInitializedRef.current = true
    }
  }, [tasks, connections, measureRenderTime])

  // 更新空间索引
  useEffect(() => {
    if (isInitializedRef.current) {
      measureRenderTime('Spatial Index Update', () => {
        // 重新初始化索引（简单实现，后续可优化为增量更新）
        spatialIndex.initialize(tasks, connections)
      })
    }
  }, [tasks, connections, measureRenderTime])

  // 使用空间索引查询可见任务（暂时禁用，直接使用原始任务列表）
  // const spatialVisibleTasks = useMemo(() => {
  //   if (!spatialIndex.isReady()) return finalVisibleTasks
  //   
  //   return measureRenderTime('Spatial Query Tasks', () => {
  //     return spatialIndex.queryTasks(extendedViewport)
  //   }) || [] // 确保始终返回数组
  // }, [extendedViewport, finalVisibleTasks, measureRenderTime])

  // 查询可见连接线
  const visibleConnections = useMemo(() => {
    // 始终使用简单过滤，确保连接线能够立即显示
    return connections.filter(connection => {
      const fromTask = tasks.find(t => t.id === connection.from)
      const toTask = tasks.find(t => t.id === connection.to)
      
      // 只要源任务和目标任务都存在，就显示连接线
      if (!fromTask || !toTask) return false
      
      // 如果使用虚拟化，检查任务是否可见
      if (shouldUseVirtualization) {
        return isTaskVisible(fromTask) || isTaskVisible(toTask)
      }
      
      // 不使用虚拟化时，显示所有有效连接
      return true
    })
  }, [connections, tasks, shouldUseVirtualization, isTaskVisible])

  // 查找指定点附近的任务
  const findTasksNearPoint = useCallback((point: Position, radius: number = 50): Task[] => {
    if (!spatialIndex.isReady()) {
      // 回退到线性搜索
      return tasks.filter(task => {
        const distance = Math.sqrt(
          Math.pow(task.position.x - point.x, 2) + Math.pow(task.position.y - point.y, 2)
        )
        return distance <= radius
      })
    }

    return spatialIndex.queryTasksNearPoint(point, radius)
  }, [tasks])

  // 查找与指定任务相交的任务
  const findIntersectingTasks = useCallback((task: Task): Task[] => {
    if (!spatialIndex.isReady()) {
      // 回退到简单边界框检测
      return tasks.filter(otherTask => {
        if (otherTask.id === task.id) return false
        
        const task1Bounds = {
          left: task.position.x,
          top: task.position.y,
          right: task.position.x + TASK_NODE_WIDTH,
          bottom: task.position.y + TASK_NODE_HEIGHT,
        }
        
        const task2Bounds = {
          left: otherTask.position.x,
          top: otherTask.position.y,
          right: otherTask.position.x + TASK_NODE_WIDTH,
          bottom: otherTask.position.y + TASK_NODE_HEIGHT,
        }
        
        return !(
          task1Bounds.right < task2Bounds.left ||
          task1Bounds.left > task2Bounds.right ||
          task1Bounds.bottom < task2Bounds.top ||
          task1Bounds.top > task2Bounds.bottom
        )
      })
    }

    return spatialIndex.queryIntersectingTasks(task)
  }, [tasks])

  // 获取所有任务的边界框
  const getAllTasksBounds = useCallback(() => {
    if (!spatialIndex.isReady()) {
      if (tasks.length === 0) return null
      
      const minX = Math.min(...tasks.map(t => t.position.x))
      const minY = Math.min(...tasks.map(t => t.position.y))
      const maxX = Math.max(...tasks.map(t => t.position.x + TASK_NODE_WIDTH))
      const maxY = Math.max(...tasks.map(t => t.position.y + TASK_NODE_HEIGHT))
      
      return { left: minX, top: minY, right: maxX, bottom: maxY }
    }

    return spatialIndex.getAllTasksBounds()
  }, [tasks])

  // 渲染层级管理
  const renderLayers = useMemo(() => {
    const shouldRenderGrid = canvasState.zoom > 0.3
    const shouldRenderConnections = canvasState.zoom > 0.2
    const shouldRenderTaskDetails = canvasState.zoom > 0.5
    
    return {
      grid: shouldRenderGrid,
      connections: shouldRenderConnections,
      taskDetails: shouldRenderTaskDetails,
    }
  }, [canvasState.zoom])

  return {
    // 渲染数据 - 临时禁用空间索引，直接使用虚拟化结果
    visibleTasks: finalVisibleTasks,
    visibleConnections,
    viewport,
    extendedViewport,
    renderLayers,
    
    // 统计信息
    renderStats: {
      ...renderStats,
      spatialIndexStats: spatialIndex.getStats(),
    },
    
    // 查询方法
    findTasksNearPoint,
    findIntersectingTasks,
    getAllTasksBounds,
    getTasksInRegion,
    isTaskVisible,
    
    // 性能工具
    measureRenderTime,
  }
}