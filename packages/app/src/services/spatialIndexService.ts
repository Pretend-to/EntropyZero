import RBush from 'rbush'
import type { Task, Connection, ViewportBounds, Position } from '../types'
import { TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from '../hooks/useVirtualizedCanvas'

// 空间索引项接口
interface SpatialItem {
  minX: number
  minY: number
  maxX: number
  maxY: number
  id: string
  type: 'task' | 'connection'
  data: Task | Connection
}

/**
 * 空间索引服务
 * 使用 R-tree 数据结构优化空间查询性能
 */
class SpatialIndexService {
  private taskIndex: RBush<SpatialItem>
  private connectionIndex: RBush<SpatialItem>
  private isInitialized = false

  constructor() {
    this.taskIndex = new RBush<SpatialItem>()
    this.connectionIndex = new RBush<SpatialItem>()
  }

  /**
   * 初始化空间索引
   */
  initialize(tasks: Task[], connections: Connection[]) {
    this.clear()
    this.bulkInsertTasks(tasks)
    this.bulkInsertConnections(connections)
    this.isInitialized = true
  }

  /**
   * 清空所有索引
   */
  clear() {
    this.taskIndex.clear()
    this.connectionIndex.clear()
    this.isInitialized = false
  }

  /**
   * 批量插入任务到索引
   */
  bulkInsertTasks(tasks: Task[]) {
    const items: SpatialItem[] = tasks.map(task => ({
      minX: task.position.x,
      minY: task.position.y,
      maxX: task.position.x + TASK_NODE_WIDTH,
      maxY: task.position.y + TASK_NODE_HEIGHT,
      id: task.id,
      type: 'task',
      data: task,
    }))
    
    this.taskIndex.load(items)
  }

  /**
   * 批量插入连接线到索引
   */
  bulkInsertConnections(connections: Connection[]) {
    // 连接线的边界框需要根据连接的任务位置计算
    const items: SpatialItem[] = connections.map(connection => {
      // 这里需要根据连接的任务位置计算连接线的边界框
      // 暂时使用简单的实现，后续可以优化
      return {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        id: connection.id,
        type: 'connection',
        data: connection,
      }
    })
    
    this.connectionIndex.load(items)
  }

  /**
   * 插入单个任务
   */
  insertTask(task: Task) {
    const item: SpatialItem = {
      minX: task.position.x,
      minY: task.position.y,
      maxX: task.position.x + TASK_NODE_WIDTH,
      maxY: task.position.y + TASK_NODE_HEIGHT,
      id: task.id,
      type: 'task',
      data: task,
    }
    
    this.taskIndex.insert(item)
  }

  /**
   * 更新任务位置
   */
  updateTask(task: Task) {
    // 先删除旧的项
    this.removeTask(task.id)
    // 再插入新的项
    this.insertTask(task)
  }

  /**
   * 删除任务
   */
  removeTask(taskId: string) {
    const items = this.taskIndex.all().filter((item: SpatialItem) => item.id === taskId)
    items.forEach((item: SpatialItem) => this.taskIndex.remove(item))
  }

  /**
   * 插入连接线
   */
  insertConnection(connection: Connection, tasks: Task[]) {
    const fromTask = tasks.find(t => t.id === connection.from)
    const toTask = tasks.find(t => t.id === connection.to)
    
    if (!fromTask || !toTask) return

    const minX = Math.min(fromTask.position.x, toTask.position.x)
    const minY = Math.min(fromTask.position.y, toTask.position.y)
    const maxX = Math.max(fromTask.position.x + TASK_NODE_WIDTH, toTask.position.x + TASK_NODE_WIDTH)
    const maxY = Math.max(fromTask.position.y + TASK_NODE_HEIGHT, toTask.position.y + TASK_NODE_HEIGHT)

    const item: SpatialItem = {
      minX,
      minY,
      maxX,
      maxY,
      id: connection.id,
      type: 'connection',
      data: connection,
    }
    
    this.connectionIndex.insert(item)
  }

  /**
   * 删除连接线
   */
  removeConnection(connectionId: string) {
    const items = this.connectionIndex.all().filter((item: SpatialItem) => item.id === connectionId)
    items.forEach((item: SpatialItem) => this.connectionIndex.remove(item))
  }

  /**
   * 查询视口内的任务
   */
  queryTasks(viewport: ViewportBounds): Task[] {
    const items = this.taskIndex.search({
      minX: viewport.left,
      minY: viewport.top,
      maxX: viewport.right,
      maxY: viewport.bottom,
    })
    
    return items.map((item: SpatialItem) => item.data as Task)
  }

  /**
   * 查询视口内的连接线
   */
  queryConnections(viewport: ViewportBounds): Connection[] {
    const items = this.connectionIndex.search({
      minX: viewport.left,
      minY: viewport.top,
      maxX: viewport.right,
      maxY: viewport.bottom,
    })
    
    return items.map((item: SpatialItem) => item.data as Connection)
  }

  /**
   * 查询指定点附近的任务
   */
  queryTasksNearPoint(point: Position, radius: number = 50): Task[] {
    const items = this.taskIndex.search({
      minX: point.x - radius,
      minY: point.y - radius,
      maxX: point.x + radius,
      maxY: point.y + radius,
    })
    
    return items.map((item: SpatialItem) => item.data as Task)
  }

  /**
   * 查询与指定任务相交的其他任务
   */
  queryIntersectingTasks(task: Task): Task[] {
    const items = this.taskIndex.search({
      minX: task.position.x,
      minY: task.position.y,
      maxX: task.position.x + TASK_NODE_WIDTH,
      maxY: task.position.y + TASK_NODE_HEIGHT,
    })
    
    return items
      .filter((item: SpatialItem) => item.id !== task.id)
      .map((item: SpatialItem) => item.data as Task)
  }

  /**
   * 获取所有任务的边界框
   */
  getAllTasksBounds(): ViewportBounds | null {
    const allItems = this.taskIndex.all()
    if (allItems.length === 0) return null

    const minX = Math.min(...allItems.map((item: SpatialItem) => item.minX))
    const minY = Math.min(...allItems.map((item: SpatialItem) => item.minY))
    const maxX = Math.max(...allItems.map((item: SpatialItem) => item.maxX))
    const maxY = Math.max(...allItems.map((item: SpatialItem) => item.maxY))

    return { left: minX, top: minY, right: maxX, bottom: maxY }
  }

  /**
   * 获取索引统计信息
   */
  getStats() {
    return {
      taskCount: this.taskIndex.all().length,
      connectionCount: this.connectionIndex.all().length,
      isInitialized: this.isInitialized,
    }
  }

  /**
   * 检查索引是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

// 创建全局单例实例
export const spatialIndex = new SpatialIndexService()

// 导出服务类以便测试
export { SpatialIndexService }