// ==================== 自动刷课主循环 ====================
// 超星的章节推进链路：视频播放器帧播完(≥92%) → postMessage 通知 top →
// CX.clickNextSection() 点「下一节」；学习页 top 的 CX.tick() 负责静音、
// 找视频开播、点「播放视频」大按钮、风控验证码告警。本文件只提供开关驱动的定时器。

let mainLoopId = null;

function mainTick() {
    CX.tick();
}

function startAuto() {
    if (mainLoopId) return;
    mainLoopId = setInterval(mainTick, CFG.INTERVAL * 1000);
    setStatus('正在运行', 'running');
    console.log('[超星] 自动刷课已启动');
    CX_LOG.log('🚀 自动挂机已启动，每 ' + CFG.INTERVAL + ' 秒扫描一次页面', 'ok');
}

function stopAuto() {
    if (mainLoopId) { clearInterval(mainLoopId); mainLoopId = null; }
    setStatus('已暂停', 'paused');
    console.log('[超星] 自动刷课已停止');
    CX_LOG.log('⏸ 挂机已停止', 'info');
}
