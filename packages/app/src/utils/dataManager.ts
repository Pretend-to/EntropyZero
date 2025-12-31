import type { Task, Connection } from '../types'

export interface ExportData {
  version: string
  exportDate: string
  tasks: Task[]
  connections: Connection[]
}

/**
 * 导出任务数据为JSON文件
 */
export const exportTasksToJSON = (tasks: Task[], connections: Connection[]): void => {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    tasks,
    connections,
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `entropy-zero-tasks-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(link.href)
}

/**
 * 从JSON文件导入任务数据
 */
export const importTasksFromJSON = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as ExportData
        
        // 验证数据格式
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Invalid data format: missing tasks array')
        }
        
        if (!data.connections || !Array.isArray(data.connections)) {
          throw new Error('Invalid data format: missing connections array')
        }
        
        // 验证任务数据结构
        for (const task of data.tasks) {
          if (!task.id || !task.title || !task.position) {
            throw new Error('Invalid task data structure')
          }
        }
        
        resolve(data)
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * 导出任务数据为CSV文件
 */
export const exportTasksToCSV = (tasks: Task[]): void => {
  const headers = [
    'ID',
    'Title', 
    'Description',
    'Status',
    'Priority',
    'Position X',
    'Position Y',
    'Tags',
    'Progress',
    'Created At',
    'Updated At',
    'Due Date'
  ]
  
  const csvContent = [
    headers.join(','),
    ...tasks.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.position.x,
      task.position.y,
      `"${(task.tags || []).join(';')}"`,
      task.progress || 0,
      task.createdAt.toISOString(),
      task.updatedAt.toISOString(),
      task.dueDate ? task.dueDate.toString() : ''
    ].join(','))
  ].join('\n')
  
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `entropy-zero-tasks-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(link.href)
}

/**
 * 清空所有数据（用于重置）
 */
export const clearAllData = (): void => {
  if (confirm('确定要清空所有任务数据吗？此操作不可撤销。')) {
    localStorage.removeItem('entropy-zero-tasks')
    window.location.reload()
  }
}