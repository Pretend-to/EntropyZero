# 🚀 EntropyZero (零熵) - 空间思维任务引擎

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)](https://www.fastify.io/)

**基于"本地优先 (Local-First)"理念，融合无限画布渲染与 AI 语义增强的新一代任务管理系统**

[English](./README_EN.md) | 简体中文 | [日本語](./README_JA.md)

</div>

## ✨ 核心特性

- 🎨 **无限画布**: 突破传统列表限制，在二维空间中组织任务
- ⚡ **零延迟响应**: 基于 IndexedDB 的本地优先架构，毫秒级交互
- 🤖 **AI 智能助手**: 集成指令面板，支持自然语言任务创建和管理
- 🌐 **多语言支持**: 内置中文、英文、日文界面
- 🔗 **任务关联**: 可视化任务依赖关系，支持复杂项目管理
- ⌨️ **键盘优先**: 全键盘操作支持，提升效率用户体验
- 📱 **响应式设计**: 适配桌面、平板、移动端多种设备

## 🏗️ 项目架构

这是一个基于 pnpm + monorepo 的全栈项目：

```
EntropyZero/
├── packages/
│   ├── app/          # 🎨 前端应用 (React + Vite + Canvas)
│   │   ├── src/
│   │   │   ├── components/     # UI 组件
│   │   │   ├── hooks/         # React Hooks
│   │   │   ├── i18n/          # 国际化资源
│   │   │   ├── stores/        # Zustand 状态管理
│   │   │   └── types/         # TypeScript 类型定义
│   │   └── prototype/         # UI/UX 原型设计
│   └── server/       # 🚀 后端服务 (Fastify + WebSocket)
├── docs/             # 📚 项目文档
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8

### 安装依赖
```bash
# 克隆仓库
git clone https://github.com/Pretend-to/entropy-zero.git
cd entropy-zero

# 安装依赖
pnpm install
```

### 开发模式
```bash
# 同时启动前端和后端
pnpm dev

# 或者分别启动
pnpm --filter @entropy-zero/app dev    # 前端: http://localhost:5173
pnpm --filter @entropy-zero/server dev # 后端: http://localhost:3001
```

### 构建部署
```bash
# 构建所有包
pnpm build

# 启动生产服务
pnpm --filter @entropy-zero/server start
```

## 🛠️ 技术栈

### 前端 (packages/app)
- **框架**: React 18 + TypeScript + Vite
- **状态管理**: Zustand (轻量级状态管理)
- **本地存储**: Dexie.js (IndexedDB 封装)
- **渲染引擎**: Canvas API + Framer Motion
- **空间索引**: RBush (高性能 2D 空间索引)
- **国际化**: react-i18next + i18next-scanner
- **PWA**: vite-plugin-pwa (离线支持)

### 后端 (packages/server)
- **框架**: Fastify (高性能 Node.js 框架)
- **实时通信**: WebSocket + @fastify/websocket
- **数据验证**: Zod (TypeScript-first 验证库)
- **CORS**: @fastify/cors

### 开发工具
- **包管理**: pnpm + workspace
- **代码检查**: oxlint (Rust 实现的高性能 linter)
- **代码格式化**: Prettier
- **类型检查**: TypeScript 5.0+

## 💡 设计哲学

传统的 TODO 工具大多采用"线性列表"，限制了复杂逻辑的表达。**EntropyZero** 试图通过以下三个维度打破限制：

### 🎯 空间化 (Spatial)
任务不再是列表项，而是画布上的节点，通过空间距离和连线表达关联关系，让复杂项目的结构一目了然。

### ⚡ 零延迟 (Zero Latency)  
通过 IndexedDB 离线存储和 Canvas 增量渲染，实现海量任务下的秒级响应，让思维流畅不被打断。

### 🤖 智能流 (AI-Driven)
利用 LLM 辅助任务拆解与自动化布局，将用户从琐碎的操作中解放，专注于创造性工作。

## 📸 界面预览

> 🚧 界面截图即将更新...

## 🎮 使用指南

### 基础操作
- `Cmd/Ctrl + K`: 打开智能指令面板
- `双击空白区域`: 创建新任务
- `拖拽任务`: 移动和组织任务位置
- `连接任务`: 建立任务依赖关系

### 指令面板
- `/ai`: 进入 AI 助手模式
- `/search`: 全局搜索任务
- `/template`: 选择任务模板
- `/workflow`: 执行自动化工作流

### 多语言切换
系统支持中文、英文、日文界面，可在设置中切换语言。

## 🧪 开发指南

### 代码质量
```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 提取翻译文本
pnpm --filter @entropy-zero/app i18n:extract
```

### 测试
```bash
# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage
```

### 项目规范
- 使用 TypeScript 严格模式
- 遵循 Prettier 代码格式
- 组件采用函数式 + Hooks 模式
- 国际化文本统一管理

## 🗂️ 项目文档

- [前端架构设计](./docs/frontend_architecture.md)
- [前端组件说明](./docs/frontend_components.md)
- [后端服务文档](./docs/fastify_server.md)
- [AI 客户端配置](./docs/ai_client_config.md)
- [UI/UX 设计文档](./packages/app/prototype/UI-UX设计文档.md)
- [国际化实现指南](./packages/app/docs/国际化实现指南.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范
- 遵循现有的代码风格
- 添加适当的测试用例
- 更新相关文档
- 确保 CI 检查通过

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE) - 查看 LICENSE 文件了解详情。

## 🙏 致谢

感谢以下开源项目的启发和支持：
- [React](https://reactjs.org/) - 用户界面库
- [Fastify](https://www.fastify.io/) - 高性能 Web 框架
- [Dexie.js](https://dexie.org/) - IndexedDB 封装库
- [RBush](https://github.com/mourner/rbush) - 空间索引库
- [Framer Motion](https://www.framer.com/motion/) - 动画库

## 📞 联系我们

- 项目主页: [https://github.com/Pretend-to/entropy-zero](https://github.com/Pretend-to/entropy-zero)
- 问题反馈: [Issues](https://github.com/Pretend-to/entropy-zero/issues)
- 功能建议: [Discussions](https://github.com/Pretend-to/entropy-zero/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️**

Made with ❤️ by EntropyZero Team

</div>