/* 整机集成测试：jsdom 真实加载 index.html，验证应用功能闭环 */
import { createRequire } from 'node:module';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

let window, document, App;

before(async () => {
  const dom = await JSDOM.fromFile(join(rootDir, 'index.html'), {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(w) {
      w.__MDE_NO_CDN__ = true;   // 禁止 CDN 懒加载（KaTeX/Mermaid 走降级路径，测试确定性）
    }
  });
  await new Promise((res, rej) => {
    dom.window.addEventListener('load', res);
    dom.window.addEventListener('error', e => rej(new Error('script error: ' + e.message)));
  });
  window = dom.window;
  document = window.document;
  App = window.__MDE_APP__;
});

after(async () => {
  /* 等挂起的防抖计时器（syncDoc 120ms / enhance 350ms）跑完再关窗口 */
  await new Promise(r => setTimeout(r, 700));
  if (window) window.close();
});

test('应用启动：编辑器渲染示例文档', () => {
  assert.ok(App, '__MDE_APP__ 已暴露');
  assert.ok(document.getElementById('editorHost').classList.contains('mde-root'), 'mde-root 已创建');
  assert.ok(document.querySelector('#editorHost .mde-toolbar'), '工具栏已创建');
  assert.ok(document.querySelector('#editorHost .mde-sidebar'), '侧栏已创建');
  const headings = document.querySelectorAll('#editorHost .mde-editor [data-type="heading"]');
  assert.ok(headings.length >= 2, '示例文档标题已渲染');
  assert.ok(App.editor.getMarkdown().includes('# MD Editor'));
});

test('文件/大纲双 Tab 侧栏', () => {
  assert.ok(document.querySelector('.side-tab[data-tab="files"]'), '文件 Tab 存在');
  assert.ok(document.querySelector('.side-tab[data-tab="outline"]'), '大纲 Tab 存在');
  const items = document.querySelectorAll('#outlinePanel .outline-item');
  assert.ok(items.length >= 2, '大纲项已生成');
  // 点击大纲 Tab 切换
  document.querySelector('.side-tab[data-tab="outline"]').click();
  assert.ok(!document.getElementById('outlinePanel').classList.contains('hidden'));
  document.querySelector('.side-tab[data-tab="files"]').click();
  assert.ok(!document.getElementById('filePanel').classList.contains('hidden'));
});

test('顶部工具栏：按钮与 SVG 图标（无 emoji）', () => {
  const btns = document.querySelectorAll('#appbar [data-app], #menubar [data-app]');
  assert.ok(btns.length >= 10, '工具栏按钮齐全');
  let svgCount = 0;
  btns.forEach(b => { if (b.querySelector('svg')) svgCount++; });
  assert.ok(svgCount >= 10, '全部使用 SVG 图标');
});

test('菜单栏结构：五个标准菜单 + 快捷键提示', () => {
  const roots = document.querySelectorAll('#menuBar .menu-root');
  assert.equal(roots.length, 5, '文件/编辑/格式/视图/帮助 五个菜单根');
  const ids = Array.from(roots).map(r => r.querySelector('.menu.dropdown').id);
  assert.deepEqual(ids, ['menuFile', 'menuEdit', 'menuFormat', 'menuView', 'menuHelp'], '菜单顺序与命名');
  const kbds = document.querySelectorAll('#menuBar .menu-item kbd');
  assert.ok(kbds.length >= 15, '菜单项带快捷键提示，实测 ' + kbds.length);
  const seps = document.querySelectorAll('#menuBar .menu-sep');
  assert.ok(seps.length >= 5, '菜单分组分隔线');
  assert.ok(document.querySelectorAll('#menubar .menu-item svg').length === 0, '菜单用文字而非图标 emoji');
});

test('菜单开合：点击展开 → 执行动作 → 自动收起', () => {
  document.querySelector('.menu-root[data-mkey="f"] .menu-title').click();
  assert.ok(document.getElementById('menuFile').classList.contains('open'), '文件菜单展开');
  assert.ok(document.querySelector('.menu-root[data-mkey="f"]').classList.contains('open'), '根标题高亮');
  /* 执行文件菜单项（查找栏动作可确定验证） */
  document.querySelector('.menu-root[data-mkey="e"] .menu-title').click();
  assert.ok(document.getElementById('menuEdit').classList.contains('open'), '切到编辑菜单');
  document.querySelector('#menuEdit [data-app="find"]').click();
  assert.ok(!document.getElementById('findBar').classList.contains('hidden'), '菜单项动作生效');
  assert.ok(!document.querySelector('.menu.dropdown.open'), '动作执行后菜单收起');
  document.querySelector('[data-fact="close"]').click();
});

test('格式菜单转发到编辑器格式操作', () => {
  const boldBtn = document.querySelector('#editorHost .mde-btn[data-action="bold"]');
  assert.ok(boldBtn, '编辑器格式按钮存在（转发锚点）');
  let clicked = 0;
  boldBtn.addEventListener('click', () => { clicked++; });
  document.querySelector('.menu-root[data-mkey="o"] .menu-title').click();
  document.querySelector('#menuFormat [data-efwd="bold"]').click();
  assert.equal(clicked, 1, '格式菜单点击被转发到加粗按钮');
  assert.ok(!document.querySelector('.menu.dropdown.open'), '转发后菜单收起');
});

test('编辑菜单：撤销禁用态随 undo 栈刷新', () => {
  document.querySelector('.menu-root[data-mkey="e"] .menu-title').click();
  const undoItem = document.querySelector('#menuEdit [data-mstate="undo"]');
  /* 此前测试已重置过文档，undo 栈仅剩基线 → 撤销应禁用 */
  assert.ok(undoItem.classList.contains('disabled'), '无可撤销时禁用');
  const redoItem = document.querySelector('#menuEdit [data-mstate="redo"]');
  assert.ok(redoItem.classList.contains('disabled'), '无可重做时禁用');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(!document.querySelector('.menu.dropdown.open'), 'Esc 关闭菜单');
});

