/* 纯逻辑层测试：路径/树构建/适配器/查找替换(文本)/导出/最近与设置存储 */
import { createRequire } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const Core = require('../js/core.js');

test('路径工具', () => {
  assert.equal(Core.pathBasename('D:/docs/a/b/note.md'), 'note.md');
  assert.equal(Core.pathDirname('D:/docs/a/b/note.md'), 'D:/docs/a/b');
  assert.equal(Core.pathJoin('D:/docs', 'assets/img.png'), 'D:/docs/assets/img.png');
  assert.equal(Core.pathJoin('', 'x.md'), 'x.md');
  assert.equal(Core.isMd('a.MD'), true);
  assert.equal(Core.isMd('a.txt'), false);
});

test('buildFlatTree：目录在前、字母序、先序遍历', () => {
  const entries = Core.buildFlatTree('docs', [
    'docs/b.md', 'docs/sub/a.md', 'docs/a.md', 'docs/sub/deep/c.md', 'docs/图片说明.md'
  ]);
  const paths = entries.map(e => e.path);
  assert.deepEqual(paths, ['sub', 'sub/deep', 'sub/deep/c.md', 'sub/a.md', 'a.md', 'b.md', '图片说明.md']);
  assert.equal(entries[0].is_dir, true);
  assert.equal(entries[2].depth, 2);
});

test('FileAdapter：create/update/version 冲突', async () => {
  const a = new Core.FileAdapter();
  const doc = await a.create({ title: 't', content: 'c' });
  assert.equal(doc.version, 1);
  const up = await a.update(doc.id, { content: 'c2' });
  assert.equal(up.version, 2);
  await assert.rejects(() => a.update(doc.id, { content: 'x' }, 1), /VERSION_CONFLICT/);
  await assert.rejects(() => a.update('nope', {}), /NOT_FOUND/);
  const list = await a.list();
  assert.equal(list.length, 1);
});

test('findMatches：大小写与多匹配', () => {
  const text = 'Abc abc ABC';
  assert.equal(Core.findMatches(text, 'abc').length, 3);
  assert.equal(Core.findMatches(text, 'abc', true).length, 1);
  assert.deepEqual(Core.findMatches(text, ''), []);
  const m = Core.findMatches('hello world hello', 'hello');
  assert.deepEqual(m, [{ start: 0, end: 5 }, { start: 12, end: 17 }]);
});

test('exportHtmlDocument：包含标题/样式/正文', () => {
  const html = Core.exportHtmlDocument('我的<title>', '<p>body</p>', '.x{color:red}');
  assert.ok(html.includes('<title>我的&lt;title&gt;</title>'));
  assert.ok(html.includes('.x{color:red}'));
  assert.ok(html.includes('<p>body</p>'));
  assert.ok(html.includes('class="mde-root"'));
});

test('RecentStore / SettingsStore', () => {
  const mem = (() => {
    const m = {};
    return { getItem: k => m[k] ?? null, setItem: (k, v) => { m[k] = v; }, removeItem: k => { delete m[k]; } };
  })();
  const r = new Core.RecentStore(mem);
  r.push({ path: 'a.md', name: 'a.md' });
  r.push({ path: 'b.md', name: 'b.md' });
  r.push({ path: 'a.md', name: 'a.md' });
  const arr = r.load();
  assert.equal(arr[0].path, 'a.md');
  assert.equal(arr.length, 2);

  const s = new Core.SettingsStore(mem);
  const d = s.load();
  assert.equal(d.theme, 'light');
  s.save({ theme: 'dark' });
  assert.equal(s.load().theme, 'dark');
});
