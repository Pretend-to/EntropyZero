import React, { useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useTaskEditor } from '../hooks/useTaskEditor'
import { useTaskStore } from '../stores/useTaskStore'
import ContextMenu from './ContextMenu'
import type { Task } from '../types'
import './TaskNode.css'

interface TaskNodeProps {
  task: Task
  selected?: boolean
  dragging?: boolean
  showDetails?: boolean
  onSelect?: () => void
  onConnectionStart?: (taskId: string, connectionPoint: 'top' | 'right' | 'bottom' | 'left', position: { x: number, y: number }) => void
  onConnectionEnd?: (taskId: string, connectionPoint: 'top' | 'right' | 'bottom' | 'left') => void
}

const TaskNode: React.FC<TaskNodeProps> = ({ 
  task, 
  selected = false, 
  dragging = false, 
  showDetails = true,
  onSelect,
  onConnectionStart,
  onConnectionEnd
}) => {
  const { t, formatRelativeTime } = useI18n()
  const { removeTask, addTask, setTaskStatus, setTaskPriority } = useTaskStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
  const {
    isEditing,
    startEditing,
    handleKeyDown,
    handleBlur,
    editingRef,
  } = useTaskEditor()

  const getStatusColor = (status: Task['status']) => {
    const colors = {
      todo: 'var(--status-todo)',
      inProgress: 'var(--status-progress)',
      waiting: 'var(--status-waiting)',
      done: 'var(--status-done)',
      blocked: 'var(--status-blocked)',
    }
    return colors[status]
  }

  const getPriorityLabel = (priority: Task['priority']) => {
    return t(`priority.${priority}`, { ns: 'task' })
  }

  const handleClick = (e: React.MouseEvent) => {
    // 如果正在编辑，不处理点击事件
    if (isEditing(task.id, 'title') || isEditing(task.id, 'description')) {
      return
    }
    
    // 检查是否点击了可编辑区域
    const target = e.target as HTMLElement
    const isEditableArea = target.classList.contains('task-node__title') || 
                          target.classList.contains('task-node__description') ||
                          target.classList.contains('task-node__description-placeholder')
    
    if (isEditableArea) {
      // 如果点击的是可编辑区域，不处理选择逻辑
      return
    }
    
    e.stopPropagation()
    onSelect?.()
  }

  // 单击标题开始编辑
  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    startEditing(task, 'title')
  }

  // 单击描述开始编辑
  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    startEditing(task, 'description')
  }

  // 阻止编辑时的事件冒泡
  const handleEditingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent) => {
    console.log('handleContextMenu called!')
    e.preventDefault()
    e.stopPropagation()
    
    // 如果正在编辑，不显示右键菜单
    if (isEditing(task.id, 'title') || isEditing(task.id, 'description')) {
      console.log('Editing mode, not showing context menu')
      return
    }
    
    // 直接使用鼠标的视口坐标，因为现在菜单通过Portal渲染到body
    const x = e.clientX
    const y = e.clientY
    
    console.log('Context menu position:', { x, y })
    
    setContextMenu({ x, y })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  const handleEdit = () => {
    startEditing(task, 'title')
    setContextMenu(null)
  }

  const handleDelete = () => {
    removeTask(task.id)
    setContextMenu(null)
  }

  const handleDuplicate = () => {
    const newTask = {
      ...task,
      title: `${task.title} (副本)`,
      position: {
        x: task.position.x + 20,
        y: task.position.y + 20,
      },
    }
    // 移除不需要复制的字段
    const { id, createdAt, updatedAt, ...taskData } = newTask
    addTask(taskData)
    setContextMenu(null)
  }

  const handleStatusChange = (status: Task['status']) => {
    setTaskStatus(task.id, status)
    setContextMenu(null)
  }

  const handlePriorityChange = (priority: Task['priority']) => {
    setTaskPriority(task.id, priority)
    setContextMenu(null)
  }

  const handleActionEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    startEditing(task, 'title')
  }

  const handleActionConnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 开始连接创建模式
    if (onConnectionStart) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
      onConnectionStart(task.id, 'right', position)
    }
  }

  // 连接点拖拽处理
  const handleConnectionPointMouseDown = (
    e: React.MouseEvent,
    connectionPoint: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (onConnectionStart) {
      // 获取连接点DOM元素的实际屏幕位置
      const connectionPointElement = e.target as HTMLElement
      const rect = connectionPointElement.getBoundingClientRect()
      
      // 获取SVG容器的位置，转换为SVG坐标系
      const svgContainer = document.querySelector('.connections-layer') as HTMLElement
      const svgRect = svgContainer?.getBoundingClientRect()
      
      const position = {
        x: rect.left + rect.width / 2 - (svgRect?.left || 0),
        y: rect.top + rect.height / 2 - (svgRect?.top || 0)
      }
      
      console.log('连接点拖拽开始:', {
        connectionPoint,
        domRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        svgRect: svgRect ? { left: svgRect.left, top: svgRect.top } : null,
        finalPosition: position,
        taskId: task.id
      })
      
      onConnectionStart(task.id, connectionPoint, position)
    }
  }

  // 连接点鼠标进入处理（用于完成连接）
  const handleConnectionPointMouseEnter = (
    _e: React.MouseEvent,
    connectionPoint: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    // 只有在连接创建模式下才处理
    if (onConnectionEnd) {
      onConnectionEnd(task.id, connectionPoint)
    }
  }

  const handleActionMore = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 获取按钮的屏幕位置
    const button = e.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    
    // 显示右键菜单在按钮下方
    setContextMenu({ 
      x: rect.left, 
      y: rect.bottom + 5 
    })
  }

  // Safe date formatting with error handling
  const formatTaskDate = (date: Date | string | undefined) => {
    if (!date) return ''
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return ''
      return formatRelativeTime(dateObj)
    } catch (error) {
      console.warn('Date formatting error:', error)
      return ''
    }
  }

  return (
    <>
      <div
        data-task-id={task.id}
        className={`task-node ${selected ? 'task-node--selected' : ''} ${dragging ? 'task-node--dragging' : ''} ${(isEditing(task.id, 'title') || isEditing(task.id, 'description')) ? 'task-node--editing' : ''} task-node--${task.status} ${!showDetails ? 'task-node--simplified' : ''}`}
        style={{
          left: task.position.x,
          top: task.position.y,
          borderColor: getStatusColor(task.status),
          color: getStatusColor(task.status),
          cursor: (isEditing(task.id, 'title') || isEditing(task.id, 'description')) ? 'default' : 'move',
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* 连接点 */}
        <div className="task-node__connection-points">
          <div 
            className="connection-point connection-point--top" 
            onMouseDown={(e) => handleConnectionPointMouseDown(e, 'top')}
            onMouseEnter={(e) => handleConnectionPointMouseEnter(e, 'top')}
          />
          <div 
            className="connection-point connection-point--right" 
            onMouseDown={(e) => handleConnectionPointMouseDown(e, 'right')}
            onMouseEnter={(e) => handleConnectionPointMouseEnter(e, 'right')}
          />
          <div 
            className="connection-point connection-point--bottom" 
            onMouseDown={(e) => handleConnectionPointMouseDown(e, 'bottom')}
            onMouseEnter={(e) => handleConnectionPointMouseEnter(e, 'bottom')}
          />
          <div 
            className="connection-point connection-point--left" 
            onMouseDown={(e) => handleConnectionPointMouseDown(e, 'left')}
            onMouseEnter={(e) => handleConnectionPointMouseEnter(e, 'left')}
          />
        </div>

        {/* 任务头部 */}
        <div className="task-node__header">
          <div className="task-node__status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(task.status) }}
            >
              {task.status === 'done' && <span className="status-icon">✓</span>}
              {task.status === 'inProgress' && <div className="status-progress" />}
            </div>
          </div>
          
          <div 
            className="task-node__title" 
            contentEditable={isEditing(task.id, 'title')}
            suppressContentEditableWarning={true}
            ref={isEditing(task.id, 'title') ? editingRef : undefined}
            onClick={isEditing(task.id, 'title') ? handleEditingClick : handleTitleClick}
            onKeyDown={isEditing(task.id, 'title') ? handleKeyDown : undefined}
            onBlur={isEditing(task.id, 'title') ? handleBlur : undefined}
            title={isEditing(task.id, 'title') ? t('task:editing.enterToSave') : t('task:editing.clickToEdit')}
          >
            {task.title}
          </div>
          
          {showDetails && task.priority !== 'medium' && (
            <div className={`task-node__priority priority--${task.priority}`}>
              {getPriorityLabel(task.priority)}
            </div>
          )}
        </div>

        {/* 任务描述 - 只在显示详细信息时渲染 */}
        {showDetails && (
          <div 
            className={`task-node__description ${!task.description && !isEditing(task.id, 'description') ? 'task-node__description--empty' : ''}`}
            contentEditable={isEditing(task.id, 'description')}
            suppressContentEditableWarning={true}
            ref={isEditing(task.id, 'description') ? editingRef : undefined}
            onClick={isEditing(task.id, 'description') ? handleEditingClick : handleDescriptionClick}
            onKeyDown={isEditing(task.id, 'description') ? handleKeyDown : undefined}
            onBlur={isEditing(task.id, 'description') ? handleBlur : undefined}
            title={isEditing(task.id, 'description') ? t('task:editing.enterToSave') : t('task:editing.clickToEdit')}
          >
            {isEditing(task.id, 'description') ? (
              task.description || t('task:placeholders.taskDescription')
            ) : task.description ? (
              task.description
            ) : (
              <span className="task-node__description-placeholder">
                {t('task:placeholders.taskDescription')}
              </span>
            )}
          </div>
        )}

        {/* 进度条 */}
        {showDetails && task.progress !== undefined && (
          <div className="task-node__progress">
            <div 
              className="progress-bar"
              style={{ 
                width: `${task.progress}%`,
                backgroundColor: getStatusColor(task.status)
              }}
            />
          </div>
        )}

        {/* 子任务 - 只在显示详细信息时渲染 */}
        {showDetails && task.subtasks && task.subtasks.length > 0 && (
          <div className="task-node__subtasks">
            {task.subtasks.slice(0, 3).map(subtask => (
              <div key={subtask.id} className={`subtask ${subtask.completed ? 'subtask--completed' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={subtask.completed} 
                  readOnly 
                  className="subtask__checkbox"
                />
                <span className="subtask__title">{subtask.title}</span>
              </div>
            ))}
            {task.subtasks.length > 3 && (
              <div className="subtask-more">
                +{task.subtasks.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* 标签 - 简化显示 */}
        {task.tags && task.tags.length > 0 && (
          <div className="task-node__tags">
            {showDetails ? (
              <>
                {task.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="task-tag">
                    #{tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="task-tag task-tag--more">
                    +{task.tags.length - 3}
                  </span>
                )}
              </>
            ) : (
              <span className="task-tag task-tag--count">
                {task.tags.length} tags
              </span>
            )}
          </div>
        )}

        {/* 任务底部 */}
        <div className="task-node__footer">
          <div className="task-node__date">
            {task.dueDate ? (
              <span className="due-date">
                📅 {showDetails ? formatTaskDate(task.dueDate) : '⏰'}
              </span>
            ) : (
              showDetails && (
                <span className="created-date">
                  {formatTaskDate(task.createdAt)}
                </span>
              )
            )}
          </div>
          
          {showDetails && (
            <div className="task-node__actions">
              <button 
                className="action-btn" 
                title={t('task:actions.edit')}
                onClick={handleActionEdit}
              >
                ✏️
              </button>
              <button 
                className="action-btn" 
                title={t('ui:canvas.connectTasks')}
                onClick={handleActionConnect}
              >
                🔗
              </button>
              <button 
                className="action-btn" 
                title={t('task:actions.more')}
                onClick={handleActionMore}
              >
                ⋯
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          task={task}
          position={contextMenu}
          onClose={handleCloseContextMenu}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
        />
      )}
    </>
  )
}

export default TaskNode