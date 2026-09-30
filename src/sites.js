// ==================== 超星学习通适配层 ====================
//
// 超星学习通结构（线上实测）：
//   课程首页  mooc-ans/mycourse/studentcourse —— 左侧「待完成任务点」+ 顶部 作业/考试 tab
//   学习页    mooc-ans/mycourse/studentstudy   —— 主文档含右侧章节树与「上一节/下一节」按钮
//     └ iframe  mooc-ans/knowledge/cards       —— 任务点卡片列表（无需脚本介入）
//         └ iframe  ananas/modules/video       —— 真实 <video> 播放器，完成条件「观看时长 ≥ 90%」
// 视频帧播完 → postMessage 通知 top → top 点击「下一节」。

const CX = {
    // 该 frame 是否为超星视频播放器 iframe（唯一需要注入的子 frame）
    isVideoIframe() { return /\/ananas\/modules\/video\//.test(location.pathname); },

    // ===== 视频播放器帧：静音、倍速、自动开播、播完通知 top =====
    startVideoFrameLoop() {
        loadCfg();
        setInterval(() => { try { CX.videoTick(); } catch (e) {} }, 3000);
        console.log('[ChaoxingAutoStudy] video frame loop 已启动');
    },
    videoTick() {
        // frame 里面板不生效，开关直接读存储
        const on = GM_getValue(SK.autoPlay, false);
        conf.autoPlay = on === true || on === 'true';
        const speed = parseFloat(GM_getValue(SK.cxSpeed, '1')) || 1; // 与 loadCfg 默认一致：1x 最稳，倍速由用户面板显式开启
        for (const v of document.querySelectorAll('video')) {
            if (muteEnabled && !v.muted) v.muted = true;
            if (v.playbackRate !== speed) { try { v.playbackRate = speed; } catch (e) {} }
            if (conf.autoPlay && !v.ended && v.readyState >= 2 && v.paused) {
                try { v.play().catch(() => {}); } catch (e) {}
            }
            // 完成判定：ended 或播过 92%（平台要求 90%，留余量；不可拖拽只能真实播放）
            if (!v._xaDone && v.duration > 0 && (v.ended || v.currentTime >= v.duration * 0.92)) {
                v._xaDone = true;
                try { window.parent.postMessage({ __xa: 'cx-video-done' }, '*'); } catch (e) {}
            }
        }
        // 合成鼠标移动，防超星失焦暂停
        if (conf.autoPlay) {
            try {
                document.dispatchEvent(new MouseEvent('mousemove', {
                    bubbles: true, clientX: 100 + Math.random() * 300, clientY: 100 + Math.random() * 200,
                }));
            } catch (e) {}
        }
    },

    // ===== 学习页 top 帧：穿透同源 iframe 收集视频，静音/自动开播/完成检测 =====
    //（超星播放器在 ananas/modules/video 二级 iframe 里，与主文档同源，可直接穿透；
    //  同时保留 video 帧注入作为双保险，两处 play() 幂等无冲突）
    _lastNext: 0,
    _nextErrAt: 0,
    collectVideos(doc, depth) {
        if (depth > 3) return [];
        let out = qsa('video', doc);
        for (const f of qsa('iframe', doc)) {
            try { if (f.contentDocument) out = out.concat(CX.collectVideos(f.contentDocument, depth + 1)); } catch (e) {}
        }
        return out;
    },
    tick() {
        muteAll();
        if (!/\/mycourse\/studentstudy/.test(location.href)) return;
        // 预扫描：已有视频在播则本轮不再启动新视频——一章多个视频同播易触发风控 9010
        let playing = CX.collectVideos(document, 0).some(v => !v.paused && !v.ended);
        const rpt = { frame: 0, vid: 0, btn: 0, play: 0 };
        const visit = (doc, depth) => {
            if (depth > 3) return;
            rpt.frame++;
            for (const v of qsa('video', doc)) {
                rpt.vid++;
                if (muteEnabled && !v.muted) v.muted = true;
                if (v.playbackRate !== conf.cxSpeed) { try { v.playbackRate = conf.cxSpeed; } catch (e) {} }
                if (conf.autoPlay && !playing && v.paused && !v.ended) {
                    try { const p = v.play(); if (p && p.catch) p.catch(() => {}); rpt.play++; playing = true; } catch (e) {}
                }
                if (!v.paused && !v.ended) playing = true;
                // 完成判定：ended 或播过 92%（平台要求 90%，留余量；不可拖拽只能真实播放）
                if (!v._xaDone && v.duration > 0 && (v.ended || v.currentTime >= v.duration * 0.92)) {
                    v._xaDone = true;
                    CX_LOG.log('✅ 一个视频已看完（≥92%）', 'ok');
                    CX.clickNextSection();
                }
            }
            // 大播放按钮：超星按钮无 title/aria（vjs-big-play-button 类名也可能变），
            // 按可见文本精确匹配「播放视频」；点击后按钮消失故不会重复点击；同样一轮只点一个
            for (const b of qsa('button, [role="button"], [class*="play"], a, div', doc)) {
                if (qtext(b) !== '播放视频' || !visible(b)) continue;
                rpt.btn++;
                if (conf.autoPlay && !playing) { try { b.click(); playing = true; } catch (e) {} }
            }
            for (const f of qsa('iframe', doc)) {
                // 风控验证码：卡片 iframe 被 antispider 验证页替换（9010），提示人工处理；
                // 验证通过后 iframe 恢复，复位标记以便下次再触发时仍能告警
                if (/antispider/i.test(f.src || '')) {
                    if (!CX._capWarned) {
                        CX._capWarned = true;
                        CX_LOG.log('⚠️ 触发平台风控验证码，请人工在页面中输入验证码；通过后挂机自动恢复', 'error');
                        CX_LOG.progress('⚠️ 等待人工验证码…');
                    }
                } else if (depth === 0 || f.src) {
                    CX._capWarned = false;
                }
                try { if (f.contentDocument) visit(f.contentDocument, depth + 1); } catch (e) {}
            }
        };
        visit(document, 0);
        // 诊断报告 30s 节流：帧数/视频数/按钮数/play调用数，用于远程定位链路断点
        const now = Date.now();
        if (now - (CX._rptAt || 0) > 30000) {
            CX._rptAt = now;
            CX_LOG.log('🔍 视频扫描: frames=' + rpt.frame + ' videos=' + rpt.vid
                + ' playBtns=' + rpt.btn + ' playCalls=' + rpt.play
                + (playing ? ' ▶播放中' : ' ⏸未播放') + ' autoPlay=' + !!conf.autoPlay, 'ai');
        }
        if (conf.autoPlay && !playing && now - (CX._idleLogAt || 0) > 60000) {
            CX._idleLogAt = now;
            CX_LOG.progress('⏳ 等待视频任务点…');
        }
    },
    bindStudyTop() {
        window.addEventListener('message', (e) => {
            if (!e.data || e.data.__xa !== 'cx-video-done') return;
            CX.clickNextSection();
        });
    },
    clickNextSection() {
        const now = Date.now();
        if (now - CX._lastNext < 8000) return;
        let btn = null;
        qsa('button, a, [role="button"], [class*="next"], [class*="Next"]').forEach(el => {
            if (btn || !visible(el)) return;
            if (qtextAll(el) === '下一节') btn = el;
        });
        if (btn) {
            CX._lastNext = now;
            CX_LOG.log('▶ 视频已看完（≥92%），点击「下一节」', 'ok');
            CX_LOG.progress('▶ 跳转下一节…');
            try { btn.click(); } catch (e) {}
        } else if (now - CX._nextErrAt > 30000) {
            CX._nextErrAt = now;
            CX_LOG.log('未找到「下一节」按钮', 'error');
        }
    },

};

