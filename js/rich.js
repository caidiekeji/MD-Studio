/* ============================================================
 * MD Editor — 数学公式（KaTeX）与 Mermaid 图表增强
 *
 * 设计：
 *  - 懒加载：检测到公式/图表才从 CDN 加载库，不进主包
 *  - 序列化安全：渲染视图带 data-mdx-skip（nodeToMd 跳过），
 *    原始 LaTeX 始终保留在隐藏源码 span 中，Markdown 往返无损
 *  - 交互：点击渲染结果 → 还原为源码文本编辑；失焦/停止输入 → 重新渲染
 *  - Mermaid：```mermaid 代码块下方追加渲染视图，源码可继续编辑
 *  - 无网络时优雅降级：显示等宽源码文本
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MDERich = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm';

  function attach(editor, opts) {
    opts = opts || {};
    var editorEl = editor.editorEl;
    var container = editor.container;
    var cdn = opts.cdn || DEFAULT_CDN;
    var enableMath = opts.math !== false;
    var enableMermaid = opts.mermaid !== false;

    var katexState = 'none';        // none | loading | ready | failed
    var katexQueue = [];
    var mermaidState = 'none';
    var mermaidLib = null;
    var mermaidQueue = [];
    var mermaidSeq = 0;

    /* ---- 资源加载 ---- */
    function loadKatex(done) {
      if (opts.katexLoader) { opts.katexLoader(done); return; }        // 测试注入
      if (typeof window !== 'undefined' && window.__MDE_NO_CDN__) {    // 测试/离线模式
        katexState = 'failed'; done(false); return;
      }
      if (katexState === 'ready') { done(true); return; }
      if (katexState === 'failed') { done(false); return; }
      katexQueue.push(done);
      if (katexState === 'loading') return;
      katexState = 'loading';
      var doc = document;
      if (!doc.querySelector('link[data-mdx-katex]')) {
        var link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = cdn + '/katex@0.16.11/dist/katex.min.css';
        link.setAttribute('data-mdx-katex', '1');
        doc.head.appendChild(link);
      }
      var s = doc.createElement('script');
      s.src = cdn + '/katex@0.16.11/dist/katex.min.js';
      s.onload = function () {
        katexState = typeof window.katex !== 'undefined' ? 'ready' : 'failed';
        katexQueue.splice(0).forEach(function (cb) { cb(katexState === 'ready'); });
      };
      s.onerror = function () {
        katexState = 'failed';
        katexQueue.splice(0).forEach(function (cb) { cb(false); });
      };
      doc.head.appendChild(s);
    }
    function loadMermaid(done) {
      if (opts.mermaidLoader) { opts.mermaidLoader(done); return; }    // 测试注入
      if (typeof window !== 'undefined' && window.__MDE_NO_CDN__) {    // 测试/离线模式
        mermaidState = 'failed'; done(null); return;
      }
      if (mermaidState === 'ready') { done(mermaidLib); return; }
      if (mermaidState === 'failed') { done(null); return; }
      mermaidQueue.push(done);
      if (mermaidState === 'loading') return;
      mermaidState = 'loading';
      var theme = container.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
      import(cdn + '/mermaid@10.9.1/dist/mermaid.esm.min.mjs')
        .then(function (mod) {
          mermaidLib = mod.default || mod;
          try { mermaidLib.initialize({ startOnLoad: false, theme: theme, securityLevel: 'strict' }); } catch (err) {}
          mermaidState = 'ready';
          mermaidQueue.splice(0).forEach(function (cb) { cb(mermaidLib); });
        })
        .catch(function () {
          mermaidState = 'failed';
          mermaidQueue.splice(0).forEach(function (cb) { cb(null); });
        });
    }

    /* ---- 数学渲染 ---- */
    function renderMathView(viewEl, tex, displayMode) {
      viewEl.textContent = tex;   // 兜底：先显示源码
      loadKatex(function (ok) {
        if (!ok || !viewEl.isConnected) return;
        try {
          viewEl.innerHTML = '';
          window.katex.render(tex, viewEl, { displayMode: displayMode, throwOnError: false });
          viewEl.classList.remove('mde-math-fallback');
        } catch (err) { viewEl.textContent = tex; viewEl.classList.add('mde-math-fallback'); }
      });
    }

    /* 段落 → 块级公式 $$...$$（整块） */
    function enhanceBlockMath(el, caretNode) {
      if (el.dataset.mdxMath === '1') return;
      if (caretNode && el.contains(caretNode)) return;   // 正在编辑的块暂不渲染
      var raw = el.textContent;
      var m = raw.match(/^\s*\$\$([\s\S]+)\$\$\s*$/);
      if (!m || el.querySelector('code')) return;
      var tex = m[1].trim();
      el.dataset.mdxMath = '1';
      var wrap = document.createElement('span');
      wrap.className = 'mde-math';
      wrap.setAttribute('data-mdx-math', '1');
      wrap.setAttribute('contenteditable', 'false');
      var src = document.createElement('span');
      src.className = 'mde-math-src';
      src.textContent = m[0].replace(/^\n|\n$/g, '');
      var view = document.createElement('span');
      view.className = 'mde-math-view mde-math-block';
      view.setAttribute('data-mdx-skip', '1');
      wrap.appendChild(src);
      wrap.appendChild(view);
      el.innerHTML = '';
      el.appendChild(wrap);
      renderMathView(view, tex, true);
    }

    /* 文本节点中的行内公式 $...$ */
    var INLINE_MATH_RE = /\$([^$\n]+)\$/;
    function enhanceInlineMath(rootEl, caretNode) {
      if (!enableMath) return;
      var walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode;
          while (p && p !== rootEl) {
            if (p.nodeType === 1) {
              var tag = p.tagName.toLowerCase();
              if (tag === 'code' || p.hasAttribute('data-mdx-skip') || p.hasAttribute('data-mdx-math')) {
                return NodeFilter.FILTER_REJECT;
              }
            }
            p = p.parentNode;
          }
          return n.textContent.indexOf('$') >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });
      var hits = [], n;
      while ((n = walker.nextNode())) hits.push(n);
      hits.forEach(function (node) {
        if (node === caretNode) return;   // 光标所在文本节点暂不渲染（Typora 式离开后渲染）
        var text = node.textContent;
        var m = text.match(INLINE_MATH_RE);
        if (!m) return;
        var tex = m[1].trim();
        var span = document.createElement('span');
        span.className = 'mde-math';
        span.setAttribute('data-mdx-math', '1');
        span.setAttribute('contenteditable', 'false');
        var src = document.createElement('span');
        src.className = 'mde-math-src';
        src.textContent = m[0];
        var view = document.createElement('span');
        view.className = 'mde-math-view';
        view.setAttribute('data-mdx-skip', '1');
        span.appendChild(src);
        span.appendChild(view);
        renderMathView(view, tex, false);
        /* 拆分原文本节点：before + math span + after */
        var idxStart = text.indexOf(m[0]);
        var after = text.slice(idxStart + m[0].length);
        var parent = node.parentNode;
        if (after) node.textContent = after; else parent.removeChild(node);
        parent.insertBefore(span, node);
        if (idxStart > 0) parent.insertBefore(document.createTextNode(text.slice(0, idxStart)), span);
      });
    }

    /* ---- Mermaid ---- */
    function enhanceMermaid() {
      if (!enableMermaid) return;
      var blocks = editorEl.querySelectorAll('.mde-codeblock[data-lang="mermaid"]');
      Array.prototype.forEach.call(blocks, function (block) {
        var code = block.querySelector('code');
        if (!code) return;
        var src = code.textContent;
        var view = block.querySelector('.mde-mermaid-view');
        if (!view) {
          view = document.createElement('div');
          view.className = 'mde-mermaid-view';
          view.setAttribute('data-mdx-skip', '1');
          view.setAttribute('contenteditable', 'false');
          block.appendChild(view);
        }
        if (view.dataset.src === src && view.dataset.state === 'done') return;
        view.dataset.src = src;
        view.dataset.state = 'pending';
        view.textContent = '';
        view.classList.add('mde-rendering');
        loadMermaid(function (lib) {
          if (!view.isConnected) return;
          if (!lib) {
            view.classList.remove('mde-rendering');
            view.dataset.state = 'fallback';
            view.textContent = src;   // 降级：显示源码
            return;
          }
          var id = 'mde-mmd-' + (++mermaidSeq);
          try {
            lib.render(id, src).then(function (res) {
              if (!view.isConnected) return;
              view.classList.remove('mde-rendering');
              view.dataset.state = 'done';
              view.innerHTML = res.svg;
            }).catch(function () {
              view.classList.remove('mde-rendering');
              view.dataset.state = 'error';
              view.textContent = src;
            });
          } catch (err) {
            view.classList.remove('mde-rendering');
            view.dataset.state = 'error';
            view.textContent = src;
          }
        });
      });
    }

    /* ---- 增强入口 ---- */
    function blockOf(node) {
      var n = node;
      while (n && n.parentNode && n.parentNode !== editorEl) n = n.parentNode;
      return (n && n.parentNode === editorEl) ? n : null;
    }
    function enhance() {
      var sel = null;
      try { sel = window.getSelection(); } catch (err) {}
      var caretNode = (sel && sel.rangeCount) ? sel.getRangeAt(0).startContainer : null;
      /* 光标所在块整体跳过渲染（Typora 式：离开后渲染，避免编辑中被抢光标） */
      var caretBlock = (caretNode && editorEl.contains(caretNode)) ? blockOf(caretNode) : null;
      /* 1. 行内/块级公式（跳过代码块内部） */
      if (enableMath) {
        var kids = editorEl.children;
        for (var i = 0; i < kids.length; i++) {
          var el = kids[i];
          if (el === caretBlock) continue;
          var t = el.dataset ? el.dataset.type : '';
          if (t === 'code' || t === 'table' || t === 'hr') continue;
          enhanceInlineMath(el, caretNode);
          if (t === 'paragraph') enhanceBlockMath(el, caretNode);
        }
      }
      /* 2. Mermaid */
      enhanceMermaid();
    }
    var enhanceTimer = null;
    function scheduleEnhance() {
      clearTimeout(enhanceTimer);
      enhanceTimer = setTimeout(enhance, 350);
    }

    /* ---- 点击渲染结果 → 还源码编辑 ---- */
    function restoreMath(mathEl) {
      var src = mathEl.querySelector('.mde-math-src');
      if (!src) return;
      var raw = src.textContent;
      var parent = mathEl.parentNode;
      var textNode = document.createTextNode(raw);
      parent.replaceChild(textNode, mathEl);
      /* 清理块级标记，允许离开后重新渲染 */
      if (parent.dataset && parent.dataset.mdxMath) delete parent.dataset.mdxMath;
      editorEl.focus();
      try {
        var r = document.createRange();
        r.setStart(textNode, raw.length); r.collapse(true);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
      } catch (err) {}
      scheduleEnhance();
    }

    editorEl.addEventListener('click', function (e) {
      var mathEl = e.target.closest ? e.target.closest('.mde-math') : null;
      if (mathEl) { e.preventDefault(); restoreMath(mathEl); return; }
      var mmView = e.target.closest ? e.target.closest('.mde-mermaid-view') : null;
      if (mmView) {
        var code = mmView.parentNode.querySelector('pre code');
        if (code) {
          editorEl.focus();
          try {
            var r2 = document.createRange();
            r2.selectNodeContents(code); r2.collapse(true);
            var sel2 = window.getSelection();
            sel2.removeAllRanges(); sel2.addRange(r2);
          } catch (err) {}
        }
      }
    });

    /* 编辑后重新增强 */
    editorEl.addEventListener('input', scheduleEnhance);
    /* undo 还原后内容可能带旧渲染态，无需处理（快照含渲染结果）；
       但 setMarkdown/load 换文档必须重扫 */
    if (typeof editor.setMarkdown === 'function') {
      var origSet = editor.setMarkdown;
      editor.setMarkdown = function () {
        var r = origSet.apply(editor, arguments);
        scheduleEnhance();
        return r;
      };
    }

    /* 主题切换 → Mermaid 重渲染（KaTeX 跟随 CSS 变量无需处理） */
    var MO = typeof MutationObserver !== 'undefined' ? MutationObserver
      : (typeof window !== 'undefined' ? window.MutationObserver : null);
    var themeObs = MO ? new MO(function () {
      if (mermaidState !== 'ready') return;
      var theme = container.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
      try { mermaidLib.initialize({ startOnLoad: false, theme: theme, securityLevel: 'strict' }); } catch (err) {}
      editorEl.querySelectorAll('.mde-mermaid-view').forEach(function (v) { v.dataset.state = ''; });
      enhance();
    }) : null;
    if (themeObs) themeObs.observe(container, { attributes: true, attributeFilter: ['data-theme'] });

    enhance();

    return {
      enhance: enhance,
      /* 测试注入口：跳过 CDN，直接指定渲染器 */
      _setKatexReady: function () { katexState = 'ready'; },
      _stats: function () {
        return {
          math: editorEl.querySelectorAll('.mde-math').length,
          blockMath: editorEl.querySelectorAll('.mde-math-block').length,
          mermaid: editorEl.querySelectorAll('.mde-mermaid-view').length
        };
      },
      destroy: function () {
        clearTimeout(enhanceTimer);
        if (themeObs) themeObs.disconnect();
      }
    };
  }

  return { attach: attach };
});
