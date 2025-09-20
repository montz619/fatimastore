// Convert existing pat-herobg-*.jpg files to WebP versions.
// Usage: npm install sharp && node scripts/convert-to-webp.js
// Or: npm run convert-webp (after running npm install)

const fs = require('fs');
const path = require('path');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('This script requires "sharp". Run: npm install sharp');
    process.exit(1);
  }

  const imagesDir = path.join(__dirname, '..', 'images');
  if (!fs.existsSync(imagesDir)) {
    console.error('images directory not found:', imagesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(imagesDir).filter(f => /^pat-herobg-\d+\.jpg$/i.test(f));
  if (!files.length) {
    console.log('No matching pat-herobg-*.jpg files found to convert.');
    return;
  }

  for (const file of files) {
    const inPath = path.join(imagesDir, file);
    const outName = file.replace(/\.jpg$/i, '.webp');
    const outPath = path.join(imagesDir, outName);
    try {
      await sharp(inPath)
        .webp({ quality: 80 })
        .toFile(outPath);
      console.log(`Converted ${file} -> ${outName}`);
    } catch (err) {
      console.error('Failed to convert', file, err);
    }
  }
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
