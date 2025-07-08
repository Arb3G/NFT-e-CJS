const fetch = require('node-fetch');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function callGenerate(prompt) {
  try {
    const response = await fetch('https://mxjogmsxszgtrpqszlln.supabase.co/functions/v1/genA', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`❌ Supabase error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    console.log("🧾 Full response from Supabase:", JSON.stringify(data, null, 2)); // 🔍 Debug print

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
