# EntropyZero 前端架构文档

## 1. 项目愿景与目标

EntropyZero 的前端旨在打造一款基于“本地优先 (Local-First)”理念，融合无限画布渲染与 AI 语义增强的新一代任务管理系统。其核心目标是为用户提供一个 **零延迟**、**空间化**、**智能化** 的任务组织与交互体验。

- **空间化 (Spatial)**：任务以节点形式在无限画布上展示，通过空间关系直观表达逻辑。
- **零延迟 (Zero Latency)**：所有交互都应有即时反馈，海量数据下也能保持流畅。
- **智能化 (AI-Driven)**：利用 LLM 辅助任务拆解、规划与自动化布局。

## 2. 技术选型

| 类别         | 技术                                   | 职责                                       |
|--------------|----------------------------------------|--------------------------------------------|
| **核心框架** | React 18 + TypeScript + Vite           | 构建用户界面，提供类型安全和高效的开发环境。 |
| **状态管理** | Zustand                                | 轻量、高效的全局状态管理。                 |
| **数据持久化**| Dexie.js (IndexedDB Wrapper)           | 实现“本地优先”的核心，存储所有用户数据。     |
| **渲染引擎** | Canvas API + Framer Motion + RBush     | 负责无限画布的高性能渲染、动画和空间索引。   |
| **样式方案** | CSS Modules + Prettier                 | 提供组件级别的样式隔离和统一的代码格式。   |
| **代码质量** | Oslint                                 | 高性能的代码检查工具。                     |
| **包管理**   | pnpm (Monorepo)                        | 高效的依赖管理和多包工作流。               |

## 3. 架构设计原则

- **组件化 (Component-Based)**：遵循原子设计思想，将 UI 拆分为独立的、可复用的组件。
- **关注点分离 (Separation of Concerns)**：
  - **UI 组件 (`src/UI`)**: 只负责渲染和响应用户交互。
  - **状态管理 (`src/stores`)**: 集中管理应用的全局状态。
  - **服务层 (`src/services`)**: 处理外部 API 调用、数据持久化等副作用。
- **本地优先 (Local-First)**：所有数据默认存储在本地 `IndexedDB` 中，应用的核心功能不依赖网络连接。网络仅用于可选的数据同步或 AI 服务调用。
- **性能优先 (Performance-First)**：
  - **虚拟化渲染**: 对画布外的节点和长列表进行虚拟化，仅渲染可见部分。
  - **增量渲染**: 画布更新时只重绘变化的区域。
  - **空间索引**: 使用 `RBush` 库快速查询可视区域内的任务节点。

### 3.4. 渐进式 Web 应用 (PWA)

为了 fully 实现“本地优先 (Local-First)”和“零延迟 (Zero Latency)”的愿景，EntropyZero 将作为渐进式 Web 应用 (PWA) 进行开发。

- **离线能力 (Offline Capability)**：通过 Service Worker 缓存应用壳层 (App Shell) 和关键数据，确保应用在无网络连接时也能快速启动和运行。
- **可安装性 (Installability)**：用户可以将应用安装到桌面或移动设备主屏幕，提供类似原生应用的体验，无需浏览器地址栏。
- **可靠性与性能**： Service Worker 能够拦截网络请求，提供缓存优先或网络优先的策略，提高加载速度和应对不佳网络环境的能力。

**实现方案**:
- **`vite-plugin-pwa`**: 使用此 Vite 插件自动化 Service Worker 的生成和 Web App Manifest 的配置。
- **Web App Manifest**: 配置应用名称、图标、启动 URL、显示模式 (standalone) 和主题颜色，以优化安装体验。
- **Service Worker 策略**: 实施合适的缓存策略（例如：优先缓存应用静态资源，运行时缓存数据 API 请求），确保核心功能离线可用。

## 4. 目录结构 (`packages/app/src`)

```
src/
├── UI/                     # 可复用的 UI 组件 (原子/分子/组织)
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.module.css
│   ├── TaskNode/
│   │   ├── TaskNode.tsx
│   │   └── TaskNode.module.css
│   └── ...
├── components/             # 复杂的业务组件 (视图/页面级)
│   ├── CanvasView.tsx      # 主画布视图
│   ├── Sidebar.tsx         # 侧边栏
│   └── CommandPalette.tsx  # 指令框
├── stores/                 # Zustand 全局状态管理
│   ├── useTaskStore.ts     # 任务相关的状态
│   └── useSettingsStore.ts # 用户设置相关的状态
├── services/               # 应用的服务层
│   ├── aiConfigService.ts  # AI 配置与 API 调用
│   └── dbService.ts        # Dexie.js 数据库服务
├── hooks/                  # 自定义的 React Hooks
│   └── useDebounce.ts
├── styles/                 # 全局样式
│   ├── index.css
│   └── variables.css
├── types/                  # 全局 TypeScript 类型定义
│   └── index.ts
├── main.tsx                # 应用入口文件
└── App.tsx                 # 应用根组件
```

