**EntropyZero 前端架构文档**

**1. 项目愿景与目标**

EntropyZero的前端旨在打造一款基于“本地优先 (Local-First)”理念，融合无限画布渲染与AI语义增强的新一代任务管理系统。其核心目标是为用户提供一个**空间化**、**零延迟**、**智能化**并且**键盘优先**的任务组织与交互体验。

* **空间化 (Spatial)**：任务以节点形式在无限画布上展示，通过空间关系直观表达逻辑。
* **零延迟 (Zero Latency)**：所有交互都应有即时反馈，海量数据下也能保持流畅。
* **智能化 (AI-Driven)**：利用LLM辅助任务拆解、规划与自动化布局。
* **键盘优先**: 充分支持键盘操作，提升用户效率，特别是在创建、编辑和导航任务时。

**2. 技术选型**

| 类别                 | 技术                               | 职责                                                                                                             |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **核心框架**   | React 18 + TypeScript + Vite       | 构建用户界面，提供类型安全和高效的开发环境。                                                                     |
| **状态管理**   | Zustand                            | 轻量、高效的全局状态管理。                                                                                       |
| **数据持久化** | Dexie.js (IndexedDB Wrapper)       | 实现“本地优先”的核心，存储所有用户数据。                                                                       |
| **渲染引擎**   | Canvas API + Framer Motion + RBush | 负责无限画布的高性能渲染、动画和空间索引。利用虚拟化渲染、增量渲染以及空间索引等技术，优化海量任务节点下的性能。 |
| **样式方案**   | CSS Modules + Prettier             | 提供组件级别的样式隔离和统一的代码格式。支持深色和浅色主题，并提供高对比度模式。                                 |
| **代码质量**   | OxLint                             | 高性能的代码检查工具。                                                                                           |
| **包管理**     | pnpm (Monorepo)                    | 高效的依赖管理和多包工作流。                                                                                     |
| **国际化**     | i18next                            | 提供国际化(i18n)支持，支持多语言界面，并适配不同文化下的文本、日期、数字和布局习惯。                             |

**3. 架构设计原则**

* **组件化 (Component-Based)**：遵循原子设计思想，将UI拆分为独立的、可复用的组件。
* **关注点分离 (Separation of Concerns)**：
  * **UI 组件 (`src/UI`)**: 只负责渲染和响应用户交互。
  * **状态管理 (`src/stores`)**: 集中管理应用的全局状态。
  * **服务层 (`src/services`)**: 处理外部API调用、数据持久化和国际化等副作用。
* **本地优先 (Local-First)**：所有数据默认存储在本地 `IndexedDB`中，应用的核心功能不依赖网络连接。网络仅用于可选的数据同步或AI服务调用。
* **性能优先 (Performance-First)**：利用虚拟化渲染、增量渲染和空间索引等技术，优化无限画布的渲染性能。
* **可访问性 (Accessibility)**：确保所有功能都可通过键盘访问，并提供屏幕阅读器支持和视觉辅助功能。

**3.1 核心架构设计**

* **无限画布渲染**: 使用Canvas API实现高性能的无限画布渲染，支持缩放、平移和惯性滚动。
* **任务节点**: 以节点形式在画布上展示任务，节点包含状态指示器、标题、描述、标签和时间信息。
* **连接线**: 使用贝塞尔曲线表示任务之间的依赖关系，支持不同类型的连接线，例如实线(强依赖)、虚线(弱依赖)和点线(相关任务)。
* **智能指令框**: 提供全局的、键盘驱动的操作入口，支持创建任务、搜索任务、AI辅助和导航等指令。
* **侧边栏**: 用于项目管理和导航，包含项目列表、标签管理和设置面板。
* **状态栏**: 显示当前状态信息。

**3.2 交互设计**

* **键盘导航**: 提供完善的键盘导航支持，例如使用Tab键切换焦点、Enter键编辑任务、Delete键删除任务、Cmd/Ctrl + K 触发指令框等。
* **拖拽行为**: 支持任务节点的拖拽移动，拖拽到其他任务创建依赖关系，拖拽到边缘自动滚动画布。
* **手势操作**: 支持鼠标中键/空格键 + 拖拽平移画布、滚轮缩放、双击空白区域创建新任务、框选批量选择任务等。

**3.3 渐进式 Web 应用 (PWA)**

