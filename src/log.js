// ==================== 运行日志 / 进度 ====================
// 面板日志框与进度条的统一入口（CX.tick 视频诊断、风控告警、跳节日志都走这里）

const CX_LOG = {
    logLines: [],

    log(msg, type) {
        const line = '[' + new Date().toLocaleTimeString() + '] ' + msg;
        CX_LOG.logLines.push({ text: line, type: type || 'info' });
        if (CX_LOG.logLines.length > 200) CX_LOG.logLines.shift();
        const box = document.getElementById('xa-ai-log');
        if (box) {
            box.innerHTML = CX_LOG.logLines.slice(-60).map(l => {
                const col = l.type === 'error' ? '#dc2626' : l.type === 'ok' ? '#059669' : l.type === 'ai' ? '#7c3aed' : '#374151';
                return '<div style="color:' + col + ';line-height:1.55;">' + l.text.replace(/</g, '&lt;') + '</div>';
            }).join('');
            box.scrollTop = box.scrollHeight;
        }
        console.log('[CX] ' + msg);
    },

    // 面板进度条：显示当前任务（等待视频 / 跳节 / 风控验证码）
    progress(text) {
        const el = document.getElementById('xa-progress');
        if (el) el.textContent = text;
    },
};