## 5. 核心模块拆解

### 5.1. 渲染引擎 (`CanvasView.tsx`)
这是应用的核心，负责无限画布的渲染和交互。
- **职责**:
  - 监听用户输入（拖拽、缩放、平移）。
  - 使用 Canvas API 绘制网格背景、任务节点和连接线。
  - 利用 `RBush` 进行视口裁剪（culling），仅渲染可见节点。
  - 通过 `Framer Motion` 管理动画状态，实现平滑的交互体验。

### 5.2. 状态管理 (`src/stores`)
- **`useTaskStore`**:
  - 存储所有任务节点 (`tasks`)、连接线 (`connections`) 的状态。
  - 提供对任务的 CRUD (增删改查) 操作。所有操作直接修改本地数据库，并更新状态以触发 React 重渲染。
- **`useSettingsStore`**:
  - 存储用户偏好设置，如主题、语言、AI 配置 (`baseUrl`, `apiKey`)。
  - 提供修改设置的 actions。

### 5.3. 数据持久化 (`dbService.ts`)
- **职责**:
  - 初始化 `Dexie.js` 数据库和数据表 (e.g., `tasks`, `connections`, `settings`)。
  - 封装对 `IndexedDB` 的所有读写操作，为 `Zustand` stores 提供数据源。
- **数据流**:
  1. 用户操作 (e.g., 创建任务)。
  2. `Zustand` action 被调用。
  3. Action 首先调用 `dbService` 将数据写入 `IndexedDB`。
  4. 写入成功后，更新 `Zustand` state。
  5. React 组件响应 state 变化，重新渲染。

### 5.4. 服务层 (`aiConfigService.ts`)
- **职责**:
  - 管理用户配置的 AI `baseUrl` 和 `apiKey`。
  - 封装符合 OpenAI 格式的 API 请求 (`fetch` 调用)。
  - 提供 `callAiApi` 函数，供上层业务逻辑（如指令框）调用。

### 5.5. 指令框 (`CommandPalette.tsx`)
- **职责**:
  - 提供全局的、键盘驱动的操作入口。
  - 根据用户输入，过滤并展示不同的指令（创建任务、搜索、调用 AI 等）。
  - 调用 `Zustand` stores 或服务层来执行相应操作。

## 6. 数据流
本应用遵循单向数据流原则：

```
+----------------+      +----------------+      +----------------+      +----------------+
|  User Action   |----->|     Action     |----->|   DB Service   |----->|    Zustand     |
| (e.g., Click)  |      | (Zustand Store)|      | (Write to DB)  |      | (Update State) |
+----------------+      +----------------+      +----------------+      +-------+--------+
                                                                                |
                                                                                | Re-render
                                                                                v
+----------------+      +----------------+      +----------------+      +-------+--------+
|   Component    |<-----|  React Renders |<-----|   Read State   |<-----|  Read State    |
|   (UI Update)  |      |   (DOM Update) |      | (from Zustand) |      | (from Store)   |
+----------------+      +----------------+      +----------------+      +----------------+
```

1.  **用户交互**: 用户在 UI 组件上触发一个事件。
2.  **调用 Action**: 事件处理器调用 `Zustand` store 中定义的 action。
3.  **数据持久化**: Action 首先通过 `dbService` 将更改写入 `IndexedDB`。
4.  **更新状态**: 数据成功写入后，action 更新 `Zustand` store 中的状态。
5.  **组件重渲染**: 订阅了该状态的 React 组件自动重新渲染，展示最新的数据。

## 7. 样式方案

采用 **CSS Modules**，确保组件样式的局部作用域，避免全局样式污染。
- 每个组件拥有自己的 `.module.css` 文件。
- 全局样式（如 CSS 变量、重置样式）存放在 `src/styles` 目录。
- 使用 Prettier 保证代码风格统一。

## 8. 开发规范

- **组件**: 尽可能创建小而美的纯组件。复杂的业务逻辑应抽离到 `hooks` 或 `stores` 中。
- **命名**:
  - 文件名: `PascalCase` (e.g., `TaskNode.tsx`)。
  - CSS Modules: `styles.module.css`。
  - 自定义 Hooks: `use` 前缀 (e.g., `useCanvasInteraction`)。
- **文档**:
  - 新组件应在文件顶部使用 JSDoc 注释其 `props`。
  - 复杂的业务逻辑或算法应添加必要的注释。
- **代码质量**: 在提交代码前，运行 `pnpm lint` 和 `pnpm format`。
- **Git Flow**: 遵循 `feature-branch` 工作流，通过 Pull Request 合并代码。

这份架构文档旨在为 EntropyZero 的前端开发提供清晰的指导。随着项目的迭代，本文档也应被持续更新。
