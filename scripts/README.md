Update-product server
---------------------

Purpose
- Minimal server endpoint that calls the secure Supabase RPC `rpc_update_product` using the `service_role` key. Use this on a trusted server or serverless function.

Setup
1. Install runtime deps in the project root:

```powershell
npm install express cors
```

2. Create environment variables (see `.env.example`):

```text
SUPABASE_URL=https://<PROJECT>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
PORT=3000
```

Run locally

```powershell
# set env vars in PowerShell (one-liners)
$env:SUPABASE_URL='https://<PROJECT>.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='<SERVICE_ROLE_KEY>'; node "scripts/update-product-server.js"
```

Example request

```bash
curl -X POST http://localhost:3000/update-product \
  -H "Content-Type: application/json" \
  -d '{"id":"00000000-0000-0000-0000-000000000000","price":12.5,"stock":7}'
```

Deployment
- Deploy to any Node-capable host (Vercel Serverless Functions, Fly, Render, Heroku, etc.). Ensure the `SUPABASE_SERVICE_ROLE_KEY` is set in the platform's secret store and is never public.

Security
- The `service_role` key bypasses RLS — do not expose it to browsers. Only call this endpoint from trusted servers or CI. Consider adding authentication (JWT/API key) to this endpoint before exposing it publicly.Run the image conversion helper

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
