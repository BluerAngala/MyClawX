<p align="center">
  <img src="src/assets/logo.svg" width="128" height="128" alt="MyClawX Logo" />
</p>

<h1 align="center">MyClawX</h1>

<p align="center">
  <strong>基于 OpenClaw 二次开发的图形化 AI 助手</strong>
</p>

<p align="center">
  简体中文 | <a href="README.md">English</a>
</p>

---

## 项目简介

**MyClawX** 是一个基于 [OpenClaw](https://github.com/OpenClaw) 二次开发的图形化桌面应用。我们的目标是为普通用户提供一个**零门槛、易上手**的 AI 自动化工具。

相较于原始项目，MyClawX 更加注重小白用户的体验，通过直观的图形界面取代复杂的命令行操作，让每个人都能轻松驾驭强大的 AI Agent。

### 核心亮点

- **面向小白设计**：全图形化操作，无需了解任何编程知识或终端命令。
- **深度场景自动化**：内置针对不同**职业**（如内容创作者、律师等）和**场景**优化的预设方案。
- **开箱即用**：内置环境管理，自动配置 Python 运行环境，实现真正的“一键启动”。
- **深度集成**：无缝对接 OpenClaw 强大的插件生态，支持多渠道（飞书、钉钉、微信等）自动化。

---

## 主要功能

### 🎯 职业与场景预设
支持按职业定制 AI 行为。无论你是需要辅助文案创作，还是进行法律条文检索，MyClawX 都能提供深度的自动化支持。

### 💬 极简聊天体验
现代化的聊天界面，支持 Markdown 渲染，让 AI 交互像使用社交软件一样自然。

### ⏰ 智能定时任务
通过图形化界面配置 Cron 任务，让 AI 代理在后台为你 7x24 小时工作，自动处理资讯、监控数据或发送提醒。

### 🧩 技能一键扩展
集成技能市场，无需配置复杂的 package.json，点点鼠标即可为你的 AI 助手增加新功能。

### 🔐 安全与隐私
API 密钥等敏感信息存储在系统原生的安全保险箱中，所有 AI 推理逻辑支持本地运行，保护您的隐私。

---

## 快速开始

### 系统要求

- **操作系统**: Windows 10+, macOS 11+, 或 Linux (Ubuntu 20.04+)
- **内存**: 4GB RAM (推荐 8GB)
- **磁盘空间**: 约 1GB 可用空间

### 安装方式

1. **直接下载**：前往 [Releases](https://github.com/BluerAngala/MyClawX/releases) 页面下载对应系统的 `.exe` 或 `.dmg` 安装包。
2. **一键安装**：运行安装程序，按照引导完成初始化即可。

---

## 开发者相关

如果您希望基于本项目进行开发：

```bash
# 克隆仓库
git clone https://github.com/BluerAngala/MyClawX.git
cd MyClawX

# 初始化环境
pnpm run init

# 启动开发模式
pnpm dev
```

---

## 致谢

MyClawX 离不开以下优秀开源项目的支持：

- [OpenClaw](https://github.com/OpenClaw) – 强大的 AI Agent 运行时
- [Electron](https://www.electronjs.org/) – 跨平台桌面框架
- [React](https://react.dev/) – UI 组件库

---

## 许可证

本项目采用 [GPL v3.0](LICENSE) 协议开源。
- **协议继承**：二次修改或分发必须遵循相同的协议。
- **源码公开**：分发修改版本时必须公开源代码。

---

<p align="center">
  <sub>Built with ❤️ by BluerAngala</sub>
</p>
