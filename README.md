# MD Editor Desktop

所见即所得（WYSIWYG）Markdown 桌面编辑器，基于 Tauri 2，安装包约 **3~6 MB**。

## 架构

```
├─ index.html            应用外壳
├─ js/md-editor.js       编辑器核心（零依赖，WYSIWYG + Markdown 双向引擎）
├─ js/core.js            纯逻辑层（文件树/适配器/查找替换/表格操作/导出）
├─ js/app.js             应用层（Tauri/浏览器双桥接 + 功能装配）
├─ src-tauri/            Rust 后端（文件 IO / 目录遍历 / 图片落盘 / 对话框）
├─ tests/                Node + jsdom 自动化测试（21 项）
└─ .github/workflows/    CI 多平台构建（Windows / macOS / Linux）
```

## 功能清单

| 功能 | 说明 |
| --- | --- |
| WYSIWYG 编辑 | 打字即转换（`#`→标题、`**`→粗体等），13+ 语言代码高亮 |
| 文件树 | 打开文件夹，浏览/打开 .md，目录折叠，最近文件 |
| 文件读写 | Ctrl+S 保存、另存为、未保存关闭确认 |
| 图片本地化 | 粘贴/拖入图片 → 存到文档 `assets/` 目录（浏览器模式 dataURL） |
| 查找替换 | Ctrl+F / Ctrl+H，跨节点匹配计数、逐个替换、全部替换 |
| 源码模式 | Ctrl+/ 双向同步 |
| 导出 | HTML（内联样式独立文件）/ PDF（打印管线） |
| 表格工具 | 悬浮工具条，行/列增删（最小规模保护） |
| 大纲 | 标题层级导航 |
| 其他 | 深浅主题、中英双语、设置持久化、SVG 图标（无 emoji） |

## 开发

```bash
npm install        # 安装测试依赖
npm test           # 运行 21 项自动化测试
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

- 撤销/重做依赖 `execCommand`（块级结构变更后可能丢撤销栈），后续版本自建 undo 栈
- 数学公式（KaTeX）/ Mermaid 图表为下一迭代项
- 解析器为自研轻量实现，极复杂的嵌套 Markdown（多级列表、引用内代码块）还原度仍在持续改进
