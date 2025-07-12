// testartgen.js
const fs = require('fs');
const generateArt = require('./services/createart');

(async () => {
  try {
    const prompt = 'a futuristic African cityscape at sunset';
    const buffer = await generateArt(prompt);
    fs.writeFileSync('testoutput.png', buffer);
    console.log('✅ Art generated and saved as testoutput.png');
  } catch (err) {
    console.error('💥 Error during test:', err.message);
  }
})();


