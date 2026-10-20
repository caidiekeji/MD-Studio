/* KaTeX 数学公式 / Mermaid 图表增强测试（jsdom 无网络环境，验证结构、序列化安全与降级） */
import { createRequire } from 'node:module';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

let window, document, MDE, MDERich, editor, editorEl, rich;

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
  MDERich = require(join(rootDir, 'js/rich.js'));
  document.getElementById('host').innerHTML = '';
  editor = MDE.create(document.getElementById('host'), {
    storage: new MDE.adapters.Memory(),
    toolbar: false, outline: false, statusbar: false,
    autoSave: false, autofocus: false
  });
  editorEl = editor.editorEl;
  rich = MDERich.attach(editor, {
    mermaidLoader: (done) => done(null)   // 注入降级 loader，不走网络
  });
});

after(() => { if (window) window.close(); });

test('行内公式：渲染结构生成，Markdown 序列化无损', () => {
  editor.setMarkdown('质能方程 $E = mc^2$ 很有名');
  rich.enhance();
  const math = editorEl.querySelectorAll('.mde-math');
  assert.equal(math.length, 1, '一个行内公式');
  const src = math[0].querySelector('.mde-math-src');
  const view = math[0].querySelector('.mde-math-view');
  assert.equal(src.textContent, '$E = mc^2$', '源码原文保留');
  assert.equal(view.getAttribute('data-mdx-skip'), '1', '渲染视图标记跳过');
  assert.equal(math[0].getAttribute('contenteditable'), 'false', '公式不可直接编辑');
  assert.ok(editor.getMarkdown().includes('质能方程 $E = mc^2$ 很有名'), '序列化无损');
});

test('块级公式：$$ 包裹的段落转为公式块', () => {
  editor.setMarkdown('$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$');
  rich.enhance();
  assert.equal(editorEl.querySelectorAll('.mde-math-block').length, 1, '公式块已生成');
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 1, '单个包裹结构');
  assert.equal(editor.getMarkdown(), '$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$', '往返无损');
});

test('代码块内的 $ 不触发公式渲染', () => {
  editor.setMarkdown('```\nprice is $5 and $10\n```');
  rich.enhance();
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 0, '代码内不渲染');
  assert.ok(editor.getMarkdown().includes('$5 and $10'));
});

test('点击渲染公式 → 还原为源码文本', () => {
  editor.setMarkdown('value $a^2 + b^2$ here');
  rich.enhance();
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 1);
  editorEl.querySelector('.mde-math').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 0, '公式还原为文本');
  assert.equal(editor.getMarkdown(), 'value $a^2 + b^2$ here', '源码完整');
});

test('Mermaid 代码块：追加渲染视图且序列化只输出源码', () => {
  editor.setMarkdown('```mermaid\ngraph TD\n  A --> B\n```');
  rich.enhance();
  const block = editorEl.querySelector('.mde-codeblock[data-lang="mermaid"]');
  assert.ok(block, 'mermaid 代码块存在');
  const view = block.querySelector('.mde-mermaid-view');
  assert.ok(view, '渲染视图已追加');
  assert.equal(view.getAttribute('data-mdx-skip'), '1', '视图标记跳过');
  assert.equal(view.getAttribute('contenteditable'), 'false', '视图不可编辑');
  /* 无网络/注入 null loader → 降级显示源码 */
  assert.equal(view.textContent, 'graph TD\n  A --> B', '降级显示源码');
  assert.equal(editor.getMarkdown(), '```mermaid\ngraph TD\n  A --> B\n```', '序列化只含代码源文');
});

test('正文中未配对的 $ 不渲染', () => {
  editor.setMarkdown('价格是 $5，单价 10 元');
  rich.enhance();
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 0, '无配对不渲染');
});

test('光标所在块跳过渲染（避免编辑中被抢光标）', () => {
  editor.setMarkdown('typing $x^2$ now');
  const p = editorEl.firstElementChild;
  /* 模拟光标在该段落内 */
  const range = document.createRange();
  range.selectNodeContents(p);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(range);
  rich.enhance();
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 0, '光标所在块不渲染');
  sel.removeAllRanges();
  rich.enhance();
  assert.equal(editorEl.querySelectorAll('.mde-math').length, 1, '光标移开后渲染');
});
