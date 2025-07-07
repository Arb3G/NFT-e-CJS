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
 */
async function getUser(userId) {
  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && status !== 406) {
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

/**
 * Logs a CJS token purchase into the 'purchases' table.
 * @param {string} userId - The user's ID
 * @param {string|number} amount - Amount purchased
 * @param {string} originating - Source of the purchase (e.g. "Crypto Wallet")
 * @returns {Promise<boolean>} true if successful, false on failure
 */
async function logPurchase(userId, amount, originating = 'Crypto Wallet') {
  try {
    const { error } = await supabase.from('purchases').insert([
      {
        user_id: userId,
        amount,
        originating,
        purchased_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('logPurchase error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected logPurchase error:', err.message);
    return false;
  }
}

module.exports = { getUser, addUser, logPurchase };
