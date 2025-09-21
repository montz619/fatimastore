const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'js', 'brands.js');
const src = fs.readFileSync(file, 'utf8');
try { new Function(src); console.log('PARSE_OK'); } catch (err) { console.error('PARSE_ERROR', err && err.message); process.exit(2); }