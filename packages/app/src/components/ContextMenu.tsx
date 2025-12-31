import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../hooks/useI18n'
import type { Task } from '../types'
import './ContextMenu.css'

interface ContextMenuProps {
  task: Task
  position: { x: number; y: number }
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onStatusChange: (status: Task['status']) => void
  onPriorityChange: (priority: Task['priority']) => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  task,
  position,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onPriorityChange,
}) => {
  const { t } = useI18n()
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // ESC键关闭菜单
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const statusOptions: Array<{ value: Task['status']; label: string }> = [
    { value: 'todo', label: t('task:status.todo') },
    { value: 'inProgress', label: t('task:status.inProgress') },
    { value: 'waiting', label: t('task:status.waiting') },
    { value: 'done', label: t('task:status.done') },
    { value: 'blocked', label: t('task:status.blocked') },
  ]

  const priorityOptions: Array<{ value: Task['priority']; label: string }> = [
    { value: 'low', label: t('task:priority.low') },
    { value: 'medium', label: t('task:priority.medium') },
    { value: 'high', label: t('task:priority.high') },
    { value: 'urgent', label: t('task:priority.urgent') },
  ]

  const menuContent = (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseEnter={() => {
        console.log('Context menu rendered at:', position)
        console.log('Menu element rect:', menuRef.current?.getBoundingClientRect())
      }}
    >
      {/* 基本操作 */}
      <div className="context-menu__section">
        <button className="context-menu__item" onClick={onEdit}>
          <span className="context-menu__label">{t('task:actions.edit')}</span>
        </button>
        
        <button className="context-menu__item" onClick={onDuplicate}>
          <span className="context-menu__label">{t('task:actions.duplicateTask')}</span>
        </button>
        
        <button 
          className="context-menu__item context-menu__item--danger" 
          onClick={onDelete}
        >
          <span className="context-menu__label">{t('task:actions.deleteTask')}</span>
        </button>
      </div>

      {/* 状态切换 */}
      <div className="context-menu__section">
        <div className="context-menu__submenu">
          <div className="context-menu__submenu-header">
            <span className="context-menu__label">{t('task:fields.status')}</span>
          </div>
          <div className="context-menu__submenu-content">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                className={`context-menu__item ${task.status === option.value ? 'context-menu__item--active' : ''}`}
                onClick={() => onStatusChange(option.value)}
              >
                <span className="context-menu__label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 优先级切换 */}
      <div className="context-menu__section">
        <div className="context-menu__submenu">
          <div className="context-menu__submenu-header">
            <span className="context-menu__label">{t('task:fields.priority')}</span>
          </div>
          <div className="context-menu__submenu-content">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                className={`context-menu__item ${task.priority === option.value ? 'context-menu__item--active' : ''}`}
                onClick={() => onPriorityChange(option.value)}
              >
                <span className="context-menu__label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // 使用 Portal 将菜单渲染到 document.body，避免受父容器 transform 影响
  return createPortal(menuContent, document.body)
}

export default ContextMenu