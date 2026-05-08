/**
 * 心晴空间 · 神经美学交互引擎
 * Neuroaesthetics Interaction Engine
 *
 * 提供：
 * 1. 导航栏滚动透明效果
 * 2. 交错入场动画（Stagger）
 * 3. 主题切换（暖/冷/创意）
 * 4. 微交互反馈（触摸、点击）
 * 5. 流体动画工具
 * 6. 无障碍：减少动效偏好检测
 */

;(function () {
    'use strict';

    /* ========== 工具函数 ========== */

    /**
     * 判断用户是否偏好减少动效
     * @returns {boolean}
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * 节流函数 — 滚动事件优化
     * @param {Function} fn
     * @param {number} delay
     * @returns {Function}
     */
    function throttle(fn, delay) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, args);
            }
        };
    }

    /**
     * 获取最近父元素（含选择器）
     * @param {Element} el
     * @param {string} selector
     * @returns {Element|null}
     */
    function closest(el, selector) {
        let node = el;
        while (node && node !== document.body) {
            if (node.matches(selector)) return node;
            node = node.parentElement;
        }
        return null;
    }

    /* ========== 1. 导航栏滚动效果 ========== */

    function initNavbar() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        function updateNavbar() {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        updateNavbar();
        window.addEventListener('scroll', throttle(updateNavbar, 80), { passive: true });
    }

    /* ========== 2. 交错入场动画 ========== */

    /**
     * 为具有 [data-stagger] 的子元素设置交错延迟
     * 用法：在父元素上加 data-stagger="fade-in-up"
     */
    function initStaggerAnimations() {
        if (prefersReducedMotion()) return;

        const parents = document.querySelectorAll('[data-stagger]');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const parent = entry.target;
                    const animationClass = parent.dataset.stagger;
                    const children = parent.children;

                    Array.from(children).forEach((child, i) => {
                        child.style.setProperty('--stagger-index', i);
                        child.classList.add(animationClass);
                    });

                    observer.unobserve(parent);
                });
            },
            { threshold: 0.1 }
        );

        parents.forEach((el) => observer.observe(el));
    }

    /* ========== 3. 滚动入场动画（通用） ========== */

    function initScrollReveal() {
        if (prefersReducedMotion()) return;

        const targets = document.querySelectorAll('[data-reveal]');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    el.classList.add('revealed');
                    observer.unobserve(el);
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        targets.forEach((el) => observer.observe(el));
    }

    /* ========== 4. 主题切换 ========== */

    const THEME_KEY = 'xinqing-theme';

    function getSavedTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'default';
        } catch {
            return 'default';
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch { /* ignore */ }
        // 通知其他组件
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    function initTheme() {
        const saved = getSavedTheme();
        if (saved !== 'default') {
            applyTheme(saved);
        }

        // 监听主题切换按钮（所有带 [data-theme-toggle] 的按钮）
        document.addEventListener('click', (e) => {
            const btn = closest(e.target, '[data-theme-toggle]');
            if (!btn) return;
            const theme = btn.dataset.themeToggle;
            applyTheme(theme);
        });
    }

    /* ========== 5. 微交互：触控反馈 ========== */

    function initTouchFeedback() {
        if ('ontouchstart' in window) {
            document.addEventListener('touchstart', (e) => {
                const el = closest(e.target, '[data-touch-feedback]');
                if (!el) return;
                el.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
                el.style.transform = 'scale(0.96)';
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                const el = closest(e.target, '[data-touch-feedback]');
                if (!el) return;
                el.style.transform = 'scale(1)';
            }, { passive: true });
        }
    }

    /* ========== 6. 流体形状动画 ========== */

    /**
     * 让指定元素持续缓慢变形（流体感）
     * 用法：initFluidShape(document.querySelector('.lob-shape'))
     */
    function initFluidShape(el) {
        if (!el || prefersReducedMotion()) return;

        let t = 0;
        function animate() {
            t += 0.008;
            const r1 = 50 + 15 * Math.sin(t);
            const r2 = 40 + 15 * Math.cos(t * 0.7);
            const r3 = 60 + 10 * Math.sin(t * 1.3);
            const r4 = 30 + 10 * Math.cos(t * 0.5);
            el.style.borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r4}% ${r1}% ${r2}% ${r3}%`;
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ========== 7. 数字递增动画 ========== */

    /**
     * 数字从 0 递增到目标值（动画）
     * @param {HTMLElement} el - 目标元素
     * @param {number} target - 目标数字
     * @param {number} duration - 时长（ms）
     * @param {Function} [formatter] - 格式化函数
     */
    function animateCountUp(el, target, duration = 1200, formatter = null) {
        if (prefersReducedMotion()) {
            el.textContent = formatter ? formatter(target) : String(target);
            return;
        }

        const start = performance.now();
        const initial = 0;

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.round(initial + (target - initial) * eased);
            el.textContent = formatter ? formatter(current) : String(current);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    /* ========== 8. 页面过渡（SPA风格） ========== */

    function initPageTransition() {
        // 页面加载时淡入
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.style.opacity = '1';
            });
        });

        // 链接点击时淡出（同域）
        document.addEventListener('click', (e) => {
            const link = closest(e.target, 'a[href]');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            // 仅同域
            try {
                const url = new URL(href, location.href);
                if (url.origin !== location.origin) return;
            } catch {
                return;
            }

            e.preventDefault();
            document.body.style.opacity = '0';
            setTimeout(() => {
                location.href = href;
            }, 350);
        });
    }

    /* ========== 9. 减少动效偏好监听 ========== */

    function initMotionPreferenceListener() {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        mq.addEventListener('change', (e) => {
            document.documentElement.classList.toggle('reduce-motion', e.matches);
        });
        if (mq.matches) {
            document.documentElement.classList.add('reduce-motion');
        }
    }

    /* ========== 初始化 ========== */

    function init() {
        initNavbar();
        initStaggerAnimations();
        initScrollReveal();
        initTheme();
        initTouchFeedback();
        initMotionPreferenceListener();
        // 页面过渡（可选，对静态页面可能太激进，默认注释）
        // initPageTransition();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ========== 公开 API ========== */
    window.NeuroAesthetics = {
        animateCountUp,
        initFluidShape,
        applyTheme,
        prefersReducedMotion,
        throttle,
        initStaggerAnimations,
    };
})();
