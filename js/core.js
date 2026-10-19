/*! MDE Desktop core — 纯逻辑层，可在 Node/jsdom 中测试 | MIT */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else global.MDECore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

/* ================= 路径工具 ================= */
function pathBasename(p) {
  if (!p) return '';
  return String(p).replace(/[\\/]+$/, '').split(/[\\/]/).pop();
}
function pathDirname(p) {
  if (!p) return '';
  var s = String(p).replace(/[\\/]+$/, '');
  var i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
  return i > 0 ? s.slice(0, i) : (i === 0 ? s.slice(0, 1) : '');
}
function pathJoin(dir, name) {
  if (!dir) return name;
  return dir.replace(/[\\/]+$/, '') + '/' + name;
}
function isMd(name) {
  return /\.(md|markdown|mdown)$/i.test(String(name || ''));
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ================= 文件树构建 =================
 * 输入：相对路径数组（posix 分隔），输出：先序扁平树（目录在前、字母序）
 */
function buildFlatTree(rootName, relPaths) {
  var rootNode = { dirs: {}, files: [] };
  relPaths.forEach(function (rp) {
    var parts = String(rp).split('/').filter(Boolean);
    if (parts[0] === rootName) parts = parts.slice(1);
    if (!parts.length) return;
    var node = rootNode;
    for (var i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        if (isMd(parts[i]) && node.files.indexOf(parts[i]) < 0) node.files.push(parts[i]);
      } else {
        if (!node.dirs[parts[i]]) node.dirs[parts[i]] = { dirs: {}, files: [] };
        node = node.dirs[parts[i]];
      }
    }
  });
  var out = [];
  function walk(node, prefix, depth) {
    Object.keys(node.dirs).sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })
      .forEach(function (d) {
        var p = prefix ? prefix + '/' + d : d;
        out.push({ name: d, path: p, depth: depth, is_dir: true });
        walk(node.dirs[d], p, depth + 1);
      });
    node.files.sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; })
      .forEach(function (f) {
        out.push({ name: f, path: prefix ? prefix + '/' + f : f, depth: depth, is_dir: false });
      });
  }
  walk(rootNode, '', 0);
  return out;
}

/* ================= 文件存储适配器 =================
 * 与 md-editor.js 存储适配器同接口：list/get/create/update/remove
 * create 分配 id；update 递增 version；磁盘写入由应用层负责
 */
function FileAdapter() {
  this.name = 'file';
  this._store = {};
  this._seq = 0;
}
FileAdapter.prototype._newId = function () { return 'f' + (++this._seq) + '-' + Date.now().toString(36); };
FileAdapter.prototype.list = function () {
  var self = this;
  return Promise.resolve(Object.keys(self._store).map(function (id) {
    var d = self._store[id];
    return { id: d.id, title: d.title, updatedAt: d.updatedAt, version: d.version };
  }));
};
FileAdapter.prototype.get = function (id) {
  var d = this._store[id];
  return Promise.resolve(d ? JSON.parse(JSON.stringify(d)) : null);
};
FileAdapter.prototype.create = function (input) {
  var doc = {
    id: this._newId(),
    title: input.title || 'Untitled',
    content: input.content || '',
    version: 1,
    updatedAt: Date.now()
  };
  this._store[doc.id] = doc;
  return Promise.resolve(JSON.parse(JSON.stringify(doc)));
};
FileAdapter.prototype.update = function (id, input, version) {
  var cur = this._store[id];
  if (!cur) { var e1 = new Error('NOT_FOUND'); e1.code = 'NOT_FOUND'; return Promise.reject(e1); }
  if (version != null && cur.version !== version) {
    var e2 = new Error('VERSION_CONFLICT'); e2.code = 'VERSION_CONFLICT'; e2.serverDoc = cur; return Promise.reject(e2);
  }
  var next = Object.assign({}, cur, input, { version: cur.version + 1, updatedAt: Date.now() });
  this._store[id] = next;
  return Promise.resolve(JSON.parse(JSON.stringify(next)));
};
FileAdapter.prototype.remove = function (id) { delete this._store[id]; return Promise.resolve(); };

/* ================= 文本查找 / 替换 ================= */
function findMatches(text, query, caseSensitive) {
  if (!query) return [];
  var hay = String(text), needle = String(query);
  if (!caseSensitive) { hay = hay.toLowerCase(); needle = needle.toLowerCase(); }
  var out = [], from = 0;
  while (needle.length) {
    var idx = hay.indexOf(needle, from);
    if (idx < 0) break;
    out.push({ start: idx, end: idx + needle.length });
    from = idx + needle.length;
  }
  return out;
}

/* 收集 root 下所有文本节点及累计偏移 */
function collectTextNodes(root) {
  var doc = root.ownerDocument || document;
  var walker = doc.createTreeWalker(root, 4 /* SHOW_TEXT */, null);
  var nodes = [], starts = [], text = '', n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue) continue;
    nodes.push(n);
    starts.push(text.length);
    text += n.nodeValue;
  }
  return { nodes: nodes, starts: starts, text: text };
}

/* 将 [start,end) 文本区间替换为 replacement（跨节点），返回是否有改动 */
function replaceRange(ctx, start, end, replacement) {
  var changed = false;
  for (var i = 0; i < ctx.nodes.length; i++) {
    var ns = ctx.starts[i];
    var node = ctx.nodes[i];
    var ne = ns + node.nodeValue.length;
    if (ne <= start) continue;
    if (ns >= end) break;
    var before = node.nodeValue.slice(0, Math.max(0, start - ns));
    var after = node.nodeValue.slice(Math.max(0, Math.min(node.nodeValue.length, end - ns)));
    node.nodeValue = before + replacement + after;
    replacement = '';
    changed = true;
  }
  return changed;
}

