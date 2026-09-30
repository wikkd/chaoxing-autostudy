#!/usr/bin/env node
'use strict';
// 本地安装源：node serve.js [port] 后浏览器打开 http://127.0.0.1:<port>/<文件名>
// 即可触发油猴/ScriptCat 的安装页。仅服务 dist/ 目录。
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PORT = Number(process.argv[2]) || 8848;
const MIME = { '.js': 'text/javascript; charset=utf-8', '.user.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8' };

http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    const file = path.join(ROOT, name);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404).end('not found');
        return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
    console.log(new Date().toLocaleTimeString() + ' GET /' + name);
}).listen(PORT, '127.0.0.1', () => {
    console.log('✅ 安装源已启动: http://127.0.0.1:' + PORT + '/');
    fs.readdirSync(ROOT).forEach(f => console.log('   http://127.0.0.1:' + PORT + '/' + f));
});
