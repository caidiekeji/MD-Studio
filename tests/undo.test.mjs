/* 自建 undo/redo 栈测试：打字合并、结构快照、撤销/重做、工具栏与快捷键接管 */
import { createRequire } from 'node:module';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let window, document, MDE, MDEUndo, editor, editorEl, undo;

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
  MDEUndo = require(join(rootDir, 'js/undo.js'));
  document.getElementById('host').innerHTML = '';
  editor = MDE.create(document.getElementById('host'), {
    storage: new MDE.adapters.Memory(),
    toolbar: true, outline: false, statusbar: false,
    autoSave: false, autofocus: false
  });
  editorEl = editor.editorEl;
  undo = MDEUndo.attach(editor);
});

after(async () => {
  /* 先销毁编辑器并等挂起的防抖计时器（syncDoc 120ms / typing 400ms）跑完，再关窗口 */
  try { undo.destroy(); editor.destroy(); } catch (err) {}
  await sleep(600);
  if (window) window.close();
});

const input = () => editorEl.dispatchEvent(new window.Event('input', { bubbles: true }));

test('基线：attach 后 reset 建立初始快照，canUndo 为 false', () => {
  editor.setMarkdown('hello world');
  assert.equal(undo.canUndo(), false, '仅基线无可撤销');
  assert.equal(editor.getMarkdown(), 'hello world');
});

test('同块打字合并为一个撤销点', async () => {
  editor.setMarkdown('first');
  const p = editorEl.firstElementChild;
  p.textContent = 'first plus more';
  input();
  await sleep(80);
  p.textContent = 'first plus more text';
  input();
  await sleep(450);   // 等待打字防抖提交
  assert.equal(undo.depth(), 2, '基线 + 合并后的打字快照');
  assert.ok(undo.canUndo());
  assert.ok(undo.undo(), '撤销成功');
  assert.equal(editor.getMarkdown(), 'first', '内容回到打字前');
  assert.ok(editorEl.textContent.includes('first'), 'DOM 已还原');
});

test('undo 后 redo 恢复', async () => {
  // 承接上一测试：当前处于基线
  assert.ok(undo.canRedo());
  assert.ok(undo.redo(), '重做成功');
  assert.equal(editor.getMarkdown(), 'first plus more text');
  assert.equal(undo.canRedo(), false, '已到最新');
});

test('结构变更（新增块）立即生成撤销点', () => {
  editor.setMarkdown('only para');
  const p2 = document.createElement('p');
  p2.dataset.type = 'paragraph';
  p2.innerHTML = 'added block';
  editorEl.appendChild(p2);
  input();   // 块签名变化 → 立即提交
  assert.ok(undo.canUndo(), '结构快照已入栈');
  assert.ok(undo.undo());
  assert.equal(editor.getMarkdown(), 'only para', '新块被撤销移除');
  undo.redo();
  assert.ok(editor.getMarkdown().includes('added block'), '重做恢复新块');
});

test('工具栏撤销/重做按钮被接管（不再走 execCommand）', async () => {
  editor.setMarkdown('before click');
  const p = editorEl.firstElementChild;
  p.textContent = 'after click';
  input();
  await sleep(450);
  const btnUndo = document.querySelector('[data-action="undo"]');
  const btnRedo = document.querySelector('[data-action="redo"]');
  assert.ok(btnUndo && btnRedo);
  btnUndo.click();
  assert.equal(editor.getMarkdown(), 'before click', '工具栏撤销生效');
  btnRedo.click();
  assert.equal(editor.getMarkdown(), 'after click', '工具栏重做生效');
});

test('Ctrl+Z / Ctrl+Y 快捷键被接管', async () => {
  editor.setMarkdown('origin');
  const p = editorEl.firstElementChild;
  p.textContent = 'changed';
  input();
  await sleep(450);
  editorEl.dispatchEvent(new window.KeyboardEvent('keydown', {
    key: 'z', ctrlKey: true, bubbles: true, cancelable: true
  }));
  assert.equal(editor.getMarkdown(), 'origin', 'Ctrl+Z 撤销生效');
  editorEl.dispatchEvent(new window.KeyboardEvent('keydown', {
    key: 'y', ctrlKey: true, bubbles: true, cancelable: true
  }));
  assert.equal(editor.getMarkdown(), 'changed', 'Ctrl+Y 重做生效');
});

test('setMarkdown / newDoc 自动重建基线', () => {
  editor.setMarkdown('doc A');
  const p = editorEl.firstElementChild;
  p.textContent = 'doc A edited';
  input();
  editor.setMarkdown('doc B');
  assert.equal(undo.canUndo(), false, '换文档后撤销栈重置');
  assert.equal(editor.getMarkdown(), 'doc B');
});
