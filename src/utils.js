// ==================== 工具函数 ====================

// 元素是否真实可见（尺寸非零 + 未被隐藏）
function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
}

// 常用 DOM 小工具
function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function qtext(el) { return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim(); }        // 压缩空白
function qtextAll(el) { return ((el && el.textContent) || '').replace(/\s+/g, ''); }             // 去全部空白（精确比对用）

// 静音所有视频（仅当 muteEnabled 开启）
function muteAll() {
    document.querySelectorAll('video').forEach(v => { if (muteEnabled && !v.muted) v.muted = true; });
}
