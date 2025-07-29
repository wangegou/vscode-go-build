"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let outputChannel;
// Go编译配置WebView提供器
class GoBuildConfigProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.config = {
            outputName: '',
            outputDir: './bin',
            targetOS: 'current',
            targetArch: 'current',
            enableRace: false,
            enableOptimization: true,
            stripSymbols: false,
            cgoEnabled: true
        };
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // 处理来自webview的消息
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'updateConfig':
                    this.updateConfig(data.key, data.value);
                    break;
                case 'compile':
                    this.executeCompile();
                    break;
                case 'getCommand':
                    this.sendCurrentCommand();
                    break;
            }
        });
    }
    refresh() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }
    updateConfig(key, value) {
        if (value === 'toggle') {
            this.config[key] = !this.config[key];
        }
        else {
            this.config[key] = value;
        }
        // 智能冲突处理
        if (key === 'stripSymbols' && this.config.stripSymbols) {
            // 启用压缩体积时，自动启用优化（禁用调试模式）
            this.config.enableOptimization = true;
        }
        this.refresh();
        this.sendCurrentCommand();
    }
    getConfig() {
        return this.config;
    }
    sendCurrentCommand() {
        const command = this.buildCommand();
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateCommand',
                command: command
            });
        }
    }
    buildCommand() {
        var _a;
        const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
        if (!workspaceFolder) {
            throw new Error('请先打开一个Go工作区');
        }
        let command = 'go build';
        // 添加输出文件名
        if (this.config.outputName) {
            command += ` -o ${this.config.outputDir}/${this.config.outputName}`;
        }
        else {
            const projectName = path.basename(workspaceFolder.uri.fsPath);
            command += ` -o ${this.config.outputDir}/${projectName}`;
        }
        // 添加竞态检测
        if (this.config.enableRace) {
            command += ' -race';
        }
        // 智能冲突处理：压缩体积与调试模式互斥
        if (this.config.stripSymbols) {
            // 启用压缩体积时，添加链接标志
            command += ' -ldflags "-s -w"';
        }
        // 只有明确关闭优化且未启用压缩体积时才添加调试标志
        if (!this.config.enableOptimization && !this.config.stripSymbols) {
            command += ' -gcflags "-N -l"';
        }
        // 设置CGO环境变量
        const cgoEnabled = this.config.cgoEnabled ? '1' : '0';
        // 设置交叉编译环境变量
        if (this.config.targetOS !== 'current' || this.config.targetArch !== 'current') {
            const goos = this.config.targetOS === 'current' ? process.env.GOOS || process.platform : this.config.targetOS;
            const goarch = this.config.targetArch === 'current' ? process.env.GOARCH || process.arch : this.config.targetArch;
            command = `CGO_ENABLED=${cgoEnabled} GOOS=${goos} GOARCH=${goarch} ${command}`;
        }
        else {
            command = `CGO_ENABLED=${cgoEnabled} ${command}`;
        }
        command += ' .';
        return command;
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Go 编译配置</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 10px;
                    margin: 0;
                }
                .config-section {
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                .config-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: var(--vscode-textLink-foreground);
                }
                .config-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    gap: 10px;
                }
                .config-label {
                    min-width: 80px;
                    font-size: 12px;
                }
                input, select {
                    flex: 1;
                    padding: 4px 8px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 2px;
                }
                button {
                     padding: 6px 12px;
                     border: none;
                     border-radius: 2px;
                     background-color: #666;
                     color: #ccc;
                     cursor: pointer;
                     margin: 2px;
                     transition: all 0.2s ease;
                 }
                 button:hover {
                     background-color: #777;
                 }
                 button.selected {
                     background-color: var(--vscode-button-background);
                     color: var(--vscode-button-foreground);
                 }
                 input:focus {
                     outline: 1px solid var(--vscode-focusBorder);
                     outline-offset: -1px;
                 }
                .compile-button {
                    background-color: #666;
                    color: #ccc;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 20px 0;
                    width: 100%;
                    transition: all 0.2s ease;
                }
                .compile-button:hover {
                    background-color: #777;
                }
                .compile-button.active {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .compile-button.compiling {
                    background-color: #666;
                    color: #ccc;
                    cursor: not-allowed;
                }
                .compile-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .button-group {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                }
            </style>
        </head>
        <body>
            <div class="config-section">
                 <div class="config-title">📁 基本配置</div>
                 <div class="config-row">
                     <span class="config-label">输出目录:</span>
                     <input type="text" id="outputDir" value="${this.config.outputDir}" placeholder="./bin">
                 </div>
                 <div class="config-row">
                     <span class="config-label">文件名:</span>
                     <input type="text" id="outputName" value="${this.config.outputName}" placeholder="默认">
                 </div>
             </div>

            <div class="config-section">
                 <div class="config-title">💻 目标系统</div>
                 <div class="button-group">
                     <button onclick="setConfig('targetOS', 'current')" class="${this.config.targetOS === 'current' ? 'selected' : ''}">当前系统</button>
                     <button onclick="setConfig('targetOS', 'windows')" class="${this.config.targetOS === 'windows' ? 'selected' : ''}">Windows</button>
                     <button onclick="setConfig('targetOS', 'linux')" class="${this.config.targetOS === 'linux' ? 'selected' : ''}">Linux</button>
                     <button onclick="setConfig('targetOS', 'darwin')" class="${this.config.targetOS === 'darwin' ? 'selected' : ''}">macOS</button>
                     <button onclick="setConfig('targetOS', 'freebsd')" class="${this.config.targetOS === 'freebsd' ? 'selected' : ''}">FreeBSD</button>
                 </div>
             </div>
 
             <div class="config-section">
                 <div class="config-title">🏗️ 目标架构</div>
                 <div class="button-group">
                     <button onclick="setConfig('targetArch', 'current')" class="${this.config.targetArch === 'current' ? 'selected' : ''}">当前架构</button>
                     <button onclick="setConfig('targetArch', 'amd64')" class="${this.config.targetArch === 'amd64' ? 'selected' : ''}">AMD64</button>
                     <button onclick="setConfig('targetArch', 'arm64')" class="${this.config.targetArch === 'arm64' ? 'selected' : ''}">ARM64</button>
                     <button onclick="setConfig('targetArch', '386')" class="${this.config.targetArch === '386' ? 'selected' : ''}">386</button>
                     <button onclick="setConfig('targetArch', 'arm')" class="${this.config.targetArch === 'arm' ? 'selected' : ''}">ARM</button>
                 </div>
             </div>
 
             <div class="config-section">
                 <div class="config-title">⚙️ 编译选项</div>
                 <div class="button-group">
                     <button onclick="toggleConfig('enableRace')" class="${this.config.enableRace ? 'selected' : ''}">🏃 竞态检测 ${this.config.enableRace ? '✓' : '✗'}</button>
                     <button onclick="toggleConfig('enableOptimization')" class="${this.config.enableOptimization ? 'selected' : ''}">🚀 优化编译 ${this.config.enableOptimization ? '✓' : '✗'}</button>
                     <button onclick="toggleConfig('stripSymbols')" class="${this.config.stripSymbols ? 'selected' : ''}">🗜️ 压缩体积 ${this.config.stripSymbols ? '✓' : '✗'}</button>
                     <button onclick="toggleConfig('cgoEnabled')" class="${this.config.cgoEnabled ? 'selected' : ''}">🔗 CGO支持 ${this.config.cgoEnabled ? '✓' : '✗'}</button>
                 </div>
             </div>

            <button class="compile-button" onclick="compile()">🔨 开始编译</button>
             
             <div class="config-section">
                 <div class="config-title">📋 当前命令</div>
                 <div id="commandDisplay" style="background-color: var(--vscode-editor-background); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: var(--vscode-editor-foreground); border: 1px solid var(--vscode-panel-border);">go build -o ./bin/project .</div>
             </div>
 
             <script>
                 const vscode = acquireVsCodeApi();
                 let isCompiling = false;
                 
                 function setConfig(key, value) {
                     if (isCompiling) return;
                     vscode.postMessage({
                         type: 'updateConfig',
                         key: key,
                         value: value
                     });
                     updateCommandDisplay();
                 }
                 
                 function toggleConfig(key) {
                     if (isCompiling) return;
                     vscode.postMessage({
                         type: 'updateConfig',
                         key: key,
                         value: 'toggle'
                     });
                     updateCommandDisplay();
                 }
                 
                 function compile() {
                     isCompiling = true;
                     const button = document.querySelector('.compile-button');
                     button.textContent = '🔄 编译中...';
                     button.classList.remove('active');
                     button.classList.add('compiling');
                     button.disabled = true;
                     
                     vscode.postMessage({
                         type: 'compile'
                     });
                     
                     // 3秒后恢复按钮状态
                     setTimeout(() => {
                         isCompiling = false;
                         button.textContent = '🔨 开始编译';
                         button.classList.remove('compiling');
                         button.classList.remove('active');
                         button.disabled = false;
                     }, 3000);
                 }
                 
                 // 鼠标点击时添加active状态
                 document.addEventListener('DOMContentLoaded', function() {
                     const compileButton = document.querySelector('.compile-button');
                     compileButton.addEventListener('mousedown', function() {
                         if (!isCompiling) {
                             this.classList.add('active');
                         }
                     });
                     compileButton.addEventListener('mouseup', function() {
                         if (!isCompiling) {
                             setTimeout(() => {
                                 this.classList.remove('active');
                             }, 100);
                         }
                     });
                     compileButton.addEventListener('mouseleave', function() {
                         if (!isCompiling) {
                             this.classList.remove('active');
                         }
                     });
                 });
                 
                 function updateCommandDisplay() {
                     // 这里会通过消息更新命令显示
                     vscode.postMessage({
                         type: 'getCommand'
                     });
                 }
                 
                 // 监听输入框焦点变化 - 直接判断焦点状态
                 document.addEventListener('blur', (e) => {
                     if (e.target.tagName === 'INPUT' && !isCompiling) {
                         // 输入框失去焦点时更新配置
                         vscode.postMessage({
                             type: 'updateConfig',
                             key: e.target.id,
                             value: e.target.value
                         });
                         updateCommandDisplay();
                     }
                 }, true); // 使用捕获阶段确保能监听到所有输入框
                 
                 // 监听输入框获得焦点
                 document.addEventListener('focus', (e) => {
                     if (e.target.tagName === 'INPUT' && !isCompiling) {
                         // 输入框获得焦点时可以做一些准备工作（如果需要）
                     }
                 }, true);
                 
                 // 页面加载时更新命令显示
                  window.addEventListener('load', () => {
                      updateCommandDisplay();
                  });
                  
                  // 监听来自扩展的消息
                  window.addEventListener('message', (event) => {
                      const message = event.data;
                      if (message.type === 'updateCommand') {
                          document.getElementById('commandDisplay').textContent = message.command;
                      }
                  });
             </script>
        </body>
        </html>`;
    }
    executeCompile() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('请先打开一个Go工作区');
                return;
            }
            // 使用buildCommand方法确保命令一致性
            const command = this.buildCommand();
            yield executeBuild(command, 'Go项目编译');
        });
    }
}
GoBuildConfigProvider.viewType = 'goBuildPanel';
function activate(context) {
    // 创建输出通道
    outputChannel = vscode.window.createOutputChannel('Go Build');
    // 创建Go编译配置提供器
    const goBuildConfigProvider = new GoBuildConfigProvider(context.extensionUri);
    // 注册webview view provider
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(GoBuildConfigProvider.viewType, goBuildConfigProvider));
    // 注册命令
    const disposables = [
        // 显示编译选项菜单
        vscode.commands.registerCommand('goBuild.showBuildOptions', showBuildOptions),
        // 编译当前文件
        vscode.commands.registerCommand('goBuild.buildCurrentFile', buildCurrentFile),
        // 编译整个项目
        vscode.commands.registerCommand('goBuild.buildProject', buildProject),
        // 编译并运行
        vscode.commands.registerCommand('goBuild.buildAndRun', buildAndRun),
        // 交叉编译
        vscode.commands.registerCommand('goBuild.crossCompile', crossCompile),
        // 清理输出
        vscode.commands.registerCommand('goBuild.clean', cleanOutput),
        // 编译设置
        vscode.commands.registerCommand('goBuild.settings', openSettings),
        // 执行编译
        vscode.commands.registerCommand('goBuild.executeCompile', () => {
            executeCompileWithConfig(goBuildConfigProvider);
        }),
        // 设置配置值
        vscode.commands.registerCommand('goBuild.setConfigValue', (configKey, value) => {
            goBuildConfigProvider.updateConfig(configKey, value);
            vscode.window.showInformationMessage(`已设置${configKey}为: ${value}`);
        }),
        // 打开Go编译面板
        vscode.commands.registerCommand('goBuild.openBuildPanel', () => {
            vscode.commands.executeCommand('workbench.view.extension.goBuildContainer');
        }),
        outputChannel
    ];
    context.subscriptions.push(...disposables);
}
exports.activate = activate;
function showBuildOptions() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = [
            {
                label: "$(file-code) 编译当前文件",
                description: "编译当前打开的Go文件",
                command: "buildCurrentFile"
            },
            {
                label: "$(package) 编译整个项目",
                description: "编译当前工作区的Go项目",
                command: "buildProject"
            },
            {
                label: "$(play) 编译并运行",
                description: "编译项目并立即运行",
                command: "buildAndRun"
            }
        ];
        const selected = yield vscode.window.showQuickPick(options, {
            placeHolder: "选择编译选项",
            matchOnDescription: true
        });
        if (selected) {
            switch (selected.command) {
                case 'buildCurrentFile':
                    yield buildCurrentFile();
                    break;
                case 'buildProject':
                    yield buildProject();
                    break;
                case 'buildAndRun':
                    yield buildAndRun();
                    break;
            }
        }
    });
}
function buildCurrentFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.document.languageId !== 'go') {
            vscode.window.showErrorMessage('请先打开一个Go文件');
            return;
        }
        const filePath = activeEditor.document.fileName;
        const fileName = path.basename(filePath, '.go');
        const config = vscode.workspace.getConfiguration('goBuild');
        const outputDir = config.get('outputDir', './bin');
        yield executeBuild(`go build -o ${outputDir}/${fileName} "${filePath}"`, '编译当前文件');
    });
}
function buildProject() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }
        const config = vscode.workspace.getConfiguration('goBuild');
        const outputDir = config.get('outputDir', './bin');
        const projectName = path.basename(workspaceFolder.uri.fsPath);
        const command = `go build -o ${outputDir}/${projectName} .`;
        yield executeBuild(command, '编译项目');
    });
}
function buildAndRun() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }
        // 先编译项目
        const config = vscode.workspace.getConfiguration('goBuild');
        const outputDir = config.get('outputDir', './bin');
        const projectName = path.basename(workspaceFolder.uri.fsPath);
        const buildCommand = `go build -o ${outputDir}/${projectName} .`;
        try {
            yield executeBuild(buildCommand, '编译项目');
            // 编译成功后运行
            const terminal = vscode.window.createTerminal('Go Run');
            terminal.sendText(`cd "${workspaceFolder.uri.fsPath}" && ./${outputDir}/${projectName}`);
            terminal.show();
            vscode.window.showInformationMessage('程序已在终端中运行');
        }
        catch (error) {
            // 编译失败，不运行
        }
    });
}
function executeBuild(command, taskName) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        outputChannel.clear();
        outputChannel.show();
        outputChannel.appendLine(`开始${taskName}...`);
        outputChannel.appendLine(`执行命令: ${command}`);
        outputChannel.appendLine('---');
        try {
            const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
            const cwd = (workspaceFolder === null || workspaceFolder === void 0 ? void 0 : workspaceFolder.uri.fsPath) || process.cwd();
            const { stdout, stderr } = yield execAsync(command, { cwd });
            if (stdout) {
                outputChannel.appendLine(stdout);
            }
            if (stderr) {
                outputChannel.appendLine(stderr);
            }
            outputChannel.appendLine('---');
            outputChannel.appendLine(`${taskName}成功完成！`);
            const config = vscode.workspace.getConfiguration('goBuild');
            if (config.get('showNotifications', true)) {
                vscode.window.showInformationMessage(`${taskName}成功！`);
            }
        }
        catch (error) {
            outputChannel.appendLine('---');
            outputChannel.appendLine(`${taskName}失败:`);
            outputChannel.appendLine(error.message);
            vscode.window.showErrorMessage(`${taskName}失败: ${error.message}`);
            throw error; // 重新抛出错误，供调用者处理
        }
    });
}
function crossCompile() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const platforms = [
            { label: 'Windows (amd64)', value: 'GOOS=windows GOARCH=amd64' },
            { label: 'Linux (amd64)', value: 'GOOS=linux GOARCH=amd64' },
            { label: 'macOS (amd64)', value: 'GOOS=darwin GOARCH=amd64' },
            { label: 'macOS (arm64)', value: 'GOOS=darwin GOARCH=arm64' },
            { label: 'Linux (arm64)', value: 'GOOS=linux GOARCH=arm64' }
        ];
        const selected = yield vscode.window.showQuickPick(platforms, {
            placeHolder: '选择目标平台'
        });
        if (selected) {
            const config = vscode.workspace.getConfiguration('goBuild');
            const outputDir = config.get('outputDir', './bin');
            const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
            const projectName = workspaceFolder ? path.basename(workspaceFolder.uri.fsPath) : 'app';
            const command = `${selected.value} go build -o ${outputDir}/${projectName}-${selected.label.toLowerCase().replace(/[^a-z0-9]/g, '-')} .`;
            yield executeBuild(command, `交叉编译 (${selected.label})`);
        }
    });
}
function cleanOutput() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const config = vscode.workspace.getConfiguration('goBuild');
        const outputDir = config.get('outputDir', './bin');
        try {
            const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('请先打开一个工作区');
                return;
            }
            const fullOutputPath = path.resolve(workspaceFolder.uri.fsPath, outputDir);
            // 检查目录是否存在
            if (fs.existsSync(fullOutputPath)) {
                // 读取目录内容并删除所有文件
                const files = fs.readdirSync(fullOutputPath);
                for (const file of files) {
                    const filePath = path.join(fullOutputPath, file);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    }
                    else {
                        fs.unlinkSync(filePath);
                    }
                }
                outputChannel.clear();
                outputChannel.show();
                outputChannel.appendLine('开始清理输出目录...');
                outputChannel.appendLine(`清理目录: ${fullOutputPath}`);
                outputChannel.appendLine(`已删除 ${files.length} 个文件/目录`);
                outputChannel.appendLine('---');
                outputChannel.appendLine('清理输出目录成功完成！');
                vscode.window.showInformationMessage('输出目录已清理');
            }
            else {
                vscode.window.showInformationMessage('输出目录不存在，无需清理');
            }
        }
        catch (error) {
            outputChannel.appendLine('---');
            outputChannel.appendLine('清理输出目录失败:');
            outputChannel.appendLine(error.message);
            vscode.window.showErrorMessage(`清理失败: ${error.message}`);
        }
    });
}
function openSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.commands.executeCommand('workbench.action.openSettings', 'goBuild');
    });
}
function executeCompileWithConfig(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const command = provider.buildCommand();
            yield executeBuild(command, 'Go项目编译');
        }
        catch (error) {
            vscode.window.showErrorMessage(error.message);
        }
    });
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map