import type { Position, CanvasState } from '../types'

/**
 * 统一的坐标系统转换工具
 * 解决DOM节点和SVG之间的坐标不一致问题
 */

// 任务节点的标准尺寸
export const TASK_NODE_DIMENSIONS = {
  width: 280,
  height: 120,
} as const

/**
 * 将画布逻辑坐标转换为屏幕坐标
 */
export function canvasToScreen(
  canvasPos: Position, 
  canvasState: CanvasState
): Position {
  return {
    x: canvasPos.x * canvasState.zoom + canvasState.pan.x,
    y: canvasPos.y * canvasState.zoom + canvasState.pan.y,
  }
}

/**
 * 将屏幕坐标转换为画布逻辑坐标
 */
export function screenToCanvas(
  screenPos: Position, 
  canvasState: CanvasState
): Position {
  return {
    x: (screenPos.x - canvasState.pan.x) / canvasState.zoom,
    y: (screenPos.y - canvasState.pan.y) / canvasState.zoom,
  }
}

/**
 * 获取任务节点连接点在画布逻辑坐标系中的位置
 */
export function getTaskConnectionPoint(
  taskPosition: Position,
  connectionPoint: 'top' | 'right' | 'bottom' | 'left'
): Position {
  const { width, height } = TASK_NODE_DIMENSIONS
  
  switch (connectionPoint) {
    case 'top':
      return { 
        x: taskPosition.x + width / 2, 
        y: taskPosition.y 
      }
    case 'right':
      return { 
        x: taskPosition.x + width, 
        y: taskPosition.y + height / 2 
      }
    case 'bottom':
      return { 
        x: taskPosition.x + width / 2, 
        y: taskPosition.y + height 
      }
    case 'left':
      return { 
        x: taskPosition.x, 
        y: taskPosition.y + height / 2 
      }
    default:
      return { 
        x: taskPosition.x + width / 2, 
        y: taskPosition.y + height / 2 
      }
  }
}

/**
 * 获取任务节点连接点在屏幕坐标系中的位置
 */
export function getTaskConnectionPointScreen(
  taskPosition: Position,
  connectionPoint: 'top' | 'right' | 'bottom' | 'left',
  canvasState: CanvasState
): Position {
  const canvasPoint = getTaskConnectionPoint(taskPosition, connectionPoint)
  return canvasToScreen(canvasPoint, canvasState)
}

/**
 * 根据两个任务的位置关系选择最佳连接点
 */
export function getBestConnectionPoints(
  fromTaskPosition: Position, 
  toTaskPosition: Position
): {
  fromPoint: 'top' | 'right' | 'bottom' | 'left'
  toPoint: 'top' | 'right' | 'bottom' | 'left'
} {
  const { width, height } = TASK_NODE_DIMENSIONS
  
  const fromCenter = {
    x: fromTaskPosition.x + width / 2,
    y: fromTaskPosition.y + height / 2
  }
  
  const toCenter = {
    x: toTaskPosition.x + width / 2,
    y: toTaskPosition.y + height / 2
  }
  
  const deltaX = toCenter.x - fromCenter.x
  const deltaY = toCenter.y - fromCenter.y
  
  let fromPoint: 'top' | 'right' | 'bottom' | 'left'
  let toPoint: 'top' | 'right' | 'bottom' | 'left'
  
  // 根据相对位置选择连接点
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // 水平方向距离更大
    if (deltaX > 0) {
      fromPoint = 'right'
      toPoint = 'left'
    } else {
      fromPoint = 'left'
      toPoint = 'right'
    }
  } else {
    // 垂直方向距离更大
    if (deltaY > 0) {
      fromPoint = 'bottom'
      toPoint = 'top'
    } else {
      fromPoint = 'top'
      toPoint = 'bottom'
    }
  }
  
  return { fromPoint, toPoint }
}

/**
 * 获取DOM元素的连接点在SVG坐标系中的位置
 * 这个函数通过查询DOM元素的实际位置来确保坐标准确，并转换为SVG坐标系
 */
export function getDOMConnectionPointPosition(
  taskElement: HTMLElement,
  connectionPoint: 'top' | 'right' | 'bottom' | 'left',
  svgContainer?: HTMLElement
): Position | null {
  const connectionPointElement = taskElement.querySelector(
    `.connection-point--${connectionPoint}`
  ) as HTMLElement
  
  if (!connectionPointElement) {
    console.warn(`连接点元素未找到: .connection-point--${connectionPoint}`)
    return null
  }
  
  const rect = connectionPointElement.getBoundingClientRect()
  const position = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
  
  // 如果提供了SVG容器，转换为相对于SVG容器的坐标
  if (svgContainer) {
    const svgRect = svgContainer.getBoundingClientRect()
    return {
      x: position.x - svgRect.left,
      y: position.y - svgRect.top
    }
  }
  
  return position
}

/**
 * 获取任务DOM元素的实际尺寸和位置
 */
export function getTaskDOMBounds(taskElement: HTMLElement): {
  position: Position
  size: { width: number; height: number }
} | null {
  const rect = taskElement.getBoundingClientRect()
  return {
    position: { x: rect.left, y: rect.top },
    size: { width: rect.width, height: rect.height }
  }
}

/**
 * 通过任务ID查找对应的DOM元素
 */
export function findTaskElement(taskId: string): HTMLElement | null {
  return document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement
}

/**
 * 获取SVG容器元素
 */
export function findSVGContainer(): HTMLElement | null {
  return document.querySelector('.connections-layer') as HTMLElement
}

/**
 * 获取任务连接点的SVG坐标（通过DOM查询）
 */
export function getTaskConnectionPointFromDOM(
  taskId: string,
  connectionPoint: 'top' | 'right' | 'bottom' | 'left'
): Position | null {
  const taskElement = findTaskElement(taskId)
  if (!taskElement) {
    console.warn(`任务DOM元素未找到: ${taskId}`)
    return null
  }
  
  const svgContainer = findSVGContainer()
  return getDOMConnectionPointPosition(taskElement, connectionPoint, svgContainer || undefined)
}

/**
 * 生成贝塞尔曲线路径
 */
export function generateBezierPath(
  start: Position, 
  end: Position, 
  controlOffset?: number
): string {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  const offset = controlOffset || Math.min(distance * 0.3, 100)
  
  const controlPoint1 = {
    x: start.x + offset,
    y: start.y,
  }
  
  const controlPoint2 = {
    x: end.x - offset,
    y: end.y,
  }

  return `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`
}