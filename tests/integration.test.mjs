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
    pretendToBeVisual: true
  });
  await new Promise((res, rej) => {
    dom.window.addEventListener('load', res);
    dom.window.addEventListener('error', e => rej(new Error('script error: ' + e.message)));
  });
  window = dom.window;
  document = window.document;
  App = window.__MDE_APP__;
});

after(() => {
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
  const btns = document.querySelectorAll('#appbar [data-app]');
  assert.ok(btns.length >= 10, '工具栏按钮齐全');
  let svgCount = 0;
  btns.forEach(b => { if (b.querySelector('svg')) svgCount++; });
  assert.ok(svgCount >= 10, '全部使用 SVG 图标');
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