/* 文本偏移 → {node, offset}，用于定位光标 */
function locate(ctx, pos) {
  for (var i = ctx.nodes.length - 1; i >= 0; i--) {
    if (ctx.starts[i] <= pos) {
      var off = pos - ctx.starts[i];
      if (off <= ctx.nodes[i].nodeValue.length) return { node: ctx.nodes[i], offset: off };
    }
  }
  return null;
}

/* ================= 表格操作 ================= */
function tableCellTag(tr) { return tr.children.length && tr.children[0].tagName === 'TH' ? 'th' : 'td'; }

function tableInsertRow(table, refTr, above) {
  var tr = refTr && refTr.parentNode ? refTr : table.querySelector('tbody tr') || table.querySelector('tr');
  if (!tr) return null;
  var nr = document.createElement('tr');
  var count = tr.children.length;
  for (var i = 0; i < count; i++) {
    var td = document.createElement('td');
    td.appendChild(document.createElement('br'));
    nr.appendChild(td);
  }
  tr.parentNode.insertBefore(nr, above ? tr : tr.nextSibling);
  return nr;
}

function tableInsertCol(table, refCell, left) {
  var cell = refCell && refCell.tagName ? refCell : table.querySelector('th,td');
  if (!cell) return null;
  var idx = Array.prototype.indexOf.call(cell.parentNode.children, cell);
  var rows = table.querySelectorAll('tr');
  var last = null;
  Array.prototype.forEach.call(rows, function (tr) {
    var tag = tr.parentNode.tagName === 'THEAD' ? 'th' : 'td';
    var c = document.createElement(tag);
    if (tag === 'td') c.appendChild(document.createElement('br'));
    var ref = tr.children[idx] || null;
    if (left && ref) tr.insertBefore(c, ref);
    else if (ref && ref.nextSibling) tr.insertBefore(c, ref.nextSibling);
    else tr.appendChild(c);
    last = c;
  });
  return last;
}

function tableDeleteRow(table, tr) {
  if (!tr || !tr.parentNode) return false;
  var body = table.querySelector('tbody') || table;
  if (body.querySelectorAll('tr').length <= 1) return false;  // 至少保留 1 行
  tr.parentNode.removeChild(tr);
  return true;
}

function tableDeleteCol(table, refCell) {
  var cell = refCell || table.querySelector('th,td');
  if (!cell) return false;
  var idx = Array.prototype.indexOf.call(cell.parentNode.children, cell);
  if (table.querySelector('tr').children.length <= 1) return false;  // 至少保留 1 列
  Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
    if (tr.children[idx]) tr.removeChild(tr.children[idx]);
  });
  return true;
}

/* ================= HTML 导出 ================= */
function exportHtmlDocument(title, bodyHtml, css) {
  return '<!DOCTYPE html>\n<html lang="zh">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>' + escapeHtml(title) + '</title>\n' +
    '<style>' + css + '</style>\n' +
    '<style>body{margin:0;background:#fff;display:flex;justify-content:center}' +
    '.mde-root{height:auto;min-height:0;display:block;background:#fff}' +
    '.paper{max-width:860px;width:100%;padding:48px 32px;box-sizing:border-box}' +
    '@media print{body{display:block}.paper{max-width:none;padding:0 8mm}}</style>\n' +
    '</head>\n<body>\n<div class="paper"><div class="mde-root"><article class="mde-editor" style="max-width:none;padding:0;min-height:0">' +
    bodyHtml +
    '</article></div></div>\n</body>\n</html>';
}

/* ================= 最近文件 ================= */
function RecentStore(storage, key) {
  this.storage = storage;
  this.key = key || 'mde-desktop.recent';
}
RecentStore.prototype.load = function () {
  try { return JSON.parse(this.storage.getItem(this.key) || '[]'); }
  catch (e) { return []; }
};
RecentStore.prototype.push = function (entry) {
  var arr = this.load().filter(function (x) { return x.path !== entry.path; });
  arr.unshift({ path: entry.path, name: entry.name, folder: entry.folder || '', ts: Date.now() });
  arr = arr.slice(0, 20);
  try { this.storage.setItem(this.key, JSON.stringify(arr)); } catch (e) { /* 忽略配额错误 */ }
  return arr;
};

/* ================= 设置 ================= */
function SettingsStore(storage, key) {
  this.storage = storage;
  this.key = key || 'mde-desktop.settings';
  this.defaults = { theme: 'light', lang: 'zh' };
}
SettingsStore.prototype.load = function () {
  var s = Object.assign({}, this.defaults);
  try { Object.assign(s, JSON.parse(this.storage.getItem(this.key) || '{}')); } catch (e) { /* 保持默认 */ }
  return s;
};
SettingsStore.prototype.save = function (s) {
  try { this.storage.setItem(this.key, JSON.stringify(s)); } catch (e) { /* 忽略 */ }
};

return {
  pathBasename: pathBasename,
  pathDirname: pathDirname,
  pathJoin: pathJoin,
  isMd: isMd,
  escapeHtml: escapeHtml,
  buildFlatTree: buildFlatTree,
  FileAdapter: FileAdapter,
  findMatches: findMatches,
  collectTextNodes: collectTextNodes,
  replaceRange: replaceRange,
  locate: locate,
  tableInsertRow: tableInsertRow,
  tableInsertCol: tableInsertCol,
  tableDeleteRow: tableDeleteRow,
  tableDeleteCol: tableDeleteCol,
  exportHtmlDocument: exportHtmlDocument,
  RecentStore: RecentStore,
  SettingsStore: SettingsStore
};

});
