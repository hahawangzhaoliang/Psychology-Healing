/* ===== 轻疗愈小游戏（共享版） =====
 * 供 relax.html 游戏卡区与娱乐主题工具栏复用
 * 依赖：无（I18N 存在时自动中英双语）
 * API：
 *   window.openGame(name)  打开游戏弹窗（snake/bubble/star/cloud）
 *   window.closeGame()     关闭
 *   window.gamesReady      是否已加载
 */
(function () {
    'use strict';

    var STYLE_ID = 'games-shared-styles';
    var currentGame = null;
    var gameKeysHandler = null;

    function gt(key, zh) {
        if (window.I18N && I18N.currentLocale === 'en') {
            return I18N.t(key, zh) || zh;
        }
        return zh;
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.game-modal {
    position: fixed; inset: 0; z-index: 9000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(30, 40, 35, 0.45); backdrop-filter: blur(5px);
}
.game-modal.hidden { display: none; }
.game-panel {
    background: var(--theme-card, #ffffff);
    border-radius: 20px; padding: 1.1rem 1.4rem 1.3rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
    max-width: min(92vw, 520px); width: auto;
    max-height: 90vh; overflow-y: auto;
}
.game-modal .game-panel canvas {
    display: block; max-width: 100%; height: auto;
    border-radius: 14px;
}
.game-chip {
    border: 1px solid var(--theme-border, #e5e7eb);
    background: var(--theme-bg, #f9fafb);
    color: var(--theme-text, #1f2937);
    border-radius: 999px; padding: 5px 14px;
    font-size: 0.8rem; font-weight: 600; cursor: pointer;
    transition: all 0.2s ease;
}
.game-chip:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
.game-chip.primary {
    background: linear-gradient(135deg, var(--color-primary-400, #8fb8a8), var(--color-primary-500, #6aa894));
    color: #fff; border: none;
}
`;
        document.head.appendChild(style);
    }

    function ensureModal() {
        var modal = document.getElementById('gameModal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'gameModal';
        modal.className = 'game-modal hidden';
        modal.addEventListener('click', function (e) { if (e.target === modal) closeGame(); });
        modal.innerHTML = `
            <div class="game-panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                    <h3 id="gameTitle" style="margin:0;font-size:1.05rem;color:var(--theme-text);"></h3>
                    <button onclick="window.closeGame && window.closeGame()" style="background:none;border:none;font-size:1.1rem;color:var(--theme-text-light);cursor:pointer;padding:0.25rem 0.5rem;" aria-label="Close">✕</button>
                </div>
                <div id="gameStage"></div>
                <p id="gameHint" style="margin:0.7rem 0 0;font-size:0.8rem;color:var(--theme-text-light);line-height:1.6;text-align:center;"></p>
            </div>`;
        document.body.appendChild(modal);
        return modal;
    }

    function openGame(name) {
        ensureModal();
        var modal = document.getElementById('gameModal');
        var stage = document.getElementById('gameStage');
        var title = document.getElementById('gameTitle');
        var hint = document.getElementById('gameHint');
        stage.innerHTML = '';
        if (currentGame) { try { currentGame.stop(); } catch (e) {} currentGame = null; }
        if (gameKeysHandler) { window.removeEventListener('keydown', gameKeysHandler); gameKeysHandler = null; }
        var conf = {
            snake: {
                title: gt('relax.game_snake_title', '软糖蛇蛇'),
                hint: gt('relax.game_snake_hint', '方向键或滑动控制。撞到边缘会从另一边轻轻出现，永远不会失败。'),
                start: startSnake
            },
            bubble: {
                title: gt('relax.game_bubble_title', '泡泡轻拍'),
                hint: gt('relax.game_bubble_hint', '点击或按住，让泡泡把紧绷一点点带走。'),
                start: startBubble
            },
            star: {
                title: gt('relax.game_star_title', '星星收集'),
                hint: gt('relax.game_star_hint', '点击飘落的星星，把它们轻轻接住。没有输赢，只有闪烁。'),
                start: startStar
            },
            cloud: {
                title: gt('relax.game_cloud_title', '云朵泡泡'),
                hint: gt('relax.game_cloud_hint', '点一点云朵，让它化作小泡泡飘走。'),
                start: startCloud
            }
        };
        var c = conf[name];
        if (!c) return;
        title.textContent = c.title;
        hint.textContent = c.hint;
        currentGame = c.start(stage);
        modal.classList.remove('hidden');
    }

    function closeGame() {
        var modal = document.getElementById('gameModal');
        if (modal) modal.classList.add('hidden');
        if (currentGame) { try { currentGame.stop(); } catch (e) {} currentGame = null; }
        if (gameKeysHandler) { window.removeEventListener('keydown', gameKeysHandler); gameKeysHandler = null; }
    }

    /* ===== 软糖蛇蛇（无失败解压版） ===== */
    function startSnake(host) {
        var canvas = document.createElement('canvas');
        canvas.width = 440; canvas.height = 440;
        host.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var N = 20, S = 22;
        var snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10}];
        var dir = {x:1,y:0}, nextDir = {x:1,y:0};
        var food = {x:15,y:10};
        var stars = 0, ticks = 0, paused = false, stopped = false, iv = null;

        function spawnFood() {
            var p;
            do { p = { x: Math.floor(Math.random()*N), y: Math.floor(Math.random()*N) }; }
            while (snake.some(function (s) { return s.x === p.x && s.y === p.y; }));
            food = p;
        }

        function step() {
            if (stopped || paused) return;
            dir = nextDir;
            var head = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N };
            var hitSelf = snake.slice(0, -1).some(function (s) { return s.x === head.x && s.y === head.y; });
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                stars++; spawnFood();
            } else {
                snake.pop();
                if (hitSelf) { snake.pop(); snake.pop(); if (snake.length < 3) snake = [{x:5,y:5},{x:4,y:5}]; }
            }
            ticks++;
            updateHud();
            draw();
        }

        function draw() {
            ctx.clearRect(0, 0, 440, 440);
            ctx.fillStyle = 'rgba(120,160,200,0.10)';
            for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) {
                if ((x + y) % 2 === 0) ctx.fillRect(x*S+0.5, y*S+0.5, S-1, S-1);
            }
            var len = snake.length;
            for (var i = len - 1; i >= 0; i--) {
                var t = i / Math.max(len - 1, 1);
                var hue = 150 + t * 30, light = 62 + t * 14;
                ctx.fillStyle = 'hsl(' + hue + ', 45%, ' + light + '%)';
                var pad = i === 0 ? 2 : 3 + t * 2;
                var sx = snake[i].x * S + pad, sy = snake[i].y * S + pad, size = S - pad * 2;
                ctx.beginPath();
                if (i === 0) {
                    ctx.roundRect(sx, sy, size, size, size/2.5); ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(sx + size*0.68, sy + size*0.34, size*0.12, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(sx + size*0.68, sy + size*0.66, size*0.12, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#334155';
                    ctx.beginPath(); ctx.arc(sx + size*0.72, sy + size*0.34, size*0.06, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(sx + size*0.72, sy + size*0.66, size*0.06, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.roundRect(sx, sy, size, size, size/2.2); ctx.fill();
                }
            }
            var fx = food.x * S + S/2, fy = food.y * S + S/2;
            var pulse = 1 + Math.sin(ticks * 0.35) * 0.12;
            var grd = ctx.createRadialGradient(fx, fy, 1, fx, fy, 9 * pulse);
            grd.addColorStop(0, 'rgba(255,200,120,0.95)');
            grd.addColorStop(0.5, 'rgba(255,170,140,0.55)');
            grd.addColorStop(1, 'rgba(255,170,140,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(fx, fy, 9 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFD9A0';
            ctx.beginPath(); ctx.arc(fx, fy, 3.2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(120,160,200,0.25)';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 438, 438);
        }

        function updateHud() {
            var secs = Math.round(ticks * 0.15);
            var hud = document.getElementById('gameHud');
            if (!hud) {
                hud = document.createElement('div');
                hud.id = 'gameHud';
                hud.style.cssText = 'display:flex;align-items:center;gap:0.5rem;justify-content:center;margin-bottom:0.6rem;flex-wrap:wrap;';
                host.insertBefore(hud, canvas);
            }
            var pauseLabel = paused ? gt('relax.game_resume', '继续') : gt('relax.game_pause', '暂停');
            hud.innerHTML =
                '<span style="font-size:0.8rem;color:var(--theme-text);">' + gt('relax.game_stars', '星光') + ' <b>' + stars + '</b></span>' +
                '<span style="font-size:0.8rem;color:var(--theme-text-light);">·</span>' +
                '<span style="font-size:0.8rem;color:var(--theme-text-light);">' + secs + gt('relax.game_sec', 's') + '</span>' +
                '<button class="game-chip" onclick="window.__snakeToggle && window.__snakeToggle()">' + pauseLabel + '</button>' +
                '<button class="game-chip primary" onclick="window.__snakeRestart && window.__snakeRestart()">' + gt('relax.game_restart', '重新开始') + '</button>';
        }

        window.__snakeToggle = function () { paused = !paused; updateHud(); draw(); };
        window.__snakeRestart = function () {
            snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10}];
            dir = {x:1,y:0}; nextDir = {x:1,y:0};
            stars = 0; ticks = 0; paused = false;
            spawnFood(); updateHud(); draw();
        };

        gameKeysHandler = function (e) {
            var k = e.key;
            var d = { 'ArrowUp': {x:0,y:-1}, 'ArrowDown': {x:0,y:1}, 'ArrowLeft': {x:-1,y:0}, 'ArrowRight': {x:1,y:0},
                      'w': {x:0,y:-1}, 's': {x:0,y:1}, 'a': {x:-1,y:0}, 'd': {x:1,y:0},
                      'W': {x:0,y:-1}, 'S': {x:0,y:1}, 'A': {x:-1,y:0}, 'D': {x:1,y:0} };
            if (k === ' ') { e.preventDefault(); window.__snakeToggle(); return; }
            if (d[k] && (d[k].x !== -dir.x || d[k].y !== -dir.y)) { nextDir = d[k]; }
        };
        window.addEventListener('keydown', gameKeysHandler);

        var tx = null, ty = null;
        var ts = function (e) {
            var t = e.touches && e.touches[0]; if (!t) return;
            var r = canvas.getBoundingClientRect();
            tx = (t.clientX - r.left) / r.width * 440;
            ty = (t.clientY - r.top) / r.height * 440;
        };
        var tm = function (e) {
            if (tx === null) return;
            var t = e.touches && e.touches[0]; if (!t) return;
            var r = canvas.getBoundingClientRect();
            var nx = (t.clientX - r.left) / r.width * 440, ny = (t.clientY - r.top) / r.height * 440;
            var dx = nx - tx, dy = ny - ty;
            if (Math.abs(dx) > Math.abs(dy)) { if (dx > 12) nextDir = {x:1,y:0}; else if (dx < -12) nextDir = {x:-1,y:0}; }
            else { if (dy > 12) nextDir = {x:0,y:1}; else if (dy < -12) nextDir = {x:0,y:-1}; }
            tx = nx; ty = ny;
        };
        canvas.addEventListener('touchstart', ts, { passive: true });
        canvas.addEventListener('touchmove', tm, { passive: true });

        updateHud();
        draw();
        iv = setInterval(step, 150);

        return {
            stop: function () {
                stopped = true;
                clearInterval(iv);
                window.removeEventListener('keydown', gameKeysHandler);
                gameKeysHandler = null;
                delete window.__snakeToggle;
                delete window.__snakeRestart;
                canvas.removeEventListener('touchstart', ts);
                canvas.removeEventListener('touchmove', tm);
            }
        };
    }

    /* ===== 泡泡轻拍 ===== */
    function startBubble(host) {
        var canvas = document.createElement('canvas');
        canvas.width = 440; canvas.height = 360;
        host.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var raf = null, stopped = false;
        var ripples = [], bubbles = [];
        var lastT = 0;

        function spawn(x, y) {
            ripples.push({ x: x, y: y, r: 4, max: 60 + Math.random()*40, a: 0.5 });
            var n = 3 + Math.floor(Math.random()*3);
            for (var i = 0; i < n; i++) {
                bubbles.push({
                    x: x + (Math.random()-0.5)*70, y: y + (Math.random()-0.5)*70,
                    r: 5 + Math.random()*12, vx: (Math.random()-0.5)*0.5, vy: -0.6 - Math.random()*0.8,
                    hue: 190 + Math.random()*60, a: 0.55 + Math.random()*0.3, wob: Math.random()*Math.PI*2
                });
            }
        }

        function frame(t) {
            if (stopped) return;
            var dt = Math.min((t - lastT) / 16.7, 3) || 1;
            lastT = t;
            ctx.clearRect(0, 0, 440, 360);
            for (var i = ripples.length - 1; i >= 0; i--) {
                var r = ripples[i];
                r.r += 1.1 * dt; r.a -= 0.012 * dt;
                if (r.a <= 0 || r.r > r.max) { ripples.splice(i, 1); continue; }
                ctx.strokeStyle = 'rgba(160, 205, 235, ' + r.a.toFixed(3) + ')';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
            }
            for (var j = bubbles.length - 1; j >= 0; j--) {
                var b = bubbles[j];
                b.x += b.vx * dt; b.y += b.vy * dt; b.wob += 0.05 * dt;
                if (b.y < -20 || b.a <= 0.03) { bubbles.splice(j, 1); continue; }
                b.a -= 0.0025 * dt;
                ctx.fillStyle = 'hsla(' + b.hue.toFixed(0) + ', 70%, 78%, ' + b.a.toFixed(3) + ')';
                ctx.beginPath(); ctx.arc(b.x + Math.sin(b.wob) * 1.5, b.y, b.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'hsla(' + b.hue.toFixed(0) + ', 70%, 88%, ' + (b.a * 0.7).toFixed(3) + ')';
                ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,' + (b.a * 0.6).toFixed(3) + ')';
                ctx.beginPath(); ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.22, 0, Math.PI * 2); ctx.fill();
            }
            if (bubbles.length > 160) bubbles.splice(0, bubbles.length - 160);
            raf = requestAnimationFrame(frame);
        }

        function pt(e) {
            var r = canvas.getBoundingClientRect();
            return { x: (e.clientX - r.left) / r.width * 440, y: (e.clientY - r.top) / r.height * 360 };
        }
        var pd = function (e) {
            var p = pt(e);
            for (var i = 0; i < 3; i++) spawn(p.x + (Math.random()-0.5)*20, p.y + (Math.random()-0.5)*20);
        };
        var pm = function (e) {
            var p = pt(e);
            if (Math.random() < 0.5) spawn(p.x, p.y);
        };
        canvas.addEventListener('pointerdown', pd);
        canvas.addEventListener('pointermove', pm);
        raf = requestAnimationFrame(frame);

        return {
            stop: function () {
                stopped = true;
                if (raf) cancelAnimationFrame(raf);
                canvas.removeEventListener('pointerdown', pd);
                canvas.removeEventListener('pointermove', pm);
            }
        };
    }

    /* ===== 星星收集（新） ===== */
    function startStar(host) {
        var canvas = document.createElement('canvas');
        canvas.width = 440; canvas.height = 400;
        host.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var raf = null, stopped = false, lastT = 0;
        var stars = [], caught = 0, spawnT = 0;

        function newStar() {
            return {
                x: 30 + Math.random() * 380, y: -12 - Math.random() * 60,
                r: 5 + Math.random() * 6,
                vy: 0.25 + Math.random() * 0.45,
                wob: Math.random() * Math.PI * 2, ws: 0.03 + Math.random() * 0.03,
                hue: 40 + Math.random() * 20,
                a: 0.9
            };
        }

        function drawBg() {
            ctx.fillStyle = '#101B2E';
            ctx.fillRect(0, 0, 440, 400);
            // 小背景星
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            for (var i = 0; i < 40; i++) {
                var sx = (i * 97) % 440, sy = (i * 61) % 400;
                ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2); ctx.fill();
            }
        }

        function frame(t) {
            if (stopped) return;
            var dt = Math.min((t - lastT) / 16.7, 3) || 1;
            lastT = t;
            spawnT += dt;
            if (spawnT > 26) { spawnT = 0; stars.push(newStar()); }
            drawBg();
            for (var i = stars.length - 1; i >= 0; i--) {
                var s = stars[i];
                s.y += s.vy * dt;
                s.wob += s.ws * dt;
                s.a -= 0.0012 * dt;
                if (s.y > 410 || s.a <= 0.05) { stars.splice(i, 1); continue; }
                var glow = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 3.2);
                glow.addColorStop(0, 'hsla(' + s.hue + ', 90%, 78%, ' + s.a.toFixed(3) + ')');
                glow.addColorStop(1, 'hsla(' + s.hue + ', 90%, 78%, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'hsla(' + s.hue + ', 95%, 88%, ' + s.a.toFixed(3) + ')';
                ctx.beginPath(); ctx.arc(s.x + Math.sin(s.wob) * 1.6, s.y, s.r, 0, Math.PI * 2); ctx.fill();
            }
            // HUD
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '14px sans-serif';
            ctx.fillText('✨ ' + caught, 16, 24);
            raf = requestAnimationFrame(frame);
        }

        function pt(e) {
            var r = canvas.getBoundingClientRect();
            return { x: (e.clientX - r.left) / r.width * 440, y: (e.clientY - r.top) / r.height * 400 };
        }
        var pd = function (e) {
            var p = pt(e);
            for (var i = stars.length - 1; i >= 0; i--) {
                var s = stars[i];
                var dx = p.x - s.x, dy = p.y - s.y;
                if (dx * dx + dy * dy < (s.r * 2.6) * (s.r * 2.6)) {
                    caught++;
                    stars.splice(i, 1);
                    for (var k = 0; k < 8; k++) {
                        var sp = newStar();
                        sp.x = s.x; sp.y = s.y; sp.vy = 0.5;
                        sp.r = 2.5 + Math.random() * 2;
                        stars.splice(i, 0, sp);
                        i++;
                    }
                }
            }
        };
        canvas.addEventListener('pointerdown', pd);
        (function () {
            var s1 = newStar(); s1.y = 20 + Math.random() * 160; stars.push(s1);
            var s2 = newStar(); s2.y = 20 + Math.random() * 160; stars.push(s2);
        })();
        raf = requestAnimationFrame(frame);

        return {
            stop: function () {
                stopped = true;
                if (raf) cancelAnimationFrame(raf);
                canvas.removeEventListener('pointerdown', pd);
            }
        };
    }

    /* ===== 云朵泡泡（新） ===== */
    function startCloud(host) {
        var canvas = document.createElement('canvas');
        canvas.width = 440; canvas.height = 320;
        host.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        var raf = null, stopped = false, lastT = 0;
        var clouds = [], puffs = [];

        function newCloud() {
            return {
                x: 20 + Math.random() * 400, y: 40 + Math.random() * 190,
                w: 46 + Math.random() * 36, vx: 0.12 + Math.random() * 0.2,
                drift: Math.random() * Math.PI * 2,
                a: 0.92
            };
        }

        function drawCloud(c) {
            var grd = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.w * 0.7);
            grd.addColorStop(0, 'rgba(255,255,255,' + (c.a * 0.95).toFixed(3) + ')');
            grd.addColorStop(1, 'rgba(200,220,240,' + (c.a * 0.55).toFixed(3) + ')');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.w * 0.42, 0, Math.PI * 2);
            ctx.arc(c.x + c.w * 0.30, c.y - c.w * 0.12, c.w * 0.34, 0, Math.PI * 2);
            ctx.arc(c.x - c.w * 0.28, c.y + c.w * 0.06, c.w * 0.30, 0, Math.PI * 2);
            ctx.arc(c.x + c.w * 0.05, c.y + c.w * 0.14, c.w * 0.30, 0, Math.PI * 2);
            ctx.fill();
        }

        function frame(t) {
            if (stopped) return;
            var dt = Math.min((t - lastT) / 16.7, 3) || 1;
            lastT = t;
            ctx.fillStyle = '#EAF6FB';
            ctx.fillRect(0, 0, 440, 320);
            for (var i = clouds.length - 1; i >= 0; i--) {
                var c = clouds[i];
                c.x += c.vx * dt;
                c.drift += 0.01 * dt;
                if (c.x > 500) { c.x = -30 - Math.random() * 60; c.y = 40 + Math.random() * 190; }
                drawCloud(c);
            }
            for (var j = puffs.length - 1; j >= 0; j--) {
                var p = puffs[j];
                p.x += p.vx * dt; p.y -= p.vy * dt; p.a -= 0.008 * dt; p.r += 0.25 * dt;
                if (p.a <= 0.02 || p.y < -14) { puffs.splice(j, 1); continue; }
                ctx.fillStyle = 'rgba(180, 215, 235, ' + p.a.toFixed(3) + ')';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            }
            if (clouds.length < 3 && Math.random() < 0.01) clouds.push(newCloud());
            raf = requestAnimationFrame(frame);
        }

        function pt(e) {
            var r = canvas.getBoundingClientRect();
            return { x: (e.clientX - r.left) / r.width * 440, y: (e.clientY - r.top) / r.height * 320 };
        }
        var pd = function (e) {
            var p = pt(e);
            var hit = false;
            for (var i = clouds.length - 1; i >= 0; i--) {
                var c = clouds[i];
                var dx = p.x - c.x, dy = p.y - c.y;
                if (dx * dx + dy * dy < (c.w * 0.65) * (c.w * 0.65)) {
                    for (var k = 0; k < 6; k++) {
                        puffs.push({
                            x: c.x + (Math.random() - 0.5) * c.w * 0.4,
                            y: c.y + (Math.random() - 0.5) * c.w * 0.4,
                            r: 4 + Math.random() * 6,
                            vx: (Math.random() - 0.5) * 0.5, vy: 0.5 + Math.random() * 0.6,
                            a: 0.5
                        });
                    }
                    clouds.splice(i, 1);
                    hit = true;
                }
            }
            if (!hit && clouds.length < 3) clouds.push(newCloud());
        };
        canvas.addEventListener('pointerdown', pd);
        for (var n = 0; n < 3; n++) clouds.push(newCloud());
        raf = requestAnimationFrame(frame);

        return {
            stop: function () {
                stopped = true;
                if (raf) cancelAnimationFrame(raf);
                canvas.removeEventListener('pointerdown', pd);
            }
        };
    }

    window.openGame = openGame;
    window.closeGame = closeGame;
    window.gamesReady = true;
})();
