/*! MDEditor v1.0.2 — WYSIWYG Markdown Editor | MIT License */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define(factory);
  else global.MDEditor = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var VERSION = '1.0.2';
var STYLE_ID = 'mde-styles';

/* ============================================================
 * 0. i18n
 * ============================================================ */
var I18N = {
  zh: {
    outline: '大纲', outlineEmpty: '暂无标题', untitled: '未命名',
    saved: '已保存', saving: '保存中…', ready: '就绪',
    copy: '复制', copied: '已复制', copyFailed: '复制失败',
    saveSuccess: '已保存', saveConflict: '保存冲突：文档已被他人修改',
    saveFailed: '保存失败：', loadFailed: '加载失败：',
    headingMenu: '标题 ', bodyText: '正文',
    promptLinkUrl: '输入链接地址：', promptLinkText: '链接文字：',
    promptLinkDefault: '链接', promptImageUrl: '图片地址：',
    promptImageAlt: '图片描述（可选）：',
    unsafeLink: '不安全的链接协议', unsafeImage: '不安全的图片地址',
    tipUndo: '撤销 Ctrl+Z', tipRedo: '重做 Ctrl+Shift+Z',
    tipBold: '粗体 Ctrl+B', tipItalic: '斜体 Ctrl+I', tipStrike: '删除线',
    tipInlineCode: '行内代码', tipHeading: '标题',
    tipUl: '无序列表 Ctrl+Shift+7', tipOl: '有序列表 Ctrl+Shift+8',
    tipTask: '任务列表 Ctrl+Shift+9',
    tipQuote: '引用', tipHr: '分割线',
    tipLink: '链接 Ctrl+K', tipImage: '图片', tipTable: '表格',
    tipCodeBlock: '代码块', tipOutline: '大纲', tipTheme: '主题',
    tipSave: '保存 Ctrl+S',
    errContainerNotFound: 'MDEditor: 未找到容器元素'
  },
  en: {
    outline: 'Outline', outlineEmpty: 'No headings', untitled: 'Untitled',
    saved: 'Saved', saving: 'Saving…', ready: 'Ready',
    copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed',
    saveSuccess: 'Saved', saveConflict: 'Conflict: document changed',
    saveFailed: 'Save failed: ', loadFailed: 'Load failed: ',
    headingMenu: 'Heading ', bodyText: 'Body',
    promptLinkUrl: 'Link URL:', promptLinkText: 'Link text:',
    promptLinkDefault: 'link', promptImageUrl: 'Image URL:',
    promptImageAlt: 'Image alt (optional):',
    unsafeLink: 'Unsafe link protocol', unsafeImage: 'Unsafe image URL',
    tipUndo: 'Undo Ctrl+Z', tipRedo: 'Redo Ctrl+Shift+Z',
    tipBold: 'Bold Ctrl+B', tipItalic: 'Italic Ctrl+I', tipStrike: 'Strikethrough',
    tipInlineCode: 'Inline code', tipHeading: 'Heading',
    tipUl: 'Bulleted list Ctrl+Shift+7', tipOl: 'Numbered list Ctrl+Shift+8',
    tipTask: 'Task list Ctrl+Shift+9',
    tipQuote: 'Quote', tipHr: 'Divider',
    tipLink: 'Link Ctrl+K', tipImage: 'Image', tipTable: 'Table',
    tipCodeBlock: 'Code block', tipOutline: 'Outline', tipTheme: 'Theme',
    tipSave: 'Save Ctrl+S',
    errContainerNotFound: 'MDEditor: container not found'
  }
};
var currentLang = 'zh';
function setLang(lang) {
  if (I18N[lang]) currentLang = lang;
}
function t(key) {
  var dict = I18N[currentLang] || I18N.zh;
  return dict[key] != null ? dict[key] : key;
}

/* ============================================================
 * 1. 图标（Lucide 风格美化版）
 * ============================================================ */
var ICONS = {
  /* ---- 编辑操作 ---- */
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>',

  /* ---- 行内格式 ---- */
  bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
  italic: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
  strike: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',

  /* ---- 块级格式 ---- */
  heading: '<path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  'list-ordered': '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  task: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  quote: '<path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4"/><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4"/>',
  minus: '<path d="M5 12h14"/>',

  /* ---- 插入 ---- */
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/>',
  codeblock: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m10 10-2 2 2 2"/><path d="m14 10 2 2-2 2"/>',

  /* ---- 视图 ---- */
  outline: '<path d="M3 6h18"/><path d="M7 12h14"/><path d="M7 18h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',

  /* ---- 文件 ---- */
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
};

function icon(name, size) {
  size = size || 18;
  var p = ICONS[name] || '';
  /* 小尺寸用更粗的描边保证视觉重量一致；
     18px 以上保持 2 —— 在 24 viewBox 里对应实际 1.5px，简洁精致 */
  var sw = size <= 14 ? 2.5 : 2;
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
    '" fill="none" stroke="currentColor" stroke-width="' + sw +
    '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
}

/* ============================================================
 * 2. 工具函数
 * ============================================================ */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
function uid() { return 'd' + Date.now() + Math.random().toString(36).slice(2, 7); }
function debounce(fn, wait) {
  var t; return function () {
    var self = this, args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(self, args); }, wait);
  };
}
function toArray(list) {
  if (!list) return [];
  return Array.prototype.slice.call(list);
}

/* ============================================================
 * 3. URL 安全过滤
 * ============================================================ */
