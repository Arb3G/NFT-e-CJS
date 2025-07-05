const express = require('express');
const router = express.Router();

/**
 * GET /pay?uri=<ENCODED_URI>
 * Redirects the user to the decoded web+stellar:pay URI
 */
router.get('/pay', (req, res) => {
  const { uri } = req.query;

  if (!uri) {
    return res.status(400).send('❌ Missing `uri` query parameter');
  }

  try {
    const decoded = decodeURIComponent(uri);

    if (!decoded.startsWith('web+stellar:pay')) {
      return res.status(400).send('❌ Invalid Stellar payment URI');
    }

    console.log('🔁 Redirecting to:', decoded);
    return res.redirect(decoded);
  } catch (err) {
    console.error('❌ Error decoding URI:', err.message);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
