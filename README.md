# Go Build Extension

🚀 一个功能丰富的 VSCode 插件，提供可视化的 Go 程序编译配置界面，让 Go 开发更加高效便捷！

![Pasted Graphic.png](https://s2.loli.net/2025/07/30/Q2u7kKh9nwgGUpY.png)

![Go Build Extension](https://img.shields.io/badge/Go-Build%20Extension-00ADD8?style=for-the-badge&logo=go)

## ✨ 功能特性

### 🎯 核心功能

- **🖥️ 可视化配置面板**: 在 VSCode 底部面板提供图形化编译配置界面
- **⚡ 实时命令预览**: 底部显示当前配置对应的完整 Go 编译命令
- **🔧 多种编译模式**: 支持普通编译、调试模式、压缩体积等选项
- **🌍 交叉编译支持**: 支持 Windows、Linux、macOS、FreeBSD 等目标系统
- **🏗️ 多架构支持**: 支持 AMD64、ARM64、386、ARM 等目标架构
- **🏃 竞态检测**: 内置 Go race detector 支持
- **🔗 CGO 支持**: 可切换 CGO_ENABLED=0/1，支持纯 Go 编译和 C 库调用
- **🧠 智能冲突检测**: 自动处理编译选项之间的冲突
- **📱 右键菜单集成**: 在 Go 文件上右键可快速访问编译选项

## 📖 使用方法

### 🚀 快速开始

1. **打开 Go 项目** - 在 VSCode 中打开包含 Go 代码的项目
2. **打开编译面板** - 在 VSCode 底部面板找到"Go 编译配置"标签页
3. **配置编译选项**：
   - 📁 **输出目录**: 设置编译输出路径（默认：`./bin`）
   - 📝 **文件名**: 设置输出文件名（可选，默认使用项目名）
   - 🌍 **目标系统**: 选择 Windows、Linux、macOS、FreeBSD
   - 🏗️ **目标架构**: 选择 AMD64、ARM64、386、ARM
   - ⚙️ **编译选项**: 启用/禁用各种编译特性
4. **预览命令** - 查看底部"当前命令"区域的实时命令预览
5. **开始编译** - 点击"🔨 开始编译"按钮执行编译

### 🎮 快捷操作

- **右键菜单**: 在`.go`文件上右键选择"显示编译选项"
- **命令面板**: 按`Ctrl+Shift+P`，输入"Go Build"查看所有可用命令
- **快捷键**: 可在 VSCode 设置中为常用命令配置快捷键

## ⚙️ 编译选项详解

### 🔧 基础选项

- **🚀 优化编译**: 启用 Go 默认优化，提升运行性能（默认开启）
- **🏃 竞态检测**: 启用 Go race detector，检测并发竞态问题
- **🗜️ 压缩体积**: 去除符号表和调试信息，显著减小文件体积
- **🔗 CGO 支持**: 控制 CGO_ENABLED 环境变量
  - ✅ **启用 CGO**: 支持调用 C 代码和库
  - ❌ **禁用 CGO**: 生成纯 Go 二进制文件，更好的可移植性

### 🌍 交叉编译支持

| 目标系统 | 支持架构               | 说明                        |
| -------- | ---------------------- | --------------------------- |
| Windows  | AMD64, 386, ARM64      | 生成.exe 可执行文件         |
| Linux    | AMD64, 386, ARM64, ARM | 适用于各种 Linux 发行版     |
| macOS    | AMD64, ARM64           | 支持 Intel 和 Apple Silicon |
| FreeBSD  | AMD64, 386, ARM64, ARM | Unix 系统支持               |

## 📦 安装方法

### 🛒 从 VSCode 扩展商店安装（推荐）

1. 打开 VSCode
2. 点击左侧活动栏的扩展图标（或按`Ctrl+Shift+X`）
3. 搜索"Go Build Extension"
4. 点击"安装"按钮
5. 重新加载 VSCode

### 📁 从 VSIX 文件安装

1. 下载最新的`.vsix`文件
2. 在 VSCode 中按`Ctrl+Shift+P`（Windows/Linux）或`Cmd+Shift+P`（Mac）
3. 输入"Extensions: Install from VSIX"
4. 选择下载的`.vsix`文件
5. 重启 VSCode

### 🔧 开发模式

```bash
# 克隆项目
git clone https://github.com/wangergou/vscode-go-build.git
cd vscode-go-build

# 安装依赖
npm install

# 编译TypeScript
npm run compile

# 在VSCode中按F5启动扩展开发主机
```

## ⚙️ 配置选项

### 🔧 扩展设置

在 VSCode 设置中可以配置以下选项：

```json
{
  // 默认输出目录
  "goBuild.outputDir": "./bin",

  // 是否显示编译通知
  "goBuild.showNotifications": true
}
```

### 🎯 使用场景

#### 🚀 日常开发

- 使用默认配置快速编译当前项目
- 启用竞态检测确保并发安全
- 使用 CGO 支持调用 C 库

#### 🌍 部署发布

- 禁用 CGO 生成静态链接的可执行文件
- 启用压缩体积减小文件大小
- 交叉编译生成多平台版本

#### 🐛 调试测试

- 启用竞态检测发现并发问题
- 保留调试信息便于问题定位
- 使用优化编译提升性能

## 🔍 常见问题

### Q: 为什么交叉编译失败？

A: 确保目标平台支持所选架构，某些 CGO 依赖可能不支持交叉编译。

### Q: 如何生成静态链接的可执行文件？

A: 禁用 CGO 支持（CGO_ENABLED=0）并启用压缩体积选项。

### Q: 竞态检测影响性能吗？

A: 是的，竞态检测会显著降低性能，仅在开发和测试时使用。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看[LICENSE](LICENSE)文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**如果这个扩展对你有帮助，请给个 ⭐️ 支持一下！**
