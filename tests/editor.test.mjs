/* jsdom 环境：编辑器核心往返测试 + DOM 层查找替换/表格操作测试 */
import { createRequire } from 'node:module';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="host"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/'
});

before(() => {
  global.window = dom.window;
  global.document = dom.window.document;
  global.NodeFilter = dom.window.NodeFilter;
  global.Node = dom.window.Node;
  global.Event = dom.window.Event;
});

after(() => {
  delete global.window;
  delete global.document;
});

function loadLib() {
  const MDE = require('../js/md-editor.js');
  const Core = require('../js/core.js');
  return { MDE, Core };
}

const SAMPLE = [
  '# 标题一',
  '',
  '一段 **粗体** 和 *斜体* 以及 `code` 和 [链接](https://example.com)。',
  '',
  '## 标题二',
  '',
  '> 引用文本',
  '',
  '- 列表项 A',
  '- 列表项 B',
  '',
  '1. 有序一',
  '2. 有序二',
  '',
  '- [x] 已完成任务',
  '- [ ] 未完成任务',
  '',
  '```js',
  'const x = 1;',
  '```',
  '',
  '---',
  '',
  '| 列1 | 列2 |',
  '| --- | --- |',
  '| a | b |',
  '',
  '结尾段落'
].join('\n');

test('编辑器往返：setMarkdown → getMarkdown 幂等', () => {
  const { MDE } = loadLib();
  document.getElementById('host').innerHTML = '';
  const ed = MDE.create('#host', {
    storage: new MDE.adapters.Memory(),
    toolbar: false, outline: false, statusbar: false,
    autoSave: false, autofocus: false
  });
  ed.setMarkdown(SAMPLE);
  const out1 = ed.getMarkdown();
  // 关键内容标记全部保留
  assert.ok(out1.includes('# 标题一'));
  assert.ok(out1.includes('## 标题二'));
  assert.ok(out1.includes('**粗体**'));
  assert.ok(out1.includes('*斜体*'));
  assert.ok(out1.includes('`code`'));
  assert.ok(out1.includes('[链接](https://example.com)'));
  assert.ok(out1.includes('> 引用文本'));
  assert.ok(out1.includes('- 列表项 A'));
  assert.ok(out1.includes('1. 有序一'));
  assert.ok(out1.includes('- [x] 已完成任务'));
  assert.ok(out1.includes('- [ ] 未完成任务'));
  assert.ok(out1.includes('```js\nconst x = 1;\n```'));
  assert.ok(out1.includes('---'));
  assert.ok(out1.includes('| 列1 | 列2 |'));
  assert.ok(out1.includes('| a | b |'));
  // 幂等：再次解析序列化结果不变
  ed.setMarkdown(out1);
  const out2 = ed.getMarkdown();
  assert.equal(out2, out1);
  ed.destroy();
});

test('编辑器：空文档 / newDoc / dirty 状态', () => {
  const { MDE } = loadLib();
  document.getElementById('host').innerHTML = '';
  const ed = MDE.create('#host', {
    storage: new MDE.adapters.Memory(),
    toolbar: false, outline: false, statusbar: false,
    autoSave: false, autofocus: false
  });
  ed.setMarkdown(SAMPLE);
  assert.ok(ed.isDirty());
  ed.newDoc();
  assert.equal(ed.getMarkdown(), '');
  assert.equal(ed.getTitle(), '未命名');
  ed.destroy();
});

test('sanitizeUrl：XSS 防护', () => {
  const { MDE } = loadLib();
  const { sanitizeUrl } = MDE;
  assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeUrl('java\nscript:alert(1)'), '');
  assert.equal(sanitizeUrl(' data:text/html;base64,xxx'), '');
  assert.equal(sanitizeUrl('https://example.com'), 'https://example.com');
  assert.equal(sanitizeUrl('/local/path'), '/local/path');
  assert.equal(sanitizeUrl('#anchor'), '#anchor');
  assert.equal(sanitizeUrl('data:image/png;base64,xxx', true), 'data:image/png;base64,xxx');
  assert.equal(sanitizeUrl('data:text/html,xxx', true), '');
});

test('DOM 查找替换：collectTextNodes / locate / replaceRange', () => {
  const { Core } = loadLib();
  const d = document;
  const root = d.createElement('div');
  root.innerHTML = '<p>hello <b>brave</b> world</p><p>second line</p>';
  d.body.appendChild(root);
  const ctx = Core.collectTextNodes(root);
  assert.equal(ctx.text, 'hello brave worldsecond line');

  // 跨节点替换：'brave' 在 <b> 内
  const m = Core.findMatches(ctx.text, 'brave')[0];
  assert.ok(Core.replaceRange(ctx, m.start, m.end, 'BRAVE'));
  assert.equal(root.querySelector('b').textContent, 'BRAVE');

  // 替换跨两个节点的区间（<b> 尾部与后续文本节点）
  const ctx2 = Core.collectTextNodes(root);
  const m2 = Core.findMatches(ctx2.text, 'world')[0];
  assert.ok(Core.replaceRange(ctx2, m2.start, m2.end, 'LO'));
  assert.ok(root.textContent.includes('LO'));
  assert.ok(!root.textContent.includes('world'));

  // 无命中时无改动
  const ctx3 = Core.collectTextNodes(root);
  assert.equal(Core.replaceRange(ctx3, 9999, 10000, 'x'), false);

  const pos = Core.locate(ctx, 2);
  assert.equal(pos.node.nodeType, 3);
  root.remove();
});

test('表格操作：行列增删与最小规模保护', () => {
  const { Core } = loadLib();
  const d = document;
  const table = d.createElement('table');
  table.innerHTML = '<thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody>';
  d.body.appendChild(table);

  // 插入行
  const tbodyRow = table.querySelector('tbody tr');
  const nr = Core.tableInsertRow(table, tbodyRow, false);
  assert.equal(table.querySelectorAll('tbody tr').length, 2);
  assert.equal(nr.children.length, 2);

  // 插入列
  Core.tableInsertCol(table, table.querySelector('th'), false);
  assert.equal(table.querySelectorAll('tr')[0].children.length, 3);
  assert.equal(table.querySelector('thead tr').children[1].tagName, 'TH');

  // 删行保护：tbody 只剩 1 行时拒绝删除
  const rows = table.querySelectorAll('tbody tr');
  Core.tableDeleteRow(table, rows[1]);
  assert.equal(table.querySelectorAll('tbody tr').length, 1);
  assert.equal(Core.tableDeleteRow(table, table.querySelector('tbody tr')), false);

  // 删列保护：仅剩 1 列时拒绝
  Core.tableDeleteCol(table, table.querySelector('thead tr').children[2]);
  assert.equal(table.querySelector('thead tr').children.length, 2);
  assert.equal(Core.tableDeleteCol(table, table.querySelector('td')), true);
  assert.equal(table.querySelector('thead tr').children.length, 1);
  assert.equal(Core.tableDeleteCol(table, table.querySelector('td')), false);

  table.remove();
});

test('高亮器：token 分类', () => {
  const { MDE } = loadLib();
  const html = MDE.Highlighter.highlight('const x = 1; // hi', 'js');
  assert.ok(html.includes('mde-hl-kw'));
  assert.ok(html.includes('mde-hl-num'));
  assert.ok(html.includes('mde-hl-cmt'));
  // 未知语言原样转义
  assert.equal(MDE.Highlighter.highlight('<b>', 'unknown'), '&lt;b&gt;');
});
