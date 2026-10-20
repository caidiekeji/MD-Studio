/*! MDE Desktop — 应用层：桌面/浏览器双桥接 + 功能补齐 | MIT */
(function () {
'use strict';

var MDE = window.MDEditor, Core = window.MDECore;

/* ============================================================
 * 0. 应用级 i18n
 * ============================================================ */
var APP_I18N = {
  zh: {
    appName: 'MD Editor', newDoc: '新建', openFile: '打开文件', openFolder: '打开文件夹',
    save: '保存', saveAs: '另存为', exportHtml: '导出 HTML', exportPdf: '导出 PDF',
    find: '查找替换', source: '源码模式', files: '文件', outline: '大纲', recent: '最近',
    refresh: '刷新', noFolder: '未打开文件夹\n点击"打开文件夹"浏览 Markdown 文件',
    settings: '设置', language: '语言', theme: '主题', light: '浅色', dark: '深色',
    matchOne: '1 个匹配', matchMany: '{n} 个匹配', noMatch: '无匹配',
    replace: '替换', replaceAll: '全部替换', prev: '上一个', next: '下一个',
    findPlaceholder: '查找…', replacePlaceholder: '替换为…', caseSensitive: 'Aa',
    confirmNew: '当前文档有未保存的修改，确定新建？',
    confirmClose: '文档有未保存的修改，仍要退出？',
    saveFailed: '保存失败：', exported: '已导出', imgSaved: '图片已插入',
    untitled: '未命名', clearRecent: '清空最近记录', sourceHint: '编辑 Markdown 源码，关闭时应用修改',
    menuFile: '文件(F)', menuEdit: '编辑(E)', menuFormat: '格式(O)', menuView: '视图(V)', menuHelp: '帮助(H)',
    recentFiles: '最近文件', mUndo: '撤销', mRedo: '重做', selectAll: '全选',
    fmtBold: '加粗', fmtItalic: '斜体', fmtStrike: '删除线', fmtInlineCode: '行内代码',
    heading: '标题', mBody: '正文', mUl: '无序列表', mOl: '有序列表', mTask: '任务列表',
    mQuote: '引用', mCodeBlock: '代码块', mHr: '分隔线', mLink: '链接', mImage: '图片', mTable: '表格',
    mSidebar: '显示/隐藏侧栏', appearance: '外观', shortcuts: '快捷键列表',
    about: '关于 MD Editor', aboutTitle: '关于', shortcutsTitle: '快捷键列表'
  },
  en: {
    appName: 'MD Editor', newDoc: 'New', openFile: 'Open File', openFolder: 'Open Folder',
    save: 'Save', saveAs: 'Save As', exportHtml: 'Export HTML', exportPdf: 'Export PDF',
    find: 'Find & Replace', source: 'Source Mode', files: 'Files', outline: 'Outline', recent: 'Recent',
    refresh: 'Refresh', noFolder: 'No folder open\nClick "Open Folder" to browse Markdown files',
    settings: 'Settings', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark',
    matchOne: '1 match', matchMany: '{n} matches', noMatch: 'No match',
    replace: 'Replace', replaceAll: 'Replace All', prev: 'Prev', next: 'Next',
    findPlaceholder: 'Find…', replacePlaceholder: 'Replace with…', caseSensitive: 'Aa',
    confirmNew: 'Unsaved changes. Create new document anyway?',
    confirmClose: 'Unsaved changes. Quit anyway?',
    saveFailed: 'Save failed: ', exported: 'Exported', imgSaved: 'Image inserted',
    untitled: 'Untitled', clearRecent: 'Clear recent', sourceHint: 'Edit Markdown source; changes apply on close',
    menuFile: 'File(F)', menuEdit: 'Edit(E)', menuFormat: 'Format(O)', menuView: 'View(V)', menuHelp: 'Help(H)',
    recentFiles: 'Recent Files', mUndo: 'Undo', mRedo: 'Redo', selectAll: 'Select All',
    fmtBold: 'Bold', fmtItalic: 'Italic', fmtStrike: 'Strikethrough', fmtInlineCode: 'Inline Code',
    heading: 'Heading', mBody: 'Body Text', mUl: 'Bullet List', mOl: 'Numbered List', mTask: 'Task List',
    mQuote: 'Quote', mCodeBlock: 'Code Block', mHr: 'Divider', mLink: 'Link', mImage: 'Image', mTable: 'Table',
    mSidebar: 'Toggle Sidebar', appearance: 'Appearance', shortcuts: 'Keyboard Shortcuts',
    about: 'About MD Editor', aboutTitle: 'About', shortcutsTitle: 'Keyboard Shortcuts'
  }
};
function T(key) {
  var d = APP_I18N[settings.lang] || APP_I18N.zh;
  return d[key] != null ? d[key] : key;
}

/* ============================================================
 * 1. 图标（自绘 SVG，无 emoji）
 * ============================================================ */
var AI = {
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M15 2v5h5"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  sliders: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="7" cy="18" r="2"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  logo: '<path d="M4 19V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13"/><path d="M7 9h5"/><path d="M7 13h7"/><path d="M7 17h4"/>'
};
function aIcon(name, size) {
  size = size || 16;
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
    '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    (AI[name] || '') + '</svg>';
}

/* ============================================================
 * 2. 状态 / 设置
 * ============================================================ */
var settingsStore = new Core.SettingsStore(window.localStorage);
var settings = settingsStore.load();
var recentStore = new Core.RecentStore(window.localStorage);
var state = {
  mode: (window.__TAURI__ && window.__TAURI__.core) ? 'tauri' : 'browser',
  folder: null,       // 当前文件夹（tauri: 绝对路径 / browser: 名称）
  entries: [],        // 文件树扁平列表
  filePath: null,     // 当前文件（tauri: 绝对路径 / browser: 虚拟相对路径）
  dirty: false,
  collapsed: {}       // 文件树折叠状态
};

/* ============================================================
 * 3. 桥接层（Tauri / 浏览器双模式）
 * ============================================================ */
function tauriBridge() {
  var T = window.__TAURI__;
  var invoke = T.core.invoke;
  return {
    mode: 'tauri',
    openFolder: function () {
      return invoke('pick_folder').then(function (dir) {
        if (!dir) return null;
        return invoke('list_md', { root: dir }).then(function (list) {
          var rootBase = Core.pathBasename(dir);
          list.forEach(function (e) {
            e.rel = e.path.length > dir.length ? e.path.slice(dir.length + 1).replace(/\\/g, '/') : e.name;
          });
          return { root: dir, rootName: rootBase, entries: list };
        });
      });
    },
    openFilePicker: function () {
      return invoke('pick_file').then(function (p) {
        if (!p) return null;
        return invoke('read_file', { path: p }).then(function (content) {
          return { path: p, name: Core.pathBasename(p), content: content };
        });
      });
    },
    readPath: function (p) { return invoke('read_file', { path: p }); },
    pickSavePath: function (name) { return invoke('pick_save_file', { name: name }); },
    writePath: function (p, c) { return invoke('write_file', { path: p, content: c }); },
    saveImage: function (file) {
      var dir = state.folder || Core.pathDirname(state.filePath || '');
      if (!dir) return Promise.resolve(null);
      return file.arrayBuffer().then(function (buf) {
        var ext = (file.name.match(/\.(\w+)$/) || [, 'png'])[1].toLowerCase();
        var name = 'img-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '-' +
          Math.random().toString(36).slice(2, 6) + '.' + ext;
        var bytes = Array.from(new Uint8Array(buf));
        return invoke('write_image', { folder: dir, name: name, data: bytes }).then(function (rel) {
          return { src: T.core.convertFileSrc(Core.pathJoin(dir, rel)), rel: rel };
        });
      });
    },
    exportFile: function (name, content) {
      return invoke('pick_save_file', { name: name }).then(function (p) {
        if (!p) return false;
        return invoke('write_file', { path: p, content: content }).then(function () { return true; });
      });
    },
    listenClose: function (fn) { T.event.listen('close-requested', fn); },
    exit: function () { invoke('exit_app'); },
    download: function () { /* 桌面端不需要 */ }
  };
}

function browserBridge() {
  var fileMap = {};     // relPath -> File
  var contentMap = {};  // relPath -> 最新文本（保存后覆盖）
  var dirInput = null, fileInput = null;
  function makeInput(kind) {
    var el = document.createElement('input');
    el.type = 'file';
    el.style.display = 'none';
    if (kind === 'dir') { el.setAttribute('webkitdirectory', ''); }
    else el.accept = '.md,.markdown,.mdown,text/markdown';
    document.body.appendChild(el);
    return el;
  }
  function pickFiles(input) {
    return new Promise(function (res) {
      input.value = '';
      input.onchange = function () {
        res(Array.prototype.slice.call(input.files || []));
      };
      input.click();
    });
  }
  return {
    mode: 'browser',
    openFolder: function () {
      if (!dirInput) dirInput = makeInput('dir');
      return pickFiles(dirInput).then(function (files) {
        if (!files.length) return null;
        fileMap = {}; contentMap = {};
        var rels = [];
        files.forEach(function (f) {
          var rp = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
          fileMap[rp] = f;
          if (Core.isMd(rp)) rels.push(rp);
        });
        var rootName = rels.length ? rels[0].split('/')[0] : 'docs';
        return { root: rootName, rootName: rootName, entries: Core.buildFlatTree(rootName, rels) };
      });
    },
    openFilePicker: function () {
      if (!fileInput) fileInput = makeInput('file');
      return pickFiles(fileInput).then(function (files) {
        var f = files[0];
        if (!f) return null;
        return f.text().then(function (content) {
          return { path: f.name, name: f.name, content: content };
        });
      });
    },
    readPath: function (p) {
      if (contentMap[p] != null) return Promise.resolve(contentMap[p]);
      var f = fileMap[p];
      return f ? f.text() : Promise.reject(new Error('NOT_FOUND'));
    },
    pickSavePath: function (name) {
      var base = state.folder ? state.folder + '/' : '';
      return Promise.resolve(base + name);
    },
    writePath: function (p, c) { contentMap[p] = c; return Promise.resolve(); },
    saveImage: function (file) {
      return new Promise(function (res) {
        var r = new FileReader();
        r.onload = function () { res({ src: r.result, rel: file.name }); };
        r.onerror = function () { res(null); };
        r.readAsDataURL(file);
      });
    },
    exportFile: function (name, content) {
      var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
      return Promise.resolve(true);
    },
    listenClose: function (fn) {
      window.addEventListener('beforeunload', function (e) {
        if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
      });
    },
    exit: function () { /* 浏览器无法退出 */ },
    download: function (name, content, mime) {
      var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    }
  };
}

var bridge = state.mode === 'tauri' ? tauriBridge() : browserBridge();

/* ============================================================
 * 4. DOM 引用
 * ============================================================ */
var $ = function (sel) { return document.querySelector(sel); };
var editorHost = $('#editorHost');
var sourceArea = $('#sourceArea');
var findBar = $('#findBar');
var tableBar = $('#tableBar');
var filePathLabel = $('#filePathLabel');
var filePanel = $('#filePanel');
var outlinePanel = $('#outlinePanel');

/* ============================================================
 * 5. 创建编辑器（复用 md-editor.js，存储走 FileAdapter）
 * ============================================================ */
var adapter = new Core.FileAdapter();
var editor = MDE.create(editorHost, {
  storage: adapter,
  outline: true,          // 借用内置侧栏容器，内容替换为 文件/大纲 双 Tab
  toolbar: true,
  statusbar: true,
  autoSave: true,
  autoSaveDelay: 600,
  autofocus: false,
  theme: settings.theme,
  lang: settings.lang,
  onChange: function () {
    state.dirty = true;
    refreshOutline();
    updateTitle();
  },
  onSave: function (saved) {
    persistToDisk(saved.content);
  },
  onError: function (err) {
    appToast(T('saveFailed') + err.message);
  }
});
var editorEl = editor.editorEl;

/* 自建撤销/重做栈 + 数学公式/Mermaid 增强 */
var undoApi = MDEUndo.attach(editor);
var richApi = MDERich.attach(editor);

/* 劫持内置侧栏 → 文件 / 大纲 双 Tab */
(function hijackSidebar() {
  var side = editorHost.querySelector('.mde-sidebar');
  if (!side) return;
  side.innerHTML =
    '<div class="side-tabs">' +
    '<button type="button" class="side-tab active" data-tab="files">' + T('files') + '</button>' +
    '<button type="button" class="side-tab" data-tab="outline">' + T('outline') + '</button>' +
    '</div>' +
    '<div class="side-panel" id="filePanel"></div>' +
    '<div class="side-panel hidden" id="outlinePanel"><div class="outline-list"></div></div>';
  filePanel = $('#filePanel');
  outlinePanel = $('#outlinePanel');
  side.addEventListener('click', function (e) {
    var tab = e.target.closest('.side-tab');
    if (!tab) return;
    side.querySelectorAll('.side-tab').forEach(function (b) { b.classList.toggle('active', b === tab); });
    filePanel.classList.toggle('hidden', tab.dataset.tab !== 'files');
    outlinePanel.classList.toggle('hidden', tab.dataset.tab !== 'outline');
  });
})();

/* ============================================================
 * 6. 文件树
 * ============================================================ */
function renderFileTree() {
  if (!filePanel) return;
  if (!state.folder) {
    filePanel.innerHTML = '<div class="tree-empty">' + T('noFolder').replace('\n', '<br>') + '</div>';
    return;
  }
  var html = '<div class="tree-head"><span class="tree-root" title="' + Core.escapeHtml(state.folder) + '">' +
    Core.escapeHtml(Core.pathBasename(state.folder) || state.folder) + '</span>' +
    '<button type="button" class="tree-refresh" data-act="refresh" title="' + T('refresh') + '">' + aIcon('refresh', 13) + '</button></div>';
  state.entries.forEach(function (e, i) {
    var collapsed = state.collapsed[e.path];
    html += '<div class="tree-row' + (e.is_dir ? ' is-dir' : '') + '" data-idx="' + i + '" style="padding-left:' + (10 + e.depth * 14) + 'px">';
    if (e.is_dir) html += '<span class="tree-chev">' + aIcon(collapsed ? 'chevR' : 'chevD', 12) + '</span>';
    else html += '<span class="tree-chev"></span>';
    html += '<span class="tree-name">' + Core.escapeHtml(e.name) + '</span></div>';
  });
  filePanel.innerHTML = html;
}

filePanel.addEventListener('click', function (e) {
  if (e.target.closest('[data-act="refresh"]')) { reloadFolder(); return; }
  var row = e.target.closest('.tree-row');
  if (!row) return;
  var entry = state.entries[+row.dataset.idx];
  if (!entry) return;
  if (entry.is_dir) {
    state.collapsed[entry.path] = !state.collapsed[entry.path];
    renderFileTree();
    return;
  }
  openPath(entry.path);
});

function renderCollapsedAware(entries) {
  // 折叠目录时隐藏其子项
  var out = [];
  var hide = {};
  entries.forEach(function (e) {
    var parts = e.path.split('/');
    parts.pop();
    var parentKey = parts.join('/');
    if (parentKey && hide[parentKey]) { hide[e.path] = true; return; }
    if (e.is_dir && state.collapsed[e.path]) hide[e.path] = true;
    out.push(e);
  });
  return out;
}

function reloadFolder() {
  if (!state.folder) return;
  if (state.mode === 'browser') {
    // 浏览器模式：文件树来自已选择的目录，无需重载（File 对象不可重读目录）
    renderFileTree();
    return;
  }
  bridge.openFolderFromRoot(state.folder);
}

/* ============================================================
 * 7. 打开 / 新建 / 保存
 * ============================================================ */
function guardDirty(next) {
  if (state.dirty && !window.confirm(T('confirmNew'))) return;
  next();
}

function loadIntoEditor(path, name, content) {
  editor.newDoc();
  editor.setMarkdown(content || '');
  state.filePath = path;
  state.dirty = false;
  recentStore.push({ path: path, name: name, folder: state.folder || '' });
  renderRecentMenu();
  updateTitle();
  refreshOutline();
}

function openPath(path) {
  guardDirty(function () {
    bridge.readPath(path).then(function (content) {
      loadIntoEditor(path, Core.pathBasename(path) || path, content);
    }).catch(function (err) { appToast(T('saveFailed') + err.message); });
  });
}

function doOpenFile() {
  guardDirty(function () {
    bridge.openFilePicker().then(function (f) {
      if (!f) return;
      if (state.mode === 'tauri') {
        var dir = Core.pathDirname(f.path);
        if (dir && dir !== state.folder) {
          state.folder = dir;
          loadTreeEntries(dir);
        }
      }
      loadIntoEditor(f.path, f.name, f.content);
    });
  });
}

function doOpenFolder() {
  bridge.openFolder().then(function (r) {
    if (!r) return;
    state.folder = r.root;
    state.entries = r.entries;
    state.collapsed = {};
    renderFileTree();
  });
}

function loadTreeEntries(dir) {
  if (state.mode !== 'tauri') return;
  window.__TAURI__.core.invoke('list_md', { root: dir }).then(function (list) {
    list.forEach(function (e) {
      e.rel = e.path.length > dir.length ? e.path.slice(dir.length + 1).replace(/\\/g, '/') : e.name;
    });
    state.entries = list;
    renderFileTree();
  });
}
/* tauri 桥接扩展：从已知根目录刷新 */
if (state.mode === 'tauri') {
  bridge.openFolderFromRoot = function (dir) {
    loadTreeEntries(dir);
  };
}

function doNewDoc() {
  guardDirty(function () {
    editor.newDoc();
    state.filePath = null;
    state.dirty = false;
    updateTitle();
    refreshOutline();
    editor.focus();
  });
}

/* 编辑器自动保存回调 → 落盘 */
function persistToDisk(content) {
  var p = Promise.resolve(state.filePath);
  if (!state.filePath) {
    var title = (editor.getTitle() || T('untitled')).replace(/[\\/:*?"<>|]/g, '-').slice(0, 60);
    p = bridge.pickSavePath(title + '.md').then(function (path) {
      if (!path) return null;
      state.filePath = path;
      if (!state.folder && state.mode === 'tauri') {
        state.folder = Core.pathDirname(path);
        loadTreeEntries(state.folder);
      }
      return path;
    });
  }
  p.then(function (path) {
    if (!path) return;
    return bridge.writePath(path, content).then(function () {
      state.dirty = false;
      updateTitle();
      if (state.mode === 'browser' && !state.folder) bridge.download(Core.pathBasename(path) || path, content, 'text/markdown');
    });
  }).catch(function (err) { appToast(T('saveFailed') + err.message); });
}

function doSave(explicit) {
  var content = editor.getMarkdown();
  persistToDisk(content);
}

function doSaveAs() {
  var title = (editor.getTitle() || T('untitled')).replace(/[\\/:*?"<>|]/g, '-').slice(0, 60);
  bridge.pickSavePath(title + '.md').then(function (path) {
    if (!path) return;
    state.filePath = path;
    bridge.writePath(path, editor.getMarkdown()).then(function () {
      state.dirty = false;
      updateTitle();
      if (state.mode === 'browser') bridge.download(Core.pathBasename(path), editor.getMarkdown(), 'text/markdown');
    });
  });
}

/* ============================================================
 * 8. 导出
 * ============================================================ */
function buildExportHtml() {
  var holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;left:-99999px;top:0;width:900px;height:auto;';
  document.body.appendChild(holder);
  var tmp = MDE.create(holder, {
    storage: new MDE.adapters.Memory(),
    toolbar: false, outline: false, statusbar: false,
    autoSave: false, autofocus: false
  });
  tmp.setMarkdown(editor.getMarkdown());
  var inner = holder.querySelector('.mde-editor').innerHTML;
  var css = document.getElementById('mde-styles').textContent;
  tmp.destroy();
  document.body.removeChild(holder);
  return Core.exportHtmlDocument(editor.getTitle() || T('untitled'), inner, css);
}

function doExportHtml() {
  var name = (editor.getTitle() || 'document') + '.html';
  bridge.exportFile(name, buildExportHtml()).then(function (ok) {
    if (ok) appToast(T('exported'));
  });
}

function doExportPdf() {
  document.body.classList.add('printing');
  window.print();
  setTimeout(function () { document.body.classList.remove('printing'); }, 500);
}

/* ============================================================
 * 9. 查找 / 替换
 * ============================================================ */
var findState = { matches: [], index: -1, ctx: null };

function findBarShow(withReplace) {
  findBar.classList.remove('hidden');
  findBar.classList.toggle('with-replace', !!withReplace);
  $('#findInput').focus();
  $('#findInput').select();
  runFind();
}
function findBarHide() {
  findBar.classList.add('hidden');
  findState = { matches: [], index: -1, ctx: null };
  editor.focus();
}

function runFind() {
  var query = $('#findInput').value;
  var caseSensitive = $('#findCase').classList.contains('active');
  findState.ctx = Core.collectTextNodes(editorEl);
  findState.matches = Core.findMatches(findState.ctx.text, query, caseSensitive);
  findState.index = findState.matches.length ? 0 : -1;
  updateFindStatus();
  if (findState.index >= 0) selectMatch();
}

function updateFindStatus() {
  var el = $('#findStatus');
  var n = findState.matches.length;
  el.textContent = n === 0 ? T('noMatch') : (n === 1 ? T('matchOne') : T('matchMany').replace('{n}', n));
  el.classList.toggle('none', n === 0);
}

function selectMatch() {
  var m = findState.matches[findState.index];
  if (!m) return;
  var a = Core.locate(findState.ctx, m.start);
  var b = Core.locate(findState.ctx, m.end);
  if (!a || !b) return;
  try {
    var r = document.createRange();
    r.setStart(a.node, a.offset);
    r.setEnd(b.node, b.offset);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    var rect = r.getBoundingClientRect();
    var scroll = editorHost.querySelector('.mde-scroll');
    if (scroll && (rect.top < 0 || rect.bottom > window.innerHeight)) {
      r.startContainer.parentNode.scrollIntoView({ block: 'center' });
    }
  } catch (e) { /* 越界忽略 */ }
}

function findStep(delta) {
  if (!findState.matches.length) { runFind(); return; }
  findState.index = (findState.index + delta + findState.matches.length) % findState.matches.length;
  $('#findStatus').textContent = (findState.index + 1) + ' / ' + findState.matches.length;
  selectMatch();
}

function replaceCurrent() {
  if (!findState.matches.length) return;
  var m = findState.matches[findState.index];
  var replacement = $('#replaceInput').value;
  var ctx = Core.collectTextNodes(editorEl);
  if (Core.replaceRange(ctx, m.start, m.end, replacement)) {
    editorEl.dispatchEvent(new Event('input', { bubbles: true }));
    runFind();
  }
}

function replaceAllMatches() {
  var query = $('#findInput').value;
  if (!query) return;
  var replacement = $('#replaceInput').value;
  var caseSensitive = $('#findCase').classList.contains('active');
  var ctx = Core.collectTextNodes(editorEl);
  var matches = Core.findMatches(ctx.text, query, caseSensitive);
  var count = 0;
  for (var i = matches.length - 1; i >= 0; i--) {
    if (Core.replaceRange(ctx, matches[i].start, matches[i].end, replacement)) count++;
  }
  if (count) {
    editorEl.dispatchEvent(new Event('input', { bubbles: true }));
    appToast(T('matchMany').replace('{n}', count));
  }
  runFind();
}

/* ============================================================
 * 10. 源码模式
 * ============================================================ */
var sourceOn = false;
function toggleSource(force) {
  sourceOn = force != null ? force : !sourceOn;
  sourceArea.classList.toggle('hidden', !sourceOn);
  if (sourceOn) {
    sourceArea.value = editor.getMarkdown();
    sourceArea.focus();
  } else {
    if (sourceArea.value !== editor.getMarkdown()) {
      editor.setMarkdown(sourceArea.value);
      refreshOutline();
    }
    editor.focus();
  }
}

/* ============================================================
 * 11. 图片粘贴 / 拖放
 * ============================================================ */
function insertImageElement(src, alt) {
  editorEl.focus();
  var sel = window.getSelection();
  var img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('alt', alt || '');
  var p = document.createElement('p');
  p.dataset.type = 'paragraph';
  p.appendChild(document.createElement('br'));
  var range = sel.rangeCount ? sel.getRangeAt(0) : null;
  if (range && editorEl.contains(range.startContainer)) {
    range.deleteContents();
    range.insertNode(img);
    range.setStartAfter(img);
    range.insertNode(p);
    range.setStart(p, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editorEl.appendChild(img);
    editorEl.appendChild(p);
  }
  editorEl.dispatchEvent(new Event('input', { bubbles: true }));
}

function handleImageFile(file) {
  bridge.saveImage(file).then(function (r) {
    if (r && r.src) {
      insertImageElement(r.src, '');
      appToast(T('imgSaved'));
    }
  });
}

editorEl.addEventListener('paste', function (e) {
  var cd = e.clipboardData;
  if (!cd || !cd.files || !cd.files.length) return;
  var img = null;
  for (var i = 0; i < cd.files.length; i++) {
    if (/^image\//.test(cd.files[i].type)) { img = cd.files[i]; break; }
  }
  if (!img) return;  // 文本粘贴交由编辑器处理
  e.preventDefault();
  e.stopImmediatePropagation();
  handleImageFile(img);
}, true);

editorEl.addEventListener('drop', function (e) {
  var dt = e.dataTransfer;
  if (!dt || !dt.files || !dt.files.length) return;
  var img = null;
  for (var i = 0; i < dt.files.length; i++) {
    if (/^image\//.test(dt.files[i].type)) { img = dt.files[i]; break; }
  }
  if (!img) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  handleImageFile(img);
}, true);

/* ============================================================
 * 12. 表格浮动工具条
 * ============================================================ */
var tableBarTarget = null;
editorEl.addEventListener('mouseover', function (e) {
  var table = e.target.closest && e.target.closest('table');
  if (table && table.dataset.type === 'table') {
    if (tableBarTarget === table) return;
    tableBarTarget = table;
    var scroll = editorHost.querySelector('.mde-scroll');
    var sr = scroll.getBoundingClientRect();
    var tr = table.getBoundingClientRect();
    tableBar.style.left = Math.min(Math.max(8, tr.left - sr.left + scroll.scrollLeft + 8), sr.width - 260) + 'px';
    tableBar.style.top = (tr.top - sr.top + scroll.scrollTop - 34) + 'px';
    tableBar.classList.remove('hidden');
  } else if (!e.target.closest('#tableBar')) {
    tableBarTarget = null;
    tableBar.classList.add('hidden');
  }
});

tableBar.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-tact]');
  if (!btn || !tableBarTarget) return;
  var table = tableBarTarget;
  var sel = window.getSelection();
  var cell = sel.rangeCount && table.contains(sel.getRangeAt(0).startContainer)
    ? sel.getRangeAt(0).startContainer.parentNode.closest('th,td') : null;
  var act = btn.dataset.tact;
  var ok = false;
  if (act === 'row-up' && cell) ok = !!Core.tableInsertRow(table, cell.parentNode, true);
  else if (act === 'row-down' && cell) ok = !!Core.tableInsertRow(table, cell.parentNode, false);
  else if (act === 'row-del' && cell) ok = Core.tableDeleteRow(table, cell.parentNode);
  else if (act === 'col-left' && cell) ok = !!Core.tableInsertCol(table, cell, true);
  else if (act === 'col-right' && cell) ok = !!Core.tableInsertCol(table, cell, false);
  else if (act === 'col-del' && cell) ok = Core.tableDeleteCol(table, cell);
  if (ok) {
    editorEl.dispatchEvent(new Event('input', { bubbles: true }));
    refreshOutline();
  }
});

/* ============================================================
 * 13. 大纲
 * ============================================================ */
function refreshOutline() {
  if (!outlinePanel) return;
  var list = outlinePanel.querySelector('.outline-list');
  if (!list) return;
  var items = [];
  var kids = editorEl.children;
  for (var i = 0; i < kids.length; i++) {
    if (kids[i].dataset && kids[i].dataset.type === 'heading') {
      items.push({ i: i, level: +kids[i].dataset.level || 1, text: kids[i].textContent.trim() || T('untitled') });
    }
  }
  list.innerHTML = items.length ? items.map(function (it) {
    return '<div class="outline-item" data-goto="' + it.i + '" style="padding-left:' + (8 + (it.level - 1) * 12) + 'px">' +
      Core.escapeHtml(it.text) + '</div>';
  }).join('') : '<div class="tree-empty">' + (settings.lang === 'zh' ? '暂无标题' : 'No headings') + '</div>';
}

outlinePanel.addEventListener('click', function (e) {
  var item = e.target.closest('[data-goto]');
  if (!item) return;
  var target = editorEl.children[+item.dataset.goto];
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ============================================================
 * 14. 顶部工具栏 / 菜单
 * ============================================================ */
function appToast(msg) {
  var el = $('#appToast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(appToast._t);
  appToast._t = setTimeout(function () { el.classList.remove('show'); }, 1800);
}

function updateTitle() {
  var name = state.filePath ? Core.pathBasename(state.filePath) : T('untitled');
  filePathLabel.textContent = (state.dirty ? '● ' : '') + name;
  filePathLabel.title = state.filePath || '';
  document.title = name + ' - ' + T('appName');
}

function closeMenus(except) {
  document.querySelectorAll('.menu.open').forEach(function (m) {
    if (m !== except) m.classList.remove('open');
  });
  syncMenuRoots();
}
/* 下拉开合状态 → 菜单根标题高亮同步 */
function syncMenuRoots() {
  document.querySelectorAll('.menu-root').forEach(function (r) {
    var dd = r.querySelector('.menu.dropdown');
    r.classList.toggle('open', !!(dd && dd.classList.contains('open')));
  });
}
document.addEventListener('click', function (e) {
  if (!e.target.closest('.menu-wrap') && !e.target.closest('.menu-root')) closeMenus();
});

function toggleMenu(id) {
  var m = $(id);
  var open = m.classList.contains('open');
  closeMenus();
  m.classList.toggle('open', !open);
  syncMenuRoots();
}

function recentMenuHtml() {
  var list = recentStore.load();
  return list.length ? list.map(function (r) {
    return '<button type="button" class="menu-item" data-recent="' + Core.escapeHtml(r.path) + '" title="' +
      Core.escapeHtml(r.path) + '">' + Core.escapeHtml(r.name) + '</button>';
  }).join('') + '<button type="button" class="menu-item muted" data-act="clear-recent">' + T('clearRecent') + '</button>'
    : '<div class="menu-empty">—</div>';
}
function renderRecentMenu() {
  var html = recentMenuHtml();
  $('#recentMenu').innerHTML = html;
  var mr = $('#menuRecent');
  if (mr) mr.innerHTML = html;
}

function onRecentMenuClick(e) {
  var item = e.target.closest('[data-recent]');
  if (item) {
    closeMenus();
    var path = item.dataset.recent;
    if (state.mode === 'tauri') {
      var dir = Core.pathDirname(path);
      guardDirty(function () {
        if (dir && dir !== state.folder) { state.folder = dir; loadTreeEntries(dir); }
        openPath(path);
      });
    } else {
      openPath(path);  // 浏览器模式：仅当内容仍在内存时可用
    }
    return;
  }
  if (e.target.closest('[data-act="clear-recent"]')) {
    window.localStorage.removeItem(recentStore.key);
    renderRecentMenu();
    closeMenus();
  }
}
$('#recentMenu').addEventListener('click', onRecentMenuClick);
var menuRecentEl = $('#menuRecent');
if (menuRecentEl) menuRecentEl.addEventListener('click', onRecentMenuClick);

function applySettings() {
  settingsStore.save(settings);
  document.body.setAttribute('data-theme', settings.theme);
  editor.setTheme(settings.theme);
  MDE.setLang(settings.lang);
  applyStaticLabels();
  renderFileTree();
  refreshOutline();
  updateTitle();
}

function applyStaticLabels() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = T(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    el.title = T(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    el.placeholder = T(el.dataset.i18nPlaceholder);
  });
}

/* 顶部按钮图标注入（自绘 SVG，无 emoji） */
var APP_BTN_ICONS = {
  'new': 'plus', 'open-file': 'file', 'open-folder': 'folder',
  'save': 'save', 'save-as': 'file', 'export-html': 'download', 'export-pdf': 'printer',
  'find': 'search', 'source': 'code', 'recent-menu': 'clock', 'settings-menu': 'sliders'
};
function injectAppIcons() {
  /* 只注入图标按钮（.app-btn），菜单项保持纯文字 */
  document.querySelectorAll('#appbar [data-app], #menubar .app-btn[data-app]').forEach(function (b) {
    var name = APP_BTN_ICONS[b.dataset.app];
    if (name) b.innerHTML = aIcon(name, 16);
  });
  var mc = document.querySelector('#appModal .modal-close');
  if (mc) mc.innerHTML = aIcon('x', 15);
}

/* 全局动作派发：工具栏 / 菜单栏统一入口 */
document.addEventListener('click', function (e) {
  var inDropdown = !!e.target.closest('.menu.dropdown');
  var setBtn = e.target.closest('[data-set]');
  if (setBtn && !e.target.closest('#settingsMenu')) {
    var kv = setBtn.dataset.set.split(':');
    settings[kv[0]] = kv[1];
    applySettings();
    if (inDropdown) closeMenus();
    return;
  }
  var btn = e.target.closest('[data-app]');
  if (!btn) return;
  if (inDropdown) closeMenus();
  var act = btn.dataset.app;
  switch (act) {
    case 'new': doNewDoc(); break;
    case 'open-file': doOpenFile(); break;
    case 'open-folder': doOpenFolder(); break;
    case 'save': doSave(true); break;
    case 'save-as': doSaveAs(); break;
    case 'export-html': doExportHtml(); break;
    case 'export-pdf': doExportPdf(); break;
    case 'find': findBarShow(false); break;
    case 'source': toggleSource(); break;
    case 'recent-menu': renderRecentMenu(); toggleMenu('#recentMenu'); break;
    case 'settings-menu': toggleMenu('#settingsMenu'); break;
  }
});

$('#settingsMenu').addEventListener('click', function (e) {
  var item = e.target.closest('[data-set]');
  if (!item) return;
  var kv = item.dataset.set.split(':');
  settings[kv[0]] = kv[1];
  applySettings();
  closeMenus();
});

/* ============================================================
 * 15.5 菜单栏系统（标准桌面软件：开合 / 悬停切换 / Alt 热键 /
 *      方向键导航 / 状态刷新 / 格式转发 / 模态框）
 * ============================================================ */
function menuRootOf(dd) { return dd.closest ? dd.closest('.menu-root') : null; }

function openMenuDropdown(dd) {
  closeMenus(dd);
  dd.classList.add('open');
  syncMenuRoots();
  refreshMenuStates();
  clearMenuFocus();
}
function toggleMenuRoot(root) {
  var dd = root.querySelector('.menu.dropdown');
  if (!dd) return;
  if (dd.classList.contains('open')) closeMenus();
  else openMenuDropdown(dd);
}
function closeAllMenuRoots() { closeMenus(); }

function refreshMenuStates() {
  /* 撤销/重做禁用态 */
  document.querySelectorAll('[data-mstate]').forEach(function (item) {
    var ok = item.dataset.mstate === 'undo' ? undoApi.canUndo() : undoApi.canRedo();
    item.classList.toggle('disabled', !ok);
    item.setAttribute('aria-disabled', ok ? 'false' : 'true');
  });
  /* 主题/语言勾选态 */
  document.querySelectorAll('[data-set]').forEach(function (item) {
    var kv = item.dataset.set.split(':');
    var on = settings[kv[0]] === kv[1];
    var mark = item.querySelector('.check');
    if (on && !mark) {
      mark = document.createElement('span');
      mark.className = 'check';
      mark.textContent = '✓';
      item.insertBefore(mark, item.firstChild);
    } else if (!on && mark) {
      mark.parentNode.removeChild(mark);
    }
  });
}

/* ---- 格式菜单 → 转发编辑器内置格式按钮（按钮在 DOM 中但不可见也能触发） ---- */
function fwdEditorAction(action) {
  var btn = document.querySelector('#editorHost .mde-btn[data-action="' + action + '"]');
  if (btn) btn.click();
}
function fwdHeading(level) {
  var btn = document.querySelector('#editorHost .mde-dd-menu [data-heading="' + level + '"]');
  if (btn) btn.click();
}

/* ---- 模态框 ---- */
function showModal(title, html) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#appModal').classList.remove('hidden');
}
function closeModal() { $('#appModal').classList.add('hidden'); }
function isModalOpen() { return !$('#appModal').classList.contains('hidden'); }

function showShortcuts() {
  var rows = [
    ['Ctrl+N / Ctrl+O / Ctrl+Shift+O', T('newDoc') + ' / ' + T('openFile') + ' / ' + T('openFolder')],
    ['Ctrl+S / Ctrl+Shift+S', T('save') + ' / ' + T('saveAs')],
    ['Ctrl+F / Ctrl+H', T('find') + ' / ' + T('replace')],
    ['Ctrl+/', T('source')],
    ['Ctrl+Z / Ctrl+Y', T('mUndo') + ' / ' + T('mRedo')],
    ['Ctrl+B / Ctrl+I / Ctrl+K', T('fmtBold') + ' / ' + T('fmtItalic') + ' / ' + T('mLink')],
    ['Ctrl+1 … Ctrl+6 / Ctrl+0', T('heading') + ' / ' + T('mBody')],
    ['Ctrl+Shift+7 / 8 / 9', T('mUl') + ' / ' + T('mOl') + ' / ' + T('mTask')],
    ['Alt+F/E/O/V/H', T('menuFile') + ' ' + T('menuEdit') + ' ' + T('menuFormat') + ' ' + T('menuView') + ' ' + T('menuHelp')]
  ];
  var html = '<table class="sc-table"><tbody>' + rows.map(function (r) {
    return '<tr><td><kbd>' + r[0] + '</kbd></td><td>' + Core.escapeHtml(r[1]) + '</td></tr>';
  }).join('') + '</tbody></table>';
  showModal(T('shortcutsTitle'), html);
}
function showAbout() {
  var html =
    '<div class="about-logo">' +
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0969da" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13"/><path d="M7 9h5"/><path d="M7 13h7"/><path d="M7 17h4"/></svg>' +
    'MD Editor</div>' +
    '<div class="about-meta">v1.1.0 · ' + (state.mode === 'tauri' ? 'Desktop (Tauri 2)' : 'Web Preview') + '<br>' +
    'WYSIWYG Markdown 编辑器 · MIT License</div>';
  showModal(T('aboutTitle'), html);
}
document.querySelectorAll('#appModal [data-mclose]').forEach(function (el) {
  el.addEventListener('click', closeModal);
});

/* ---- 菜单栏事件 ---- */
var menuBarEl = $('#menuBar');
menuBarEl.addEventListener('click', function (e) {
  var title = e.target.closest('.menu-title');
  if (title) { toggleMenuRoot(title.closest('.menu-root')); return; }
  /* 菜单项动作 */
  var item = e.target.closest('.menu-item');
  if (!item) return;
  if (item.classList.contains('disabled')) return;
  var fwd = item.dataset.efwd;
  if (fwd) { closeMenus(); fwdEditorAction(fwd); return; }
  var fwdh = item.dataset.efwdh;
  if (fwdh != null && fwdh !== '') { closeMenus(); fwdHeading(fwdh); return; }
  var mact = item.dataset.mact;
  if (mact) {
    closeMenus();
    if (mact === 'replace') findBarShow(true);
    else if (mact === 'select-all') {
      editor.focus();
      try {
        var r = document.createRange();
        r.selectNodeContents(editorEl);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
      } catch (err) {}
    }
    else if (mact === 'shortcuts') showShortcuts();
    else if (mact === 'about') showAbout();
  }
  /* data-app / data-set 由全局派发器处理，这里确保下拉收起 */
  if (item.dataset.app || item.dataset.set) closeMenus();
});

/* 悬停切换：菜单已展开时 hover 其他根标题直接切换（专业菜单行为） */
menuBarEl.addEventListener('mouseover', function (e) {
  var title = e.target.closest('.menu-title');
  if (!title) return;
  if (!document.querySelector('.menu.dropdown.open')) return;
  openMenuDropdown(title.closest('.menu-root').querySelector('.menu.dropdown'));
});

/* 方向键导航 + Esc + Alt 热键 */
function openDropdownOfKey(k) {
  return document.querySelector('.menu-root[data-mkey="' + k + '"] .menu.dropdown');
}
function menuVisibleItems(dd) {
  return Array.prototype.filter.call(dd.querySelectorAll('.menu-item'), function (i) {
    return !i.classList.contains('disabled');
  });
}
function clearMenuFocus() {
  document.querySelectorAll('.menu-item.mfocus').forEach(function (i) { i.classList.remove('mfocus'); });
}
function moveMenuFocus(dd, delta) {
  var items = menuVisibleItems(dd);
  if (!items.length) return;
  var cur = dd.querySelector('.menu-item.mfocus');
  var idx = items.indexOf(cur);
  idx = idx < 0 ? (delta > 0 ? 0 : items.length - 1) : (idx + delta + items.length) % items.length;
  clearMenuFocus();
  items[idx].classList.add('mfocus');
  try { items[idx].scrollIntoView({ block: 'nearest' }); } catch (err) {}
}
document.addEventListener('keydown', function (e) {
  /* Esc：先关模态，再关菜单 */
  if (e.key === 'Escape') {
    if (isModalOpen()) { closeModal(); return; }
    var open = document.querySelector('.menu.dropdown.open');
    if (open) {
      var root = menuRootOf(open);
      closeAllMenuRoots();
      if (root) root.querySelector('.menu-title').focus();
      e.preventDefault(); e.stopPropagation();
    }
    return;
  }
  /* Alt+字母 打开菜单（标准桌面软件热键） */
  if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    var k = (e.key || '').toLowerCase();
    var dd = openDropdownOfKey(k);
    if (dd) {
      e.preventDefault();
      var root2 = menuRootOf(dd);
      if (root2.classList.contains('open')) closeAllMenuRoots();
      else openMenuDropdown(dd);
      return;
    }
  }
  /* 展开态下的方向键 / Enter */
  var openDd = document.querySelector('.menu.dropdown.open');
  if (!openDd) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); moveMenuFocus(openDd, 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveMenuFocus(openDd, -1); }
  else if (e.key === 'Enter' || e.key === ' ') {
    var focusItem = openDd.querySelector('.menu-item.mfocus');
    if (focusItem && e.key === 'Enter') { e.preventDefault(); focusItem.click(); }
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    var roots = Array.prototype.slice.call(document.querySelectorAll('.menu-root'));
    var curRoot = menuRootOf(openDd);
    var pos = roots.indexOf(curRoot);
    var next = roots[(pos + (e.key === 'ArrowRight' ? 1 : -1) + roots.length) % roots.length];
    openMenuDropdown(next.querySelector('.menu.dropdown'));
    next.querySelector('.menu-title').focus();
  }
}, false);

/* ============================================================
 * 15. 查找栏事件
 * ============================================================ */
$('#findInput').addEventListener('input', runFind);
$('#findInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); findStep(e.shiftKey ? -1 : 1); }
  if (e.key === 'Escape') findBarHide();
});
$('#replaceInput').addEventListener('keydown', function (e) {
  if (e.key === 'Escape') findBarHide();
});
$('#findBar').addEventListener('click', function (e) {
  var btn = e.target.closest('[data-fact]');
  if (!btn) return;
  var act = btn.dataset.fact;
  if (act === 'prev') findStep(-1);
  else if (act === 'next') findStep(1);
  else if (act === 'replace') replaceCurrent();
  else if (act === 'replace-all') replaceAllMatches();
  else if (act === 'case') { btn.classList.toggle('active'); runFind(); }
  else if (act === 'close') findBarHide();
});

/* ============================================================
 * 16. 全局快捷键
 * ============================================================ */
window.addEventListener('keydown', function (e) {
  var mod = e.ctrlKey || e.metaKey;
  if (!mod) {
    if (e.key === 'Escape' && !findBar.classList.contains('hidden')) findBarHide();
    return;
  }
  var k = e.key.toLowerCase();
  if (k === 's' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); doSave(true); }
  else if (k === 'n') { e.preventDefault(); e.stopPropagation(); doNewDoc(); }
  else if (k === 'o' && e.shiftKey) { e.preventDefault(); e.stopPropagation(); doOpenFolder(); }
  else if (k === 'o') { e.preventDefault(); e.stopPropagation(); doOpenFile(); }
  else if (k === 'f') { e.preventDefault(); e.stopPropagation(); findBarShow(false); }
  else if (k === 'h') { e.preventDefault(); e.stopPropagation(); findBarShow(true); }
  else if (k === '/') { e.preventDefault(); e.stopPropagation(); toggleSource(); }
}, true);

/* ============================================================
 * 17. 关闭保护
 * ============================================================ */
bridge.listenClose(function () {
  if (!state.dirty || window.confirm(T('confirmClose'))) bridge.exit();
});

/* ============================================================
 * 18. 启动
 * ============================================================ */
applySettings();
injectAppIcons();
renderRecentMenu();
renderFileTree();
refreshOutline();
refreshMenuStates();   // 菜单勾选/禁用初始态
updateTitle();
if (state.mode === 'browser') {
  // 浏览器演示：预置示例文档，便于验证功能闭环
  editor.setMarkdown('# MD Editor\n\n这是一个 **所见即所得** Markdown 编辑器的浏览器演示模式。\n\n## 已实现的完整功能\n\n- 文件树与 `文件读写`\n- 图片粘贴到本地 assets\n- 查找与替换（Ctrl+F / Ctrl+H）\n- 源码模式（Ctrl+/）\n- 导出 HTML / PDF\n- 表格行列增删\n- 数学公式与 Mermaid 图表\n- 自建撤销/重做栈\n\n## 数学公式（点击可编辑）\n\n质能方程 $E = mc^2$ 与勾股定理 $a^2 + b^2 = c^2$。\n\n$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}\n$$\n\n## Mermaid 图表\n\n```mermaid\ngraph LR\n  A[Markdown] --> B[编辑器]\n  B --> C{桌面应用}\n  C -->|Tauri 2| D[3MB 安装包]\n```\n\n## 代码块\n\n```js\nfunction hello() {\n  console.log("hello desktop");\n}\n```\n\n## 嵌套列表\n\n- 第一层\n  - 第二层\n    - 第三层\n\n## 表格\n\n| 功能 | 状态 |\n| --- | --- |\n| 文件树 | 已完成 |\n| 查找替换 | 已完成 |\n\n> 提示：桌面模式（Tauri）下所有文件操作直接读写磁盘。\n\n- [x] 编辑器核心\n- [ ] 打包发布\n\n---\n');
  refreshOutline();  // onChange 有 120ms 防抖，初始大纲需立即刷新
}

/* 测试句柄（自动化验证用） */
window.__MDE_APP__ = {
  editor: editor,
  state: state,
  adapter: adapter,
  settings: settings,
  buildExportHtml: buildExportHtml,
  toggleSource: toggleSource,
  findBarShow: findBarShow,
  runFind: runFind,
  undo: undoApi,
  rich: richApi
};

})();
