// ==================== 悬浮控制面板 UI ====================

const PANEL_CSS = `
#xa-panel{position:fixed;top:16px;left:16px;width:300px;background:#fff;border-radius:14px;
  box-shadow:0 10px 32px rgba(0,0,0,.14),0 2px 8px rgba(0,0,0,.06);z-index:99999;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;transition:opacity .25s,transform .25s;}
#xa-panel.xa-hidden{opacity:0;transform:scale(.85);pointer-events:none;}
.xa-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;
  background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;font-size:15px;font-weight:700;letter-spacing:.5px;cursor:move;user-select:none;}
.xa-min-btn{width:22px;height:22px;border-radius:6px;border:none;background:rgba(255,255,255,.2);
  color:#fff;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;}
.xa-min-btn:hover{background:rgba(255,255,255,.35);}
.xa-tabs{display:flex;background:#f9fafb;border-bottom:1px solid #e5e7eb;}
.xa-tab{flex:1;padding:9px 4px;font-size:12px;font-weight:600;color:#6b7280;text-align:center;cursor:pointer;transition:all .15s;border-bottom:2px solid transparent;}
.xa-tab:hover{color:#f97316;}
.xa-tab.active{color:#ea580c;border-bottom-color:#ea580c;background:#fff;}
.xa-body{padding:14px;display:flex;flex-direction:column;gap:10px;max-height:640px;overflow-y:auto;}
.xa-tab-pane{display:none;flex-direction:column;gap:10px;}
.xa-tab-pane.active{display:flex;}
.xa-status{font-size:12px;color:#6b7280;text-align:center;padding:6px 8px;border-radius:6px;background:#f3f4f6;transition:color .2s,background .2s;}
.xa-status.running{color:#059669;background:#d1fae5;}
.xa-status.paused{color:#d97706;background:#fef3c7;}
.xa-progress{font-size:11px;color:#c2410c;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;
  padding:6px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.xa-mute{width:100%;padding:9px 0;border:none;border-radius:10px;font-size:13px;font-weight:600;
  cursor:pointer;transition:all .2s;letter-spacing:.3px;color:#374151;background:#f3f4f6;}
.xa-mute:hover{background:#e5e7eb;}
.xa-mute.muted{background:#fee2e2;color:#dc2626;}
.xa-input{width:100%;padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;
  font-family:inherit;outline:none;transition:border-color .2s;box-sizing:border-box;}
.xa-input:focus{border-color:#f97316;box-shadow:0 0 0 2px rgba(249,115,22,.12);}
.xa-row{display:flex;align-items:center;gap:8px;}
.xa-switch{position:relative;width:42px;height:22px;border-radius:11px;background:#d1d5db;cursor:pointer;transition:background .2s;flex-shrink:0;}
.xa-switch.on{background:linear-gradient(135deg,#10b981,#059669);}
.xa-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s;}
.xa-switch.on::after{transform:translateX(20px);}
.xa-ai-log{background:#0f172a;color:#e2e8f0;border-radius:8px;padding:10px;font-size:11px;
  font-family:'SF Mono','Menlo','Consolas',monospace;height:240px;min-height:140px;max-height:480px;
  resize:vertical;overflow-y:auto;line-height:1.5;}
.xa-ai-log::-webkit-scrollbar{width:4px;}
.xa-ai-log::-webkit-scrollbar-thumb{background:#475569;border-radius:2px;}
#xa-mini{position:fixed;top:16px;left:16px;width:44px;height:44px;border-radius:50%;
  background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;font-size:18px;font-weight:700;
  display:none;align-items:center;justify-content:center;cursor:move;z-index:99999;
  box-shadow:0 4px 16px rgba(249,115,22,.35);transition:transform .2s;user-select:none;}
#xa-mini:hover{transform:scale(1.1);}
#xa-mini.show{display:flex;}
.xa-loghead{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#6b7280;font-weight:700;}
.xa-loghead button{border:none;background:#f3f4f6;color:#6b7280;font-size:11px;border-radius:6px;padding:3px 10px;cursor:pointer;transition:background .2s;}
.xa-loghead button:hover{background:#e5e7eb;color:#374151;}
.xa-about{font-size:12px;color:#374151;line-height:1.8;max-height:350px;overflow-y:auto;
  padding-right:4px;word-break:break-word;}
.xa-about h4{font-size:14px;color:#c2410c;margin:0 0 6px;}
.xa-about p{margin:0 0 8px;}
`;

