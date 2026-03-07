# AGENTS.md

## Cursor Cloud 专用说明

### 概述

MyClawX 是一个跨平台的 **Electron 桌面应用**（React 19 + Vite + TypeScript），为 OpenClaw AI 代理运行时提供图形界面。它使用 pnpm 作为包管理器（版本在 `package.json` 的 `packageManager` 字段中锁定）。

### 快速参考

| 任务 | 命令 |
|------|---------|
| 安装依赖 + 下载 uv | `pnpm run init` |
| 开发服务器 (Vite + Electron) | `pnpm dev` |
| 代码检查 (ESLint, 自动修复) | `pnpm run lint` |
| 类型检查 | `pnpm run typecheck` |
| 单元测试 (Vitest) | `pnpm test` |
| 运行单个测试文件 | `pnpm test -- path/to/test.test.ts` |
| 运行单个测试 | `pnpm test -- -t "test name"` |
| 仅构建前端 | `pnpm run build:vite` |
| 完整构建 (Vite + electron-builder) | `pnpm run build` |

### 容易被忽视的注意事项

- **pnpm 版本**：确切的 pnpm 版本通过 `package.json` 中的 `packageManager` 锁定。安装前使用 `corepack enable && corepack prepare` 激活正确版本。
- **Linux 无头环境下的 Electron**：dbus 错误（`Failed to connect to the bus`）是预期且无害的。在设置了 `$DISPLAY`（例如通过 Xvfb/VNC 设置为 `:1`）的情况下应用仍可正常运行。
- **`pnpm run lint` 竞态条件**：如果刚运行过 `pnpm run uv:download`，ESLint 可能会失败并报 `ENOENT: no such file or directory, scandir '/workspace/temp_uv_extract'`，因为临时目录在下载过程中被创建又删除了。下载脚本完成后重新运行 lint 即可。
- **构建脚本警告**：`pnpm install` 可能会警告 `@discordjs/opus` 和 `koffi` 的构建脚本被忽略。这些是可选的消息通道依赖项，警告可以安全忽略。
- **`pnpm run init`**：这是一个便捷脚本，先运行 `pnpm install` 再运行 `pnpm run uv:download`。可以运行 `pnpm run init` 或分两步运行。
- **Gateway 启动**：运行 `pnpm dev` 时，OpenClaw Gateway 进程会自动在 18789 端口启动。需要约 10-30 秒才能就绪。UI 开发不需要 Gateway 就绪——应用在没有 Gateway 的情况下也能运行（显示"连接中"状态）。
- **无需数据库**：应用使用 `electron-store`（JSON 文件）和系统密钥链。无需数据库设置。
- **AI Provider 密钥**：实际 AI 对话需要在设置 > AI Providers 中配置至少一个提供商 API 密钥。在没有密钥的情况下应用也可完全导航和测试。
- **Token 使用历史实现**：仪表盘的 token 使用历史不是从控制台日志解析的。它读取本地 OpenClaw 配置目录下的 OpenClaw 会话转录 `.jsonl` 文件，从中提取带有 `message.usage` 的助手消息，并从这些结构化记录中聚合 input/output/cache/total tokens 和 cost 等字段。

---

## 代码风格指南

### 一般原则

- **禁止注释**，除非明确需要（例如解释复杂业务逻辑）
- **使用路径别名**：`@/` 对应 `src/`，`@electron/` 对应 `electron/`
- **严格 TypeScript**：所有代码必须通过 `pnpm run typecheck`（启用严格模式）
- **ESLint 合规**：所有代码必须通过 `pnpm run lint`

### TypeScript

- 无法推断时，对函数参数和返回值使用显式类型
- 类型真正未知时使用 `unknown`，然后用类型守卫收窄
- 避免使用 `any`——ESLint 会警告（`@typescript-eslint/no-explicit-any`）
- 联合类型/元组使用 `type`，对象形状使用 `interface`
- 已知类型时优先使用 `as` 转换而非 `any`
- 未使用的参数添加 `_` 前缀（例如 `_unusedParam`）

### 命名规范

- **变量/函数**：camelCase
- **组件/接口/类型**：PascalCase
- **文件**：普通文件使用 kebab-case，组件使用 PascalCase（例如 `ChatMessage.tsx`）
- **常量**：真正常量使用 UPPER_SNAKE_CASE const 对象使用 camelCase
- **布尔变量**：使用 `is`、`has`、`should`、`can` 前缀（例如 `isLoading`、`hasError`）

