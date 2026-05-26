/**
 * i18n.js — 心晴空间 国际化引擎 v1.1
 *
 * 功能：
 * 1. 自动检测/存储用户语言偏好（localStorage > navigator.language > zh-CN）
 * 2. 首次加载时存储原始中文到 data-original 属性
 * 3. 切换语言时：英文从 /i18n/en.json 加载；中文从 data-original 恢复
 * 4. 扫描页面所有 [data-i18n] / [data-i18n-html] 元素，替换文本
 * 5. 语言切换后自动重新渲染
 *
 * 用法：
 *   <!-- HTML：添加 data-i18n 属性 -->
 *   <a href="relax.html" data-i18n="nav.relax">疗愈练习</a>
 *
 *   <!-- HTML：含 HTML 标签的翻译用 data-i18n-html -->
 *   <h1 data-i18n-html="hero.title">碎片化<span class="highlight">疗愈</span><br>陪伴你的每一刻</h1>
 *
 *   <!-- JS：获取翻译 -->
 *   <script src="js/i18n.js"></script>
 *   <script>
 *     const text = window.I18N.t('buttons.start');
 *   </script>
 */

;(function () {
    'use strict';

    const I18N = {
        // 当前语言
        currentLocale: 'zh-CN',

        // 支持的语言列表
        supportedLocales: ['zh-CN', 'en'],

        // 语言显示名
        localeDisplayNames: {
            'zh-CN': '中',
            'en': 'EN',
        },

        // 英文语言包缓存（中文不需要，存在 data-original 中）
        enTranslations: null,

        // 语言包基础路径
        basePath: '/i18n',

        /**
         * 初始化 i18n
         */
        async init() {
            // 1. 检测语言
            this.currentLocale = this.detectLocale();

            // 2. 设置 HTML lang 属性
            document.documentElement.lang = this.currentLocale === 'en' ? 'en' : 'zh-CN';

            // 3. 存储原始中文文本
            this.storeOriginals();

            // 4. 如果当前是英文，加载语言包
            if (this.currentLocale === 'en') {
                const loaded = await this.loadEnTranslations();
                if (!loaded) {
                    // 加载失败，回退到中文
                    this.currentLocale = 'zh-CN';
                    document.documentElement.lang = 'zh-CN';
                    this.restoreOriginals();
                }
            }

            // 5. 应用翻译到页面
            this.applyTranslations();

            // 6. 渲染语言切换按钮
            this.renderSwitcher();

            // 7. 监听 DOM 变化（SPA 场景）
            this.observeMutations();

            return this;
        },

        /**
         * 检测当前语言（优先级：localStorage > navigator.language > 默认 zh-CN）
         */
        detectLocale() {
            // 1. localStorage 中保存的用户选择
            const saved = localStorage.getItem('xinqing_locale');
            if (saved && this.supportedLocales.includes(saved)) {
                return saved;
            }

            // 2. 浏览器语言
            const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
            if (navLang.startsWith('en')) return 'en';
            // 默认中文
            return 'zh-CN';
        },

        /**
         * 存储原始中文文本到 data-original 属性
         */
        storeOriginals() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                if (!el.getAttribute('data-original')) {
                    el.setAttribute('data-original', el.textContent.trim());
                }
            });
            document.querySelectorAll('[data-i18n-html]').forEach(el => {
                if (!el.getAttribute('data-original-html')) {
                    el.setAttribute('data-original-html', el.innerHTML.trim());
                }
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                if (!el.getAttribute('data-original-placeholder')) {
                    el.setAttribute('data-original-placeholder', el.placeholder || '');
                }
            });
        },

        /**
         * 加载英文语言包
         */
        async loadEnTranslations() {
            try {
                const url = `${this.basePath}/en.json`;
                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                this.enTranslations = await resp.json();
                return true;
            } catch (err) {
                console.warn(`[i18n] 加载英文语言包失败:`, err.message);
                return false;
            }
        },

        /**
         * 获取翻译文本
         * @param {string} key - 点分隔的键，如 'nav.home'
         * @param {Object} [params] - 可选的参数替换，如 { count: 5 }
         * @returns {string}
         */
        t(key, params = {}) {
            if (this.currentLocale === 'zh-CN') {
                // 中文：从 data-original 获取（由 applyTranslations 处理）
                return key;
            }
            if (!this.enTranslations) return key;
            const keys = key.split('.');
            let result = keys.reduce((obj, k) => (obj || {})[k], this.enTranslations);
            if (result === undefined) {
                console.warn(`[i18n] 缺失翻译: ${key}`);
                return key;
            }
            // 参数替换：{count} -> 5
            if (typeof result === 'string' && params) {
                Object.entries(params).forEach(([k, v]) => {
                    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
                });
            }
            return result;
        },

        /**
         * 应用翻译到所有 [data-i18n] / [data-i18n-html] 元素
         */
        applyTranslations() {
            if (this.currentLocale === 'zh-CN') {
                this.restoreOriginals();
                return;
            }

            if (!this.enTranslations) return;

            // 遍历所有带 data-i18n 属性的元素（纯文本）
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const text = this.t(key);
                if (text && text !== key) {
                    this.setElementText(el, text);
                }
            });

            // 遍历所有带 data-i18n-html 的元素（含 HTML 标签）
            document.querySelectorAll('[data-i18n-html]').forEach(el => {
                const key = el.getAttribute('data-i18n-html');
                const html = this.t(key);
                if (html && html !== key) {
                    el.innerHTML = html;
                }
            });

            // 遍历所有带 data-i18n-placeholder 的输入框
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                const text = this.t(key);
                if (text && text !== key) {
                    el.placeholder = text;
                }
            });

            // 遍历所有带 data-i18n-title 的元素（tooltip）
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                const text = this.t(key);
                if (text && text !== key) {
                    el.title = text;
                }
            });

            // 更新 HTML lang 属性
            document.documentElement.lang = 'en';
        },

        /**
         * 恢复原始中文文本
         */
        restoreOriginals() {
            // 恢复 data-i18n 元素
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const original = el.getAttribute('data-original');
                if (original) {
                    this.setElementText(el, original);
                }
            });

            // 恢复 data-i18n-html 元素
            document.querySelectorAll('[data-i18n-html]').forEach(el => {
                const original = el.getAttribute('data-original-html');
                if (original) {
                    el.innerHTML = original;
                }
            });

            // 恢复 data-i18n-placeholder 元素
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const original = el.getAttribute('data-original-placeholder');
                if (original) {
                    el.placeholder = original;
                }
            });

            // 恢复 data-i18n-title 元素
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const original = el.getAttribute('data-original-title');
                if (original) {
                    el.title = original;
                }
            });
        },

        /**
         * 智能设置元素文本（保留子元素如 <span>、<svg> 等）
         */
        setElementText(el, text) {
            // 如果元素只有文本节点，直接替换
            const childNodes = Array.from(el.childNodes);
            const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE);

            if (textNodes.length === 1 && childNodes.length === 1) {
                // 只有文本，直接替换
                textNodes[0].textContent = text;
            } else if (textNodes.length > 0) {
                // 有文本节点也有子元素：只替换第一个文本节点（通常是 before elements）
                textNodes[0].textContent = text;
            } else {
                // 没有文本节点：找到第一个现有文本位置或插入
                const firstChild = el.firstChild;
                if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
                    firstChild.textContent = text;
                }
            }
        },

        /**
         * 切换语言
         */
        async switchLocale(newLocale) {
            if (!this.supportedLocales.includes(newLocale)) {
                console.warn(`[i18n] 不支持的语言: ${newLocale}`);
                return;
            }
            if (newLocale === this.currentLocale) return;

            // 保存选择
            localStorage.setItem('xinqing_locale', newLocale);
            this.currentLocale = newLocale;

            // 加载英文语言包（如果需要）
            if (newLocale === 'en' && !this.enTranslations) {
                const loaded = await this.loadEnTranslations();
                if (!loaded) {
                    // 加载失败，回退
                    localStorage.setItem('xinqing_locale', 'zh-CN');
                    this.currentLocale = 'zh-CN';
                    this.restoreOriginals();
                    this.renderSwitcher();
                    return;
                }
            }

            // 重新应用翻译
            this.applyTranslations();

            // 重新渲染切换按钮
            this.renderSwitcher();

            // 触发自定义事件（供其他 JS 监听）
            document.dispatchEvent(new CustomEvent('localeChanged', {
                detail: { locale: newLocale },
            }));
        },

        /**
         * 渲染语言切换按钮
         * 查找 .i18n-switcher 容器，注入切换按钮
         */
        renderSwitcher() {
            const containers = document.querySelectorAll('.i18n-switcher');
            if (!containers.length) return;

            containers.forEach(container => {
                const otherLocale = this.currentLocale === 'en' ? 'zh-CN' : 'en';
                const displayName = this.localeDisplayNames[otherLocale] || otherLocale;
                container.innerHTML = `
                    <button
                        class="i18n-switcher-btn"
                        onclick="I18N.switchLocale('${otherLocale}')"
                        title="Switch to ${otherLocale}"
                        style="
                            padding: 0.25rem 0.6rem;
                            border: 1px solid var(--color-primary-300, #8ac4b5);
                            border-radius: var(--radius-full, 9999px);
                            background: transparent;
                            color: var(--color-primary-600, #4a8a7a);
                            font-size: 0.8rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            line-height: 1.5;
                        "
                        onmouseover="this.style.background='var(--color-primary-50,#f0faf7)';this.style.color='var(--color-primary-700,#3a7a6a)';"
                        onmouseout="this.style.background='transparent';this.style.color='var(--color-primary-600,#4a8a7a)';"
                    >${displayName}</button>
                `;
            });
        },

        /**
         * 监听 DOM 变化（动态添加的元素也需要翻译）
         */
        observeMutations() {
            if (this._observer) this._observer.disconnect();

            this._observer = new MutationObserver((mutations) => {
                let shouldApply = false;
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.hasAttribute('data-i18n')) shouldApply = true;
                            if (node.querySelector?.('[data-i18n]')) shouldApply = true;
                            if (node.hasAttribute('data-i18n-html')) shouldApply = true;
                            if (node.querySelector?.('[data-i18n-html]')) shouldApply = true;
                        }
                    });
                });
                if (shouldApply) {
                    // 防抖：100ms 后执行
                    clearTimeout(this._applyTimer);
                    this._applyTimer = setTimeout(() => {
                        if (this.currentLocale === 'en') {
                            this.applyTranslations();
                        }
                    }, 100);
                }
            });

            this._observer.observe(document.body, { childList: true, subtree: true });
        },
    };

    // 导出到全局
    window.I18N = I18N;

    // 页面加载后自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => I18N.init());
    } else {
        I18N.init();
    }
})();
