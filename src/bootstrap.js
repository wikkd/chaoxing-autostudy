// ==================== 入口 ====================
// 防重复注入（同一页面脚本可能被加载多次）
if (window.xaScriptLoaded) return;
window.xaScriptLoaded = true;

// 子 frame 策略：仅视频播放器 iframe 需要注入（自动开播 + 倍速 + 完成通知），
// knowledge/cards 等中间层 iframe 直接跳过
if (window.self !== window.top) {
    if (CX.isVideoIframe()) CX.startVideoFrameLoop();
    return;
}

loadCfg();

// 学习页 top：挂视频完成 → 「下一节」的消息监听
CX.bindStudyTop();

// 构建并挂载 UI
buildPanel();
makeDraggable(panel, panel.querySelector('.xa-header'));
makeDraggable(mini, mini);
bindUI();

// 恢复上一次的最小化状态
if (GM_getValue(SK.minimized, false)) {
    panel.classList.add('xa-hidden');
    mini.classList.add('show');
}

muteAll();

// MIT 一句话提示（替代原拦截式免责弹窗）
CX_LOG.log('本脚本以 MIT 协议开源发布，详见仓库 LICENSE。请遵守平台规则与当地法律使用。', 'info');

// 启动「学习状态异常」弹窗自动刷新
initPopupAutoReload();

console.log('[ChaoxingAutoStudy] 已加载');