let panel = null;
let mini = null;
let statusEl = null;

function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'xa-status' + (cls ? ' ' + cls : '');
}

// 面板/迷你球位置持久化（按元素 id 分别记录）
function restorePos(el) {
    try {
        const all = JSON.parse(GM_getValue(SK.panelPos, '{}'));
        const p = all && all[el.id];
        if (p && typeof p.l === 'number') { el.style.left = p.l + 'px'; el.style.top = p.t + 'px'; }
    } catch (e) {}
}
function savePos(el) {
    try {
        const all = JSON.parse(GM_getValue(SK.panelPos, '{}'));
        all[el.id] = { l: parseInt(el.style.left) || 0, t: parseInt(el.style.top) || 0 };
        GM_setValue(SK.panelPos, JSON.stringify(all));
    } catch (e) {}
}

function buildPanel() {
    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    document.head.appendChild(style);

    panel = document.createElement('div');
    panel.id = 'xa-panel';
    panel.innerHTML = `
<div class="xa-header"><span>超星网课辅助 <span id="xa-ver" style="opacity:.85;font-size:11px;font-weight:500;"></span></span><button class="xa-min-btn" title="最小化">−</button></div>
<div class="xa-tabs">
  <div class="xa-tab active" data-tab="cfg">⚙ 挂机</div>
  <div class="xa-tab" data-tab="about">ℹ 关于</div>
</div>
<div class="xa-body">
  <!-- Tab 1: 挂机配置 -->
  <div class="xa-tab-pane active" data-pane="cfg">
    <div class="xa-status" id="xa-status">状态：就绪</div>
    <div class="xa-progress" id="xa-progress">待机中</div>
    <div class="xa-row" style="justify-content:space-between;">
      <span style="font-size:12px;color:#374151;font-weight:600;">全自动刷课</span>
      <div class="xa-switch" id="xa-autoplay-switch" title="开启自动刷课"></div>
    </div>
    <button class="xa-mute">🔇 关闭静音</button>
    <select class="xa-input" id="xa-cx-speed" title="视频倍速（默认 1x，改速度有风控风险请自行斟酌）">
      <option value="1">视频倍速：1x（默认，最稳）</option>
      <option value="1.25">视频倍速：1.25x</option>
      <option value="1.5">视频倍速：1.5x</option>
      <option value="2">视频倍速：2x（平台上限，自行斟酌）</option>
    </select>
  </div>
  <!-- Tab 2: 关于 -->
  <div class="xa-tab-pane" data-pane="about">
    <div class="xa-about">
      <h4>👋 关于本脚本</h4>
      <p>本脚本以 <strong>MIT 协议</strong>开源发布，源码与构建流程完全公开，详见仓库 LICENSE 与 README。</p>
      <h4>1. 脚本能做什么</h4>
      <p>自动刷视频课：静音自动播放、合成鼠标防失焦暂停、播完 ≥92% 自动跳「下一节」；触发平台风控验证码时仅面板告警提示人工输入，不代答不绕过。</p>
      <h4>2. 使用提示</h4>
      <p>仅供计算机自动化技术交流与学习，请在遵守平台规则与当地法律的前提下使用，使用风险请自行承担。刷完课建议自行复习。</p>
      <h4>3. 反馈与更新</h4>
      <p>遇到 bug 可在 GitHub Issues 反馈。网课平台经常改版，若某天失效我会跟进修复。</p>
    </div>
  </div>
  <!-- 共享日志框 -->
  <div class="xa-loghead"><span>📜 运行日志</span><button id="xa-clear-log">清空</button></div>
  <div class="xa-ai-log" id="xa-ai-log"><div style="color:#94a3b8;">等待操作...</div></div>
</div>`;
    document.body.appendChild(panel);
    restorePos(panel);
    const ver = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version) ? 'v' + GM_info.script.version : '';
    const verEl = panel.querySelector('#xa-ver');
    if (verEl && ver) verEl.textContent = ver;

    mini = document.createElement('div');
    mini.id = 'xa-mini';
    mini.textContent = '超';
    document.body.appendChild(mini);
    restorePos(mini);
}

