import React from 'react'
import { useI18n } from '../hooks/useI18n'
import type { Connection, Task, CanvasState } from '../types'

interface ConnectionLineProps {
  connection: Connection
  tasks: Task[]
  canvasState: CanvasState
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ connection, tasks, canvasState }) => {
  const { t } = useI18n()
  const fromTask = tasks.find(t => t.id === connection.from)
  const toTask = tasks.find(t => t.id === connection.to)
  
  if (!fromTask || !toTask) return null

  // 计算任务节点的中心点
  const fromCenter = {
    x: (fromTask.position.x + 100) * canvasState.zoom + canvasState.pan.x, // 100 是节点宽度的一半
    y: (fromTask.position.y + 60) * canvasState.zoom + canvasState.pan.y,  // 60 是节点高度的一半
  }
  
  const toCenter = {
    x: (toTask.position.x + 100) * canvasState.zoom + canvasState.pan.x,
    y: (toTask.position.y + 60) * canvasState.zoom + canvasState.pan.y,
  }

  // 计算贝塞尔曲线控制点
  const deltaX = toCenter.x - fromCenter.x
  const deltaY = toCenter.y - fromCenter.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  // 控制点偏移量，基于距离调整
  const controlOffset = Math.min(distance * 0.3, 100)
  
  const controlPoint1 = {
    x: fromCenter.x + controlOffset,
    y: fromCenter.y,
  }
  
  const controlPoint2 = {
    x: toCenter.x - controlOffset,
    y: toCenter.y,
  }

  // 生成 SVG 路径
  const pathData = `M ${fromCenter.x} ${fromCenter.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${toCenter.x} ${toCenter.y}`

  // 根据连接类型设置样式
  const getConnectionStyle = () => {
    const baseStyle = {
      fill: 'none',
      stroke: 'var(--accent-primary)',
      strokeWidth: 2,
      opacity: 0.6,
    }

    switch (connection.type) {
      case 'strong':
        return { ...baseStyle, strokeWidth: 3, opacity: 0.8 }
      case 'weak':
        return { ...baseStyle, strokeDasharray: '5,5', opacity: 0.5 }
      case 'related':
        return { ...baseStyle, strokeDasharray: '2,3', opacity: 0.4 }
      default:
        return baseStyle
    }
  }

  // 计算箭头位置和角度
  const angle = Math.atan2(deltaY, deltaX)
  const arrowSize = 8
  const arrowDistance = 20 // 箭头距离目标节点的距离
  
  const arrowX = toCenter.x - Math.cos(angle) * arrowDistance
  const arrowY = toCenter.y - Math.sin(angle) * arrowDistance
  
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
    <g className={`connection-line connection-line--${connection.type}`}>
      {/* 连接线路径 */}
      <path
        d={pathData}
        style={getConnectionStyle()}
        className="connection-path"
      />
      
      {/* 箭头 */}
      <polygon
        points={arrowPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="var(--accent-primary)"
        opacity="0.8"
        className="connection-arrow"
      />
      
      {/* 连接线标签（如果需要） */}
      {connection.type === 'strong' && (
        <text
          x={(fromCenter.x + toCenter.x) / 2}
          y={(fromCenter.y + toCenter.y) / 2 - 10}
          fill="var(--text-tertiary)"
          fontSize="10"
          textAnchor="middle"
          className="connection-label"
        >
          {t('ui:canvas.dependency')}
        </text>
      )}
    </g>
  )
}

export default ConnectionLine