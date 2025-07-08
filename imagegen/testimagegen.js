const fetch = require('node-fetch');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

async function callGenerate(prompt) {
  try {
    const response = await fetch('https://mxjogmsxszgtrpqszlln.supabase.co/functions/v1/genA', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: add Supabase anon/public key if you use RLS or auth
        // 'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`❌ Supabase error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.reply;
  } catch (err) {
    console.error('❌ Error calling generate:', err);
    return null;
  }
}

// Example usage:
callGenerate('Describe an Afrofuturist utopia').then((reply) => {
  console.log('🧠 Reply from ChatGPT via Supabase:', reply);
});