test('Alt 热键打开菜单（专业桌面软件行为）', () => {
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'f', altKey: true, bubbles: true, cancelable: true }));
  assert.ok(document.getElementById('menuFile').classList.contains('open'), 'Alt+F 打开文件菜单');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'v', altKey: true, bubbles: true, cancelable: true }));
  assert.ok(document.getElementById('menuView').classList.contains('open'), 'Alt+V 切换到视图菜单');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(!document.querySelector('.menu.dropdown.open'), 'Esc 关闭');
});

test('视图菜单：源码模式动作 + 主题切换勾选', () => {
  document.querySelector('.menu-root[data-mkey="v"] .menu-title').click();
  document.querySelector('#menuView [data-app="source"]').click();
  const ta = document.getElementById('sourceArea');
  assert.ok(!ta.classList.contains('hidden'), '菜单项打开源码模式');
  assert.ok(!document.querySelector('.menu.dropdown.open'), '菜单已收起');
  App.toggleSource(false);
  /* 主题项勾选态 */
  document.querySelector('.menu-root[data-mkey="v"] .menu-title').click();
  const lightItem = document.querySelector('#menuView [data-set="theme:light"]');
  assert.ok(lightItem.querySelector('.check'), '当前主题项带勾选标记');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
});

test('帮助菜单 → 快捷键模态框 → Esc 关闭', () => {
  document.querySelector('.menu-root[data-mkey="h"] .menu-title').click();
  document.querySelector('#menuHelp [data-mact="shortcuts"]').click();
  const modal = document.getElementById('appModal');
  assert.ok(!modal.classList.contains('hidden'), '模态框已打开');
  assert.ok(document.getElementById('modalTitle').textContent.length > 0, '模态框标题');
  assert.ok(document.querySelectorAll('#modalBody .sc-table kbd').length >= 8, '快捷键表格渲染');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(modal.classList.contains('hidden'), 'Esc 关闭模态框');
});

test('查找替换闭环：打开 → 匹配计数 → 全部替换', () => {
  App.findBarShow(true);
  assert.ok(!document.getElementById('findBar').classList.contains('hidden'), '查找栏已打开');
  const input = document.getElementById('findInput');
  input.value = '已完成';
  App.runFind();
  const status = document.getElementById('findStatus').textContent;
  assert.ok(/\d/.test(status), '显示匹配计数: ' + status);
  // 全部替换
  document.getElementById('replaceInput').value = '已交付';
  document.querySelector('[data-fact="replace-all"]').click();
  assert.ok(!App.editor.getMarkdown().includes('已完成'), '原文已替换');
  assert.ok(App.editor.getMarkdown().includes('已交付'), '新文本已生效');
  document.querySelector('[data-fact="close"]').click();
});

test('源码模式闭环：打开 → 内容同步 → 关闭回写', () => {
  App.toggleSource(true);
  const ta = document.getElementById('sourceArea');
  assert.ok(!ta.classList.contains('hidden'), '源码区可见');
  assert.ok(ta.value.includes('# MD Editor'), '源码内容同步');
  ta.value = App.editor.getMarkdown().replace('# MD Editor', '# 源码修改标题');
  App.toggleSource(false);
  assert.ok(ta.classList.contains('hidden'), '源码区已隐藏');
  assert.ok(App.editor.getMarkdown().includes('# 源码修改标题'), '修改已回写编辑器');
  assert.ok(document.querySelector('#editorHost .mde-editor [data-type="heading"]').textContent.includes('源码修改标题'));
});

test('导出 HTML：完整独立文档', () => {
  const html = App.buildExportHtml();
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('mde-styles') === false, '内联样式而非引用');
  assert.ok(html.includes('mde-hl-') || html.includes('<h1>'), '渲染内容存在');
  assert.ok(html.includes('<style>'), '样式已内联');
});

test('文件树空态与最近菜单', () => {
  assert.ok(App.state.mode === 'browser', '浏览器桥接模式');
  assert.ok(document.getElementById('filePanel').textContent.length > 0, '文件树有空态提示');
  // 最近菜单（示例打开未记录，应为空态或列表，不抛错）
  document.querySelector('[data-app="recent-menu"]').click();
  assert.ok(document.getElementById('recentMenu').classList.contains('open'));
  document.body.click();
});

test('主题与语言切换持久化', () => {
  document.querySelector('[data-app="settings-menu"]').click();
  document.querySelector('[data-set="theme:dark"]').click();
  assert.equal(document.body.getAttribute('data-theme'), 'dark');
  assert.equal(App.settings.theme, 'dark');
  document.querySelector('[data-app="settings-menu"]').click();
  document.querySelector('[data-set="lang:en"]').click();
  assert.equal(document.querySelector('[data-i18n="appName"]').textContent, 'MD Editor');
  // 还原
  document.querySelector('[data-app="settings-menu"]').click();
  document.querySelector('[data-set="theme:light"]').click();
  document.querySelector('[data-app="settings-menu"]').click();
  document.querySelector('[data-set="lang:zh"]').click();
  assert.equal(document.body.getAttribute('data-theme'), 'light');
});

test('dirty 状态与新文档', async () => {
  App.editor.setMarkdown('# dirty 检查\n\n内容');
  await new Promise(r => setTimeout(r, 250));  // 等待 onChange 防抖回调
  assert.equal(App.state.dirty, true, '编辑后为 dirty');
  App.editor.newDoc();
  App.state.dirty = false;
  assert.equal(App.editor.getMarkdown(), '', '空文档序列化为空字符串');
});
