import React from 'react'
import { useI18n } from '../hooks/useI18n'
import { useUIStore } from '../stores/useUIStore'
import { useTaskStore } from '../stores/useTaskStore'
import { LanguageSwitcher } from './LanguageSwitcher'
import './Sidebar.css'

interface SidebarProps {
  collapsed?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { t } = useI18n()
  const { setActiveView, activeView } = useUIStore()
  const { tasks, getTasksByStatus } = useTaskStore()

  const projectStats = {
    total: tasks.length,
    todo: getTasksByStatus('todo').length,
    inProgress: getTasksByStatus('inProgress').length,
    done: getTasksByStatus('done').length,
    blocked: getTasksByStatus('blocked').length,
  }

  const menuItems = [
    {
      id: 'projects',
      icon: '📁',
      label: t('ui:sidebar.projects'),
      children: [
        { id: 'current', icon: '🎯', label: t('ui:sidebar.currentProject'), count: projectStats.total },
        { id: 'personal', icon: '📋', label: t('ui:sidebar.personalTasks'), count: 5 },
        { id: 'archived', icon: '🗂️', label: t('ui:sidebar.archivedProjects'), count: 23 },
      ]
    },
    {
      id: 'views',
      icon: '📊',
      label: t('ui:sidebar.views'),
      children: [
        { id: 'today', icon: '🗓️', label: t('time.today', { ns: 'common' }), count: 3 },
        { id: 'week', icon: '📅', label: t('time.thisWeek', { ns: 'common' }), count: 7 },
        { id: 'important', icon: '⭐', label: t('ui:sidebar.importantTasks'), count: 4 },
        { id: 'urgent', icon: '🔥', label: t('ui:sidebar.urgentTasks'), count: 2 },
        { id: 'completed', icon: '✅', label: t('ui:sidebar.completedTasks'), count: projectStats.done },
      ]
    },
    {
      id: 'tags',
      icon: '🏷️',
      label: t('ui:sidebar.tags'),
      children: [
        { id: 'important', icon: '🔴', label: t('ui:sidebar.tag.important'), count: 6 },
        { id: 'urgent', icon: '🟠', label: t('ui:sidebar.tag.urgent'), count: 3 },
        { id: 'development', icon: '🔵', label: t('ui:sidebar.tag.development'), count: 8 },
        { id: 'design', icon: '🟢', label: t('ui:sidebar.tag.design'), count: 4 },
        { id: 'learning', icon: '🟣', label: t('ui:sidebar.tag.learning'), count: 5 },
      ]
    }
  ]

  if (collapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">🚀</span>
          </div>
        </div>
        
        <nav className="sidebar__nav">
          {menuItems.map((section) => (
            <div key={section.id} className="sidebar__section">
              <button 
                className="sidebar__item sidebar__item--icon-only"
                title={section.label}
              >
                <span className="sidebar__icon">{section.icon}</span>
              </button>
            </div>
          ))}
        </nav>
        
        <div className="sidebar__footer">
          <div className="sidebar__user sidebar__user--collapsed">
            <div className="sidebar__avatar">H</div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon">🚀</span>
          <span className="sidebar__logo-text gradient-text">EntropyZero</span>
        </div>
        
        <div className="sidebar__search">
          <div className="search-box">
            <span className="search-box__icon">🔍</span>
            <input
              type="text"
              className="search-box__input"
              placeholder={t('ui:commandPalette.placeholder')}
            />
          </div>
        </div>
        
        <div className="sidebar__quick-actions">
          <button className="quick-action">
            <span>➕</span>
            <span>{t('task:actions.createTask')}</span>
          </button>
          <button className="quick-action">
            <span>📋</span>
            <span>{t('ui:sidebar.addProject')}</span>
          </button>
        </div>
      </div>
      
      <div className="sidebar__content">
        {menuItems.map((section) => (
          <div key={section.id} className="sidebar__section">
            <div className="sidebar__section-header">
              <h3 className="sidebar__section-title">
                <span className="sidebar__icon">{section.icon}</span>
                {section.label}
              </h3>
              <button className="sidebar__section-action" title={t('ui:sidebar.add', { label: section.label })}>
                +
              </button>
            </div>
            
            <ul className="sidebar__list">
              {section.children?.map((item) => (
                <li key={item.id} className="sidebar__list-item">
                  <button 
                    className={`sidebar__item ${activeView === item.id ? 'sidebar__item--active' : ''}`}
                    onClick={() => setActiveView(item.id as any)}
                  >
                    <span className="sidebar__icon">{item.icon}</span>
                    <span className="sidebar__text">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="sidebar__count">{item.count}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <h3 className="sidebar__section-title">
              <span className="sidebar__icon">⚙️</span>
              {t('common:actions.settings')}
            </h3>
          </div>
          
          <ul className="sidebar__list">
            <li className="sidebar__list-item">
              <button className="sidebar__item">
                <span className="sidebar__icon">🎨</span>
                <span className="sidebar__text">{t('ui:sidebar.themeSettings')}</span>
              </button>
            </li>
            <li className="sidebar__list-item">
              <button className="sidebar__item">
                <span className="sidebar__icon">⌨️</span>
                <span className="sidebar__text">{t('ui:sidebar.hotkeys')}</span>
              </button>
            </li>
            <li className="sidebar__list-item">
              <button className="sidebar__item">
                <span className="sidebar__icon">☁️</span>
                <span className="sidebar__text">{t('ui:sidebar.dataSync')}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="sidebar__footer">
        <div className="sidebar__language">
          <LanguageSwitcher compact showFlag />
        </div>
        
        <div className="sidebar__user">
          <div className="sidebar__avatar">H</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{t('ui:sidebar.user.name')}</div>
            <div className="sidebar__user-status">{t('ui:sidebar.user.status')}</div>
          </div>
          <button className="sidebar__user-settings">⚙️</button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
