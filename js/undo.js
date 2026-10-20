/* ============================================================
 * MD Editor — 自建撤销/重做栈（替换 execCommand 撤销依赖）
 *
 * 模型：快照栈（html + 光标绝对偏移 + 块签名）
 *  - 输入：同块连续打字合并为一个快照点（700ms 合并窗口）
 *  - 结构变更：块签名（子元素序列）变化时立即入栈
 *  - Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y、工具栏撤销重做按钮均接管
 *  - setMarkdown / newDoc / load 后自动重建基线
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MDEUndo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function attach(editor, opts) {
    opts = opts || {};
    var editorEl = editor.editorEl;
    var maxLen = opts.maxLen || 200;
    var mergeWindow = opts.mergeWindow || 700;
    var typingDelay = opts.typingDelay || 400;

    var states = [];          // { html, caret, sig, typing }
    var idx = -1;
    var applying = false;     // apply 期间抑制 input 记录
    var typingTimer = null;
    var lastCommitTime = 0;

    /* ---- 快照 ---- */
    function signature() {
      var s = [];
      for (var i = 0; i < editorEl.children.length; i++) {
        var c = editorEl.children[i];
        var ds = c.dataset || {};
        s.push(c.tagName + ':' + (ds.type || '') + ':' + (ds.lang || '') + ':' + (ds.indent || ''));
      }
      return s.join('|');
    }
    function getCaret() {
      try {
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return null;
        var r = sel.getRangeAt(0);
        if (!editorEl.contains(r.startContainer)) return null;
        var pre = document.createRange();
        pre.selectNodeContents(editorEl);
        pre.setEnd(r.startContainer, r.startOffset);
        return pre.toString().length;
      } catch (err) { return null; }
    }
    function setCaret(offset) {
      if (offset == null) return;
      try {
        var walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
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
      } catch (err) { /* 光标还原失败可忽略 */ }
    }
    function snapshot(typing) {
      return { html: editorEl.innerHTML, caret: getCaret(), sig: signature(), typing: !!typing };
    }

    /* ---- 入栈 ---- */
    function commit(typing) {
      if (applying) return;
      clearTimeout(typingTimer); typingTimer = null;
      var snap = snapshot(typing);
      var cur = states[idx];
      if (cur && cur.html === snap.html) { lastCommitTime = typing ? lastCommitTime : Date.now(); return; }
      var now = Date.now();
      if (typing && cur && cur.typing && (now - lastCommitTime) < mergeWindow) {
        states[idx] = snap; lastCommitTime = now; return;
      }
      states = states.slice(0, idx + 1);
      states.push(snap);
      if (states.length > maxLen) states.shift();
      idx = states.length - 1;
      lastCommitTime = now;
    }
    function scheduleTyping() {
      if (applying) return;
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function () { commit(true); }, typingDelay);
    }

    /* ---- 跳转 ---- */
    function apply(snap) {
      applying = true;
      editorEl.innerHTML = snap.html;
      setCaret(snap.caret);
      /* 让核心库重新同步大纲/状态/dirty */
      try {
        var Evt = (typeof window !== 'undefined' && window.Event) ? window.Event : Event;
        editorEl.dispatchEvent(new Evt('input', { bubbles: true }));
      } catch (err) {}
      applying = false;
      lastCommitTime = 0;   // 撤销后下一次打字开启新快照点
    }
    function flushTyping() { if (typingTimer) commit(true); }
    function undo() {
      flushTyping();
      if (idx <= 0) return false;
      idx--; apply(states[idx]);
      return true;
    }
    function redo() {
      flushTyping();
      if (idx >= states.length - 1) return false;
      idx++; apply(states[idx]);
      return true;
    }
    function reset() {
      clearTimeout(typingTimer); typingTimer = null;
      states = []; idx = -1; lastCommitTime = 0;
      commit(false);
    }
    function canUndo() { return idx > 0; }
    function canRedo() { return idx < states.length - 1; }

    /* ---- 事件接管 ---- */
    function onKeydown(e) {
      var mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      var k = (e.key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (undo() && typeof opts.onRestore === 'function') opts.onRestore('undo');
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (redo() && typeof opts.onRestore === 'function') opts.onRestore('redo');
      }
    }
    function onClickCapture(e) {
      var btn = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!btn) return;
      var a = btn.dataset.action;
      if (a === 'undo' || a === 'redo') {
        e.preventDefault(); e.stopPropagation();
        var ok = a === 'undo' ? undo() : redo();
        if (ok && typeof opts.onRestore === 'function') opts.onRestore(a);
      }
    }
    function onInput() {
      if (applying) return;
      var sig = signature();
      var cur = states[idx];
      if (!cur || sig !== cur.sig) commit(false);   // 结构变更：立即入栈
      else scheduleTyping();                         // 同块打字：防抖合并
    }

    editorEl.addEventListener('input', onInput);
    editorEl.addEventListener('keydown', onKeydown, true);
    editor.container.addEventListener('click', onClickCapture, true);

    /* 程序化换文档后重建基线 */
    ['setMarkdown', 'newDoc', 'load'].forEach(function (m) {
      if (typeof editor[m] !== 'function') return;
      var orig = editor[m];
      editor[m] = function () {
        var r = orig.apply(editor, arguments);
        if (r && typeof r.then === 'function') {
          r.then(function () { reset(); }, function () { reset(); });
        } else {
          reset();
        }
        return r;
      };
    });

    reset();

    return {
      undo: undo,
      redo: redo,
      commit: function () { commit(false); },
      reset: reset,
      canUndo: canUndo,
      canRedo: canRedo,
      depth: function () { return states.length; },
      destroy: function () {
        clearTimeout(typingTimer);
        editorEl.removeEventListener('input', onInput);
        editorEl.removeEventListener('keydown', onKeydown, true);
        editor.container.removeEventListener('click', onClickCapture, true);
      }
    };
  }

  return { attach: attach };
});