function makeDraggable(dragEl, handleEl) {
    let dragging = false, moved = false, startX, startY, origLeft, origTop;
    handleEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button, .xa-min-btn, .xa-switch, input, .xa-btn')) return;
        e.preventDefault();
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = parseInt(dragEl.style.left) || dragEl.getBoundingClientRect().left;
        origTop = parseInt(dragEl.style.top) || dragEl.getBoundingClientRect().top;
        dragEl.style.transition = 'none';
        dragEl.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx || dy) moved = true;
        const maxX = window.innerWidth - dragEl.offsetWidth;
        const maxY = window.innerHeight - dragEl.offsetHeight;
        dragEl.style.left = Math.max(0, Math.min(origLeft + dx, maxX)) + 'px';
        dragEl.style.top = Math.max(0, Math.min(origTop + dy, maxY)) + 'px';
    });
    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        dragEl.style.cursor = '';
        dragEl.style.transition = '';
        if (moved) savePos(dragEl);
    });
}

function bindUI() {
    const $ = s => panel.querySelector(s);
    statusEl = $('#xa-status');

    // Tab 切换
    qsa('.xa-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            qsa('.xa-tab, .xa-tab-pane').forEach(el => el.classList.remove('active'));
            tab.classList.add('active');
            const pane = panel.querySelector('[data-pane="' + tab.dataset.tab + '"]');
            if (pane) pane.classList.add('active');
        });
    });

    // 最小化 / 恢复（状态持久化）
    $('.xa-min-btn').addEventListener('click', () => {
        panel.classList.add('xa-hidden');
        mini.classList.add('show');
        GM_setValue(SK.minimized, true);
    });
    mini.addEventListener('click', () => {
        panel.classList.remove('xa-hidden');
        mini.classList.remove('show');
        GM_setValue(SK.minimized, false);
    });

    // 挂机开关：独立控制主循环
    const playSwitch = $('#xa-autoplay-switch');
    function refreshPlaySwitch() {
        if (conf.autoPlay) {
            playSwitch.classList.add('on');
            startAuto();
        } else {
            playSwitch.classList.remove('on');
            stopAuto();
        }
    }
    playSwitch.addEventListener('click', () => {
        conf.autoPlay = !conf.autoPlay;
        GM_setValue(SK.autoPlay, conf.autoPlay);
        refreshPlaySwitch();
    });

    // 清空日志
    $('#xa-clear-log').addEventListener('click', () => {
        CX_LOG.logLines = [];
        const box = document.getElementById('xa-ai-log');
        if (box) box.innerHTML = '<div style="color:#94a3b8;">日志已清空</div>';
    });

    // 静音按钮
    const muteBtn = $('.xa-mute');
    muteBtn.addEventListener('click', () => {
        muteEnabled = !muteEnabled;
        if (muteEnabled) { muteAll(); muteBtn.classList.remove('muted'); muteBtn.textContent = '🔇 关闭静音'; }
        else { document.querySelectorAll('video').forEach(v => { if (v.muted) v.muted = false; }); muteBtn.classList.add('muted'); muteBtn.textContent = '🔊 开启声音'; }
    });

    // 视频倍速下拉（默认 1x；风险项，用户显式开启）
    const cxSpeedInput = $('#xa-cx-speed');
    if (cxSpeedInput) {
        cxSpeedInput.value = String(conf.cxSpeed);
        cxSpeedInput.addEventListener('change', () => {
            conf.cxSpeed = parseFloat(cxSpeedInput.value) || 1;
            GM_setValue(SK.cxSpeed, String(conf.cxSpeed));
            CX_LOG.log('视频倍速已设为 ' + conf.cxSpeed + 'x', 'ok');
        });
    }

    refreshPlaySwitch();
}
