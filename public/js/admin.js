/* ============================================================
   心晴空间 · 管理后台 JavaScript
   admin.js - 从 admin.html 提取
   ============================================================ */

// ─── 全局状态 ────────────────────────────────────────────────
let ADMIN_TOKEN = localStorage.getItem('admin_token') || '';
let CURRENT_TAB = 'dashboard';
let CURRENT_COLLECTION = 'exercises';
let CURRENT_PAGE = 1;
const PAGE_SIZE = 10;
let crawlResults = { exercises:[], knowledge:[], tips:[] };
let crawlTab = 'exercises';
let editingId = null;
let editingRecord = null; // 当前编辑的完整记录（用于JSON编辑器）

// ─── 智能缓存配置 ─────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5分钟 TTL
const CACHE_PREFIX = 'xq_cache_';

function getCacheKey(path, options = {}) {
    // 将请求路径和方法组合成缓存 key
    const method = (options.method || 'GET').toUpperCase();
    return CACHE_PREFIX + method + ':' + path;
}

function getCache(path, options = {}) {
    try {
        const key = getCacheKey(path, options);
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts > CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCache(path, options = {}, data) {
    try {
        const key = getCacheKey(path, options);
        sessionStorage.setItem(key, JSON.stringify({
            ts: Date.now(),
            data
        }));
    } catch {
        // sessionStorage 满了，忽略
    }
}

function clearCache(pathPattern) {
    // 清除匹配的缓存，不传参数则清除全部
    if (!pathPattern) {
        Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
        });
        return;
    }
    const regex = new RegExp(pathPattern);
    Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX) && regex.test(k)) {
            sessionStorage.removeItem(k);
        }
    });
}

// ─── API 基础路径 ─────────────────────────────────────────────
const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// ─── 认证请求头 ───────────────────────────────────────────────
function authHeaders() {
    return ADMIN_TOKEN
        ? { 'X-Admin-Token': ADMIN_TOKEN, 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        : {};
}

// ─── 通用 API 请求（带超时保护 + 智能缓存）───────────────────────
async function api(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const useCache = options.useCache !== false && method === 'GET';
    const bypassCache = options.bypassCache === true;

    // 检查缓存（仅 GET 请求）
    if (useCache && !bypassCache) {
        const cached = getCache(path, options);
        if (cached) {
            console.log(`[缓存命中] GET ${path}`);
            return cached;
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s 超时
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
                ...(options.headers || {})
            }
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

        // 写入缓存（仅 GET 请求）
        if (useCache && data) {
            setCache(path, options, data);
            console.log(`[缓存写入] GET ${path}`);
        }

        return data;
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error('请求超时（15秒），请检查网络或 Blob 存储状态');
        throw e;
    }
}

// ─── 登录 ────────────────────────────────────────────────────
async function doLogin() {
    const token = document.getElementById('login-token').value.trim();
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    if (!token) { errorEl.textContent = '请输入管理员令牌'; return; }

    try {
        // 调用登录接口验证令牌
        const loginRes = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const loginData = await loginRes.json().catch(() => ({}));

        if (!loginRes.ok || !loginData.success) {
            errorEl.textContent = loginData.error || '令牌无效';
            return;
        }

        ADMIN_TOKEN = token;
        localStorage.setItem('admin_token', token);
        enterApp();
    } catch (e) {
        errorEl.textContent = '连接失败：' + e.message;
    }
}

function doLogout() {
    ADMIN_TOKEN = '';
    localStorage.removeItem('admin_token');
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-token').value = '';
}

function enterApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('env-badge').textContent =
        location.hostname === 'localhost' ? '本地开发' : '生产环境';
    loadDashboard();
}

// ─── 标签切换 ────────────────────────────────────────────────
function switchTab(tab, el) {
    CURRENT_TAB = tab;
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.main > div').forEach(d => d.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');

    // ✅ 必须用 else if，只加载当前标签
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'data')  loadData();
    else if (tab === 'media') loadMedia();
    else if (tab === 'settings') loadSettings();
    else if (tab === 'crawler') switchCrawlerTab(currentCrawlerTab);
}

