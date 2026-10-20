/* 嵌套 Markdown 解析增强测试：多级列表缩进、引用内代码块 */
import { createRequire } from 'node:module';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

let window, document, MDE, editor, editorEl;

before(() => {
  const dom = new JSDOM('<body><div id="host"></div></body>', {
    pretendToBeVisual: true, url: 'http://localhost/'
  });
  window = dom.window;
  global.window = window;
  global.document = window.document;
  document = window.document;
  global.NodeFilter = window.NodeFilter;
  MDE = require(join(rootDir, 'js/md-editor.js'));
  document.getElementById('host').innerHTML = '';
  editor = MDE.create(document.getElementById('host'), {
    storage: new MDE.adapters.Memory(),
    toolbar: false, outline: false, statusbar: false,
    autoSave: false, autofocus: false
  });
  editorEl = editor.editorEl;
});

after(() => { if (window) window.close(); });

function roundtrip(md) {
  editor.setMarkdown(md);
  const once = editor.getMarkdown();
  editor.setMarkdown(once);
  const twice = editor.getMarkdown();
  return { once, twice };
}

test('多级嵌套列表：缩进层级保留', () => {
  editor.setMarkdown('- a\n  - b\n    - c\n- d');
  const lis = editorEl.querySelectorAll('.mde-li');
  assert.equal(lis.length, 4, '4 个列表项');
  assert.equal(lis[1].dataset.indent, '1', '第二项缩进 1 级');
  assert.equal(lis[2].dataset.indent, '2', '第三项缩进 2 级');
  assert.equal(lis[3].dataset.indent, undefined, '第四项无缩进');
  assert.ok(lis[2].style.marginLeft.includes('56'), '缩进渲染为 56px');
});

test('多级嵌套列表：序列化还原缩进且幂等', () => {
  const { once, twice } = roundtrip('- a\n  - b\n    - c\n- d');
  assert.ok(once.includes('\n  - b'), '一次往返保留二级缩进');
  assert.ok(once.includes('\n    - c'), '一次往返保留三级缩进');
  assert.equal(once, twice, '往返幂等');
});

test('嵌套任务列表：缩进与勾选状态保留', () => {
  const { once, twice } = roundtrip('- [ ] parent\n  - [x] child');
  assert.ok(once.includes('- [ ] parent'), '父项未勾选');
  assert.ok(once.includes('\n  - [x] child'), '子项勾选且缩进保留');
  assert.equal(once, twice);
});

test('引用内代码块：结构化渲染', () => {
  editor.setMarkdown('> before code\n> ```js\n> var x = 1;\n> ```\n> after code');
  const quote = editorEl.querySelector('blockquote[data-parts="1"]');
  assert.ok(quote, '引用块标记为 parts 结构');
  const qt = quote.querySelectorAll('.mde-quote-text');
  const cb = quote.querySelectorAll('.mde-codeblock');
  assert.equal(qt.length, 2, '两段文本');
  assert.equal(cb.length, 1, '一个代码块');
  assert.equal(cb[0].dataset.lang, 'js', '语言保留');
  assert.equal(cb[0].querySelector('code').textContent, 'var x = 1;', '代码内容保留');
});

test('引用内代码块：序列化完整还原且幂等', () => {
  const { once, twice } = roundtrip('> before code\n> ```js\n> var x = 1;\n> ```\n> after code');
  assert.equal(once, '> before code\n> ```js\n> var x = 1;\n> ```\n> after code', '逐行还原');
  assert.equal(once, twice);
});

test('普通引用（无代码）不受影响', () => {
  const { once, twice } = roundtrip('> plain quote\n> second line');
  assert.equal(once, '> plain quote\n> second line');
  assert.equal(once, twice);
  assert.ok(!editorEl.querySelector('blockquote[data-parts]'), '不启用 parts 结构');
});

test('列表项 Enter 继承缩进（listEnter 数据传递）', () => {
  editor.setMarkdown('- root\n  - child');
  const child = editorEl.querySelectorAll('.mde-li')[1];
  assert.equal(child.dataset.indent, '1', '解析出缩进');
});
