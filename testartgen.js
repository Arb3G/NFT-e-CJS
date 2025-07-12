// testartgen.js
const fs = require('fs');
const generateArt = require('./services/createart'); // Adjust path if needed

(async () => {
  const prompt = 'a futuristic African cityscape at sunset';

  try {
    const imageBuffer = await generateArt(prompt);
    if (!imageBuffer) {
      console.log('❌ Failed to generate image.');
      return;
    }

    // Save to file to visually confirm
    fs.writeFileSync('test_output.png', imageBuffer);
    console.log('✅ Image saved as test_output.png');
  } catch (err) {
    console.error('💥 Error during test:', err);
  }
})();

