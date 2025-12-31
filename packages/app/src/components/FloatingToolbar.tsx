import React from 'react'
import { useI18n } from '../hooks/useI18n'
import { useTaskStore } from '../stores/useTaskStore'
import { useTaskCreator } from '../hooks/useTaskCreator'
import { useUIStore } from '../stores/useUIStore'
import { useUndoRedo } from '../hooks/useUndoRedo'
import './FloatingToolbar.css'

const FloatingToolbar: React.FC = () => {
  const { t } = useI18n()
  const { selectedTaskIds } = useTaskStore()
  const { createTaskAtCenter } = useTaskCreator()
  const { setCommandPaletteOpen } = useUIStore()
  const { undo, redo, canUndo, canRedo, getUndoDescription, getRedoDescription } = useUndoRedo()

  const handleAddTask = () => {
    createTaskAtCenter()
  }

  const handleOpenCommand = () => {
    setCommandPaletteOpen(true)
  }

  const toolbarItems = [
    {
      id: 'add-task',
      icon: '➕',
      label: t('canvas.addTask', { ns: 'ui' }),
      shortcut: 'Cmd+N',
      action: handleAddTask,
    },
    {
      id: 'connect-tasks',
      icon: '🔗',
      label: t('canvas.connectTasks', { ns: 'ui' }),
      shortcut: 'Cmd+L',
      action: () => console.log('Connect tasks'),
      disabled: selectedTaskIds.length < 2,
    },
    {
      id: 'delete-selected',
      icon: '🗑️',
      label: t('canvas.deleteSelected', { ns: 'ui' }),
      shortcut: 'Del',
      action: () => console.log('Delete selected'),
      disabled: selectedTaskIds.length === 0,
    },
    {
      id: 'divider',
      type: 'divider' as const,
    },
    {
      id: 'undo',
      icon: '↶',
      label: t('canvas.undo', { ns: 'ui' }),
      shortcut: 'Cmd+Z',
      action: undo,
      disabled: !canUndo,
      tooltip: getUndoDescription() ? `撤销: ${getUndoDescription()}` : undefined,
    },
    {
      id: 'redo',
      icon: '↷',
      label: t('canvas.redo', { ns: 'ui' }),
      shortcut: 'Cmd+Shift+Z',
      action: redo,
      disabled: !canRedo,
      tooltip: getRedoDescription() ? `重做: ${getRedoDescription()}` : undefined,
    },
    {
      id: 'divider2',
      type: 'divider' as const,
    },
    {
      id: 'command-palette',
      icon: '⌘',
      label: t('canvas.commandPalette', { ns: 'ui' }),
      shortcut: 'Cmd+K',
      action: handleOpenCommand,
    },
  ]

  return (
    <div className="floating-toolbar">
      {toolbarItems.map((item) => {
        if (item.type === 'divider') {
          return <div key={item.id} className="toolbar-divider" />
        }

        return (
          <button
            key={item.id}
            className={`toolbar-btn ${item.disabled ? 'toolbar-btn--disabled' : ''}`}
            onClick={item.action}
            disabled={item.disabled}
            title={item.tooltip || `${item.label} ${item.shortcut ? `(${item.shortcut})` : ''}`}
          >
            <span className="toolbar-btn__icon">{item.icon}</span>
            <span className="toolbar-btn__label">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default FloatingToolbar