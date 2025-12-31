import React, { useRef } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { exportTasksToJSON, exportTasksToCSV, importTasksFromJSON, clearAllData } from '../utils/dataManager'
import './DataManager.css'

interface DataManagerProps {
  show: boolean
  onClose: () => void
}

const DataManager: React.FC<DataManagerProps> = ({ show, onClose }) => {
  const { tasks, connections, importData } = useTaskStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!show) return null

  const handleExportJSON = () => {
    exportTasksToJSON(tasks, connections)
  }

  const handleExportCSV = () => {
    exportTasksToCSV(tasks)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await importTasksFromJSON(file)
      importData(data.tasks, data.connections)
      alert(`成功导入 ${data.tasks.length} 个任务和 ${data.connections.length} 个连接`)
      onClose()
    } catch (error) {
      alert(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearData = () => {
    clearAllData()
  }

  return (
    <div className="data-manager-overlay" onClick={onClose}>
      <div className="data-manager" onClick={(e) => e.stopPropagation()}>
        <div className="data-manager__header">
          <h2 className="data-manager__title">数据管理</h2>
          <button className="data-manager__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="data-manager__content">
          {/* 数据统计 */}
          <div className="data-manager__section">
            <h3 className="data-manager__section-title">当前数据</h3>
            <div className="data-manager__stats">
              <div className="stat-item">
                <span className="stat-label">任务数量:</span>
                <span className="stat-value">{tasks.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">连接数量:</span>
                <span className="stat-value">{connections.length}</span>
              </div>
            </div>
          </div>

          {/* 导出功能 */}
          <div className="data-manager__section">
            <h3 className="data-manager__section-title">导出数据</h3>
            <div className="data-manager__actions">
              <button 
                className="data-manager__button data-manager__button--primary"
                onClick={handleExportJSON}
              >
                📄 导出为 JSON
              </button>
              <button 
                className="data-manager__button data-manager__button--secondary"
                onClick={handleExportCSV}
              >
                📊 导出为 CSV
              </button>
            </div>
            <p className="data-manager__description">
              JSON 格式包含完整数据（任务和连接），CSV 格式仅包含任务数据
            </p>
          </div>

          {/* 导入功能 */}
          <div className="data-manager__section">
            <h3 className="data-manager__section-title">导入数据</h3>
            <div className="data-manager__actions">
              <button 
                className="data-manager__button data-manager__button--primary"
                onClick={handleImportClick}
              >
                📁 选择 JSON 文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <p className="data-manager__description">
              导入的数据将替换当前所有任务和连接
            </p>
          </div>

          {/* 危险操作 */}
          <div className="data-manager__section data-manager__section--danger">
            <h3 className="data-manager__section-title">危险操作</h3>
            <div className="data-manager__actions">
              <button 
                className="data-manager__button data-manager__button--danger"
                onClick={handleClearData}
              >
                🗑️ 清空所有数据
              </button>
            </div>
            <p className="data-manager__description">
              此操作将永久删除所有任务和连接，无法撤销
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataManager