import type { Task, Connection, TaskStatus, TaskPriority } from '../types'

const taskTitles = [
  '设计用户界面原型',
  '实现登录功能',
  '优化数据库查询',
  '编写单元测试',
  '部署到生产环境',
  '修复性能问题',
  '添加国际化支持',
  '集成第三方API',
  '重构代码结构',
  '更新文档',
  '配置CI/CD流程',
  '实现缓存机制',
  '添加错误监控',
  '优化移动端体验',
  '实现搜索功能',
  '添加数据导出',
  '设计数据库架构',
  '实现权限系统',
  '优化SEO',
  '添加分析统计',
]

const taskDescriptions = [
  '使用 Figma 设计交互原型，确保用户体验流畅',
  '实现用户认证和授权机制，支持多种登录方式',
  '分析慢查询并优化数据库索引，提升查询性能',
  '编写全面的单元测试，确保代码质量和稳定性',
  '配置生产环境部署流程，确保服务稳定运行',
  '使用性能分析工具定位并修复性能瓶颈',
  '添加多语言支持，提升国际化用户体验',
  '集成支付、地图等第三方服务API',
  '重构遗留代码，提升代码可维护性',
  '更新技术文档和用户手册',
  '配置自动化构建和部署流程',
  '实现Redis缓存，提升系统响应速度',
  '集成错误监控和日志分析系统',
  '优化移动端界面和交互体验',
  '实现全文搜索和高级筛选功能',
  '添加数据导出功能，支持多种格式',
  '设计高效的数据库表结构',
  '实现基于角色的权限控制系统',
  '优化页面SEO，提升搜索引擎排名',
  '集成用户行为分析和统计功能',
]

const tags = [
  '前端', '后端', '设计', '测试', '部署', '优化', '文档', 
  'API', '数据库', '安全', '移动端', '性能', '国际化',
  '监控', '搜索', '缓存', '权限', 'SEO', '分析'
]

const statuses: TaskStatus[] = ['todo', 'inProgress', 'waiting', 'done', 'blocked']
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

/**
 * 生成随机任务数据
 */
export function generateRandomTask(index: number): Task {
  const titleIndex = index % taskTitles.length
  const descIndex = index % taskDescriptions.length
  
  // 在画布上分布任务，创建网格布局
  const gridSize = Math.ceil(Math.sqrt(index + 1))
  const row = Math.floor(index / gridSize)
  const col = index % gridSize
  
  const baseX = col * 350 + Math.random() * 100 - 50
  const baseY = row * 200 + Math.random() * 50 - 25
  
  const randomTags = tags
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 1)
  
  const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 过去30天内
  const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // 创建后7天内
  
  return {
    id: `task-${index + 1}`,
    title: `${taskTitles[titleIndex]} ${index + 1}`,
    description: taskDescriptions[descIndex],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    position: { x: baseX, y: baseY },
    tags: randomTags,
    createdAt,
    updatedAt,
    progress: Math.random() > 0.5 ? Math.floor(Math.random() * 101) : undefined,
    dueDate: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) : undefined,
  }
}

/**
 * 生成随机连接线
 */
export function generateRandomConnections(tasks: Task[], connectionCount: number = 10): Connection[] {
  const connections: Connection[] = []
  const connectionTypes: Connection['type'][] = ['strong', 'weak', 'related']
  
  for (let i = 0; i < connectionCount && i < tasks.length - 1; i++) {
    const fromIndex = Math.floor(Math.random() * tasks.length)
    let toIndex = Math.floor(Math.random() * tasks.length)
    
    // 确保不连接到自己
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * tasks.length)
    }
    
    // 检查是否已存在相同的连接
    const existingConnection = connections.find(
      conn => 
        (conn.from === tasks[fromIndex].id && conn.to === tasks[toIndex].id) ||
        (conn.from === tasks[toIndex].id && conn.to === tasks[fromIndex].id)
    )
    
    if (!existingConnection) {
      connections.push({
        id: `conn-${i + 1}`,
        from: tasks[fromIndex].id,
        to: tasks[toIndex].id,
        type: connectionTypes[Math.floor(Math.random() * connectionTypes.length)],
      })
    }
  }
  
  return connections
}

/**
 * 生成测试数据集
 */
export function generateTestData(taskCount: number = 50) {
  const tasks: Task[] = []
  
  for (let i = 0; i < taskCount; i++) {
    tasks.push(generateRandomTask(i))
  }
  
  const connections = generateRandomConnections(tasks, Math.floor(taskCount * 0.2))
  
  return { tasks, connections }
}

/**
 * 生成大量测试数据用于性能测试
 */
export function generatePerformanceTestData(taskCount: number = 1000) {
  console.log(`生成 ${taskCount} 个任务的性能测试数据...`)
  const startTime = performance.now()
  
  const data = generateTestData(taskCount)
  
  const endTime = performance.now()
  console.log(`数据生成完成，耗时: ${(endTime - startTime).toFixed(2)}ms`)
  console.log(`任务数量: ${data.tasks.length}`)
  console.log(`连接线数量: ${data.connections.length}`)
  
  return data
}