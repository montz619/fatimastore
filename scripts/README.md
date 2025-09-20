Run the image conversion helper

This project includes a small helper script to convert existing `pat-herobg-*.jpg` images to WebP versions using `sharp`.

Usage
1. Install dev dependency (from project root):

   npm install

2. Run the converter:

   npm run convert-webp

This will create `.webp` files alongside your existing `.jpg` images in the `images/` folder (e.g. `pat-herobg-480.webp`).

Notes
- The script uses quality 80 for `.webp` output; adjust the script if you prefer different compression.
- If you don't want to install `sharp` globally, installing as a dev dependency in the project (npm install) should suffice.
