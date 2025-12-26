# 前端组件文档 (`packages/app/src`)

EntropyZero 的前端应用基于 React 和 TypeScript 构建，遵循模块化和组件化的开发原则。本文档将概述当前前端应用的基本结构，并为未来的组件开发和文档编写提供指导。

## 1. 应用核心结构

### `packages/app/src/main.tsx`

这是前端应用的入口文件。它负责渲染根组件 `App` 到 DOM 中。

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### `packages/app/src/App.tsx`

`App.tsx` 是应用的根组件。在项目初期，它包含了一个简单的计数器示例作为占位符，演示了 React 的基本状态管理 (`useState`)。

**目的**: 作为应用的顶层容器，未来将负责路由管理、全局状态提供、布局结构以及加载其他主要视图组件。

**示例代码 (简化)**:
```typescript
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>EntropyZero</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          空间思维任务引擎 - 基于本地优先理念的新一代任务管理系统
        </p>
      </div>
    </div>
  )
}

export default App
```

### `packages/app/src/UI/` 目录

此目录旨在存放应用中所有可复用的 UI 组件。目前，它仅包含一个 `.gitkeep` 文件作为占位符。

**目的**: 遵循原子设计原则，将小的、独立的 UI 元素（如按钮、输入框、卡片等）和更复杂的复合组件（如模态框、侧边栏、任务节点）组织在此处。这将促进组件的复用、提高开发效率和维护性。

**未来结构建议**:
```
UI/
├── Button/
│   ├── Button.tsx
│   └── Button.module.css
├── TaskNode/
│   ├── TaskNode.tsx
│   ├── TaskNode.types.ts
│   └── TaskNode.module.css
├── Sidebar/
│   ├── Sidebar.tsx
│   └── Sidebar.module.css
└── index.ts // 导出所有组件，方便统一导入
```

### `packages/app/src/services/` 目录

此目录用于存放与业务逻辑无关的、可复用的服务模块，例如 `aiConfigService.ts`。

**目的**: 封装数据获取、状态管理、外部 API 交互等横切关注点，保持组件的纯粹性（只关注 UI 渲染）。

## 2. 组件文档编写指南 (未来开发)

当新的 React 组件被创建时，请遵循以下约定来编写其文档，以便于团队成员理解、使用和维护。

### 2.1. 文档位置

每个组件的文档应放在其自身的目录下，例如 `UI/ComponentName/README.md`，或者直接在组件文件 (`ComponentName.tsx`) 内部通过 JSDoc 风格的注释进行描述。

### 2.2. 文档内容结构

建议组件文档包含以下部分：

#### 组件名称 (`<ComponentName />`)

简明扼要地说明组件的名称。

#### 目的 (Purpose)

*   组件的用途是什么？
*   它解决了什么问题？
*   在应用中扮演什么角色？

#### Props

列出组件接收的所有 `props`，包括类型、是否可选、默认值以及详细说明。

```typescript
interface ComponentNameProps {
  /**
   * @property {string} title - 组件的标题。
   */
  title: string;
  /**
   * @property {boolean} [isDisabled=false] - 是否禁用组件。
   */
  isDisabled?: boolean;
  /**
   * @property {() => void} onClick - 点击事件的回调函数。
   */
  onClick: () => void;
}
```

#### State (如果适用)

描述组件内部管理的状态及其用途。

#### 使用示例 (Usage Example)

提供一个或多个代码示例，演示如何在其他组件中使用该组件。

```tsx
import { ComponentName } from '../UI/ComponentName';

function ParentComponent() {
  const handleClick = () => {
    console.log('Component clicked!');
  };

  return (
    <div>
      <ComponentName title="我的标题" onClick={handleClick} />
      <ComponentName title="禁用组件" isDisabled={true} onClick={handleClick} />
    </div>
  );
}
```

#### 样式 (Styling)

*   说明组件如何应用样式（例如：CSS Modules, Tailwind CSS, styled-components）。
*   如果提供自定义样式钩子（如 `className` prop），也应在此处说明。

#### 依赖 (Dependencies)

列出组件所依赖的任何外部库或内部组件。

---

遵循上述结构和指南将有助于保持前端代码库的清晰和一致性，降低新成员的学习曲线，并提高团队协作效率。
