# 客户端 AI 服务配置

EntropyZero 采用“离线优先”设计，并支持用户通过配置外部 AI 服务来增强任务管理功能。本节将指导你如何配置你的 AI 服务，以及相关的 API 参数。

**重要提示**: 你的 AI `baseUrl` 和 `apiKey` 将安全地存储在本地浏览器存储中（当前实现使用 `localStorage`，未来版本可能迁移到更持久和结构化的 `IndexedDB`，通过 `Dexie.js` 管理）。这些凭据不会发送到 EntropyZero 的服务器。

## 1. 配置项

### 1.1. AI 服务基本 URL (`baseUrl`)

这是你的 AI 服务提供商的 API 端点。它应该是一个完整的 URL，指向你的 AI 模型完成 (completion) 服务的根路径。

**示例 (OpenAI 兼容服务):**
*   `https://api.openai.com`
*   `https://your-custom-openai-compatible-api.com`

**配置位置**: 在应用的用户界面中，通常会在“设置”->“AI 配置”或类似部分提供输入框。

### 1.2. AI 服务 API 密钥 (`apiKey`)

这是用于验证你的 AI 服务请求的密钥。请确保该密钥具有访问你所需 AI 模型的权限。

**配置位置**: 同上，在应用的用户界面中提供输入框。

**安全注意事项**:
*   请勿将你的 API 密钥分享给他人。
*   虽然存储在本地，但仍需注意设备安全。
*   此密钥仅用于客户端直接向 AI 服务发出请求，不会经过 EntropyZero 的任何后端服务器。

## 2. AI API 交互模式 (OpenAI Completion 格式)

EntropyZero 的客户端 AI 模块设计为与 OpenAI 的 Completion API 格式兼容。这意味着你可以配置任何提供类似 API 接口的 AI 服务（例如：OpenAI GPT 系列，或自托管的兼容模型）。

### 2.1. 请求格式示例

当 EntropyZero 调用 AI 服务时，它会构造一个类似以下的 HTTP POST 请求体：

```json
{
  "model": "gpt-3.5-turbo", // 可配置，或由应用根据上下文选择
  "prompt": "用户输入的任务提示，例如：帮我拆解项目计划",
  "max_tokens": 150,        // 可配置，或由应用根据上下文选择
  "temperature": 0.7        // 可配置，或由应用根据上下文选择
}
```

*   `model`: 指定要使用的 AI 模型名称。
*   `prompt`: 包含用户请求或任务的文本。
*   `max_tokens`: AI 生成响应的最大 token 数量。
*   `temperature`: 控制生成文本的随机性（0.0-1.0）。

### 2.2. 预期响应格式示例

AI 服务应返回一个符合 OpenAI Completion API 规范的 JSON 响应。EntropyZero 将会从中提取 `choices[0].text` 作为 AI 的生成内容。

```json
{
  "id": "cmpl-xxxxxxxxxxxxxx",
  "object": "text_completion",
  "created": 1678886400,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "text": "这是 AI 生成的任务拆解或建议内容。",
      "index": 0,
      "logprobs": null,
      "finish_reason": "length"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 25,
    "total_tokens": 35
  }
}
```

## 3. `aiConfigService.ts` 模块 (开发者指南)

`packages/app/src/services/aiConfigService.ts` 文件提供了一组函数来管理 AI 配置：

*   `getAiConfig(): AiConfig | null`: 从本地存储中获取当前 AI 配置。
*   `saveAiConfig(config: AiConfig): void`: 将 AI 配置保存到本地存储。
*   `clearAiConfig(): void`: 清除本地存储中的 AI 配置。
*   `validateAiConfig(config: AiConfig): boolean`: 验证配置对象是否包含有效的 `baseUrl` 和 `apiKey`。
*   `callAiApi(prompt: string): Promise<string>`: 使用当前配置调用 AI API 的示例函数。它会构建一个 OpenAI 兼容的请求，并处理响应。

开发者应使用这些函数在前端 UI 中实现 AI 配置管理界面，并在需要调用 AI 功能时使用 `callAiApi` 或类似逻辑。

**未来改进**:
*   将配置存储从 `localStorage` 迁移到 `Dexie.js`，以利用其更强大的功能（如事务、更好的结构化数据管理）。
*   在 `AiConfig` 接口中添加更多可配置参数，例如默认模型 (`model`)、默认 `max_tokens`、`temperature` 等。
*   实现 AI 配置的 UI 组件，以便用户在应用内进行设置。

## 4. 示例用途

在应用的智能指令框（Command Palette）中，当用户输入一个 AI 相关的指令时，应用会：
1.  通过 `getAiConfig()` 获取 AI 配置。
2.  如果配置有效，则调用 `callAiApi(用户指令)`。
3.  将 AI 返回的结果展示给用户，例如作为任务建议或自动布局结果。

通过这种方式，EntropyZero 实现了强大的 AI 辅助功能，同时将选择权和数据隐私完全交由用户掌控。
