#!/usr/bin/env node
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

  // Prefer the largest source if present
  const candidates = fs.readdirSync(imagesDir).filter(f => /^pat-herobg-\d+\.jpg$/i.test(f)).sort((a,b) => {
    const na = Number(a.match(/pat-herobg-(\d+)\.jpg/i)[1] || 0);
    const nb = Number(b.match(/pat-herobg-(\d+)\.jpg/i)[1] || 0);
    return nb - na;
  });
  if (!candidates.length) {
    console.error('No pat-herobg-*.jpg source files found. Nothing to do.');
    process.exit(0);
  }

  const srcFile = path.join(imagesDir, candidates[0]);
  console.log('Using source image:', srcFile);

  // Target widths (common breakpoints)
  const targets = [480, 800, 1200];

  for (const w of targets) {
    const h = Math.round(w * 0.5625); // 16:9-ish ratio
    const outJpg = path.join(imagesDir, `pat-herobg-${w}-right.jpg`);
    const outWebp = path.join(imagesDir, `pat-herobg-${w}-right.webp`);
    try {
      // Create a right-focused crop resized to the target dimensions
      await sharp(srcFile)
        .resize({ width: w, height: h, fit: 'cover', position: 'right' })
        .jpeg({ quality: 82 })
        .toFile(outJpg);
      console.log('Wrote', outJpg);

      await sharp(srcFile)
        .resize({ width: w, height: h, fit: 'cover', position: 'right' })
        .webp({ quality: 80 })
        .toFile(outWebp);
      console.log('Wrote', outWebp);
    } catch (err) {
      console.error('Failed to process', w, err);
    }
  }

  console.log('Hero crop generation complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