// ─── 仪表盘 ──────────────────────────────────────────────────
async function loadDashboard() {
    const grid = document.getElementById('stats-grid');
    const list = document.getElementById('collections-list');

    // 骨架屏
    const skeletonCard = `<div class="stat-card"><div class="num" style="opacity:0.3;">-</div><div class="label">加载中…</div></div>`;
    grid.innerHTML = skeletonCard + skeletonCard + skeletonCard + skeletonCard + skeletonCard;
    list.innerHTML = '<p class="text-muted">加载中…</p>';

    // 独立并行请求，互不影响，各自降级
    const statsPromise = api('/admin/stats')
        .then(r => r.success ? r.data : null)
        .catch(e => { console.warn('[Dashboard] stats 失败:', e.message); return null; });

    const collPromise = api('/admin/collections')
        .then(r => r.success ? r.data : null)
        .catch(e => { console.warn('[Dashboard] collections 失败:', e.message); return null; });

    const [stats, collections] = await Promise.all([statsPromise, collPromise]);

    // 渲染统计卡片（有数据就显示，无数据显示占位）
    if (stats && Object.keys(stats).length > 0) {
        grid.innerHTML = Object.entries(stats).map(([key, count]) => `
            <div class="stat-card">
                <div class="num">${count}</div>
                <div class="label">${getCollectionDisplayName(key)}</div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = `
            <div class="stat-card" style="grid-column:1/-1;">
                <div class="num" style="font-size:1.2rem;color:var(--warn);">⚠️</div>
                <div class="label">统计数据加载失败<br><span style="font-size:0.75rem;color:var(--text-light);">Blob 连接超时，请稍后刷新</span></div>
            </div>
        `;
    }

    // 渲染集合列表
    if (collections && collections.length > 0) {
        list.innerHTML = `
            <table class="data-table">
                <thead><tr><th>集合名称</th><th>文件名</th><th>记录数</th><th>操作</th></tr></thead>
                <tbody>
                    ${collections.map(c => `
                        <tr>
                            <td><strong>${c.displayName}</strong><br><span class="text-muted">${c.key}</span></td>
                            <td><code style="font-size:0.8rem;">${c.fileName}.json</code></td>
                            <td><strong>${(stats && stats[c.key]) || c.count || 0}</strong></td>
                            <td>
                                <button class="btn btn-outline btn-sm" onclick="switchToDataTab('${c.key}')">管理</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (stats) {
        // stats 成功但 collections 失败，用 stats 兜底渲染
        list.innerHTML = `
            <table class="data-table">
                <thead><tr><th>集合名称</th><th>记录数</th></tr></thead>
                <tbody>
                    ${Object.entries(stats).map(([key, count]) => `
                        <tr>
                            <td><strong>${getCollectionDisplayName(key)}</strong><br><span class="text-muted">${key}</span></td>
                            <td><strong>${count}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p class="text-muted" style="margin-top:8px;font-size:0.8rem;">⚠️ 集合详情加载失败，仅显示基础统计</p>
        `;
    } else {
        list.innerHTML = `<p class="text-muted" style="color:var(--danger);">加载失败：无法连接到数据存储，请检查 Blob 配置或稍后刷新</p>`;
    }
}

// ─── 数据管理 ────────────────────────────────────────────────
function onCollectionChange() {
    CURRENT_COLLECTION = document.getElementById('collection-select').value;
    CURRENT_PAGE = 1;
    loadData();
}

async function loadData(page) {
    if (page) CURRENT_PAGE = page;
    const tbody = document.getElementById('data-tbody');
    const title = document.getElementById('data-table-title');

    tbody.innerHTML = '<tr><td colspan="3"><span style="color:var(--text-light);">⏳ 加载中…</span></td></tr>';
    document.getElementById('data-pagination').innerHTML = '';

    try {
        const res = await api(`/admin/data/${CURRENT_COLLECTION}?page=${CURRENT_PAGE}&limit=${PAGE_SIZE}`);
        if (!res.success) throw new Error(res.error);

        // JSON store 返回结构: { items, total, page, limit, totalPages }
        const items = res.items || res.data || [];
        const totalPages = res.totalPages || 1;
        const total = res.total || items.length;
        const pagination = { page: res.page || CURRENT_PAGE, total, totalPages, limit: PAGE_SIZE };

        title.textContent = `${getCollectionDisplayName(CURRENT_COLLECTION)}（${total} 条）`;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-muted">暂无数据</td></tr>';
        } else {
            tbody.innerHTML = items.map(item => {
                const preview = getRecordPreview(item);
                const safeId = String(item.id || '').replace(/'/g, "\\'");
                return `
                    <tr>
                        <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.75rem;color:var(--text-light);">${item.id || '-'}</td>
                        <td>${preview}</td>
                        <td class="actions-cell">
                            <button class="btn btn-outline btn-sm" onclick="openJsonEditor('${safeId}')">📝 编辑</button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDelete('${safeId}')">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        renderPagination(pagination);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:var(--danger);">加载失败：${e.message}</td></tr>`;
    }
}

function renderPagination(p) {
    const el = document.getElementById('data-pagination');
    el.innerHTML = `
        <button ${p.page <= 1 ? 'disabled' : ''} onclick="loadData(${p.page - 1})">上一页</button>
        <span class="page-info">第 ${p.page} / ${p.totalPages} 页（共 ${p.total} 条）</span>
        <button ${p.page >= p.totalPages ? 'disabled' : ''} onclick="loadData(${p.page + 1})">下一页</button>
    `;
}

function refreshData() {
    clearCache(`/admin/data/${CURRENT_COLLECTION}`);
    loadData(1);
}

function getRecordPreview(item) {
    // 优先显示 title，其次 content/description 的前 60 字符
    let text = item.title || item.name || item.content || item.description;
    if (text == null) {
        text = JSON.stringify(item).substring(0, 60);
    }
    return `<span style="font-size:0.85rem;">${escapeHtml(String(text).substring(0, 80))}</span>`;
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── 弹窗：新增/编辑 ────────────────────────────────────────
function openCreateModal() {
    editingId = null;
    editingRecord = null;
    document.getElementById('modal-title').textContent = '新增记录';
    document.getElementById('modal-submit').textContent = '创建';
    buildModalFields({});
}

// ─── JSON 编辑器 ────────────────────────────────────────────
// 适合复杂记录（多字段、数组、嵌套对象）的可视化编辑器

function openJsonEditor(id) {
    editingId = id;
    document.getElementById('modal-title').textContent = id ? '编辑记录' : '新增记录';
    document.getElementById('modal-submit').textContent = id ? '保存修改' : '创建';

    if (id) {
        // 加载完整记录
        api(`/admin/data/${CURRENT_COLLECTION}/${id}`)
            .then(res => {
                if (res.success) {
                    editingRecord = res.data;
                    buildModalFields(res.data);
                } else {
                    showToast('加载记录失败: ' + res.error, 'error');
                }
            })
            .catch(e => showToast('加载失败: ' + e.message, 'error'));
    } else {
        editingRecord = null;
        buildModalFields({});
    }

    document.getElementById('modal-overlay').classList.add('open');
}

// 切换到数据管理标签（不传 el，避免 switchTab 重复操作 active 类）
function switchToDataTab(collection) {
    document.getElementById('collection-select').value = collection;
    CURRENT_COLLECTION = collection;
    CURRENT_PAGE = 1;
    switchTab('data'); // switchTab 会移除所有 active，再由侧边栏点击自动加回来
}

// 轻量提示
function showToast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// 模态框标签切换（表单模式 / JSON模式）
let modalMode = 'form'; // 'form' | 'json'

function setModalMode(mode) {
    modalMode = mode;
    document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.modal-tab-btn[data-mode="${mode}"]`).classList.add('active');
    document.getElementById('form-fields-container').style.display = mode === 'form' ? '' : 'none';
    document.getElementById('json-editor-container').style.display = mode === 'json' ? '' : 'none';
}

function buildModalFields(data) {
    const container = document.getElementById('modal-fields');
    const fields = getCollectionFields(CURRENT_COLLECTION);

    // 生成原始数据 JSON（去掉自动字段）
    const rawData = { ...data };
    ['id','created_at','updated_at','imported_at','_duplicate','_duplicateReason','_collection'].forEach(k => delete rawData[k]);

    container.innerHTML = `
        <!-- 标签切换 -->
        <div style="display:flex;gap:4px;margin-bottom:16px;">
            <button class="btn btn-sm modal-tab-btn active" data-mode="form" onclick="setModalMode('form')">📋 表单编辑</button>
            <button class="btn btn-sm btn-outline modal-tab-btn" data-mode="json" onclick="setModalMode('json')">{ } JSON编辑</button>
        </div>

        <!-- 表单模式 -->
        <div id="form-fields-container">
            ${fields.map(f => {
                const val = data[f.key] ?? '';
                if (f.type === 'textarea') {
                    return `<div class="form-group">
                        <label>${f.label}</label>
                        <textarea name="${f.key}" placeholder="${f.placeholder || ''}">${escapeHtml(val)}</textarea>
                    </div>`;
                }
                return `<div class="form-group">
                    <label>${f.label}</label>
                    <input type="${f.type || 'text'}" name="${f.key}" value="${escapeHtml(val)}" placeholder="${f.placeholder || ''}">
                </div>`;
            }).join('')}
        </div>

        <!-- JSON模式 -->
        <div id="json-editor-container" style="display:none;">
            <div style="margin-bottom:6px;font-size:0.75rem;color:var(--text-light);">直接编辑 JSON，保存时验证格式</div>
            <textarea id="json-editor">${escapeHtml(JSON.stringify(rawData, null, 2))}</textarea>
            <div id="json-error" style="color:var(--danger);font-size:0.8rem;margin-top:4px;min-height:1.2em;"></div>
        </div>
    `;
}

async function submitModal() {
    let payload;

    if (modalMode === 'json') {
        const jsonEl = document.getElementById('json-editor');
        const errEl = document.getElementById('json-error');
        errEl.textContent = '';
        try {
            payload = JSON.parse(jsonEl.value);
        } catch(e) {
            errEl.textContent = 'JSON 格式错误：' + e.message;
            return;
        }
    } else {
        payload = {};
        document.querySelectorAll('#form-fields-container input[name],#form-fields-container textarea[name]').forEach(el => {
            payload[el.name] = el.value;
        });
    }

    try {
        if (editingId) {
            const res = await api(`/admin/data/${CURRENT_COLLECTION}/${editingId}`, {
                method: 'PUT', body: JSON.stringify(payload), useCache: false
            });
            if (!res.success) throw new Error(res.error);
            showToast('更新成功', 'success');
        } else {
            const res = await api(`/admin/data/${CURRENT_COLLECTION}`, {
                method: 'POST', body: JSON.stringify(payload), useCache: false
            });
            if (!res.success) throw new Error(res.error);
            showToast('创建成功', 'success');
        }

        closeModal();
        clearCache(`/admin/data/${CURRENT_COLLECTION}`);
        loadData(CURRENT_PAGE);
    } catch (e) {
        showToast('保存失败：' + e.message, 'error');
    }
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    editingId = null;
}

// ─── 删除 ────────────────────────────────────────────────────
async function confirmDelete(id) {
    if (!confirm(`确定要删除记录 ${id} 吗？此操作不可恢复。`)) return;
    try {
        await api(`/admin/data/${CURRENT_COLLECTION}/${id}`, { method: 'DELETE', useCache: false });
        clearCache(`/admin/data/${CURRENT_COLLECTION}`);
        loadData(CURRENT_PAGE);
    } catch (e) {
        alert('删除失败：' + e.message);
    }
}

// ─── 爬虫管理 ────────────────────────────────────────────────

let currentCrawlerTab = 'sources';
let editingSourceId = null;
let currentCrawlResults = null;
let currentResultFilter = 'all';

function switchCrawlerTab(tab) {
    currentCrawlerTab = tab;
    ['sources', 'tasks', 'results'].forEach(t => {
        document.getElementById(`crawler-panel-${t}`).classList.toggle('hidden', t !== tab);
        const btn = document.getElementById(`crawler-subtab-${t}`);
        btn.className = `btn btn-sm ${t === tab ? 'btn-primary' : 'btn-outline'}`;
    });

    if (tab === 'sources') loadCrawlerSources();
    if (tab === 'tasks') loadCrawlerJobs();
    if (tab === 'results') loadCrawlResults();
}

// ─── 数据源管理 ─────────────────────────────────────────────

async function loadCrawlerSources() {
    const container = document.getElementById('crawler-sources-list');
    container.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    try {
        const res = await api('/crawler/sources');
        const sources = res.data || [];

        if (sources.length === 0) {
            container.innerHTML = '<p class="text-muted">暂无数据源，点击右上角添加</p>';
            return;
        }

        const typeLabels = { text: '📝 文本', image: '🖼️ 图片', audio: '🔊 音频', paper: '📄 论文', book: '📚 书籍', mixed: '🔄 混合' };
        const statusLabels = { active: '✅ 启用', paused: '⏸️ 暂停', error: '❌ 错误' };

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>名称</th><th>URL</th><th>类型</th><th>状态</th><th>最后爬取</th><th>累计爬取</th><th>操作</th></tr></thead>
                <tbody>
                    ${sources.map(s => `
                        <tr>
                            <td style="font-weight:600;">${escapeHtml(s.name)}</td>
                            <td style="font-size:0.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                <a href="${s.url}" target="_blank" style="color:var(--primary);">${escapeHtml(s.url)}</a>
                            </td>
                            <td>${typeLabels[s.type] || s.type}</td>
                            <td>${statusLabels[s.status] || s.status}</td>
                            <td style="font-size:0.8rem;">${s.lastCrawlAt ? new Date(s.lastCrawlAt).toLocaleString('zh-CN') : '从未'}</td>
                            <td>${s.totalCrawled || 0}</td>
                            <td class="actions-cell">
                                <button class="btn btn-primary btn-sm" onclick="startCrawl('${s.id}')">🕷️ 爬取</button>
                                <button class="btn btn-outline btn-sm" onclick="editSource('${s.id}')">编辑</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteSource('${s.id}')">删除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
    }
}

function openSourceModal() {
    editingSourceId = null;
    document.getElementById('source-modal-title').textContent = '添加数据源';
    document.getElementById('source-name').value = '';
    document.getElementById('source-url').value = '';
    document.getElementById('source-type').value = 'text';
    document.getElementById('source-category').value = 'knowledge';
    document.getElementById('sel-title').value = '';
    document.getElementById('sel-content').value = '';
    document.getElementById('sel-date').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-keywords').value = '';
    document.getElementById('filter-min-length').value = '200';
    onSourceTypeChange();
    document.getElementById('source-modal-overlay').style.display = 'flex';
}

function closeSourceModal() {
    document.getElementById('source-modal-overlay').style.display = 'none';
}

function onSourceTypeChange() {
    const type = document.getElementById('source-type').value;
    document.getElementById('source-selectors-text').classList.toggle('hidden', type === 'paper');
    document.getElementById('source-selectors-paper').classList.toggle('hidden', type !== 'paper');
}

async function saveSource() {
    const type = document.getElementById('source-type').value;
    const selector = type === 'paper' ? {
        title: document.getElementById('sel-paper-title').value,
        authors: document.getElementById('sel-paper-authors').value,
        abstract: document.getElementById('sel-paper-abstract').value,
        pdfUrl: document.getElementById('sel-paper-pdf').value,
    } : {
        title: document.getElementById('sel-title').value,
        content: document.getElementById('sel-content').value,
        date: document.getElementById('sel-date').value,
    };

    const data = {
        name: document.getElementById('source-name').value.trim(),
        url: document.getElementById('source-url').value.trim(),
        type,
        category: document.getElementById('source-category').value,
        selector,
        filters: {
            dateRange: {
                from: document.getElementById('filter-date-from').value || null,
                to: document.getElementById('filter-date-to').value || null,
            },
            keywords: document.getElementById('filter-keywords').value.split(',').map(k => k.trim()).filter(Boolean),
            minContentLength: parseInt(document.getElementById('filter-min-length').value) || 0,
        },
    };

    if (!data.name || !data.url) {
        alert('请填写名称和 URL');
        return;
    }

    try {
        if (editingSourceId) {
            await api(`/crawler/sources/${editingSourceId}`, { method: 'PUT', body: JSON.stringify(data) });
            showToast('数据源已更新', 'success');
        } else {
            await api('/crawler/sources', { method: 'POST', body: JSON.stringify(data) });
            showToast('数据源已添加', 'success');
        }
        closeSourceModal();
        loadCrawlerSources();
    } catch (e) {
        alert('保存失败：' + e.message);
    }
}

async function editSource(id) {
    try {
        const res = await api(`/crawler/sources/${id}`);
        const s = res.data;
        editingSourceId = id;
        document.getElementById('source-modal-title').textContent = '编辑数据源';
        document.getElementById('source-name').value = s.name;
        document.getElementById('source-url').value = s.url;
        document.getElementById('source-type').value = s.type;
        document.getElementById('source-category').value = s.category;
        onSourceTypeChange();

        if (s.type === 'paper') {
            document.getElementById('sel-paper-title').value = s.selector?.title || '';
            document.getElementById('sel-paper-authors').value = s.selector?.authors || '';
            document.getElementById('sel-paper-abstract').value = s.selector?.abstract || '';
            document.getElementById('sel-paper-pdf').value = s.selector?.pdfUrl || '';
        } else {
            document.getElementById('sel-title').value = s.selector?.title || '';
            document.getElementById('sel-content').value = s.selector?.content || '';
            document.getElementById('sel-date').value = s.selector?.date || '';
        }

        if (s.filters) {
            document.getElementById('filter-date-from').value = s.filters.dateRange?.from || '';
            document.getElementById('filter-date-to').value = s.filters.dateRange?.to || '';
            document.getElementById('filter-keywords').value = (s.filters.keywords || []).join(', ');
            document.getElementById('filter-min-length').value = s.filters.minContentLength || 200;
        }

        document.getElementById('source-modal-overlay').style.display = 'flex';
    } catch (e) {
        alert('加载失败：' + e.message);
    }
}

async function deleteSource(id) {
    if (!confirm('确定删除此数据源吗？')) return;
    try {
        await api(`/crawler/sources/${id}`, { method: 'DELETE' });
        showToast('已删除', 'success');
        loadCrawlerSources();
    } catch (e) {
        alert('删除失败：' + e.message);
    }
}

// ─── 爬取任务 ───────────────────────────────────────────────

let crawlPollingInterval = null;

async function startCrawl(sourceId) {
    if (!confirm('确定开始爬取吗？')) return;
    try {
        const res = await api(`/crawler/crawl/${sourceId}`, { method: 'POST' });
        showToast(res.message + '（轮询状态中...）', 'success');
        
        // 切换到任务标签页
        switchCrawlerTab('tasks');
        
        // 开始轮询任务状态
        const jobId = res.data?.jobId;
        if (jobId) {
            pollJobStatus(jobId);
        }
    } catch (e) {
        alert('启动失败：' + e.message);
    }
}

async function pollJobStatus(jobId) {
    // 清除之前的轮询
    if (crawlPollingInterval) {
        clearInterval(crawlPollingInterval);
    }
    
    let pollCount = 0;
    const maxPolls = 30; // 最多轮询 30 次（60 秒）
    
    crawlPollingInterval = setInterval(async () => {
        pollCount++;
        
        try {
            const res = await api(`/crawler/jobs/${jobId}`);
            const job = res.data;
            
            if (!job) {
                clearInterval(crawlPollingInterval);
                return;
            }
            
            // 任务完成或失败，停止轮询并刷新列表
            if (job.status === 'completed' || job.status === 'failed') {
                clearInterval(crawlPollingInterval);
                crawlPollingInterval = null;
                
                // 刷新任务列表和结果
                await loadCrawlerJobs();
                if (job.status === 'completed') {
                    showToast('爬取完成！', 'success');
                    // 自动切换到结果标签页
                    switchCrawlerTab('results');
                } else {
                    showToast('爬取失败：' + (job.logs?.slice(-1)[0]?.message || '未知错误'), 'error');
                }
                return;
            }
            
            // 超时停止轮询
            if (pollCount >= maxPolls) {
                clearInterval(crawlPollingInterval);
                crawlPollingInterval = null;
                showToast('任务执行超时，请检查任务状态', 'warning');
            }
        } catch (e) {
            console.error('轮询任务状态失败:', e.message);
            // 连续失败 3 次停止轮询
            if (pollCount >= 3) {
                clearInterval(crawlPollingInterval);
                crawlPollingInterval = null;
            }
        }
    }, 2000); // 每 2 秒轮询一次
}

async function loadCrawlerJobs() {
    const container = document.getElementById('crawler-jobs-list');
    container.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    try {
        const res = await api('/crawler/jobs');
        const jobs = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (jobs.length === 0) {
            container.innerHTML = '<p class="text-muted">暂无任务</p>';
            return;
        }

        const statusLabels = {
            pending: '⏳ 等待中',
            running: '🔄 运行中',
            completed: '✅ 完成',
            failed: '❌ 失败',
        };

        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>任务ID</th><th>数据源</th><th>类型</th><th>状态</th><th>开始时间</th><th>结果</th><th>日志</th></tr></thead>
                <tbody>
                    ${jobs.map(j => `
                        <tr>
                            <td style="font-size:0.8rem;font-family:monospace;">${j.id}</td>
                            <td>${escapeHtml(j.sourceId)}</td>
                            <td>${j.type}</td>
                            <td>${statusLabels[j.status] || j.status}</td>
                            <td style="font-size:0.8rem;">${j.startedAt ? new Date(j.startedAt).toLocaleString('zh-CN') : '-'}</td>
                            <td style="font-size:0.8rem;">
                                ${j.results ? `共${j.results.total}·新${j.results.new}·重复${j.results.duplicate}` : '-'}
                            </td>
                            <td style="font-size:0.8rem;max-width:200px;">
                                ${j.logs?.slice(-2).map(l => l.message).join('<br>') || '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
    }
}

// ─── 爬取结果 ───────────────────────────────────────────────

async function loadCrawlResults(retry = 0) {
    const container = document.getElementById('crawler-results-content');
    container.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    try {
        const res = await api('/crawler/results');
        currentCrawlResults = res.data;

        // Blob 最终一致性：写入后可能短暂读不到，重试 3 次
        if (!currentCrawlResults && retry < 3) {
            setTimeout(() => loadCrawlResults(retry + 1), 1500);
            return;
        }

        if (!currentCrawlResults) {
            container.innerHTML = '<p class="text-muted">暂无爬取结果，请先执行爬取任务</p>';
            return;
        }

        renderCrawlResults();
    } catch (e) {
        container.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
    }
}

function filterCrawlResults(filter) {
    currentResultFilter = filter;
    
    // 更新 tab 按钮状态
    ['all', 'text', 'image', 'audio', 'paper', 'book'].forEach(f => {
        const btn = document.getElementById(`result-filter-${f}`);
        if (btn) {
            btn.className = `btn btn-sm ${f === filter ? 'btn-primary' : 'btn-outline'}`;
        }
    });
    
    renderCrawlResults();
}

function renderCrawlResults() {
    const container = document.getElementById('crawler-results-content');
    if (!currentCrawlResults) return;

    const { knowledge, images, audio } = currentCrawlResults;
    let items = [];

    if (currentResultFilter === 'all' || currentResultFilter === 'text') {
        items.push(...(knowledge || []).filter(i => !i._nodeType).map(i => ({ ...i, _resultType: 'text' })));
    }
    if (currentResultFilter === 'all' || currentResultFilter === 'image') {
        items.push(...(images || []).map(i => ({ ...i, _resultType: 'image' })));
    }
    if (currentResultFilter === 'all' || currentResultFilter === 'audio') {
        items.push(...(audio || []).map(i => ({ ...i, _resultType: 'audio' })));
    }
    if (currentResultFilter === 'paper') {
        items.push(...(knowledge || []).filter(i => i._nodeType === 'paper').map(i => ({ ...i, _resultType: 'paper' })));
    }
    if (currentResultFilter === 'book') {
        items.push(...(knowledge || []).filter(i => i._nodeType === 'book').map(i => ({ ...i, _resultType: 'book' })));
    }

    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted">该分类下暂无结果</p>';
        return;
    }

    container.innerHTML = `
        <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;">
            <button class="btn btn-outline btn-sm" onclick="selectAllResults(true)">全选</button>
            <button class="btn btn-outline btn-sm" onclick="selectAllResults(false)">取消</button>
            <button class="btn btn-primary btn-sm" onclick="importSelectedCrawlResults()">导入选中</button>
            <span class="text-muted" style="font-size:0.8rem;">共 ${items.length} 条</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${items.map((item, i) => renderResultItem(item, i)).join('')}
        </div>
    `;
}

function renderResultItem(item, index) {
    const typeIcons = { text: '📝', image: '🖼️', audio: '🔊', paper: '📄', book: '📚' };
    const icon = typeIcons[item._resultType] || '📄';

    if (item._resultType === 'image') {
        return `
            <div style="display:flex;gap:12px;padding:12px;border:1px solid var(--border);border-radius:var(--radius);align-items:center;">
                <input type="checkbox" class="result-select" data-index="${index}" data-type="${item._resultType}">
                <img src="${item.url}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.9rem;">${icon} ${escapeHtml(item.title)}</div>
                    <div style="font-size:0.8rem;color:var(--text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.url)}</div>
                </div>
            </div>
        `;
    }

    if (item._resultType === 'audio') {
        return `
            <div style="display:flex;gap:12px;padding:12px;border:1px solid var(--border);border-radius:var(--radius);align-items:center;">
                <input type="checkbox" class="result-select" data-index="${index}" data-type="${item._resultType}">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.9rem;">${icon} ${escapeHtml(item.title)}</div>
                    <audio controls style="width:100%;height:32px;margin-top:4px;">
                        <source src="${item.url}">
                    </audio>
                </div>
            </div>
        `;
    }

    const dupBadge = item._duplicate
        ? '<span class="badge badge-dup">已存在</span>'
        : '<span class="badge badge-new">新增</span>';

    return `
        <div style="display:flex;gap:12px;padding:12px;border:1px solid var(--border);border-radius:var(--radius);">
            <input type="checkbox" class="result-select" data-index="${index}" data-type="${item._resultType}" ${item._duplicate ? '' : 'checked'}>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
                    <span style="font-weight:600;font-size:0.9rem;">${icon} ${escapeHtml(item.title)}</span>
                    ${dupBadge}
                </div>
                <div style="font-size:0.8rem;color:var(--text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${escapeHtml((item.content || item.abstract || '').substring(0, 120))}...
                </div>
                ${item.authors ? `<div style="font-size:0.8rem;color:var(--text-light);margin-top:2px;">作者: ${escapeHtml(item.authors)}</div>` : ''}
                ${item.sourceUrl ? `<div style="font-size:0.75rem;color:var(--text-light);margin-top:2px;">来源: <a href="${item.sourceUrl}" target="_blank" style="color:var(--primary);">${escapeHtml(item.sourceUrl)}</a></div>` : ''}
            </div>
        </div>
    `;
}

function selectAllResults(checked) {
    document.querySelectorAll('.result-select').forEach(cb => cb.checked = checked);
}

async function importSelectedCrawlResults() {
    const selected = [];
    document.querySelectorAll('.result-select:checked').forEach(cb => {
        const idx = parseInt(cb.dataset.index);
        const type = cb.dataset.type;
        let item = null;
        if (type === 'image') item = currentCrawlResults.images?.[idx];
        else if (type === 'audio') item = currentCrawlResults.audio?.[idx];
        else item = currentCrawlResults.knowledge?.[idx];
        if (item) selected.push({ ...item, _importType: type });
    });

    if (selected.length === 0) {
        alert('请选择要导入的数据');
        return;
    }

    const textItems = selected.filter(s => ['text', 'paper', 'book'].includes(s._importType));
    let imported = 0;

    try {
        if (textItems.length > 0) {
            const cleanItems = textItems.map(({ _resultType, _importType, _duplicate, _duplicateReason, _collection, ...rest }) => rest);
            await api('/crawler/import', {
                method: 'POST',
                body: JSON.stringify({ items: cleanItems, collection: 'knowledge' }),
            });
            imported += textItems.length;
        }

        showToast(`成功导入 ${imported} 条数据`, 'success');
        clearCache(); // 清除所有缓存（导入了新数据）
        loadCrawlResults();
        loadDashboard();
    } catch (e) {
        alert('导入失败：' + e.message);
    }
}

function refreshCrawlResults() {
    clearCache('/crawler/results');
    loadCrawlResults();
}

// ─── 系统设置 ────────────────────────────────────────────────
async function loadSettings() {
    const infoEl = document.getElementById('system-info');
    infoEl.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    try {
        // ✅ 并行请求 metadata + blob status
        const [rootRes, statusRes] = await Promise.all([
            api('/').catch(e => ({ metadata: {} })),
            api('/admin/blob-status').catch(e => ({ data: { ok: false, error: e.message } })),
        ]);

        const res = rootRes;
        const blobOk = statusRes.data?.ok;
        infoEl.innerHTML = `
            <table class="data-table">
                <tr><td><strong>数据存储</strong></td><td>Vercel Blob</td></tr>
                <tr><td><strong>API 版本</strong></td><td>${res.metadata?.version || '-'}</td></tr>
                <tr><td><strong>最后更新</strong></td><td>${res.metadata?.lastUpdated || '-'}</td></tr>
                <tr><td><strong>存储状态</strong></td><td><span id="storage-status-badge">检查中…</span></td></tr>
            </table>
            <div style="margin-top:20px;">
                <div class="card-title" style="margin-bottom:12px;">📦 数据导入 / 导出</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="exportAllData()">📥 导出全部数据</button>
                    <button class="btn btn-outline" onclick="document.getElementById('import-file').click()">📤 导入 JSON 文件</button>
                    <input type="file" id="import-file" accept=".json" style="display:none" onchange="importJsonFile(this)">
                </div>
                <p class="text-muted" style="margin-top:8px;font-size:0.8rem;">
                    导出：将所有数据合并为一个 JSON 文件下载<br>
                    导入：上传本地修改后的 JSON 文件覆盖现有数据（完全替换）
                </p>
            </div>
            <div style="margin-top:20px;">
                <div class="card-title" style="margin-bottom:12px;">🗄️ 逐集合导出</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${['exercises','knowledge','regulation','tips'].map(c => `
                        <button class="btn btn-outline btn-sm" onclick="exportCollection('${c}')">
                            ${getCollectionDisplayName(c)}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div style="margin-top:20px;padding:12px;background:var(--warn-light);border-radius:8px;">
                <div style="font-weight:600;color:#92400E;margin-bottom:4px;">💡 提示</div>
                <p style="font-size:0.85rem;color:#92400E;margin:0;">
                    媒体文件（图片、音频）请在「媒体管理」标签页中上传和管理。
                </p>
            </div>
            <div style="margin-top:20px;">
                <div class="card-title" style="margin-bottom:12px;">🚀 数据初始化</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                    <button class="btn btn-primary" onclick="initDataFromLocal()">📦 从本地文件初始化数据</button>
                    <span class="text-muted" style="font-size:0.8rem;">将 server/data/*.json 上传到 Vercel Blob（首次部署或数据丢失时使用）</span>
                </div>
                <div id="init-data-result" style="margin-top:12px;font-size:0.85rem;"></div>
            </div>
        `;

        // Blob 状态（已在并行请求中获取）
        const statusBadge = document.getElementById('storage-status-badge');
        if (statusBadge) {
            statusBadge.innerHTML = blobOk
                ? '<span style="color:var(--success);">✅ 连接正常</span>'
                : `<span style="color:var(--danger);">❌ 异常（${statusRes.data?.error || '请检查 BLOB_READ_WRITE_TOKEN'}）</span>`;
        }
    } catch (e) {
        infoEl.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
    }
}

// 导出全部数据
async function exportAllData() {
    try {
        const res = await api('/admin/export');
        downloadJson(res, 'knowledge-all-data.json');
        showToast('导出成功', 'success');
    } catch (e) {
        showToast('导出失败：' + e.message, 'error');
    }
}

// 导出单个集合
async function exportCollection(collection) {
    try {
        const res = await api(`/admin/data/${collection}?page=1&limit=10000`);
        const items = res.items || res.data || [];
        downloadJson(items, `${collection}.json`);
        showToast(`导出 ${getCollectionDisplayName(collection)} 成功（共 ${items.length} 条）`, 'success');
    } catch (e) {
        showToast('导出失败：' + e.message, 'error');
    }
}

// 导入 JSON 文件（完全覆盖）
async function importJsonFile(input) {
    const file = input.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        const res = await api('/admin/import', {
            method: 'POST',
            body: JSON.stringify({ data })
        });
        if (!res.success) throw new Error(res.error);
        showToast(`导入成功！更新了 ${res.data?.length || 0} 个集合`, 'success');
        clearCache(); // 清除所有缓存
        loadSettings();
        loadDashboard();
    } catch (e) {
        showToast('导入失败：' + e.message, 'error');
    }
    input.value = '';
}

function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// 从本地文件初始化数据到 Blob
async function initDataFromLocal() {
    if (!confirm('确定要从本地文件初始化数据吗？\n这将把 server/data/*.json 上传到 Vercel Blob。')) return;
    const resultEl = document.getElementById('init-data-result');
    resultEl.innerHTML = '<span style="color:var(--primary);">⏳ 正在初始化...</span>';
    try {
        const res = await api('/admin/init-data', { method: 'POST' });
        if (res.success) {
            const details = res.results.map(r => {
                const icon = r.status === 'success' ? '✅' : r.status === 'error' ? '❌' : '⏭️';
                return `<div>${icon} ${r.file}: ${r.message}</div>`;
            }).join('');
            resultEl.innerHTML = `
                <div style="color:var(--success);font-weight:600;">✅ ${res.message}</div>
                <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:4px;">${details}</div>
            `;
            showToast('数据初始化成功', 'success');
            clearCache(); // 清除所有缓存（数据已重新初始化）
            loadDashboard();
        } else {
            throw new Error(res.error || '初始化失败');
        }
    } catch (e) {
        resultEl.innerHTML = `<span style="color:var(--danger);">❌ 初始化失败：${e.message}</span>`;
        showToast('初始化失败：' + e.message, 'error');
    }
}

async function confirmClearCollection() {
    if (!confirm(`⚠️ 确定要清空集合「${getCollectionDisplayName(CURRENT_COLLECTION)}」的所有数据吗？\n此操作不可恢复！`)) return;
    if (!confirm('再次确认：所有数据将被永久删除！')) return;
    try {
        await api(`/admin/data/${CURRENT_COLLECTION}/batch-delete`, {
            method: 'POST',
            body: JSON.stringify({ ids: ['__clear_all__'] }),
            useCache: false
        });
        showToast('已清空集合', 'success');
        clearCache(`/admin/data/${CURRENT_COLLECTION}`);
        loadData(1);
    } catch (e) {
        showToast('操作失败：' + e.message, 'error');
    }
}

// ─── 媒体管理 ────────────────────────────────────────────────
let mediaData = { images: [], audio: [] };

async function loadMedia() {
    const imageGrid = document.getElementById('image-grid');
    const audioList = document.getElementById('audio-list');
    const imageCount = document.getElementById('image-count');
    const audioCount = document.getElementById('audio-count');
    const blobStatus = document.getElementById('blob-status');

    // 先显示骨架屏
    blobStatus.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    imageGrid.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    audioList.innerHTML = '<p class="text-muted">⏳ 加载中…</p>';
    imageCount.textContent = '-';
    audioCount.textContent = '-';

    try {
        // ✅ 并行请求媒体列表 + Blob 状态
        const [mediaRes, statusRes] = await Promise.all([
            api('/admin/media/list').catch(e => ({ data: { images: [], audio: [] }, error: e.message })),
            api('/admin/blob-status').catch(e => ({ data: { ok: false, error: e.message } })),
        ]);

        mediaData = mediaRes.data || { images: [], audio: [] };
        const blobOk = statusRes.data?.ok;

        blobStatus.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;${blobOk ? 'color:var(--success);' : 'color:var(--danger);'}">
                <span style="font-size:1.2rem;">${blobOk ? '✅' : '❌'}</span>
                <span>Vercel Blob 连接${blobOk ? '正常' : '异常'}</span>
                ${!blobOk ? `<span class="text-muted">(${statusRes.data?.error || '请检查 BLOB_READ_WRITE_TOKEN'})</span>` : ''}
            </div>
        `;

        // 渲染图片列表
        imageCount.textContent = mediaData.images.length;
        if (mediaData.images.length === 0) {
            imageGrid.innerHTML = '<p class="text-muted">暂无图片，请上传</p>';
        } else {
            imageGrid.innerHTML = mediaData.images.map(img => `
                <div class="media-card" style="background:var(--card);border-radius:8px;overflow:hidden;box-shadow:var(--shadow);">
                    <div style="height:120px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">
                        <img src="${img.url}" alt="${img.pathname}" style="max-width:100%;max-height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=\\'color:var(--text-light);\\'>图片加载失败</span>'">
                    </div>
                    <div style="padding:8px;font-size:0.75rem;">
                        <div style="color:var(--text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${img.pathname}">${img.pathname.split('/').pop()}</div>
                        <div style="color:var(--text-light);">${formatFileSize(img.size)}</div>
                        <div style="display:flex;gap:4px;margin-top:6px;">
                            <button class="btn btn-outline btn-sm" onclick="copyMediaUrl('${img.url}')" style="flex:1;padding:4px 6px;">📋 复制</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteMedia('${encodeURIComponent(img.pathname.split('/').pop())}', 'images')" style="padding:4px 6px;">🗑️</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 渲染音频列表
        audioCount.textContent = mediaData.audio.length;
        if (mediaData.audio.length === 0) {
            audioList.innerHTML = '<p class="text-muted">暂无音频，请上传</p>';
        } else {
            audioList.innerHTML = mediaData.audio.map(audio => `
                <div class="media-card" style="background:var(--card);border-radius:8px;padding:12px;box-shadow:var(--shadow);display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;background:var(--primary-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🎵</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${audio.pathname}">${audio.pathname.split('/').pop()}</div>
                        <div class="text-muted" style="font-size:0.8rem;">${formatFileSize(audio.size)}</div>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-outline btn-sm" onclick="playAudio('${audio.url}')">▶️ 播放</button>
                        <button class="btn btn-outline btn-sm" onclick="copyMediaUrl('${audio.url}')">📋 复制</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMedia('${encodeURIComponent(audio.pathname.split('/').pop())}', 'audio')">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        blobStatus.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
        imageGrid.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
        audioList.innerHTML = `<p style="color:var(--danger);">加载失败：${e.message}</p>`;
    }
}

function refreshMedia() {
    clearCache('/admin/media');
    loadMedia();
}

// 文件大小格式化
function formatFileSize(bytes) {
    if (!bytes) return '未知';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 点击上传区域触发文件选择
document.getElementById('media-upload-area').addEventListener('click', () => {
    document.getElementById('media-file-input').click();
});

// 文件选择处理
async function handleMediaFileSelect(input) {
    if (!input.files || input.files.length === 0) return;
    await uploadMediaFiles(Array.from(input.files));
    input.value = '';
}

// 拖拽上传处理
async function handleMediaDrop(event) {
    event.preventDefault();
    event.target.style.borderColor = 'var(--border)';

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;
    await uploadMediaFiles(files);
}

// 上传多个文件
async function uploadMediaFiles(files) {
    const progressEl = document.getElementById('media-upload-progress');
    const statusEl = document.getElementById('media-upload-status');

    progressEl.classList.remove('hidden');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        statusEl.textContent = `上传中 (${i + 1}/${files.length}): ${file.name}`;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE}/admin/media/upload`, {
                method: 'POST',
                headers: authHeaders(),
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                successCount++;
            } else {
                failCount++;
                console.error(`上传失败: ${file.name}`, data.error);
            }
        } catch (e) {
            failCount++;
            console.error(`上传失败: ${file.name}`, e.message);
        }
    }

    progressEl.classList.add('hidden');
    showToast(`上传完成：成功 ${successCount} 个${failCount > 0 ? `，失败 ${failCount} 个` : ''}`, failCount > 0 ? 'error' : 'success');
    loadMedia();
}

// 复制媒体 URL
async function copyMediaUrl(url) {
    try {
        await navigator.clipboard.writeText(url);
        showToast('URL 已复制到剪贴板', 'success');
    } catch (e) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('URL 已复制到剪贴板', 'success');
    }
}

// 删除媒体文件
async function deleteMedia(filename, type) {
    if (!confirm(`确定要删除文件 "${filename}" 吗？此操作不可恢复。`)) return;

    try {
        const res = await api(`/admin/media/${type}/${filename}`, { method: 'DELETE' });
        if (!res.success) throw new Error(res.error);
        showToast('删除成功', 'success');
        loadMedia();
    } catch (e) {
        showToast('删除失败：' + e.message, 'error');
    }
}

// 播放音频（简单实现）
let currentAudio = null;
function playAudio(url) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    currentAudio = new Audio(url);
    currentAudio.play().catch(e => showToast('播放失败：' + e.message, 'error'));
}

// ─── 辅助函数 ────────────────────────────────────────────────
function getCollectionDisplayName(key) {
    const names = {
        exercises:    '疗愈练习',
        knowledge:   '心理学知识',
        regulation:  '情绪调节',
        tips:        '每日提示',
        emotionDiary:  '情绪日记',
        assessment:    '测评记录',
        feedback:    '用户反馈',
        visitStats:  '访问统计',
        graph:       '知识图谱',
        metadata:    '元数据'
    };
    return names[key] || key;
}

function getCollectionFields(collection) {
    const map = {
        exercises: [
            { key:'title',       label:'标题',       type:'text', placeholder:'练习名称' },
            { key:'category',    label:'分类',       type:'text', placeholder:'如：正念冥想' },
            { key:'duration',    label:'时长',       type:'text', placeholder:'如：10-15分钟' },
            { key:'difficulty',  label:'难度',       type:'text', placeholder:'入门/中级/高级' },
            { key:'description', label:'描述',       type:'textarea', placeholder:'简短描述' },
            { key:'steps',       label:'步骤（JSON数组）', type:'textarea', placeholder:'["步骤1","步骤2",...]' },
            { key:'benefits',    label:'益处',       type:'textarea', placeholder:'["益处1","益处2",...]' },
            { key:'tags',        label:'标签',       type:'text', placeholder:'正念,呼吸,焦虑' },
        ],
        knowledge: [
            { key:'title',    label:'标题',   type:'text', placeholder:'知识标题' },
            { key:'content',  label:'正文内容', type:'textarea', placeholder:'详细内容' },
            { key:'source',   label:'来源',   type:'text', placeholder:'如：哈佛医学院' },
            { key:'category', label:'分类',   type:'text', placeholder:'如：神经科学' },
            { key:'tags',     label:'标签',   type:'text', placeholder:'焦虑,神经科学' },
        ],
        regulation: [
            { key:'emotion',  label:'情绪类型', type:'text', placeholder:'如：焦虑' },
            { key:'methods',  label:'调节方法', type:'textarea', placeholder:'JSON数组格式' },
            { key:'lifestyle',label:'生活方式建议', type:'textarea', placeholder:'JSON数组格式' },
            { key:'whenToSeekHelp', label:'何时求助', type:'textarea', placeholder:'专业帮助提示' },
        ],
        tips: [
            { key:'content',      label:'提示内容', type:'textarea', placeholder:'提示文字' },
            { key:'category',     label:'分类',     type:'text', placeholder:'如：正念' },
            { key:'suitableTime', label:'适用时间', type:'text', placeholder:'如：睡前' },
        ],
    };
    return map[collection] || [
        { key:'title',   label:'标题', type:'text' },
        { key:'content', label:'内容', type:'textarea' },
    ];
}

// ─── 回车登录 ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-token').addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin();
    });

    // 如果已有 token，尝试直接进入
    if (ADMIN_TOKEN) {
        // 静默验证
        fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: ADMIN_TOKEN })
        }).then(r => r.json()).then(data => {
            if (data.success) enterApp();
        }).catch(()=>{});
    }
});
