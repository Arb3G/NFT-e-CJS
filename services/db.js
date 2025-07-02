// services/db.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch a single user by userId from 'users' table.
 * @param {string} userId - The user ID to query.
 * @returns {Promise<Object|null>} User object or null if not found or on error.
 */
async function getUser(userId) {
  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && status !== 406) {
      // 406 means no rows found in single()
      console.error(`getUser error (status ${status}):`, error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected getUser error:', err.message);
    return null;
  }
}

/**
 * Add or update a user in the 'users' table.
 * @param {string} userId
 * @param {string} publicKey
 * @returns {Promise<Object|null>} Upserted user data or null on error.
 */
async function addUser(userId, publicKey) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { user_id: userId, public_key: publicKey },
        { onConflict: 'user_id', returning: 'representation' }
      );

    if (error) {
      console.error('addUser error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected addUser error:', err.message);
    return null;
  }
}

module.exports = { getUser, addUser };
