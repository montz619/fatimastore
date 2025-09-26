#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const files = fs.readdirSync(cwd).filter(f => f.endsWith('.html'));
let missing = [];
let allRefs = [];
files.forEach(f => {
  const s = fs.readFileSync(path.join(cwd, f), 'utf8');
  const re = /\b(?:href|src|srcset)\s*=\s*['\"]([^'\"]+)['\"]/gi;
  let m;
  let refs = [];
  while ((m = re.exec(s)) !== null) {
    let vals = m[1];
    let arr = vals.includes(',') ? vals.split(',').map(x => x.trim().split(' ')[0]) : [vals];
    arr.forEach(v => {
      if (!v) return;
      if (v.startsWith('http') || v.startsWith('//') || v.startsWith('data:') || v.startsWith('mailto:') || v.startsWith('tel:')) return;
      let clean = v.split('?')[0].split('#')[0];
      if (clean.startsWith('./')) clean = clean.slice(2);
      if (clean.startsWith('/')) clean = clean.slice(1);
      refs.push(clean);
      const p = path.join(cwd, clean);
      if (!fs.existsSync(p)) {
        missing.push({ html: f, ref: clean });
      }
    });
  }
  allRefs.push({ html: f, count: refs.length, sample: refs.slice(0, 5) });
});

console.log(`scanned ${files.length} html files`);
allRefs.forEach(r => console.log(`${r.html}: ${r.count} local refs, sample: ${r.sample.join(', ')}`));
if (missing.length) {
  console.log(`\nmissing count ${missing.length}`);
  missing.slice(0, 500).forEach(x => console.log(x.html + ' -> ' + x.ref));
  process.exitCode = 2;
} else {
  console.log('\nno missing local refs found');
}
