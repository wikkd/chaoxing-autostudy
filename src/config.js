// ==================== 全局配置 ====================

let muteEnabled = true; // 运行期开关：是否静音视频

const CFG = {
    INTERVAL: 3, // 挂机主循环间隔（秒）
};

// 持久化键（GM_setValue / GM_getValue）
const SK = {
    autoPlay: 'xa_autoplay',
    cxSpeed: 'xa_cx_speed',    // 视频倍速（1/1.25/1.5/2；默认 1x，改播放速度有风控风险，用户在面板显式开启）
    panelPos: 'xa_panel_pos',  // 面板/迷你球拖动位置
    minimized: 'xa_minimized', // 面板是否处于最小化
};

let conf = {};

function loadCfg() {
    const g = (k, d) => GM_getValue(k, d);
    const b = v => v === true || v === 'true';
    conf = {
        autoPlay: b(g(SK.autoPlay, false)),
        // 默认 1x 最稳：>2x 会被平台服务端进度校验判异常
        cxSpeed: parseFloat(g(SK.cxSpeed, '1')) || 1,
    };
}
