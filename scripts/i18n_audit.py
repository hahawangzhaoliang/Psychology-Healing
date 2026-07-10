# -*- coding: utf-8 -*-
"""
AUTHORITATIVE global i18n audit for 心晴空间.
Covers: literal _t('k','zh'), I18N.t('k'), data-i18n* attributes,
dynamic string concatenation (prefix+var), and variable-passed keys
(nameKey/tagKey/descKey/key/captionKey fields, ternary literals, labelKeys arrays).
"""
import json, re, glob, os

data = json.load(open('public/i18n/en.json', 'r', encoding='utf-8'))

JS_FILES = glob.glob('public/js/**/*.js', recursive=True) + glob.glob('public/*.html')

def flat(o, p=''):
    out = {}
    for k, v in o.items():
        fk = (p + '.' + k) if p else k
        if isinstance(v, dict):
            out.update(flat(v, fk))
        else:
            out[fk] = v
    return out

ef = flat(data)

def present(k):
    return k in ef or ('cat_game.' + k) in ef

missing = []
def chk(k):
    if not k:
        return
    if '$' in k or '{' in k:   # template-literal fragment, not a real key
        return
    if not present(k) and k not in missing:
        missing.append(k)

KEYPAT = r"[a-z][a-z0-9_]*(\.[a-z0-9_]+)+"

# ---------- A. literal first-arg keys ----------
LIT_RE = r"_t\(['\"]({}|{})['\"]\s*[,)]".format(r"[a-zA-Z0-9_.\-]+", r"[a-zA-Z0-9_.\-]+")
for path in JS_FILES:
    if path.endswith('i18n.js'):   # engine file: only contains example/comment keys
        continue
    c = open(path, 'r', encoding='utf-8').read()
    for m in re.finditer(r"_t\(['\"]([a-zA-Z0-9_.\-]+)['\"]\s*[,)]", c):
        k = m.group(1)
        if '+' not in k:
            chk(k)
    for m in re.finditer(r"I18N\.t\(['\"]([a-zA-Z0-9_.\-]+)['\"]\)", c):
        chk(m.group(1))
    for m in re.finditer(r'data-i18n(?:-html|-placeholder|-title)?\s*=\s*["\']([^"\']+)["\']', c):
        for k in m.group(1).split():
            if re.match(KEYPAT, k):
                chk(k)

# ---------- B. dynamic concatenation (expand known sources) ----------
for e in ['joy','trust','fear','surprise','sadness','disgust','anger','anticipation']:
    chk('emotion.' + e + '_name')
for c in ['joy+trust','trust+fear','fear+surprise','surprise+sadness','sadness+disgust','disgust+anger','anger+anticipation','anticipation+joy']:
    chk('emotion.combo.' + c + '_name')
chk('emotion.intensity_mild'); chk('emotion.intensity_strong')
for s in set(re.findall(r"id:\s*'(s\d+)'", open('public/data/stories.js','r',encoding='utf-8').read())):
    chk('charging_station.story_theme_' + s); chk('charging_station.story_moral_' + s)
for cid in ['rabbit','dog','cat','fox','hedgehog','corgi','otter','elephant','whale','penguin','sheep','panda']:
    chk('companion.name_' + cid); chk('companion.personality_' + cid)
rh = open('public/role.html','r',encoding='utf-8').read()
rk = re.search(r'const conflicts\s*=\s*\{(.*?)\n        \};', rh, re.S)
if rk:
    for ck in re.findall(r"'([a-z-]+)':\s*\{", rk.group(1)):
        chk('role.' + ck + '_desc'); chk('role.' + ck + '_sug')
for cat in ['boundaries','timemgmt','selfcare','support']:
    chk('role.sug_title_' + cat)
    for i in range(3):
        chk('role_sug_item_' + cat + '_' + str(i))

# ---------- C. variable-passed keys from data fields (only real i18n keys: must contain a dot) ----------
KEYPAT = r"[a-z][a-z0-9_]*(\.[a-z0-9_]+)+"
for path in JS_FILES:
    c = open(path, 'r', encoding='utf-8').read()
    for m in re.finditer(r"(?:nameKey|tagKey|descKey|captionKey|\bkey)\s*:\s*['\"]([^'\"]+)['\"]", c):
        k = m.group(1)
        if re.match(KEYPAT, k):
            chk(k)

# ---------- D. ternary literals inside _t(...) ----------
for path in JS_FILES:
    c = open(path, 'r', encoding='utf-8').read()
    for m in re.finditer(r"_t\(\s*[^,]*?['\"]([a-zA-Z0-9_.\-]+)['\"]\s*:\s*['\"]([a-zA-Z0-9_.\-]+)['\"]", c):
        chk(m.group(1)); chk(m.group(2))

# ---------- E. labelKeys arrays ----------
for path in JS_FILES:
    c = open(path, 'r', encoding='utf-8').read()
    for m in re.finditer(r"labelKeys\s*=\s*\[([^\]]*)\]", c):
        for k in re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)):
            if re.match(KEYPAT, k):
                chk(k)

# ---------- F. sub-emotion template keys: data-i18n="emotion.sub_${em.key}_${sub.en}" ----------
rh = open('public/emotion.html', 'r', encoding='utf-8').read()
sm = re.search(r'const SUB_EMOTION_MAP\s*=\s*\{(.*?)\n        \};', rh, re.S)
if sm:
    for em in re.finditer(r'(\w+):\s*\[([^\]]*)\]', sm.group(1)):
        for en, zh in re.findall(r"en:'([^']+)',zh:'([^']+)'", em.group(2)):
            chk('emotion.sub_' + em.group(1) + '_' + en)

missing = list(dict.fromkeys(missing))
print('=== AUTHORITATIVE MISSING KEYS:', len(missing), '===')
for k in missing:
    print('  ', k)