为了fully实现“本地优先 (Local-First)”和“零延迟 (Zero Latency)”的愿景，EntropyZero将作为渐进式Web应用(PWA)进行开发。

* **离线能力 (Offline Capability)**：通过Service Worker缓存应用壳层(App Shell)和关键数据，确保应用在无网络连接时也能快速启动和运行。
* **可安装性 (Installability)**：用户可以将应用安装到桌面或移动设备主屏幕，提供类似原生应用的体验，无需浏览器地址栏。
* **可靠性与性能**：Service Worker能够拦截网络请求，提供缓存优先或网络优先的策略，提高加载速度和应对不佳网络环境的能力。

**4. 目录结构 (`packages/app/src`)**

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
│   ├── dbService.ts        # Dexie.js 数据库服务
│   └── i18nService.ts      # 国际化服务
├── hooks/                  # 自定义的 React Hooks
│   └── useDebounce.ts
├── styles/                 # 全局样式
│   ├── index.css
│   └── variables.css
├── locales/                # 国际化资源文件
│   ├── en-US.json
│   └── zh-CN.json
├── types/                  # 全局 TypeScript 类型定义
│   └── index.ts
├── main.tsx                # 应用入口文件
└── App.tsx                 # 应用根组件
```

**5. 核心模块拆解**

* **渲染引擎 (`CanvasView.tsx`)**:
  * 监听用户输入（拖拽、缩放、平移、键盘事件）。
  * 使用Canvas API绘制网格背景、任务节点和连接线。
  * 利用 `RBush`进行视口裁剪（culling），仅渲染可见节点。
  * 通过 `Framer Motion`管理动画状态，实现平滑的交互体验。
* **状态管理 (`src/stores`)**:
  * `useTaskStore`: 存储所有任务节点(`tasks`)、连接线(`connections`)的状态，提供对任务的CRUD操作。
  * `useSettingsStore`: 存储用户偏好设置，如主题、语言、AI配置。
* **数据持久化 (`dbService.ts`)**:
  * 初始化 `Dexie.js`数据库和数据表。
  * 封装对 `IndexedDB`的所有读写操作，为 `Zustand` stores提供数据源。
* **服务层 (`aiConfigService.ts`, `i18nService.ts`)**:
  * `aiConfigService.ts`: 管理AI配置和API调用。
  * `i18nService.ts`: 初始化 `i18next`，加载翻译文件，提供多语言支持。
* **指令框 (`CommandPalette.tsx`)**:
  * 提供全局的、键盘驱动的操作入口。
  * 根据用户输入，过滤并展示不同的指令。
  * 调用 `Zustand` stores或服务层来执行相应操作。

**6. 数据流**

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

1. **用户交互**: 用户在UI组件上触发一个事件。
2. **调用 Action**: 事件处理器调用 `Zustand` store中定义的action。
3. **数据持久化**: Action首先通过 `dbService`将更改写入 `IndexedDB`。
4. **更新状态**: 数据成功写入后，action更新 `Zustand` store中的状态。
5. **组件重渲染**: 订阅了该状态的React组件自动重新渲染，展示最新的数据。

**7. 样式方案**

采用**CSS Modules**，确保组件样式的局部作用域，避免全局样式污染。

* 每个组件拥有自己的 `.module.css`文件。
* 全局样式存放在 `src/styles`目录。
* 使用Prettier保证代码风格统一。
* 支持深色和浅色主题，并提供高对比度模式。

**8. 国际化方案**

* 使用 `i18next`库实现国际化，支持多语言界面。
* 翻译文件存放在 `src/locales`目录下，每个语言对应一个JSON文件。
* 使用React Context提供全局的i18n实例。
* 适配不同文化下的文本、日期、数字和布局习惯。

**9. 开发规范**

* **组件**: 尽可能创建小而美的纯组件。复杂的业务逻辑应抽离到 `hooks`或 `stores`中。
* **命名**:
  * 文件名: `PascalCase` (e.g., `TaskNode.tsx`)。
  * CSS Modules: `styles.module.css`。
  * 自定义Hooks: `use` 前缀 (e.g., `useCanvasInteraction`)。
* **文档**:
  * 新组件应在文件顶部使用JSDoc注释其 `props`。
  * 复杂的业务逻辑或算法应添加必要的注释。
* **代码质量**: 在提交代码前，运行 `pnpm lint`和 `pnpm format`。
* **Git Flow**: 遵循 `feature-branch`工作流，通过Pull Request合并代码。