function sanitizeUrl(url, allowDataImage) {
  if (url == null) return '';
  var s = String(url).trim();
  if (!s) return '';

  /* 去掉所有控制字符和空白，防止 "java\nscript:" 这类绕过 */
  var normalized = s.replace(/[\x00-\x20]/g, '').toLowerCase();

  /* 相对路径 / 锚点 / 查询串 —— 直接放行 */
  if (/^(\/|#|\?|\.\/|\.\.\/)/.test(s)) return s;

  /* 明确允许的协议 */
  if (/^(https?:|mailto:|tel:)/i.test(normalized)) return s;

  /* 图片场景允许 data:image/* */
  if (allowDataImage && /^data:image\//i.test(normalized)) return s;

  /* 其他任何带协议的（javascript:/vbscript:/data:text/html 等）一律拒绝 */
  if (/^[a-z][a-z0-9+.\-]*:/i.test(normalized)) return '';

  /* 无协议普通字符串 —— 视为相对路径 */
  return s;
}

/* ============================================================
 * 4. 高亮器
 * ============================================================ */
var Highlighter = (function () {
  var KW_JS = 'function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|const|let|var|import|export|from|default|delete|void|static|get|set';
  var KW_PY = 'def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|assert|del|in|is|not|and|or|async|await';

  var LANGS = {
    js: [
      [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
      [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, 'str'],
      [/\b(?:0[xX][\da-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, 'num'],
      [new RegExp('\\b(?:' + KW_JS + ')\\b', 'g'), 'kw'],
      [/\b(?:true|false|null|undefined|NaN|Infinity)\b/g, 'lit'],
      [/\b(?:[A-Z][A-Za-z0-9_]*)\b/g, 'type']
    ],
    ts: [
      [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
      [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, 'str'],
      [/\b(?:0[xX][\da-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, 'num'],
      [new RegExp('\\b(?:' + KW_JS + '|interface|type|enum|implements|declare|namespace|public|private|protected|readonly|abstract)\\b', 'g'), 'kw'],
      [/\b(?:true|false|null|undefined|NaN|Infinity)\b/g, 'lit'],
      [/\b(?:[A-Z][A-Za-z0-9_]*)\b/g, 'type']
    ],
    py: [
      [/(#[^\n]*)/g, 'cmt'],
      [/(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, 'str'],
      [/\b(?:0[xX][\da-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, 'num'],
      [new RegExp('\\b(?:' + KW_PY + ')\\b', 'g'), 'kw'],
      [/\b(?:True|False|None|self|cls)\b/g, 'lit']
    ],
    json: [
      [/"(?:\\.|[^"\\])*"(?=\s*:)/g, 'kw'],
      [/"(?:\\.|[^"\\])*"/g, 'str'],
      [/\b-?\d+\.?\d*(?:[eE][+-]?\d+)?\b/g, 'num'],
      [/\b(?:true|false|null)\b/g, 'lit']
    ],
    html: [
      [/<!--[\s\S]*?-->/g, 'cmt'],
      [/(?:'[^']*'|"[^"]*")/g, 'str'],
      [/<\/?[a-zA-Z][\w-]*/g, 'kw'],
      [/\b[\w-]+(?=\s*=)/g, 'type'],
      [/\b\d+\b/g, 'num']
    ],
    css: [
      [/\/\*[\s\S]*?\*\//g, 'cmt'],
      [/(?:'[^']*'|"[^"]*")/g, 'str'],
      [/#[0-9a-fA-F]{3,8}\b/g, 'lit'],
      [/[.#]?[-\w]+(?=\s*\{)/g, 'kw'],
      [/\b[\w-]+(?=\s*:)/g, 'type'],
      [/\b\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg)?\b/g, 'num']
    ],
    sh: [
      [/(#[^\n]*)/g, 'cmt'],
      [/(?:'[^']*'|"[^"]*")/g, 'str'],
      [/\$\w+|\$\{[^}]+\}/g, 'type'],
      [/\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|function|return|export|local|echo|cd|sudo|apt|npm|yarn|git|docker)\b/g, 'kw'],
      [/\b\d+\b/g, 'num']
    ],
    go: [
      [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
      [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`[^`]*`)/g, 'str'],
      [/\b(?:func|package|import|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|break|continue|select|default|fallthrough|goto)\b/g, 'kw'],
      [/\b(?:true|false|nil|iota)\b/g, 'lit'],
      [/\b\d+\.?\d*\b/g, 'num'],
      [/\b(?:[A-Z][A-Za-z0-9_]*)\b/g, 'type']
    ],
    rust: [
      [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
      [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, 'str'],
      [/\b(?:fn|let|mut|const|static|struct|enum|trait|impl|pub|use|mod|match|if|else|for|while|loop|break|continue|return|async|await|move|where|self|Self|super|crate|as|in|ref|dyn)\b/g, 'kw'],
      [/\b(?:true|false|None|Some|Ok|Err)\b/g, 'lit'],
      [/\b\d+\.?\d*(?:f32|f64|i32|i64|u32|u64|usize|isize)?\b/g, 'num'],
      [/\b(?:[A-Z][A-Za-z0-9_]*)\b/g, 'type']
    ],
    java: [
      [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
      [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, 'str'],
      [/\b(?:public|private|protected|class|interface|extends|implements|static|final|void|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|import|package|this|super|abstract|synchronized|volatile|transient|native|instanceof)\b/g, 'kw'],
      [/\b(?:true|false|null)\b/g, 'lit'],
      [/\b\d+\.?\d*[fFdDlL]?\b/g, 'num'],
      [/\b(?:String|Integer|Long|Double|Boolean|Object|List|Map|Set)\b/g, 'type']
    ]
  };

  var ALIAS = {
    javascript:'js', jsx:'js', mjs:'js',
    typescript:'ts', tsx:'ts',
    python:'py', py3:'py',
    bash:'sh', shell:'sh', zsh:'sh', console:'sh',
    yml:'yaml', scss:'css', less:'css', sass:'css',
    golang:'go', rs:'rust'
  };

  LANGS.cpp = [
    [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
    [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, 'str'],
    [/\b(?:int|char|float|double|void|long|short|unsigned|signed|bool|const|static|struct|class|enum|union|typedef|namespace|using|template|typename|public|private|protected|virtual|override|new|delete|return|if|else|for|while|do|switch|case|break|continue|goto|try|catch|throw|extern|inline|auto|constexpr|nullptr|true|false)\b/g, 'kw'],
    [/\b\d+\.?\d*(?:[uUlLfF]+)?\b/g, 'num'],
    [/#\s*\w+/g, 'type']
  ];
  LANGS.csharp = [
    [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
    [/(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|@"[^"]*")/g, 'str'],
    [/\b(?:using|namespace|class|interface|struct|enum|public|private|protected|internal|static|readonly|const|void|int|string|bool|double|float|long|var|new|return|if|else|for|foreach|while|do|switch|case|break|continue|try|catch|finally|throw|this|base|virtual|override|abstract|async|await|get|set|true|false|null)\b/g, 'kw'],
    [/\b\d+\.?\d*[fFdDmMlL]?\b/g, 'num']
  ];
  LANGS.yaml = [
    [/(#[^\n]*)/g, 'cmt'],
    [/^[ \t]*[\w.-]+(?=\s*:)/gm, 'kw'],
    [/:\s*("[^"]*"|'[^']*'|.*$)/gm, 'str'],
    [/\b(?:true|false|null|yes|no)\b/gi, 'lit'],
    [/\b-?\d+\.?\d*\b/g, 'num']
  ];
  LANGS.sql = [
    [/(--[^\n]*|\/\*[\s\S]*?\*\/)/g, 'cmt'],
    [/(?:'(?:''|[^'])*')/g, 'str'],
    [/\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|DISTINCT|UNION|ALL|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|AUTO_INCREMENT|UNIQUE)\b/gi, 'kw'],
    [/\b\d+\.?\d*\b/g, 'num']
  ];

  function normalize(lang) {
    if (!lang) return null;
    lang = String(lang).toLowerCase();
    return ALIAS[lang] || lang;
  }

  function highlight(code, lang) {
    var l = normalize(lang);
    var ruleset = l && LANGS[l];
    if (!ruleset) return escapeHtml(code);
    var store = [];
    var s = escapeHtml(code);
    ruleset.forEach(function (rule) {
      var re = rule[0], cls = rule[1];
      s = s.replace(re, function (m) {
        store.push('<span class="mde-hl-' + cls + '">' + m + '</span>');
        /* 占位符用私用区字符承载索引，避免被后续 \d+ 规则误匹配 */
        return '\x00' + String.fromCharCode(0xE000 + store.length - 1) + '\x00';
      });
    });
    return s.replace(/\x00([\uE000-\uF8FF])\x00/g, function (_, c) {
      return store[c.charCodeAt(0) - 0xE000];
    });
  }

  return { highlight: highlight, languages: Object.keys(LANGS) };
})();

/* ============================================================
 * 5. Markdown 引擎
 * ============================================================ */
function inlineToHtml(text) {
  var s = escapeHtml(text), codes = [];
  s = s.replace(/`([^`\n]+)`/g, function (m, c) { codes.push(c); return '\x01' + (codes.length - 1) + '\x01'; });

  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) {
    var safe = sanitizeUrl(url, true);
    if (!safe) return escapeHtml('![' + alt + '](' + url + ')');
    return '<img src="' + safe + '" alt="' + escapeHtml(alt) + '">';
  });

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
    var safe = sanitizeUrl(url, false);
    if (!safe) return escapeHtml('[' + label + '](' + url + ')');
    return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
  });

  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\x01(\d+)\x01/g, function (m, i) { return '<code>' + codes[+i] + '</code>'; });
  return s;
}

function nodeToMd(node) {
  var md = '';
  var kids = node.childNodes || [];
  for (var i = 0; i < kids.length; i++) {
    var child = kids[i];
    if (child.nodeType === 3) md += child.textContent;
    else if (child.nodeType === 1) {
      if (child.hasAttribute && child.hasAttribute('data-mdx-skip')) continue;
      var tag = child.tagName.toLowerCase();
      if (tag === 'br') { md += '\n'; continue; }
      var inner = nodeToMd(child);
      if (tag === 'strong' || tag === 'b') md += '**' + inner + '**';
      else if (tag === 'em' || tag === 'i') md += '*' + inner + '*';
      else if (tag === 'del' || tag === 's' || tag === 'strike') md += '~~' + inner + '~~';
      else if (tag === 'code') md += '`' + inner + '`';
      else if (tag === 'a') md += '[' + inner + '](' + (child.getAttribute('href') || '') + ')';
      else if (tag === 'img') md += '![' + (child.getAttribute('alt') || '') + '](' + (child.getAttribute('src') || '') + ')';
      else md += inner;
    }
  }
  return md;
}

var TABLE_SEP_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/* 列表缩进层级：每 2 个空格为一级 */
function listIndent(ws) { return Math.floor(ws.length / 2); }
function indentPrefix(el) {
  var n = +(el.dataset.indent || 0);
  return n > 0 ? new Array(n + 1).join('  ') : '';
}

/* 引用块内容拆分：识别引用内的围栏代码块，返回 parts（无代码时返回 null 走纯文本路径） */
function splitQuoteParts(text) {
  var lines = text.split('\n'), parts = [], buf = [];
  var inCode = false, codeLang = '', codeBuf = [];
  function flushText() { if (buf.length) { parts.push({ type: 'text', text: buf.join('\n') }); buf = []; } }
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var f = l.match(/^```(.*)$/);
    if (f && !inCode) { flushText(); inCode = true; codeLang = f[1].trim(); codeBuf = []; continue; }
    if (inCode && /^\s*```\s*$/.test(l)) {
      parts.push({ type: 'code', lang: codeLang, text: codeBuf.join('\n') });
      inCode = false; continue;
    }
    if (inCode) { codeBuf.push(l); continue; }
    buf.push(l);
  }
  if (inCode) parts.push({ type: 'code', lang: codeLang, text: codeBuf.join('\n') });
  flushText();
  for (var j = 0; j < parts.length; j++) { if (parts[j].type === 'code') return parts; }
  return null;
}

function parseMarkdown(md) {
  var lines = md.split('\n'), out = [], i = 0;
  while (i < lines.length) {
    var line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }

    var fence = line.match(/^(\s*)```(.*)$/);
    if (fence) {
      var lang = fence[2].trim(), buf = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      if (i < lines.length) i++;
      out.push({ type: 'code', lang: lang, text: buf.join('\n') });
      continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push({ type: 'hr' }); i++; continue; }

    var h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push({ type: 'heading', level: h[1].length, text: h[2] }); i++; continue; }

    if (/^>\s?/.test(line)) {
      var qb = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { qb.push(lines[i].replace(/^>\s?/, '')); i++; }
      var qtext = qb.join('\n');
      out.push({ type: 'quote', text: qtext, parts: splitQuoteParts(qtext) });
      continue;
    }
    var t = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (t) { out.push({ type: 'task', checked: t[2].toLowerCase() === 'x', text: t[3], indent: listIndent(t[1]) }); i++; continue; }

    var ul = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ul) { out.push({ type: 'ul', text: ul[2], indent: listIndent(ul[1]) }); i++; continue; }

    var ol = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (ol) { out.push({ type: 'ol', num: +ol[2], text: ol[3], indent: listIndent(ol[1]) }); i++; continue; }

    if (/^\s*\|.*\|\s*$/.test(line)) {
      var tb = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { tb.push(lines[i]); i++; }
      var isTable = tb.length >= 2 && TABLE_SEP_RE.test(tb[1]);
      if (isTable) {
        var rows = tb.map(function (l) {
          return l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); });
        });
        out.push({ type: 'table', rows: [rows[0]].concat(rows.slice(2)) });
      } else {
        out.push({ type: 'paragraph', text: tb.join('\n') });
      }
      continue;
    }

    var pb = [line]; i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|>\s?|\s*[-*+]\s|\s*\d+\.\s|\s*```|\s*\|.*\|)/.test(lines[i])) {
      pb.push(lines[i]); i++;
    }
    out.push({ type: 'paragraph', text: pb.join('\n') });
  }
  return out;
}

/* ============================================================
 * 6. 存储适配器
 * ============================================================ */
function LocalStorageAdapter(opts) {
  opts = opts || {};
  this.name = 'local';
  this.prefix = opts.prefix || 'mde:';
}
LocalStorageAdapter.prototype.list = function () {
  var self = this;
  var ids = JSON.parse(localStorage.getItem(self.prefix + 'index') || '[]');
  return Promise.resolve(ids.map(function (id) {
    var d = JSON.parse(localStorage.getItem(self.prefix + id) || 'null');
    return d ? { id: d.id, title: d.title, updatedAt: d.updatedAt, version: d.version } : null;
  }).filter(Boolean));
};
LocalStorageAdapter.prototype.get = function (id) {
  var raw = localStorage.getItem(this.prefix + id);
  return Promise.resolve(raw ? JSON.parse(raw) : null);
};
LocalStorageAdapter.prototype.create = function (input) {
  var doc = { id: uid(), title: input.title || 'Untitled', content: input.content || '',
              version: 1, updatedAt: Date.now() };
  localStorage.setItem(this.prefix + doc.id, JSON.stringify(doc));
  this._addIndex(doc.id);
  return Promise.resolve(doc);
};
LocalStorageAdapter.prototype.update = function (id, input, version) {
  var self = this;
  return self.get(id).then(function (cur) {
    if (!cur) { var e1 = new Error('NOT_FOUND'); e1.code = 'NOT_FOUND'; throw e1; }
    if (version != null && cur.version !== version) {
      var e2 = new Error('VERSION_CONFLICT'); e2.code = 'VERSION_CONFLICT'; e2.serverDoc = cur; throw e2;
    }
    var next = Object.assign({}, cur, input, { version: cur.version + 1, updatedAt: Date.now() });
    localStorage.setItem(self.prefix + id, JSON.stringify(next));
    return next;
  });
};
LocalStorageAdapter.prototype.remove = function (id) {
  localStorage.removeItem(this.prefix + id);
  var idx = JSON.parse(localStorage.getItem(this.prefix + 'index') || '[]');
  localStorage.setItem(this.prefix + 'index', JSON.stringify(idx.filter(function (x) { return x !== id; })));
  return Promise.resolve();
};
LocalStorageAdapter.prototype._addIndex = function (id) {
  var idx = JSON.parse(localStorage.getItem(this.prefix + 'index') || '[]');
  if (idx.indexOf(id) < 0) idx.push(id);
  localStorage.setItem(this.prefix + 'index', JSON.stringify(idx));
};

function MemoryAdapter() {
  this.name = 'memory';
  this._store = {};
}
MemoryAdapter.prototype.list = function () {
  var self = this;
  return Promise.resolve(Object.keys(self._store).map(function (id) {
    var d = self._store[id];
    return { id: d.id, title: d.title, updatedAt: d.updatedAt, version: d.version };
  }));
};
MemoryAdapter.prototype.get = function (id) {
  return Promise.resolve(this._store[id] ? JSON.parse(JSON.stringify(this._store[id])) : null);
};
MemoryAdapter.prototype.create = function (input) {
  var doc = { id: uid(), title: input.title || 'Untitled', content: input.content || '',
              version: 1, updatedAt: Date.now() };
  this._store[doc.id] = doc;
  return Promise.resolve(doc);
};
MemoryAdapter.prototype.update = function (id, input, version) {
  var cur = this._store[id];
  if (!cur) { var e1 = new Error('NOT_FOUND'); e1.code = 'NOT_FOUND'; return Promise.reject(e1); }
  if (version != null && cur.version !== version) {
    var e2 = new Error('VERSION_CONFLICT'); e2.code = 'VERSION_CONFLICT'; e2.serverDoc = cur; return Promise.reject(e2);
  }
  var next = Object.assign({}, cur, input, { version: cur.version + 1, updatedAt: Date.now() });
  this._store[id] = next;
  return Promise.resolve(next);
};
MemoryAdapter.prototype.remove = function (id) { delete this._store[id]; return Promise.resolve(); };

function RESTAdapter(opts) {
  opts = opts || {};
  this.name = 'rest';
  this.apiBase = (opts.apiBase || '/api').replace(/\/$/, '');
  this.token = opts.token;
  this.fetch = opts.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
}
RESTAdapter.prototype._req = function (method, path, body) {
  var self = this;
  if (!self.fetch) return Promise.reject(new Error('fetch unavailable'));
  return self.fetch(self.apiBase + path, {
    method: method,
    headers: Object.assign({ 'Content-Type': 'application/json' },
      self.token ? { Authorization: 'Bearer ' + self.token } : {}),
    body: body ? JSON.stringify(body) : undefined
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (j) {
      if (!res.ok) {
        var err = new Error((j.error && j.error.message) || ('HTTP ' + res.status));
        err.code = (j.error && j.error.code) || 'HTTP_ERROR';
        err.status = res.status;
        if (res.status === 409) err.serverDoc = j.error && j.error.serverDoc;
        throw err;
      }
      return j.data != null ? j.data : j;
    });
  });
};
RESTAdapter.prototype.list = function () { return this._req('GET', '/documents'); };
RESTAdapter.prototype.get = function (id) { return this._req('GET', '/documents/' + id); };
RESTAdapter.prototype.create = function (input) { return this._req('POST', '/documents', input); };
RESTAdapter.prototype.update = function (id, input, version) {
  return this._req('PUT', '/documents/' + id, Object.assign({}, input, { version: version }));
};
RESTAdapter.prototype.remove = function (id) { return this._req('DELETE', '/documents/' + id); };

/* ============================================================
 * 7. 样式
 * ============================================================ */
var CSS = [
'.mde-root{--mde-bg:#fff;--mde-bg2:#f6f8fa;--mde-bg3:#eaeef2;--mde-text:#1f2328;--mde-text2:#656d76;--mde-text3:#8b949e;--mde-border:#d8dee4;--mde-accent:#0969da;--mde-accent-bg:#ddf4ff;--mde-code-bg:#f6f8fa;--mde-quote:#d0d7de;--mde-min-height:200px;display:flex;flex-direction:column;height:100%;min-height:var(--mde-min-height);background:var(--mde-bg);color:var(--mde-text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;line-height:1.75;overflow:hidden}',
'.mde-root *{box-sizing:border-box}',
'.mde-root[data-theme="dark"]{--mde-bg:#0d1117;--mde-bg2:#161b22;--mde-bg3:#21262d;--mde-text:#e6edf3;--mde-text2:#8b949e;--mde-text3:#6e7681;--mde-border:#30363d;--mde-accent:#58a6ff;--mde-accent-bg:#1f3a5f;--mde-code-bg:#161b22;--mde-quote:#3d444d}',
'.mde-toolbar{flex-shrink:0;background:var(--mde-bg2);border-bottom:1px solid var(--mde-border);padding:6px 10px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;user-select:none}',
'.mde-tgroup{display:flex;align-items:center;gap:2px}',
'.mde-tsep{width:1px;height:20px;background:var(--mde-border);margin:0 6px}',
'.mde-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:none;background:transparent;color:var(--mde-text2);border-radius:6px;cursor:pointer;transition:background .12s,color .12s;padding:0}',
'.mde-btn:hover{background:var(--mde-bg3);color:var(--mde-text)}',
'.mde-btn:active{transform:scale(.94)}',
'.mde-btn.active{background:var(--mde-accent-bg);color:var(--mde-accent)}',
'.mde-btn svg{display:block}',
'.mde-dd{position:relative}',
'.mde-dd-menu{position:absolute;top:calc(100% + 4px);left:0;z-index:100;background:var(--mde-bg);border:1px solid var(--mde-border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:4px;min-width:130px;display:none}',
'.mde-dd.open .mde-dd-menu{display:block}',
'.mde-dd-menu button{display:block;width:100%;padding:7px 12px;border:none;background:transparent;color:var(--mde-text);font-size:13.5px;font-family:inherit;text-align:left;border-radius:5px;cursor:pointer}',
'.mde-dd-menu button:hover{background:var(--mde-bg3)}',
'.mde-h1{font-size:19px;font-weight:700}.mde-h2{font-size:17px;font-weight:700}.mde-h3{font-size:15.5px;font-weight:600}.mde-h4{font-size:14.5px;font-weight:600}.mde-h5{font-size:14px;font-weight:600}.mde-h6{font-size:13px;font-weight:600;color:var(--mde-text2)}',
'.mde-body{flex:1;display:flex;min-height:0}',
'.mde-sidebar{width:230px;flex-shrink:0;background:var(--mde-bg2);border-right:1px solid var(--mde-border);display:flex;flex-direction:column;overflow:hidden;transition:width .2s}',
'.mde-sidebar.collapsed{width:0;border-right:none}',
'.mde-side-head{padding:12px 14px 8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mde-text3)}',
'.mde-outline{flex:1;overflow-y:auto;padding:0 8px 16px}',
'.mde-outline-item{padding:5px 8px;font-size:13px;color:var(--mde-text2);border-radius:5px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.mde-outline-item:hover{background:var(--mde-bg3);color:var(--mde-text)}',
'.mde-outline-empty{font-size:12.5px;color:var(--mde-text3);padding:8px;text-align:center}',
'.mde-scroll{flex:1;overflow-y:auto;overflow-x:hidden}',
'.mde-editor{max-width:820px;margin:0 auto;padding:36px 56px 200px;min-height:100%;outline:none}',
'.mde-editor > *{margin:0 0 2px;border-radius:4px;transition:background .12s}',
'.mde-editor > *:hover{background:rgba(127,127,127,.04)}',
'.mde-editor p{white-space:pre-wrap;word-break:break-word;min-height:1.75em;margin:0}',
'.mde-editor h1,.mde-editor h2,.mde-editor h3,.mde-editor h4,.mde-editor h5,.mde-editor h6{font-weight:700;line-height:1.35;margin-top:20px}',
'.mde-editor h1{font-size:2em}.mde-editor h2{font-size:1.55em}.mde-editor h3{font-size:1.28em}.mde-editor h4{font-size:1.1em}.mde-editor h5{font-size:1em}.mde-editor h6{font-size:.92em;color:var(--mde-text2)}',
'.mde-editor blockquote{border-left:3px solid var(--mde-quote);padding:2px 0 2px 16px;color:var(--mde-text2);white-space:pre-wrap;margin:0}',
'.mde-editor .mde-li{display:flex;gap:8px;align-items:flex-start;min-height:1.75em}',
'.mde-editor .mde-bullet{flex-shrink:0;color:var(--mde-text2);min-width:20px;text-align:right;font-variant-numeric:tabular-nums;user-select:none}',
'.mde-editor .mde-li-content{flex:1;white-space:pre-wrap;word-break:break-word;outline:none}',
'.mde-editor .mde-task input{margin:6px 0 0;flex-shrink:0;width:15px;height:15px;cursor:pointer;accent-color:var(--mde-accent)}',
'.mde-editor .mde-done{color:var(--mde-text3);text-decoration:line-through}',
'.mde-editor hr{border:none;border-top:1px solid var(--mde-border);margin:14px 0}',
'.mde-editor code{background:var(--mde-code-bg);border:1px solid var(--mde-border);border-radius:4px;padding:.12em .38em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em}',
'.mde-editor a{color:var(--mde-accent);text-decoration:none;cursor:pointer}',
'.mde-editor a:hover{text-decoration:underline}',
'.mde-editor img{max-width:100%;border-radius:6px;display:block;margin:6px 0}',
'.mde-editor .mde-codeblock{background:var(--mde-code-bg);border:1px solid var(--mde-border);border-radius:8px;overflow:hidden;margin:8px 0}',
'.mde-editor .mde-codehead{display:flex;align-items:center;justify-content:space-between;padding:5px 10px 5px 14px;background:var(--mde-bg3);border-bottom:1px solid var(--mde-border);user-select:none}',
'.mde-editor .mde-codelang{font-size:11.5px;font-weight:600;color:var(--mde-text2);text-transform:lowercase;letter-spacing:.03em;font-family:ui-monospace,monospace}',
'.mde-editor .mde-copy{display:inline-flex;align-items:center;gap:4px;border:none;background:transparent;color:var(--mde-text2);font-size:11.5px;font-family:inherit;cursor:pointer;padding:3px 8px;border-radius:5px}',
'.mde-editor .mde-copy:hover{background:var(--mde-bg);color:var(--mde-text)}',
'.mde-editor .mde-copy.copied{color:#1a7f37}',
'.mde-root[data-theme="dark"] .mde-editor .mde-copy.copied{color:#3fb950}',
'.mde-editor pre{margin:0;padding:13px 16px;overflow-x:auto;background:transparent;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:13.2px;line-height:1.65}',
'.mde-editor pre code{background:transparent!important;border:none!important;padding:0!important;font-size:inherit}',
'.mde-editor table{border-collapse:collapse;width:100%;margin:8px 0;font-size:14px;display:block;overflow-x:auto}',
'.mde-editor th,.mde-editor td{border:1px solid var(--mde-border);padding:7px 12px;text-align:left;min-width:60px}',
'.mde-editor th{background:var(--mde-bg2);font-weight:600}',
'.mde-statusbar{flex-shrink:0;height:28px;background:var(--mde-bg2);border-top:1px solid var(--mde-border);display:flex;align-items:center;gap:16px;padding:0 16px;font-size:12px;color:var(--mde-text3);user-select:none}',
'.mde-statusbar .spacer{flex:1}',
'.mde-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#1a7f37;margin-right:5px;vertical-align:middle}',
'.mde-dot.saving{background:#d29922}',
'.mde-toast{position:fixed;bottom:52px;left:50%;transform:translateX(-50%) translateY(16px);background:#333;color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;opacity:0;pointer-events:none;transition:all .22s;z-index:9999}',
'.mde-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}',
'.mde-hl-cmt{color:#6e7781;font-style:italic}.mde-hl-str{color:#0a3069}.mde-hl-num{color:#0550ae}.mde-hl-kw{color:#cf222e;font-weight:600}.mde-hl-lit{color:#0550ae}.mde-hl-type{color:#953800}',
'.mde-root[data-theme="dark"] .mde-hl-cmt{color:#8b949e}.mde-root[data-theme="dark"] .mde-hl-str{color:#a5d6ff}.mde-root[data-theme="dark"] .mde-hl-num{color:#79c0ff}.mde-root[data-theme="dark"] .mde-hl-kw{color:#ff7b72}.mde-root[data-theme="dark"] .mde-hl-lit{color:#79c0ff}.mde-root[data-theme="dark"] .mde-hl-type{color:#ffa657}',
'@media(max-width:900px){.mde-editor{padding:28px 22px 160px}.mde-sidebar{width:180px}}'
].join('');

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  var s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ============================================================
 * 8. createEditor
 * ============================================================ */
function createEditor(container, options) {
  if (typeof container === 'string') container = document.querySelector(container);
  if (!container) throw new Error(t('errContainerNotFound'));

  options = Object.assign({
    storage: null,
    storagePrefix: 'mde:',
    docId: null,
    theme: 'light',
    height: null,
    autofocus: true,
    autoSaveDelay: 800,
    autoSave: true,
    toolbar: true,
    outline: true,
    statusbar: true,
    placeholder: '',
    lang: null,
    highlighter: null,
    onChange: null,
    onSave: null,
    onError: null,
    onReady: null
  }, options || {});

  if (options.lang) setLang(options.lang);

  injectStyles();

  /* ---- 状态 ---- */
  var doc = '';
  var currentDocId = options.docId;
  var currentVersion = 0;
  var storage = options.storage || new LocalStorageAdapter({ prefix: options.storagePrefix });
  var hl = options.highlighter || Highlighter;
  var destroyed = false;
  var dirty = false;

  /* ---- DOM ---- */
  container.innerHTML = '';
  container.classList.add('mde-root');
  container.setAttribute('data-theme', options.theme);
  if (options.height) container.style.height = options.height;

  var toolbarEl = null, sidebarEl = null, outlineEl = null;
  var editorEl, scrollEl, statusEl, statusWords, statusLines, statusSaved;

  if (options.toolbar) {
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'mde-toolbar';
    container.appendChild(toolbarEl);
  }

  var bodyEl = document.createElement('div');
  bodyEl.className = 'mde-body';
  container.appendChild(bodyEl);

  if (options.outline) {
    sidebarEl = document.createElement('aside');
    sidebarEl.className = 'mde-sidebar';
    sidebarEl.innerHTML = '<div class="mde-side-head">' + t('outline') + '</div><div class="mde-outline"></div>';
    bodyEl.appendChild(sidebarEl);
    outlineEl = sidebarEl.querySelector('.mde-outline');
  }

  scrollEl = document.createElement('div');
  scrollEl.className = 'mde-scroll';
  editorEl = document.createElement('div');
  editorEl.className = 'mde-editor';
  editorEl.contentEditable = 'true';
  editorEl.spellcheck = false;
  scrollEl.appendChild(editorEl);
  bodyEl.appendChild(scrollEl);

  if (options.statusbar) {
    statusEl = document.createElement('div');
    statusEl.className = 'mde-statusbar';
    statusEl.innerHTML = '<span data-words>0 字</span><span data-lines>0 行</span><span class="spacer"></span><span data-saved><span class="mde-dot"></span>' + t('ready') + '</span>';
    container.appendChild(statusEl);
    statusWords = statusEl.querySelector('[data-words]');
    statusLines = statusEl.querySelector('[data-lines]');
    statusSaved = statusEl.querySelector('[data-saved]');
  }

  var toastEl = document.createElement('div');
  toastEl.className = 'mde-toast';
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1600);
  }

  /* ---- 光标工具 ---- */
  function getCursorOffset(el) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    var r = sel.getRangeAt(0);
    if (!el.contains(r.startContainer)) return null;
    var pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(r.startContainer, r.startOffset);
    return pre.toString().length;
  }
  function setCursorOffset(el, offset) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var remaining = offset, node;
    while ((node = walker.nextNode())) {
      var len = node.textContent.length;
      if (remaining <= len) {
        var r = document.createRange();
        r.setStart(node, remaining); r.collapse(true);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
        return;
      }
      remaining -= len;
    }
    var r2 = document.createRange();
    r2.selectNodeContents(el); r2.collapse(false);
    var sel2 = window.getSelection();
    sel2.removeAllRanges(); sel2.addRange(r2);
  }

  /* ---- 块构造 ---- */
  function createBlockEl(type, data) {
    data = data || {};
    var el;
    switch (type) {
      case 'heading':
        el = document.createElement('h' + data.level);
        el.dataset.type = 'heading'; el.dataset.level = data.level;
        el.innerHTML = data.text ? inlineToHtml(data.text) : '<br>';
        break;
      case 'quote':
        el = document.createElement('blockquote');
        el.dataset.type = 'quote';
        if (data.parts) {
          el.dataset.parts = '1';
          data.parts.forEach(function (pt) {
            if (pt.type === 'code') {
              el.appendChild(createBlockEl('code', pt));
            } else {
              var qd = document.createElement('div');
              qd.className = 'mde-quote-text';
              qd.innerHTML = pt.text ? inlineToHtml(pt.text) : '<br>';
              el.appendChild(qd);
            }
          });
        } else {
          el.innerHTML = data.text ? inlineToHtml(data.text) : '<br>';
        }
        break;
      case 'ul': case 'ol':
        el = document.createElement('div');
        el.className = 'mde-li';
        el.dataset.type = type;
        if (type === 'ol') el.dataset.num = data.num || 1;
        if (data.indent) { el.dataset.indent = data.indent; el.style.marginLeft = (data.indent * 28) + 'px'; }
        var bullet = document.createElement('span');
        bullet.className = 'mde-bullet';
        bullet.contentEditable = 'false';
        bullet.textContent = type === 'ul' ? '•' : el.dataset.num + '.';
        var content = document.createElement('span');
        content.className = 'mde-li-content';
        content.innerHTML = data.text ? inlineToHtml(data.text) : '<br>';
        el.appendChild(bullet); el.appendChild(content);
        break;
      case 'task':
        el = document.createElement('div');
        el.className = 'mde-li mde-task';
        el.dataset.type = 'task';
        if (data.indent) { el.dataset.indent = data.indent; el.style.marginLeft = (data.indent * 28) + 'px'; }
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = !!data.checked; cb.contentEditable = 'false';
        var c2 = document.createElement('span');
        c2.className = 'mde-li-content' + (data.checked ? ' mde-done' : '');
        c2.innerHTML = data.text ? inlineToHtml(data.text) : '<br>';
        el.appendChild(cb); el.appendChild(c2);
        break;
      case 'code':
        el = document.createElement('div');
        el.className = 'mde-codeblock';
        el.dataset.type = 'code';
        el.dataset.lang = data.lang || '';
        var head = document.createElement('div');
        head.className = 'mde-codehead';
        head.contentEditable = 'false';
        var langEl = document.createElement('span');
        langEl.className = 'mde-codelang';
        langEl.textContent = data.lang || 'text';
        var copyBtn = document.createElement('button');
        copyBtn.className = 'mde-copy'; copyBtn.type = 'button';
        copyBtn.innerHTML = icon('copy', 12) + '<span>' + t('copy') + '</span>';
        head.appendChild(langEl); head.appendChild(copyBtn);
        var pre = document.createElement('pre');
        var codeEl = document.createElement('code');
        codeEl.innerHTML = hl.highlight(data.text || '', data.lang || '');
        pre.appendChild(codeEl);
        el.appendChild(head); el.appendChild(pre);
        break;
      case 'hr':
        el = document.createElement('hr');
        el.dataset.type = 'hr';
        break;
      case 'table':
        el = document.createElement('table');
        el.dataset.type = 'table';
        var rows = data.rows || [['', ''], ['', '']];
        var thead = document.createElement('thead');
        var trh = document.createElement('tr');
        (rows[0] || []).forEach(function (c) {
          var th = document.createElement('th'); th.textContent = c; trh.appendChild(th);
        });
        thead.appendChild(trh); el.appendChild(thead);
        var tbody = document.createElement('tbody');
        rows.slice(1).forEach(function (row) {
          var tr = document.createElement('tr');
          row.forEach(function (c) { var td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });
          tbody.appendChild(tr);
        });
        el.appendChild(tbody);
        break;
      default:
        el = document.createElement('p');
        el.dataset.type = 'paragraph';
        el.innerHTML = data.text ? inlineToHtml(data.text) : '<br>';
    }
    return el;
  }

  function renderFromDoc(md) {
    editorEl.innerHTML = '';
    var blocks = parseMarkdown(md);
    if (!blocks.length) {
      editorEl.appendChild(createBlockEl('paragraph', { text: '' }));
    } else {
      blocks.forEach(function (b) { editorEl.appendChild(createBlockEl(b.type, b)); });
    }
    updateOutline();
    updateStatus();
  }

  /* ---- 序列化 ---- */
  function serialize() {
    var parts = [];
    var kids = editorEl.children;
    for (var i = 0; i < kids.length; i++) {
      var child = kids[i], type = child.dataset.type;
      if (type === 'heading') {
        var txt = nodeToMd(child).trim();
        if (txt) parts.push(new Array(+child.dataset.level + 1).join('#') + ' ' + txt);
      } else if (type === 'paragraph') {
        var p = nodeToMd(child);
        if (p && p.trim()) parts.push(p);
      } else if (type === 'quote') {
        if (child.dataset.parts) {
          var ql = [];
          Array.prototype.forEach.call(child.children, function (qc) {
            if (qc.classList.contains('mde-codeblock')) {
              var cc = qc.querySelector('code');
              ql.push('> ```' + (qc.dataset.lang || ''));
              (cc ? cc.textContent : '').split('\n').forEach(function (cl) { ql.push('> ' + cl); });
              ql.push('> ```');
            } else {
              nodeToMd(qc).split('\n').forEach(function (cl) { ql.push('> ' + cl); });
            }
          });
          parts.push(ql.join('\n'));
        } else {
          var q = nodeToMd(child);
          if (q && q.trim()) parts.push(q.split('\n').map(function (l) { return '> ' + l; }).join('\n'));
        }
      } else if (type === 'ul') {
        var ulc = child.querySelector('.mde-li-content');
        parts.push(indentPrefix(child) + '- ' + (ulc ? nodeToMd(ulc) : ''));
      } else if (type === 'ol') {
        var olc = child.querySelector('.mde-li-content');
        parts.push(indentPrefix(child) + (child.dataset.num || '1') + '. ' + (olc ? nodeToMd(olc) : ''));
      } else if (type === 'task') {
        var tc = child.querySelector('.mde-li-content');
        var tcb = child.querySelector('input[type=checkbox]');
        parts.push(indentPrefix(child) + '- [' + (tcb && tcb.checked ? 'x' : ' ') + '] ' + (tc ? nodeToMd(tc) : ''));
      } else if (type === 'code') {
        var ccode = child.querySelector('code');
        parts.push('```' + (child.dataset.lang || '') + '\n' + (ccode ? ccode.textContent : '') + '\n```');
      } else if (type === 'hr') {
        parts.push('---');
      } else if (type === 'table') {
        var rws = [];
        child.querySelectorAll('tr').forEach(function (tr) {
          var cells = [];
          tr.querySelectorAll('th,td').forEach(function (c) { cells.push(c.textContent.trim()); });
          rws.push('| ' + cells.join(' | ') + ' |');
        });
        if (rws.length >= 1) {
          var colCount = rws[0].split('|').length - 2;
          var sep = '| ' + new Array(colCount + 1).join('--- |');
          rws.splice(1, 0, sep);
        }
        parts.push(rws.join('\n'));
      }
    }
    return parts.join('\n\n');
  }

  /* ---- 大纲 / 状态 ---- */
  function updateOutline() {
    if (!outlineEl) return;
    var items = [];
    var kids = editorEl.children;
    for (var i = 0; i < kids.length; i++) {
      var child = kids[i];
      if (child.dataset.type === 'heading') {
        var level = +child.dataset.level || 1;
        var hclone = child.cloneNode(true);
        hclone.querySelectorAll('[data-mdx-skip]').forEach(function (n) { n.parentNode.removeChild(n); });
        var text = hclone.textContent.trim() || t('untitled');
        items.push('<div class="mde-outline-item" data-goto="' + i + '" style="padding-left:' + (8 + (level - 1) * 12) + 'px">' + escapeHtml(text) + '</div>');
      }
    }
    outlineEl.innerHTML = items.length ? items.join('') : '<div class="mde-outline-empty">' + t('outlineEmpty') + '</div>';
  }
  function updateStatus() {
    var cn = (doc.match(/[\u4e00-\u9fa5]/g) || []).length;
    var en = (doc.match(/[a-zA-Z0-9]+/g) || []).length;
    if (statusWords) statusWords.textContent = (cn + en) + ' ' + (currentLang === 'zh' ? '字' : 'words');
    if (statusLines) statusLines.textContent = doc.split('\n').length + ' ' + (currentLang === 'zh' ? '行' : 'lines');
  }
  function markSaved(ok) {
    if (!statusSaved) return;
    statusSaved.innerHTML = '<span class="mde-dot' + (ok ? '' : ' saving') + '"></span>' + (ok ? t('saved') : t('saving'));
  }

  /* ---- 当前块 ---- */
  function getCurrentBlock() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    var node = sel.getRangeAt(0).startContainer;
    while (node && node !== editorEl) {
      if (node.parentNode === editorEl) return node;
      node = node.parentNode;
    }
    return null;
  }
  function focusBlock(el) {
    var target = el.querySelector('.mde-li-content') || el.querySelector('code') || el;
    var r = document.createRange();
    r.selectNodeContents(target); r.collapse(true);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
  }

  /* ---- 行内自动转换 ---- */
  function tryInlineConvert() {
    var sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return false;
    var range = sel.getRangeAt(0);
    var node = range.startContainer;
    if (node.nodeType !== 3) return false;
    var offset = range.startOffset;
    var before = node.textContent.slice(0, offset);
    var patterns = [
      { re: /\*\*([^*\n]+)\*\*$/, tag: 'strong', content: 1 },
      { re: /__([^_\n]+)__$/, tag: 'strong', content: 1 },
      { re: /~~([^~\n]+)~~$/, tag: 'del', content: 1 },
      { re: /`([^`\n]+)`$/, tag: 'code', content: 1 },
      { re: /\*([^\s*\n][^*\n]*[^\s*\n]|[^\s*\n])\*$/, tag: 'em', content: 1 }
    ];
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i], m = before.match(p.re);
      if (m) { applyInlineConvert(node, offset, m, p.tag); return true; }
    }
    var lm = before.match(/\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (lm) {
      var safe = sanitizeUrl(lm[2], false);
      if (safe) { applyInlineConvert(node, offset, lm, 'a', safe); return true; }
      return false;
    }
    return false;
  }
  function applyInlineConvert(node, offset, match, tag, href) {
    var full = match[0], start = offset - full.length, content = match[1];
    var text = node.textContent;
    var before = text.slice(0, start), after = text.slice(offset);
    var frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    var el = document.createElement(tag);
    if (tag === 'a') {
      el.setAttribute('href', href || '');
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
    el.textContent = content;
    frag.appendChild(el);
    var afterNode = document.createTextNode(after);
    frag.appendChild(afterNode);
    node.parentNode.replaceChild(frag, node);
    var r = document.createRange();
    r.setStart(afterNode, 0); r.collapse(true);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
  }

  /* ---- 块级自动转换 ---- */
  function tryBlockConvert() {
    var block = getCurrentBlock();
    if (!block) return false;
    var text = block.textContent;
    var offset = getCursorOffset(block);
    if (offset === null || offset !== text.length) return false;
    var patterns = [
      { re: /^(#{1,6})\s$/, type: 'heading' },
      { re: /^[-*+]\s\[([ xX])\]\s$/, type: 'task' },
      { re: /^[-*+]\s$/, type: 'ul' },
      { re: /^\d+\.\s$/, type: 'ol' },
      { re: /^>\s$/, type: 'quote' },
      { re: /^```$/, type: 'code' }
    ];
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i], m = text.match(p.re);
      if (m) { convertBlock(block, p.type, m); return true; }
    }
    return false;
  }
  function convertBlock(oldBlock, newType, m) {
    var el;
    if (newType === 'heading') el = createBlockEl('heading', { level: m[1].length, text: '' });
    else if (newType === 'ul') el = createBlockEl('ul', { text: '' });
    else if (newType === 'ol') el = createBlockEl('ol', { num: 1, text: '' });
    else if (newType === 'task') el = createBlockEl('task', { checked: /[xX]/.test(m[1]), text: '' });
    else if (newType === 'quote') el = createBlockEl('quote', { text: '' });
    else if (newType === 'code') el = createBlockEl('code', { lang: '', text: '' });
    else el = createBlockEl('paragraph', { text: '' });
    oldBlock.replaceWith(el);
    focusBlock(el);
  }

  /* ---- 代码块高亮（60ms 防抖） ---- */
  var rehighlightPending = {};
  function scheduleRehighlight(block) {
    var key = block.dataset.uid || (block.dataset.uid = uid());
    clearTimeout(rehighlightPending[key]);
    rehighlightPending[key] = setTimeout(function () {
      delete rehighlightPending[key];
      if (destroyed || !block.isConnected) return;
      var codeEl = block.querySelector('code');
      if (!codeEl) return;
      var offset = getCursorOffset(codeEl);
      if (offset === null) return;
      var text = codeEl.textContent;
      var lang = block.dataset.lang || '';
      codeEl.innerHTML = hl.highlight(text, lang);
      setCursorOffset(codeEl, offset);
    }, 60);
  }

  /* ---- 同步 ---- */
  var syncDoc = debounce(function () {
    doc = serialize();
    updateOutline();
    updateStatus();
    updateToolbarState();
    dirty = true;
    if (typeof options.onChange === 'function') options.onChange(doc);
    if (options.autoSave) scheduleSave();
  }, 120);

  var saveTimer;
  function scheduleSave() {
    markSaved(false);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { doSave(true); }, options.autoSaveDelay);
  }

  function doSave(silent) {
    if (destroyed) return Promise.resolve(null);
    doc = serialize();
    var payload = { title: getTitle(), content: doc };
    var promise;
    if (currentDocId) promise = storage.update(currentDocId, payload, currentVersion);
    else promise = storage.create(payload);
    return promise.then(function (saved) {
      currentDocId = saved.id;
      currentVersion = saved.version;
      dirty = false;
      markSaved(true);
      if (typeof options.onSave === 'function') options.onSave(saved);
      if (!silent) toast(t('saveSuccess'));
      return saved;
    }).catch(function (err) {
      if (typeof options.onError === 'function') options.onError(err);
      else toast(err.code === 'VERSION_CONFLICT' ? t('saveConflict') : (t('saveFailed') + err.message));
      throw err;
    });
  }

  function getTitle() {
    var kids = editorEl.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].dataset.type === 'heading' && +kids[i].dataset.level === 1) {
        var tx = kids[i].textContent.trim();
        if (tx) return tx.slice(0, 120);
      }
    }
    return t('untitled');
  }

  /* ---- 编辑事件 ---- */
  editorEl.addEventListener('input', function () {
    if (tryInlineConvert()) { syncDoc(); return; }
    if (tryBlockConvert()) { syncDoc(); return; }
    var block = getCurrentBlock();
    if (block && block.dataset.type === 'code') scheduleRehighlight(block);
    syncDoc();
  });

  editorEl.addEventListener('keydown', function (e) {
    var block = getCurrentBlock();
    if (!block) return;
    var li = (block.dataset.type === 'ul' || block.dataset.type === 'ol' || block.dataset.type === 'task') ? block : null;
    if (block.dataset.type === 'code' && e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
      return;
    }
    if (li && e.key === 'Tab' && !e.isComposing) {
      e.preventDefault();
      var ni = +(li.dataset.indent || 0) + (e.shiftKey ? -1 : 1);
      if (ni > 0) { li.dataset.indent = ni; li.style.marginLeft = (ni * 28) + 'px'; }
      else { delete li.dataset.indent; li.style.marginLeft = ''; }
      syncDoc();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      var type = block.dataset.type;
      if (type === 'ul' || type === 'ol' || type === 'task') {
        e.preventDefault();
        listEnter(block);
        return;
      }
      if (type === 'heading' || type === 'quote' || type === 'paragraph') {
        e.preventDefault();
        paragraphEnter(block);
        return;
      }
    }
    if (e.key === 'Backspace' && !e.isComposing) {
      var t2 = block.dataset.type;
      if (t2 === 'ul' || t2 === 'ol' || t2 === 'task') {
        var c = block.querySelector('.mde-li-content');
        if (c && c.textContent === '' && getCursorOffset(c) === 0) {
          e.preventDefault();
          var curIndent = +(block.dataset.indent || 0);
          if (curIndent > 0) {
            curIndent--;
            if (curIndent > 0) { block.dataset.indent = curIndent; block.style.marginLeft = (curIndent * 28) + 'px'; }
            else { delete block.dataset.indent; block.style.marginLeft = ''; }
            focusBlock(block);
          } else {
            var p = createBlockEl('paragraph', { text: '' });
            block.replaceWith(p);
            focusBlock(p);
          }
          syncDoc();
        }
      }
    }
  });

  /* ---- 粘贴：强制纯文本 ---- */
  editorEl.addEventListener('paste', function (e) {
    e.preventDefault();
    var text = '';
    var cd = e.clipboardData || window.clipboardData;
    if (cd) {
      text = cd.getData('text/plain') || '';
      if (!text) {
        var html = cd.getData('text/html');
        if (html) {
          try {
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            text = tmp.textContent || '';
          } catch (err) { text = ''; }
        }
      }
    }
    if (!text) return;
    document.execCommand('insertText', false, text);
    syncDoc();
  });

  /* ---- 拖放文本 ---- */
  editorEl.addEventListener('drop', function (e) {
    var dt = e.dataTransfer;
    if (!dt) return;
    if (dt.files && dt.files.length) return;
    var text = dt.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    syncDoc();
  });

  function listEnter(block) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    var content = block.querySelector('.mde-li-content');
    if (!content) return;
    var beforeRange = document.createRange();
    beforeRange.selectNodeContents(content);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    var beforeFrag = beforeRange.cloneContents();
    var afterRange = document.createRange();
    afterRange.selectNodeContents(content);
    afterRange.setStart(range.startContainer, range.startOffset);
    var afterFrag = afterRange.cloneContents();
    var beforeText = nodeToMd({ childNodes: toArray(beforeFrag.childNodes) });
    var afterText = nodeToMd({ childNodes: toArray(afterFrag.childNodes) });
    if (beforeText === '' && afterText === '') {
      var p = createBlockEl('paragraph', { text: '' });
      block.replaceWith(p);
      focusBlock(p);
      syncDoc();
      return;
    }
    content.innerHTML = beforeText ? inlineToHtml(beforeText) : '<br>';
    var type = block.dataset.type, nb;
    var indent = +(block.dataset.indent || 0);
    if (type === 'ul') nb = createBlockEl('ul', { text: afterText, indent: indent });
    else if (type === 'ol') nb = createBlockEl('ol', { num: (+block.dataset.num || 1) + 1, text: afterText, indent: indent });
    else nb = createBlockEl('task', { checked: false, text: afterText, indent: indent });
    block.after(nb);
    focusBlock(nb);
    syncDoc();
  }

  function paragraphEnter(block) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    var beforeRange = document.createRange();
    beforeRange.selectNodeContents(block);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    var beforeFrag = beforeRange.cloneContents();
    var afterRange = document.createRange();
    afterRange.selectNodeContents(block);
    afterRange.setStart(range.startContainer, range.startOffset);
    var afterFrag = afterRange.cloneContents();
    block.innerHTML = '';
    if (beforeFrag.childNodes.length === 0) block.appendChild(document.createElement('br'));
    else block.appendChild(beforeFrag);
    var p = createBlockEl('paragraph', { text: '' });
    p.innerHTML = '';
    if (afterFrag.childNodes.length === 0) p.appendChild(document.createElement('br'));
    else p.appendChild(afterFrag);
    block.after(p);
    focusBlock(p);
    syncDoc();
  }

  editorEl.addEventListener('change', function (e) {
    var cb = e.target.closest('input[type=checkbox]');
    if (!cb) return;
    var block = cb.closest('.mde-li');
    if (!block) return;
    var c = block.querySelector('.mde-li-content');
    if (c) c.classList.toggle('mde-done', cb.checked);
    syncDoc();
  });

  editorEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.mde-copy');
    if (btn) {
      e.preventDefault();
      var block = btn.closest('.mde-codeblock');
      var code = block && block.querySelector('code');
      if (code) {
        var done = function () {
          btn.classList.add('copied');
          var s = btn.querySelector('span');
          if (s) s.textContent = t('copied');
          setTimeout(function () {
            btn.classList.remove('copied');
            if (s) s.textContent = t('copy');
          }, 1500);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(code.textContent).then(done).catch(function () { toast(t('copyFailed')); });
        else {
          var ta = document.createElement('textarea');
          ta.value = code.textContent;
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (err) { toast(t('copyFailed')); }
          document.body.removeChild(ta);
        }
      }
    }
  });

  if (outlineEl) {
    outlineEl.addEventListener('click', function (e) {
      var item = e.target.closest('[data-goto]');
      if (!item) return;
      var target = editorEl.children[+item.dataset.goto];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.style.transition = 'background .4s';
        target.style.background = 'var(--mde-accent-bg)';
        setTimeout(function () { target.style.background = ''; }, 700);
      }
    });
  }

  /* ============================================================
   * 工具栏
   * ============================================================ */
  var TOOLBAR = [
    [{ a: 'undo', i: 'undo', k: 'tipUndo' }, { a: 'redo', i: 'redo', k: 'tipRedo' }],
    [
      { a: 'bold', i: 'bold', k: 'tipBold' },
      { a: 'italic', i: 'italic', k: 'tipItalic' },
      { a: 'strike', i: 'strike', k: 'tipStrike' },
      { a: 'inlinecode', i: 'code', k: 'tipInlineCode' }
    ],
    [
      { a: 'heading-menu', i: 'heading', k: 'tipHeading', dd: true },
      { a: 'ul', i: 'list', k: 'tipUl' },
      { a: 'ol', i: 'list-ordered', k: 'tipOl' },
      { a: 'task', i: 'task', k: 'tipTask' },
      { a: 'quote', i: 'quote', k: 'tipQuote' },
      { a: 'hr', i: 'minus', k: 'tipHr' }
    ],
    [
      { a: 'link', i: 'link', k: 'tipLink' },
      { a: 'image', i: 'image', k: 'tipImage' },
      { a: 'table', i: 'table', k: 'tipTable' },
      { a: 'codeblock', i: 'codeblock', k: 'tipCodeBlock' }
    ],
    [
      { a: 'toggle-outline', i: 'outline', k: 'tipOutline' },
      { a: 'toggle-theme', i: options.theme === 'dark' ? 'sun' : 'moon', k: 'tipTheme' },
      { a: 'save', i: 'save', k: 'tipSave' }
    ]
  ];

  function buildToolbar() {
    if (!toolbarEl) return;
    var html = '';
    TOOLBAR.forEach(function (group, gi) {
      if (gi > 0) html += '<div class="mde-tsep"></div>';
      html += '<div class="mde-tgroup">';
      group.forEach(function (b) {
        var title = t(b.k);
        if (b.dd) {
          html += '<div class="mde-dd"><button class="mde-btn" data-action="' + b.a + '" title="' + escapeHtml(title) + '">' + icon(b.i, 18) + '</button>' +
            '<div class="mde-dd-menu">' +
            [1, 2, 3, 4, 5, 6].map(function (n) { return '<button data-heading="' + n + '"><span class="mde-h' + n + '">' + t('headingMenu') + n + '</span></button>'; }).join('') +
            '<button data-heading="0"><span>' + t('bodyText') + '</span></button></div></div>';
        } else {
          html += '<button class="mde-btn" data-action="' + b.a + '" title="' + escapeHtml(title) + '">' + icon(b.i, 18) + '</button>';
        }
      });
      html += '</div>';
    });
    toolbarEl.innerHTML = html;
  }

  buildToolbar();

  var onDocClick = function (e) {
    if (!toolbarEl) return;
    if (!e.target.closest('.mde-dd')) {
      toolbarEl.querySelectorAll('.mde-dd.open').forEach(function (d) { d.classList.remove('open'); });
    }
  };

  if (toolbarEl) {
    toolbarEl.addEventListener('mousedown', function (e) {
      if (e.target.closest('.mde-btn')) e.preventDefault();
    });
    toolbarEl.addEventListener('click', function (e) {
      var ddBtn = e.target.closest('[data-action="heading-menu"]');
      if (ddBtn) {
        var dd = ddBtn.closest('.mde-dd');
        toolbarEl.querySelectorAll('.mde-dd.open').forEach(function (d) { if (d !== dd) d.classList.remove('open'); });
        dd.classList.toggle('open');
        e.stopPropagation();
        return;
      }
      var hBtn = e.target.closest('[data-heading]');
      if (hBtn) {
        toolbarEl.querySelectorAll('.mde-dd.open').forEach(function (d) { d.classList.remove('open'); });
        applyHeading(+hBtn.dataset.heading);
        return;
      }
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      toolbarEl.querySelectorAll('.mde-dd.open').forEach(function (d) { d.classList.remove('open'); });
      handleAction(btn.dataset.action);
    });
    document.addEventListener('click', onDocClick);
  }

  function handleAction(action) {
    switch (action) {
      case 'undo': editorEl.focus(); document.execCommand('undo'); syncDoc(); break;
      case 'redo': editorEl.focus(); document.execCommand('redo'); syncDoc(); break;
      case 'bold': editorEl.focus(); document.execCommand('bold'); syncDoc(); break;
      case 'italic': editorEl.focus(); document.execCommand('italic'); syncDoc(); break;
      case 'strike': editorEl.focus(); document.execCommand('strikeThrough'); syncDoc(); break;
      case 'inlinecode': inlineCode(); break;
      case 'ul': setBlockType('ul'); break;
      case 'ol': setBlockType('ol'); break;
      case 'task': setBlockType('task'); break;
      case 'quote': setBlockType('quote'); break;
      case 'hr': insertHr(); break;
      case 'link': insertLink(); break;
      case 'image': insertImage(); break;
      case 'table': insertTable(); break;
      case 'codeblock': setBlockType('code'); break;
      case 'toggle-outline': if (sidebarEl) sidebarEl.classList.toggle('collapsed'); break;
      case 'toggle-theme': toggleTheme(); break;
      case 'save': doSave(false); break;
    }
  }

  function inlineCode() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var text = sel.toString();
    if (!text) return;
    editorEl.focus();
    var code = document.createElement('code');
    code.textContent = text;
    var range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(code);
    range.setStartAfter(code);
    range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
    var nbsp = document.createTextNode('\u00A0');
    range.insertNode(nbsp);
    range.setStartAfter(nbsp);
    range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
    syncDoc();
  }
  function applyHeading(level) {
    var block = getCurrentBlock();
    if (!block) return;
    var text = nodeToMd(block).replace(/^#{1,6}\s/, '');
    var el = level > 0 ? createBlockEl('heading', { level: level, text: text }) : createBlockEl('paragraph', { text: text });
    block.replaceWith(el);
    focusBlock(el);
    setCursorOffset(el, el.textContent.length);
    syncDoc();
  }
  function setBlockType(type) {
    var block = getCurrentBlock();
    if (!block) return;
    var text = nodeToMd(block).replace(/^(#{1,6}\s|[-*+]\s+(\[[ xX]\]\s+)?|\d+\.\s+|>\s?)/, '');
    var el;
    if (type === 'ul') el = createBlockEl('ul', { text: text });
    else if (type === 'ol') el = createBlockEl('ol', { num: 1, text: text });
    else if (type === 'task') el = createBlockEl('task', { checked: false, text: text });
    else if (type === 'quote') el = createBlockEl('quote', { text: text });
    else if (type === 'code') el = createBlockEl('code', { lang: '', text: text });
    else el = createBlockEl('paragraph', { text: text });
    block.replaceWith(el);
    focusBlock(el);
    syncDoc();
  }
  function insertHr() {
    var block = getCurrentBlock();
    var hr = createBlockEl('hr', {});
    var p = createBlockEl('paragraph', { text: '' });
    if (block) { block.after(hr); hr.after(p); }
    else { editorEl.appendChild(hr); editorEl.appendChild(p); }
    focusBlock(p); syncDoc();
  }
  function insertLink() {
    var sel = window.getSelection();
    var text = (sel && sel.toString()) || '';
    var url = prompt(t('promptLinkUrl'), 'https://');
    if (!url) return;
    var safe = sanitizeUrl(url, false);
    if (!safe) { toast(t('unsafeLink')); return; }
    var label = text || prompt(t('promptLinkText'), t('promptLinkDefault')) || t('promptLinkDefault');
    editorEl.focus();
    var a = document.createElement('a');
    a.setAttribute('href', safe);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = label;
    var range = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (range) {
      range.deleteContents();
      range.insertNode(a);
      range.setStartAfter(a);
      range.collapse(true);
      sel.removeAllRanges(); sel.addRange(range);
    } else {
      editorEl.appendChild(a);
    }
    syncDoc();
  }
  function insertImage() {
    var url = prompt(t('promptImageUrl'), 'https://');
    if (!url) return;
    var safe = sanitizeUrl(url, true);
    if (!safe) { toast(t('unsafeImage')); return; }
    var alt = prompt(t('promptImageAlt'), '') || '';
    editorEl.focus();
    var img = document.createElement('img');
    img.setAttribute('src', safe);
    img.setAttribute('alt', alt);
    var p = document.createElement('p');
    p.appendChild(document.createElement('br'));
    var sel = window.getSelection();
    var range = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (range) {
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.insertNode(p);
      range.setStart(p, 0);
      range.collapse(true);
      sel.removeAllRanges(); sel.addRange(range);
    } else {
      editorEl.appendChild(img);
      editorEl.appendChild(p);
    }
    syncDoc();
  }
  function insertTable() {
    var data = { rows: [['列 1', '列 2', '列 3'], ['', '', ''], ['', '', '']] };
    var el = createBlockEl('table', data);
    var block = getCurrentBlock();
    if (block) block.after(el); else editorEl.appendChild(el);
    var p = createBlockEl('paragraph', { text: '' });
    el.after(p);
    focusBlock(p);
    syncDoc();
  }

  function updateToolbarState() {
    if (!toolbarEl) return;
    toolbarEl.querySelectorAll('.mde-btn').forEach(function (b) { b.classList.remove('active'); });
    var block = getCurrentBlock();
    if (!block) return;
    var map = { ul: 'ul', ol: 'ol', task: 'task', quote: 'quote', code: 'codeblock' };
    var a = map[block.dataset.type];
    if (a) {
      var btn = toolbarEl.querySelector('[data-action="' + a + '"]');
      if (btn) btn.classList.add('active');
    }
  }

  function toggleTheme() {
    var cur = container.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    container.setAttribute('data-theme', next);
    var btn = toolbarEl && toolbarEl.querySelector('[data-action="toggle-theme"]');
    if (btn) btn.innerHTML = icon(next === 'dark' ? 'sun' : 'moon', 18);
  }

  /* ---- 快捷键 ---- */
  function onKeydown(e) {
    if (destroyed) return;
    if (!editorEl.contains(e.target) && e.target !== editorEl) return;
    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); document.execCommand('bold'); syncDoc(); }
    else if (k === 'i') { e.preventDefault(); document.execCommand('italic'); syncDoc(); }
    else if (k === 'k') { e.preventDefault(); insertLink(); }
    else if (k === 's') { e.preventDefault(); doSave(false); }
    else if (k >= '1' && k <= '6') { e.preventDefault(); applyHeading(+k); }
    else if (k === '0') { e.preventDefault(); applyHeading(0); }
    else if (e.shiftKey && e.code === 'Digit7') { e.preventDefault(); setBlockType('ul'); }
    else if (e.shiftKey && e.code === 'Digit8') { e.preventDefault(); setBlockType('ol'); }
    else if (e.shiftKey && e.code === 'Digit9') { e.preventDefault(); setBlockType('task'); }
  }
  document.addEventListener('keydown', onKeydown);

  /* ---- 初始化 ---- */
  var initPromise;
  if (options.docId) {
    initPromise = storage.get(options.docId).then(function (d) {
      if (d) {
        doc = d.content || '';
        currentVersion = d.version || 0;
        renderFromDoc(doc);
      } else {
        renderFromDoc('');
      }
    }).catch(function (err) {
      if (typeof options.onError === 'function') options.onError(err);
      renderFromDoc('');
    });
  } else {
    renderFromDoc('');
    initPromise = Promise.resolve();
  }

  markSaved(true);

  /* ---- 公共 API ---- */
  var api = {
    version: VERSION,
    getMarkdown: function () { doc = serialize(); return doc; },
    setMarkdown: function (md) { doc = md || ''; renderFromDoc(doc); dirty = true; },
    getTitle: getTitle,
    getDocId: function () { return currentDocId; },
    getVersion: function () { return currentVersion; },
    isDirty: function () { return dirty; },
    save: function () { return doSave(false); },
    newDoc: function () {
      currentDocId = null;
      currentVersion = 0;
      doc = '';
      dirty = false;
      renderFromDoc('');
      markSaved(true);
      return api;
    },
    load: function (id) {
      return storage.get(id).then(function (d) {
        if (!d) throw new Error('NOT_FOUND');
        currentDocId = d.id;
        currentVersion = d.version;
        doc = d.content || '';
        renderFromDoc(doc);
        return d;
      });
    },
    list: function () { return storage.list(); },
    remove: function (id) { return storage.remove(id); },
    storage: storage,
    container: container,
    editorEl: editorEl,
    focus: function () { editorEl.focus(); },
    setTheme: function (theme) {
      container.setAttribute('data-theme', theme);
      var btn = toolbarEl && toolbarEl.querySelector('[data-action="toggle-theme"]');
      if (btn) btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', 18);
    },
    setLang: function (lang) { setLang(lang); },
    destroy: function () {
      destroyed = true;
      clearTimeout(saveTimer);
      document.removeEventListener('keydown', onKeydown);
      if (toolbarEl) document.removeEventListener('click', onDocClick);
      Object.keys(rehighlightPending).forEach(function (k) {
        clearTimeout(rehighlightPending[k]);
      });
      rehighlightPending = {};
      if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      container.innerHTML = '';
      container.classList.remove('mde-root');
    }
  };

  if (options.autofocus) {
    setTimeout(function () {
      var first = editorEl.firstElementChild;
      if (first) focusBlock(first);
    }, 0);
  }

  if (typeof options.onReady === 'function') {
    initPromise.then(function () { options.onReady(api); });
  }

  return api;
}

/* ============================================================
 * 导出
 * ============================================================ */
return {
  create: createEditor,
  createEditor: createEditor,
  adapters: {
    LocalStorage: LocalStorageAdapter,
    Memory: MemoryAdapter,
    REST: RESTAdapter
  },
  Highlighter: Highlighter,
  sanitizeUrl: sanitizeUrl,
  setLang: setLang,
  version: VERSION
};

});