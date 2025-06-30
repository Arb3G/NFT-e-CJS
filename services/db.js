// db.js with SupaBase
// services/db.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)   // Use exact column name
    .single();

  if (error) {
    console.error('getUser error:', error);
    return null;
  }

  return data;
}

async function addUser(userId, publicKey) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { user_id: userId, public_key: publicKey }, // keys must match your DB columns
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('addUser error:', error);
    throw error;
  }

  return data;
}

module.exports = { getUser, addUser };
