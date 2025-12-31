import type { Connection, Task } from '../types'

export interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

/**
 * 检测是否会形成循环依赖
 * 使用深度优先搜索 (DFS) 检测有向图中的环
 */
export function detectCyclicDependency(
  fromTaskId: string,
  toTaskId: string,
  existingConnections: Connection[]
): ValidationResult {
  // 如果是自己连接自己，直接返回错误
  if (fromTaskId === toTaskId) {
    return {
      isValid: false,
      error: '任务不能连接到自己'
    }
  }

  // 构建邻接表表示的有向图
  const graph = new Map<string, string[]>()
  
  // 添加现有连接到图中
  existingConnections.forEach(conn => {
    if (!graph.has(conn.from)) {
      graph.set(conn.from, [])
    }
    graph.get(conn.from)!.push(conn.to)
  })
  
  // 添加新连接到图中
  if (!graph.has(fromTaskId)) {
    graph.set(fromTaskId, [])
  }
  graph.get(fromTaskId)!.push(toTaskId)
  
  // 使用 DFS 检测从 toTaskId 是否能回到 fromTaskId
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true // 发现环
    }
    
    if (visited.has(nodeId)) {
      return false // 已经访问过，没有环
    }
    
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) {
        return true
      }
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // 从新连接的目标节点开始检测
  if (hasCycle(toTaskId)) {
    return {
      isValid: false,
      error: '此连接会形成循环依赖，请检查任务关系'
    }
  }
  
  return { isValid: true }
}

/**
 * 检测重复连接
 */
export function detectDuplicateConnection(
  fromTaskId: string,
  toTaskId: string,
  connectionType: Connection['type'],
  existingConnections: Connection[]
): ValidationResult {
  // 检查是否已存在相同的连接
  const existingConnection = existingConnections.find(
    conn => conn.from === fromTaskId && conn.to === toTaskId
  )
  
  if (existingConnection) {
    if (existingConnection.type === connectionType) {
      return {
        isValid: false,
        error: `已存在相同的${getConnectionTypeLabel(connectionType)}连接`
      }
    } else {
      return {
        isValid: true,
        warning: `已存在${getConnectionTypeLabel(existingConnection.type)}连接，将替换为${getConnectionTypeLabel(connectionType)}连接`
      }
    }
  }
  
  // 检查是否存在反向连接
  const reverseConnection = existingConnections.find(
    conn => conn.from === toTaskId && conn.to === fromTaskId
  )
  
  if (reverseConnection) {
    return {
      isValid: true,
      warning: `存在反向的${getConnectionTypeLabel(reverseConnection.type)}连接，请确认依赖方向是否正确`
    }
  }
  
  return { isValid: true }
}

/**
 * 综合验证连接
 */
export function validateConnection(
  fromTaskId: string,
  toTaskId: string,
  connectionType: Connection['type'],
  existingConnections: Connection[],
  tasks: Task[]
): ValidationResult {
  // 检查任务是否存在
  const fromTask = tasks.find(t => t.id === fromTaskId)
  const toTask = tasks.find(t => t.id === toTaskId)
  
  if (!fromTask || !toTask) {
    return {
      isValid: false,
      error: '任务不存在'
    }
  }
  
  // 检查循环依赖
  const cyclicResult = detectCyclicDependency(fromTaskId, toTaskId, existingConnections)
  if (!cyclicResult.isValid) {
    return cyclicResult
  }
  
  // 检查重复连接
  const duplicateResult = detectDuplicateConnection(fromTaskId, toTaskId, connectionType, existingConnections)
  if (!duplicateResult.isValid) {
    return duplicateResult
  }
  
  // 如果有警告，返回警告信息
  if (duplicateResult.warning) {
    return duplicateResult
  }
  
  return { isValid: true }
}

/**
 * 获取连接类型的中文标签
 */
function getConnectionTypeLabel(type: Connection['type']): string {
  switch (type) {
    case 'strong':
      return '强依赖'
    case 'weak':
      return '弱依赖'
    case 'related':
      return '相关'
    default:
      return '未知'
  }
}

/**
 * 分析任务的依赖关系
 */
export function analyzeTaskDependencies(
  taskId: string,
  connections: Connection[]
): {
  dependencies: string[] // 依赖的任务
  dependents: string[]   // 依赖此任务的任务
  depth: number          // 依赖深度
} {
  const dependencies: string[] = []
  const dependents: string[] = []
  
  connections.forEach(conn => {
    if (conn.from === taskId) {
      dependencies.push(conn.to)
    }
    if (conn.to === taskId) {
      dependents.push(conn.from)
    }
  })
  
  // 计算依赖深度（从此任务开始的最长路径）
  const visited = new Set<string>()
  
  function calculateDepth(currentTaskId: string): number {
    if (visited.has(currentTaskId)) {
      return 0 // 避免循环
    }
    
    visited.add(currentTaskId)
    
    const taskDependencies = connections
      .filter(conn => conn.from === currentTaskId)
      .map(conn => conn.to)
    
    if (taskDependencies.length === 0) {
      visited.delete(currentTaskId)
      return 0
    }
    
    const maxDepth = Math.max(
      ...taskDependencies.map(depId => calculateDepth(depId))
    )
    
    visited.delete(currentTaskId)
    return maxDepth + 1
  }
  
  const depth = calculateDepth(taskId)
  
  return {
    dependencies,
    dependents,
    depth
  }
}

/**
 * 获取任务的完整依赖链
 */
export function getTaskDependencyChain(
  taskId: string,
  connections: Connection[],
  tasks: Task[]
): Task[] {
  const visited = new Set<string>()
  const chain: Task[] = []
  
  function buildChain(currentTaskId: string) {
    if (visited.has(currentTaskId)) {
      return // 避免循环
    }
    
    visited.add(currentTaskId)
    
    const task = tasks.find(t => t.id === currentTaskId)
    if (task) {
      chain.push(task)
    }
    
    // 找到所有依赖的任务
    const dependencies = connections
      .filter(conn => conn.from === currentTaskId)
      .map(conn => conn.to)
    
    dependencies.forEach(depId => buildChain(depId))
  }
  
  buildChain(taskId)
  return chain
}