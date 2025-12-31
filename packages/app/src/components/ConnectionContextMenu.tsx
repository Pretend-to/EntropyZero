import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../hooks/useI18n'
import { validateConnection } from '../utils/connectionValidator'
import { useTaskStore } from '../stores/useTaskStore'
import type { Connection, ConnectionType } from '../types'
import './ContextMenu.css'

interface ConnectionContextMenuProps {
  connection: Connection
  position: { x: number; y: number }
  onClose: () => void
  onDelete: () => void
  onTypeChange: (type: ConnectionType) => void
}

const ConnectionContextMenu: React.FC<ConnectionContextMenuProps> = ({
  connection,
  position,
  onClose,
  onDelete,
  onTypeChange,
}) => {
  const { t } = useI18n()
  const { tasks, connections } = useTaskStore()
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

  const connectionTypeOptions: Array<{ value: ConnectionType; label: string; disabled?: boolean; reason?: string }> = [
    { value: 'strong', label: t('ui:canvas.connectionTypes.strong') },
    { value: 'weak', label: t('ui:canvas.connectionTypes.weak') },
    { value: 'related', label: t('ui:canvas.connectionTypes.related') },
  ]

  // 验证每个连接类型选项
  connectionTypeOptions.forEach(option => {
    if (option.value !== connection.type) {
      // 排除当前连接，验证新类型
      const otherConnections = connections.filter(c => c.id !== connection.id)
      const validation = validateConnection(
        connection.from,
        connection.to,
        option.value,
        otherConnections,
        tasks
      )
      
      if (!validation.isValid) {
        option.disabled = true
        option.reason = validation.error
      }
    }
  })

  const menuContent = (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* 连接类型切换 */}
      <div className="context-menu__section">
        <div className="context-menu__submenu">
          <div className="context-menu__submenu-header">
            <span className="context-menu__label">连接类型</span>
          </div>
          <div className="context-menu__submenu-content">
            {connectionTypeOptions.map((option) => (
              <button
                key={option.value}
                className={`context-menu__item ${connection.type === option.value ? 'context-menu__item--active' : ''} ${option.disabled ? 'context-menu__item--disabled' : ''}`}
                onClick={() => {
                  if (!option.disabled) {
                    onTypeChange(option.value)
                    onClose()
                  }
                }}
                disabled={option.disabled}
                title={option.reason}
              >
                <span className="context-menu__label">{option.label}</span>
                {option.disabled && (
                  <span className="context-menu__disabled-reason">
                    {option.reason}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 基本操作 */}
      <div className="context-menu__section">
        <button 
          className="context-menu__item context-menu__item--danger" 
          onClick={() => {
            onDelete()
            onClose()
          }}
        >
          <span className="context-menu__label">删除连接</span>
        </button>
      </div>
    </div>
  )

  // 使用 Portal 将菜单渲染到 document.body，避免受父容器 transform 影响
  return createPortal(menuContent, document.body)
}

export default ConnectionContextMenu