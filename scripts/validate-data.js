#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    throw new Error(`Failed to read/parse ${filePath}: ${e.message}`);
  }
}

function validateProduct(p) {
  const issues = [];
  if (!p.id) issues.push('missing id');
  if (!p.name) issues.push('missing name');
  if (p.price == null || Number.isNaN(Number(p.price))) issues.push('invalid price');
  if (p.stock == null || Number.isNaN(Number(p.stock))) issues.push('invalid stock');
  if (!p.image_url) issues.push('missing image_url');
  return issues;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const dataDir = path.join(repoRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    console.error('No /data directory found.');
    process.exit(2);
  }
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).map(f => path.join(dataDir, f));
  if (files.length === 0) {
    console.error('No JSON data files found in /data.');
    process.exit(2);
  }

  let hadError = false;
  // Track ids and names across files
  const globalIdMap = new Map(); // id -> [{file, index}]
  const globalNameMap = new Map();
  files.forEach(fp => {
    console.log('Checking', path.relative(repoRoot, fp));
    let arr;
    try { arr = readJson(fp); } catch (e) { console.error('  Error:', e.message); hadError = true; return; }
    if (!Array.isArray(arr)) { console.error(`  Expected array at ${fp}`); hadError = true; return; }

    const idMap = new Map();
    const nameMap = new Map();
    arr.forEach((p, i) => {
      const issues = validateProduct(p);
      if (issues.length) {
        hadError = true;
        console.error(`  [${i}] ${p && p.name ? p.name : '<unknown>'}: ${issues.join(', ')}`);
      }
      const id = p.id != null ? String(p.id) : null;
      const name = p.name ? String(p.name).trim().toLowerCase() : null;
      if (id) {
        // local duplicate detection
        if (idMap.has(id)) {
          hadError = true;
          console.error(`  Duplicate id in ${path.basename(fp)}: id=${id} at indexes ${idMap.get(id)} and ${i}`);
        } else idMap.set(id, i);
        // global tracking
        if (!globalIdMap.has(id)) globalIdMap.set(id, []);
        globalIdMap.get(id).push({ file: path.basename(fp), index: i });
      }
      if (name) {
        if (nameMap.has(name)) {
          hadError = true;
          console.error(`  Duplicate name in ${path.basename(fp)}: name="${name}" at indexes ${nameMap.get(name)} and ${i}`);
        } else nameMap.set(name, i);
        if (!globalNameMap.has(name)) globalNameMap.set(name, []);
        globalNameMap.get(name).push({ file: path.basename(fp), index: i });
      }
    });
  });

  // Cross-file duplicate id detection
  for (const [id, occurrences] of globalIdMap.entries()) {
    if (occurrences.length > 1) {
      hadError = true;
      console.error(`\nDuplicate id across files: ${id}`);
      occurrences.forEach(o => console.error(`  - ${o.file} @ index ${o.index}`));
    }
  }

  // Cross-file duplicate name detection (case-insensitive), report if same name appears in different files
  for (const [name, occurrences] of globalNameMap.entries()) {
    const filesSet = new Set(occurrences.map(o => o.file));
    if (filesSet.size > 1) {
      hadError = true;
      console.error(`\nDuplicate name across files: "${name}"`);
      occurrences.forEach(o => console.error(`  - ${o.file} @ index ${o.index}`));
    }
  }

  if (hadError) {
    console.error('\nValidation failed. Fix the above issues.');
    process.exit(1);
  }
  console.log('\nAll product JSON files look good.');
  process.exit(0);
}

main();
