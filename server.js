const express = require('express');
const app = express();

// Redirect route directly here (since no routes/ folder)
app.get('/pay', (req, res) => {
  const { uri } = req.query;
  if (!uri) return res.status(400).send('Missing `uri` query parameter');

  try {
    const decoded = decodeURIComponent(uri);
    if (!decoded.startsWith('web+stellar:pay')) {
      return res.status(400).send('Invalid payment URI');
    }
    console.log('Redirecting to:', decoded);
    res.redirect(decoded);
  } catch (err) {
    console.error('Error decoding URI:', err.message);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
