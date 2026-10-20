/* 构建脚本：把前端产物复制到 dist/（Tauri frontendDist） */
import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'js'), { recursive: true });
mkdirSync(join(dist, 'css'), { recursive: true });

copyFileSync(join(root, 'index.html'), join(dist, 'index.html'));
for (const f of ['md-editor.js', 'core.js', 'undo.js', 'rich.js', 'app.js']) {
  copyFileSync(join(root, 'js', f), join(dist, 'js', f));
}
copyFileSync(join(root, 'css', 'app.css'), join(dist, 'css', 'app.css'));

console.log('build ok -> dist/');
