/**
 * SVG 精灵加载器 — 心晴空间
 * 解决 file:// 协议下 <use href="*.svg#id"> 外部引用失效问题
 * 使用方式：在 </body> 前加入
 *   <script src="js/svg-loader.js"></script>
 * 并在脚本前通过 data-svg-sprite 属性指定精灵文件路径，例如：
 *   <script src="js/svg-loader.js" data-svg-sprite="css/icons-custom.svg"></script>
 */

(function () {
    'use strict';

    // 从 <script> 标签的 data-svg-sprite 属性读取精灵文件路径
    function getSpriteUrl() {
        var scripts = document.querySelectorAll('script[data-svg-sprite]');
        if (scripts.length > 0) {
            return scripts[scripts.length - 1].getAttribute('data-svg-sprite');
        }
        // 默认路径
        return 'css/icons-custom.svg';
    }

    // 检查是否已内联过，避免重复注入
    function isAlreadyLoaded(id) {
        return !!document.getElementById(id);
    }

    // 获取并内联 SVG 精灵
    function loadSvgSprite(url, callback) {
        var id = 'svg-sprite-' + (url.replace(/[^a-z0-9]/gi, '-'));
        if (isAlreadyLoaded(id)) {
            if (callback) callback();
            return Promise.resolve();
        }

        return fetch(url)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (svgText) {
                // 创建一个临时容器解析 SVG
                var div = document.createElement('div');
                div.innerHTML = svgText;
                var svg = div.querySelector('svg');
                if (!svg) {
                    console.warn('[svg-loader] 未在 ' + url + ' 中找到 <svg> 元素');
                    return;
                }

                // 设置隐藏样式，但保留在 DOM 中供 <use> 引用
                svg.setAttribute('id', id);
                svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;');
                // 移除可能存在的 display:none
                svg.style.display = '';

                document.body.insertBefore(svg, document.body.firstChild);
                console.log('[svg-loader] 已内联 SVG 精灵：' + url);
                if (callback) callback();
            })
            .catch(function (err) {
                console.warn('[svg-loader] 加载 SVG 精灵失败：' + url, err);
            });
    }

    // 自动加载页面 <script> 标签中声明的精灵文件
    function autoLoad() {
        var scripts = document.querySelectorAll('script[data-svg-sprite]');
        var promises = [];
        scripts.forEach(function (script) {
            var url = script.getAttribute('data-svg-sprite');
            if (url && !isAlreadyLoaded('svg-sprite-' + url.replace(/[^a-z0-9]/gi, '-'))) {
                promises.push(loadSvgSprite(url));
            }
        });
        return Promise.all(promises);
    }

    // DOM 就绪后自动执行
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoLoad);
        } else {
            autoLoad();
        }
    }

    init();

    // 暴露 API 供手动调用
    window.SvgLoader = {
        load: loadSvgSprite,
        autoLoad: autoLoad
    };
})();
