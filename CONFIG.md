# Go Build Extension 配置说明

## package.json 配置文件详解

### 基本信息
- `name`: 插件包名，用于发布和识别
- `displayName`: 在VSCode中显示的插件名称
- `description`: 插件描述，说明插件功能
- `version`: 插件版本号

### 运行环境
- `engines.vscode`: 支持的VSCode最低版本要求
- `categories`: 插件分类，帮助用户在扩展市场中找到插件
- `activationEvents`: 插件激活条件，当打开Go文件时自动激活
- `main`: 插件入口文件路径

### 功能贡献点 (contributes)

#### 命令 (commands)
- `goBuild.showBuildOptions`: 显示编译选项
- `goBuild.buildCurrentFile`: 编译当前文件
- `goBuild.buildProject`: 编译整个项目
- `goBuild.buildAndRun`: 编译并运行
- `goBuild.openBuildPanel`: 打开Go编译面板

#### 视图容器 (viewsContainers)
- `goBuildContainer`: 在底部面板创建Go编译配置容器
- 使用工具图标 `$(tools)`

#### 视图 (views)
- `goBuildPanel`: 编译选项面板
- 类型为webview，支持自定义HTML界面

#### 菜单 (menus)
- `editor/context`: 在Go文件的右键菜单中添加编译选项

#### 配置项 (configuration)
- `goBuild.outputDir`: 编译输出目录，默认为 `./bin`
- `goBuild.showNotifications`: 是否显示编译通知，默认开启

### 脚本 (scripts)
- `vscode:prepublish`: 发布前执行的脚本
- `compile`: 编译TypeScript代码
- `watch`: 监听模式编译

### 开发依赖 (devDependencies)
- `@types/vscode`: VSCode API类型定义
- `@types/node`: Node.js类型定义
- `typescript`: TypeScript编译器

## 功能特性

### 已移除功能
- ❌ VSCode底栏状态栏菜单（已删除）

### 当前功能
- ✅ 底部面板webview配置界面
- ✅ 右键菜单编译选项
- ✅ 多种编译模式支持
- ✅ 交叉编译支持
- ✅ 实时命令预览
- ✅ 智能冲突检测

## 使用说明

1. 打开Go项目
2. 在底部面板找到"Go 编译配置"标签
3. 配置编译选项（输出目录、目标平台等）
4. 点击"🔨 开始编译"按钮
5. 查看编译结果和输出

## 开发说明

- 主要代码在 `src/extension.ts`
- 使用TypeScript开发
- 支持热重载开发模式
- 遵循VSCode扩展开发规范