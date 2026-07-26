const fs = require('fs');
const path = require('path');

// Pages to process
const pages = [
  'public/relax.html',
  'public/article.html',
  'public/emotion.html',
  'public/knowledge-graph.html',
  'public/flow-experience.html',
  'public/about.html',
  'public/companion.html',
  'public/charging-station.html',
  'public/community.html',
  'public/practice.html',
  'public/role.html'
];

// Key UI text that appears in multiple pages - add data-i18n attribute
const replacements = [
  // Navigation
  { from: '>首页<', to: ' data-i18n="nav.home">首页<' },
  { from: '>疗愈练习<', to: ' data-i18n="nav.relax">疗愈练习<' },
  { from: '>情绪觉察<', to: ' data-i18n="nav.emotion">情绪觉察<' },
  { from: '>知识图谱<', to: ' data-i18n="nav.knowledge">知识图谱<' },
  { from: '>关于我们<', to: ' data-i18n="nav.about">关于我们<' },
  { from: '>我的伙伴<', to: ' data-i18n="nav.companion">我的伙伴<' },
  
  // Common buttons
  { from: '>开始练习<', to: ' data-i18n="btn.start">开始练习<' },
  { from: '>返回<', to: ' data-i18n="btn.back">返回<' },
  { from: '>暂停<', to: ' data-i18n="btn.pause">暂停<' },
];

let totalChanges = 0;

pages.forEach(pagePath => {
  const fullPath = path.join(__dirname, pagePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${pagePath} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let pageChanges = 0;
  
  replacements.forEach(({ from, to }) => {
    const regex = new RegExp(escapeRegex(from), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, to);
      pageChanges += matches.length;
    }
  });
  
  if (pageChanges > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ ${pagePath}: ${pageChanges} changes`);
    totalChanges += pageChanges;
  } else {
    console.log(`- ${pagePath}: no changes`);
  }
});

console.log(`\nTotal changes: ${totalChanges}`);

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
