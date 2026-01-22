#!/usr/bin/env node
/**
 * Minimal server endpoint to call the secure Supabase RPC `rpc_update_product`
 * - Uses the SUPABASE_SERVICE_ROLE_KEY (must be stored server-side only)
 * - Exposes POST /update-product { id, price?, stock?, metadata? }
 */
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  console.error('See scripts/.env.example for required vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/update-product', async (req, res) => {
  const { id, price = null, stock = null, metadata = null } = req.body || {};
  if (!id) return res.status(400).json({ error: 'missing `id` in body' });

  try {
    const { data, error } = await supabase.rpc('rpc_update_product', {
      p_id: id,
      p_price: price,
      p_stock: stock,
      p_meta: metadata,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json({ data });
  } catch (err) {
    console.error('Unexpected error calling RPC:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`update-product server listening on :${port}`));

module.exports = app;
