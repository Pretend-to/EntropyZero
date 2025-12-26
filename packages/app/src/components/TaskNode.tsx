import React from 'react'
import { useI18n } from '../hooks/useI18n'
import type { Task } from '../types'
import './TaskNode.css'

interface TaskNodeProps {
  task: Task
  selected?: boolean
  dragging?: boolean
  onSelect?: () => void
}

const TaskNode: React.FC<TaskNodeProps> = ({ task, selected = false, dragging = false, onSelect }) => {
  const { t, formatRelativeTime } = useI18n()

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
    e.stopPropagation()
    onSelect?.()
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
    <div
      data-task-id={task.id}
      className={`task-node ${selected ? 'task-node--selected' : ''} ${dragging ? 'task-node--dragging' : ''} task-node--${task.status}`}
      style={{
        left: task.position.x,
        top: task.position.y,
        borderColor: getStatusColor(task.status),
        color: getStatusColor(task.status),
      }}
      onClick={handleClick}
    >
      {/* 连接点 */}
      <div className="task-node__connection-points">
        <div className="connection-point connection-point--top" />
        <div className="connection-point connection-point--right" />
        <div className="connection-point connection-point--bottom" />
        <div className="connection-point connection-point--left" />
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
        
        <div className="task-node__title">{task.title}</div>
        
        {task.priority !== 'medium' && (
          <div className={`task-node__priority priority--${task.priority}`}>
            {getPriorityLabel(task.priority)}
          </div>
        )}
      </div>

      {/* 任务描述 */}
      {task.description && (
        <div className="task-node__description">
          {task.description}
        </div>
      )}

      {/* 进度条 */}
      {task.progress !== undefined && (
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

      {/* 子任务 */}
      {task.subtasks && task.subtasks.length > 0 && (
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

      {/* 标签 */}
      {task.tags && task.tags.length > 0 && (
        <div className="task-node__tags">
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
        </div>
      )}

      {/* 任务底部 */}
      <div className="task-node__footer">
        <div className="task-node__date">
          {task.dueDate ? (
            <span className="due-date">
              📅 {formatTaskDate(task.dueDate)}
            </span>
          ) : (
            <span className="created-date">
              {formatTaskDate(task.createdAt)}
            </span>
          )}
        </div>
        
        <div className="task-node__actions">
          <button className="action-btn" title={t('task:actions.edit')}>✏️</button>
          <button className="action-btn" title={t('ui:canvas.connectTasks')}>🔗</button>
          <button className="action-btn" title={t('task:actions.more')}>⋯</button>
        </div>
      </div>
    </div>
  )
}

export default TaskNode