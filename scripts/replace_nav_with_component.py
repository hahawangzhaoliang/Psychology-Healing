#!/usr/bin/env python3
"""
批量将各 HTML 页面的内联导航栏替换为 header.js 组件调用
匹配策略：找到 <nav class="navbar" 开始，到第一个 </nav> 结束
"""

import re
import os

PUBLIC_DIR = r'e:\Project\Psychology Healing\Psychology-Healing\public'

PAGE_KEY = {
    'index.html':             'index',
    'about.html':             'about',
    'emotion.html':           'emotion',
    'relax.html':             'relax',
    'flow-experience.html':  'flow-experience',
    'knowledge-graph.html':   'knowledge-graph',
    'companion.html':         'companion',
    'community.html':         'community',
    'charging-station.html': 'charging-station',
    'cat-game.html':          'cat-game',
    'growth-statistics.html': 'growth-statistics',
    'role.html':              'role',
    'article.html':           'article',
    'admin.html':             'admin',
}

# 匹配：<nav class="navbar" ...> ... </nav>（非贪婪，跨行）
NAV_PATTERN = re.compile(
    r'    <nav class="navbar"[^>]*>.*?</nav>',
    re.DOTALL
)

def process_file(filepath, page_key):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 已处理过则跳过
    if '<div id="app-header"></div>' in content:
        print('  [SKIP] 已处理：' + os.path.basename(filepath))
        return 'skipped'

    replacement = (
        '    <!-- ===== 导航栏（由 header.js 渲染） ===== -->\n'
        '    <div id="app-header"></div>'
    )
    new_content, n = NAV_PATTERN.subn(replacement, content, count=1)

    if n == 0:
        print('  [SKIP] 未找到 <nav>：' + os.path.basename(filepath))
        return False

    # 在 </body> 前插入组件脚本（如果尚未存在）
    script_block = (
        '\n    <!-- 通用导航栏组件 -->\n'
        '    <script src="js/components/header.js"></script>\n'
        '    <script>\n'
        '      renderHeader({ currentPage: \'' + page_key + '\' });\n'
        '    </script>\n'
    )

    if 'js/components/header.js' not in new_content:
        new_content = new_content.replace(
            '</body>',
            script_block + '  </body>',
            count=1
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print('  [OK] ' + os.path.basename(filepath) + '  (currentPage="' + page_key + '")')
    return True

def main():
    for fname, key in PAGE_KEY.items():
        fpath = os.path.join(PUBLIC_DIR, fname)
        if not os.path.exists(fpath):
            print('[MISS] 文件不存在：' + fname)
            continue
        print('处理：' + fname)
        try:
            result = process_file(fpath, key)
            if result is True:
                print('  Done')
            elif result == 'skipped':
                pass
            else:
                print('  Skipped')
        except Exception as e:
            print('  [ERR] ' + str(e))
        print()

if __name__ == '__main__':
    main()
