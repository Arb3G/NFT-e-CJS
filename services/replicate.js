// replicate.js

const fetch = require('node-fetch');

// Replicate API endpoint and your model version ID (Stable Diffusion XL, etc.)
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const MODEL_VERSION_ID = 'your-model-version-id'; // Replace with actual version from Replicate

/**
 * Calls Replicate API to generate an image from a prompt.
 * @param {string} prompt - Text description of desired image.
 * @returns {Promise<string|null>} URL of generated image or null if failed.
 */
async function generateArt(prompt) {
  // Send POST request to Replicate API
  const response = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`, // Your Replicate API token
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: MODEL_VERSION_ID,
      input: {
        prompt,               // Text prompt for image generation
        guidance_scale: 7,    // Controls creativity (higher = closer to prompt)
        num_inference_steps: 30, // Number of steps for generation (quality vs speed)
        width: 512,           // Image width
        height: 512,          // Image height
      },
    }),
  });

  // Parse JSON response
  const data = await response.json();

  // Return the first image URL, or null if missing
  return data?.output?.[0] || null;
}

module.exports = { generateArt };