### 导入顺序

**分组顺序：**
1. React/框架导入
2. 外部库（lucide-react、zustand 等）
3. 路径别名导入（`@/...`、`@electron/...`）
4. 相对路径导入（`../`、`./`）

**示例：**
```typescript
import { useState, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useChatStore } from '@/stores/chat';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
```

### React 模式

- 使用函数组件和 hooks
- 需要 ref 转发时使用 `React.forwardRef`
- 适当解构 props 并设置默认值
- 保持组件专注（单一职责）
- 谨慎使用 `useCallback` 和 `useMemo`——先分析性能再优化
- 使用 `react-i18next` 的 `useTranslation` 进行国际化

### UI 组件（shadcn/ui 风格）

- 使用 `class-variance-authority` (cva) 实现组件变体
- 同时导出组件及其变体
- 使用 `@/lib/utils` 的 `cn()` 合并类名（处理 Tailwind 冲突）

**示例：**
```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('基础类名...', {
  variants: {
    variant: { default: '...', destructive: '...' },
    size: { default: '...', sm: '...' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
```

### 状态管理（Zustand）

- 在 `src/stores/` 中创建具有描述性名称的 store
- 使用 `create<StoreType>((set, get) => ({ ... }))` 模式
- 导出类型化 hook：`export const useChatStore = create<ChatState>((set, get) => ({ ... }));`
- 单独定义状态接口以提高可读性

### 错误处理

- 异步操作使用 try/catch
- 非关键失败记录警告：`console.warn('Failed to load:', err)`
- 在 UI 中使用面向用户的错误状态（例如聊天页面的错误栏）
- 让关键错误传播（不要捕获后忽略）
- 使用空数组/对象作为后备，避免到处进行 null 检查

### 测试（Vitest）

- 测试文件：`tests/unit/*.test.ts` 或 `tests/unit/*.spec.ts`
- 组件测试使用 `@testing-library/react`
- 使用 `describe` 块分组相关测试
- 使用描述性测试名称：`describe('functionName', () => { it('should do X when Y', ...) })`
- 使用 `vi.fn()` 和 `vi.mock()` 模拟 Electron API
- 使用 vitest 的 `expect` 断言

**示例：**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { formatDuration } from '@/lib/utils';

describe('formatDuration', () => {
  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });
});
```

### Tailwind CSS

- 直接在 JSX 中使用工具类
- 使用 `cn()` 合并条件类名
- 避免自定义 CSS——使用 Tailwind 工具类
- 遵循 Tailwind 默认调色板（例如 `text-muted-foreground`、`bg-primary`）

### Electron/IPC

- IPC 处理器放在 `electron/main/ipc-handlers.ts`
- 在渲染进程中使用 `window.electron.ipcRenderer.invoke('channel', ...args)`
- Preload 通过 `window.electron` 暴露类型化 API
- 在渲染进程中优雅处理 IPC 错误

### 文件组织

```
src/
├── components/
│   ├── ui/          # shadcn/ui 基础组件
│   ├── common/      # 共享组件（LoadingSpinner、ErrorBoundary）
│   ├── layout/      # 布局组件（Sidebar、TitleBar）
│   └── settings/    # 设置专用组件
├── pages/           # 路由页面（Chat、Dashboard、Settings 等）
├── stores/          # Zustand 状态存储
├── lib/             # 工具函数
└── App.tsx          # 根组件

electron/
├── main/            # 主进程（index.ts、ipc-handlers.ts 等）
├── preload/         # 预加载脚本
├── gateway/         # Gateway 管理
└── utils/           # Electron 工具

tests/
├── unit/            # 单元测试
└── setup.ts         # Vitest 配置
```

### 常见陷阱

- **React 19**：使用新的 JSX 转换——无需在每个文件中导入 React
- **ESLint 未使用变量**：未使用的参数添加 `_` 前缀或使用 `varsIgnorePattern`
- **严格空检查**：显式处理 `null`/`undefined`
- **异步状态**：Zustand setter 是同步的；异步操作使用回调或单独 actions
- **localStorage**：仅在渲染进程可用；主进程存储使用 IPC
