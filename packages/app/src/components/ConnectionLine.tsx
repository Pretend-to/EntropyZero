import React, { useEffect, useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useTaskStore } from '../stores/useTaskStore'
import { 
  getBestConnectionPoints,
  generateBezierPath,
  getTaskConnectionPointFromDOM
} from '../utils/coordinateSystem'
import type { Connection, Task, CanvasState, Position } from '../types'

interface ConnectionLineProps {
  connection: Connection
  tasks: Task[]
  canvasState: CanvasState
  selected?: boolean
  onSelect?: (connectionId: string) => void
  onContextMenu?: (connectionId: string, position: Position) => void
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  connection, 
  tasks, 
  canvasState, 
  selected = false,
  onSelect,
  onContextMenu 
}) => {
  const { t } = useI18n()
  const { updateConnection } = useTaskStore()
  const [renderKey, setRenderKey] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  const fromTask = tasks.find(t => t.id === connection.from)
  const toTask = tasks.find(t => t.id === connection.to)
  
  // 当画布状态变化时，强制重新渲染以获取最新的DOM位置
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderKey(prev => prev + 1)
    }, 16) // 下一帧重新渲染
    
    return () => clearTimeout(timer)
  }, [canvasState.zoom, canvasState.pan.x, canvasState.pan.y])
  
  if (!fromTask || !toTask) return null

  // 选择最佳连接点
  const { fromPoint, toPoint } = getBestConnectionPoints(fromTask.position, toTask.position)
  
  // 直接从DOM获取连接点的屏幕坐标
  const fromScreenPos = getTaskConnectionPointFromDOM(connection.from, fromPoint)
  const toScreenPos = getTaskConnectionPointFromDOM(connection.to, toPoint)
  
  // 如果无法获取DOM位置，回退到计算位置
  if (!fromScreenPos || !toScreenPos) {
    console.warn('无法获取连接点DOM位置，连接线可能不准确', {
      connection: connection.id,
      fromTask: connection.from,
      toTask: connection.to,
      fromScreenPos,
      toScreenPos,
      renderKey
    })
    return null
  }

  // 生成贝塞尔曲线路径
  const pathData = generateBezierPath(fromScreenPos, toScreenPos)

  // 根据连接类型设置样式
  const getConnectionStyle = () => {
    const baseStyle = {
      fill: 'none',
      stroke: selected ? 'var(--accent-secondary)' : 'var(--accent-primary)',
      strokeWidth: selected ? 4 : (isHovered ? 3 : 2),
      opacity: selected ? 1 : (isHovered ? 0.8 : 0.6),
      cursor: 'pointer',
    }

    switch (connection.type) {
      case 'strong':
        return { ...baseStyle, strokeWidth: selected ? 5 : (isHovered ? 4 : 3), opacity: selected ? 1 : (isHovered ? 0.9 : 0.8) }
      case 'weak':
        return { ...baseStyle, strokeDasharray: '5,5', opacity: selected ? 0.8 : (isHovered ? 0.7 : 0.5) }
      case 'related':
        return { ...baseStyle, strokeDasharray: '2,3', opacity: selected ? 0.7 : (isHovered ? 0.6 : 0.4) }
      default:
        return baseStyle
    }
  }

  // 处理连接线点击
  const handleConnectionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('连接线被点击:', {
      connectionId: connection.id,
      target: e.target,
      currentTarget: e.currentTarget,
      clientX: e.clientX,
      clientY: e.clientY,
      type: e.type
    })
    if (onSelect) {
      onSelect(connection.id)
    }
  }

  // 处理连接线右键菜单
  const handleConnectionContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('连接线右键菜单:', connection.id, e.target)
    
    if (onContextMenu) {
      // 获取鼠标在页面中的位置
      const position = {
        x: e.clientX,
        y: e.clientY
      }
      onContextMenu(connection.id, position)
    }
  }

  // 计算箭头位置和角度
  const deltaX = toScreenPos.x - fromScreenPos.x
  const deltaY = toScreenPos.y - fromScreenPos.y
  const angle = Math.atan2(deltaY, deltaX)
  const arrowSize = 8
  const arrowDistance = 15 // 箭头距离目标连接点的距离
  
  const arrowX = toScreenPos.x - Math.cos(angle) * arrowDistance
  const arrowY = toScreenPos.y - Math.sin(angle) * arrowDistance
  
  const arrowPoints = [
    {
      x: arrowX,
      y: arrowY,
    },
    {
      x: arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
      y: arrowY - arrowSize * Math.sin(angle - Math.PI / 6),
    },
    {
      x: arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
      y: arrowY - arrowSize * Math.sin(angle + Math.PI / 6),
    },
  ]

  return (
    <g 
      className={`connection-line connection-line--${connection.type} ${selected ? 'connection-line--selected' : ''}`} 
      key={renderKey}
      style={{ pointerEvents: 'auto' }} // 确保g元素可以接收事件
    >
      {/* 调试信息 - 显示连接点位置 */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <circle cx={fromScreenPos.x} cy={fromScreenPos.y} r="3" fill="red" opacity="0.5" />
          <circle cx={toScreenPos.x} cy={toScreenPos.y} r="3" fill="blue" opacity="0.5" />
          <text x={fromScreenPos.x + 10} y={fromScreenPos.y - 10} fill="red" fontSize="10">
            {fromPoint}
          </text>
          <text x={toScreenPos.x + 10} y={toScreenPos.y - 10} fill="blue" fontSize="10">
            {toPoint}
          </text>
        </>
      )}
      
      {/* 连接线路径 - 添加一个更宽的透明路径用于更好的点击检测 */}
      <path
        d={pathData}
        fill="none"
        stroke={process.env.NODE_ENV === 'development' ? 'rgba(255, 0, 0, 0.1)' : 'transparent'} // 开发模式下显示点击区域
        strokeWidth="40" // 大幅增加点击区域
        className="connection-hit-area"
        onClick={handleConnectionClick}
        onContextMenu={handleConnectionContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }} // 确保可以点击
      />
      
      {/* 实际的连接线路径 */}
      <path
        d={pathData}
        style={{
          ...getConnectionStyle(),
          pointerEvents: 'none' // 避免重复事件
        }}
        className="connection-path"
      />
      
      {/* 选中状态的外发光效果 */}
      {selected && (
        <path
          d={pathData}
          fill="none"
          stroke="var(--accent-secondary)"
          strokeWidth="8"
          opacity="0.3"
          className="connection-glow"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* 箭头 */}
      <polygon
        points={arrowPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill={selected ? 'var(--accent-secondary)' : 'var(--accent-primary)'}
        opacity={selected ? 1 : 0.8}
        className="connection-arrow"
        onClick={handleConnectionClick}
        onContextMenu={handleConnectionContextMenu}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      />
      
      {/* 连接线标签（如果需要） */}
      {(connection.type === 'strong' || selected || isHovered) && (
        <text
          x={(fromScreenPos.x + toScreenPos.x) / 2}
          y={(fromScreenPos.y + toScreenPos.y) / 2 - 10}
          fill="var(--text-tertiary)"
          fontSize="10"
          textAnchor="middle"
          className="connection-label"
          style={{ pointerEvents: 'none' }}
        >
          {t(`ui:canvas.connectionTypes.${connection.type}`)}
        </text>
      )}
    </g>
  )
}

export default ConnectionLine