# MD Editor Desktop

所见即所得（WYSIWYG）Markdown 桌面编辑器，基于 Tauri 2，安装包约 **3~6 MB**。

## 架构

```
├─ index.html            应用外壳（菜单栏 + 工具栏 + 编辑区）
├─ js/md-editor.js       编辑器核心（零依赖，WYSIWYG + Markdown 双向引擎）
├─ js/core.js            纯逻辑层（文件树/适配器/查找替换/表格操作/导出）
├─ js/undo.js            自建撤销/重做栈（快照模型）
├─ js/rich.js            数学公式（KaTeX）/ Mermaid 图表增强（懒加载）
├─ js/app.js             应用层（Tauri/浏览器双桥接 + 菜单系统 + 功能装配）
├─ src-tauri/            Rust 后端（文件 IO / 目录遍历 / 图片落盘 / 对话框）
├─ tests/                Node + jsdom 自动化测试（49 项）
└─ .github/workflows/    CI 多平台构建（Windows / macOS / Linux）
```

## 功能清单

| 功能 | 说明 |
| --- | --- |
| 专业菜单栏 | 文件/编辑/格式/视图/帮助 五大菜单，快捷键提示、Alt 热键（Alt+F 等）、方向键导航、悬停切换、禁用/勾选态 |
| WYSIWYG 编辑 | 打字即转换（`#`→标题、`**`→粗体等），13+ 语言代码高亮 |
| 自建撤销/重做栈 | 快照模型替换 execCommand 撤销：同块打字合并、结构变更独立入栈、换文档自动重建基线 |
| 数学公式 | `$行内$` / `$$块级$$` KaTeX 渲染，点击还原源码编辑，光标所在块暂不渲染 |
| Mermaid 图表 | ` ```mermaid ` 代码块自动渲染 SVG，语法错误降级显示源码，跟随深浅主题 |
| 文件树 | 打开文件夹，浏览/打开 .md，目录折叠，最近文件 |
| 文件读写 | Ctrl+S 保存、另存为、未保存关闭确认 |
| 图片本地化 | 粘贴/拖入图片 → 存到文档 `assets/` 目录（浏览器模式 dataURL） |
| 查找替换 | Ctrl+F / Ctrl+H，跨节点匹配计数、逐个替换、全部替换 |
| 源码模式 | Ctrl+/ 双向同步 |
| 导出 | HTML（内联样式独立文件）/ PDF（打印管线） |
| 表格工具 | 悬浮工具条，行/列增删（最小规模保护） |
| 嵌套结构 | 多级列表缩进（Tab/Shift+Tab 调整）、引用内代码块完整往返 |
| 大纲 | 标题层级导航 |
| 其他 | 深浅主题、中英双语、设置持久化、SVG 图标（无 emoji） |

## 开发

```bash
npm install        # 安装测试依赖
npm test           # 运行 49 项自动化测试
npm run build      # 构建 dist/（Tauri 前端产物）
```

## 构建桌面安装包

本地无需 Rust 环境，走 CI：推 tag（`v*`）或手动触发 `Build Desktop` workflow，
自动产出 Windows `.msi/.exe`、macOS `.dmg`、Linux `.deb/.AppImage`。

```bash
git init && git add -A && git commit -m "feat: md editor desktop"
git tag v1.0.0 && git push origin main --tags
```

## Tauri 本地调试（有 Rust 环境时）

```bash
cd src-tauri && cargo tauri dev
```

## 已知限制

- 数学公式与 Mermaid 图表首次渲染需联网加载 KaTeX/Mermaid（各约几百 KB，懒加载不进安装包）；离线时降级显示源码文本
- 解析器为自研轻量实现，已支持多级嵌套列表与引用内代码块；极复杂的混合嵌套场景仍在持续改进
