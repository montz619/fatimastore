// Supabase client bootstrap (UMD expected to be loaded before this file)
// Replace the placeholders with your project's values from Supabase Dashboard -> Settings -> API
(function(){
  const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
  const SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';
  if (typeof supabase === 'undefined') {
    // supabase UMD not loaded; nothing to do
    console.warn('Supabase UMD not found. Load https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js before js/supabase-client.js');
    return;
  }
  try {
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    window.supabase = client;
    console.info('Supabase client initialized (replace placeholders in js/supabase-client.js)');
  } catch (e) {
    console.error('Failed to create Supabase client', e);
  }
})();
