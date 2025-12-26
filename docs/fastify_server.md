# Fastify 服务端文档 (`packages/server`)

`packages/server` 目录包含 EntropyZero 项目的 Fastify 服务端实现。虽然 EntropyZero 核心采用“离线优先”和客户端 AI 交互模式，但此服务端提供了一些辅助功能，主要用于本地开发环境的协调以及未来潜在的实时协作能力。

**重要提示**: 此 Fastify 服务端**不负责**处理用户的 AI 凭据（如 API 密钥），也不会作为 AI 服务的代理。所有的 AI API 请求均直接由客户端浏览器发起，指向用户配置的第三方 AI 服务。

## 1. 服务端概述

Fastify 服务端是一个轻量级、高性能的 Node.js Web 框架，在此项目中扮演以下角色：
*   提供一个基础的 HTTP 接口。
*   提供 WebSocket 通道，用于客户端和本地服务之间的实时通信（例如：未来可能的本地数据同步或协作功能）。
*   在开发模式下，与前端应用 (`packages/app`) 协同工作。

## 2. 关键技术栈

*   **Fastify**: 高度专注于速度和低开销的 Web 框架。
*   **TypeScript**: 提供类型安全和更好的代码可维护性。
*   **`@fastify/cors`**: 处理跨域资源共享，确保前端应用可以访问服务端。
*   **`@fastify/websocket`**: 为 Fastify 添加 WebSocket 功能。

## 3. 主要功能和端点

### 3.1. 健康检查 (`GET /health`)

*   **描述**: 一个简单的健康检查端点，用于验证服务端是否正在运行。
*   **URL**: `/health`
*   **方法**: `GET`
*   **响应示例**:
    ```json
    {
      "status": "ok",
      "timestamp": "2025-12-26T12:00:00.000Z"
    }
    ```

### 3.2. 示例 API 端点 (`GET /api/hello`)

*   **描述**: 一个简单的示例 API 端点。可用于测试基本的 HTTP 请求。
*   **URL**: `/api/hello`
*   **方法**: `GET`
*   **响应示例**:
    ```json
    {
      "message": "Hello from EntropyZero Server!"
    }
    ```

### 3.3. WebSocket 服务 (`/ws`)

*   **描述**: 提供一个 WebSocket 连接点，允许客户端进行双向实时通信。当前实现是一个简单的“回显（Echo）”服务，客户端发送的任何消息都会被原样返回。
*   **URL**: `/ws`
*   **协议**: WebSocket
*   **使用方式**: 客户端可以通过 WebSocket 协议连接到此端点。
*   **示例 (客户端 JavaScript)**:
    ```javascript
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.send('Hello from client!');
    };

    ws.onmessage = (event) => {
      console.log('Received:', event.data); // Output: "Echo: Hello from client!"
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    ```

## 4. 启动与配置

### 4.1. 启动服务器

在项目的根目录（monorepo 根目录）下，你可以使用以下命令启动服务端：
```bash
pnpm --filter @entropy-zero/server dev
```
或通过启动所有服务：
```bash
pnpm dev
```

### 4.2. 端口

服务端默认监听 `3001` 端口。如果需要更改，请修改 `packages/server/src/index.ts` 中的 `fastify.listen` 配置。

### 4.3. CORS 配置

CORS (`Cross-Origin Resource Sharing`) 已配置为允许来自 `http://localhost:3000` 的请求（通常是前端开发服务器的地址）。如果前端应用部署在其他域名或端口，需要相应地调整 `packages/server/src/index.ts` 中的 `cors` 配置。

## 5. 开发考量

*   **日志**: Fastify 实例启用了日志记录 (`logger: true`)，可以在控制台输出请求和错误信息，便于开发和调试。
*   **热重载**: 在开发模式下，`pnpm dev` 命令会监控文件变化并自动重启服务端。

## 6. 未来展望

此 Fastify 服务端可以作为以下功能的载体：
*   **实时协作**: 利用 WebSocket 实现多用户实时编辑画布或任务。
*   **本地数据同步**: 配合客户端的 `Dexie.js`，实现更高级的本地数据管理和备份。
*   **图片/文件上传**: 如果应用未来需要处理用户上传的资源。
*   **复杂计算卸载**: 如果某些计算不适合完全在客户端进行，可以利用本地服务端进行处理。

它提供了一个灵活的扩展点，以支持 EntropyZero 项目未来更高级的功能需求。
