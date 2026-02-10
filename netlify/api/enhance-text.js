// Netlify Serverless Function for DeepSeek AI Text Enhancement
// This function enhances OCR text using DeepSeek API

const axios = require('axios');

// Rate limiting store (in-memory, resets on redeploy)
const rateLimitStore = new Map();

// Simple in-memory rate limiter
function checkRateLimit(identifier) {
  const now = Date.now();
  const oneMinute = 60 * 1000;

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + oneMinute });
    return { allowed: true, remaining: 9 };
  }

  const user = rateLimitStore.get(identifier);

  if (now > user.resetTime) {
    user.count = 1;
    user.resetTime = now + oneMinute;
    return { allowed: true, remaining: 9 };
  }

  if (user.count >= 10) {
    const resetInSeconds = Math.ceil((user.resetTime - now) / 1000);
    return { allowed: false, resetAfter: resetInSeconds };
  }

  user.count++;
  return { allowed: true, remaining: 10 - user.count };
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for API key
  const { DEEPSEEK_API_KEY } = process.env;
  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured');
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'AI enhancement not configured. Please set DEEPSEEK_API_KEY.' })
    };
  }

  // Get client identifier for rate limiting
  const clientId = context.clientContext?.user?.sub || event.headers['client-ip'] || 'anonymous';

  // Check rate limit
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': rateLimit.resetAfter.toString()
      },
      body: JSON.stringify({
        error: 'Rate limit exceeded',
        resetAfter: rateLimit.resetAfter,
        message: `Please try again in ${rateLimit.resetAfter} seconds`
      })
    };
  }

  try {
    const { text, language = 'eng' } = JSON.parse(event.body);

    // Validate input
    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid input: text is required' })
      };
    }

    // Skip enhancement if text is too short
    if (text.trim().length < 10) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          enhanced: false,
          message: 'Text too short for enhancement'
        })
      };
    }

    console.log('Enhancing text with DeepSeek...');

    // Call DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional document editor. I will give you raw OCR text from a scanned document. Your job is to:\n1. Fix common OCR typos (misspelled words, broken lines).\n2. Format the text nicely (headers, bullet points, paragraphs).\n3. Do NOT summarize or change the meaning. Keep all information.\n4. Output ONLY the corrected text, no conversational filler.\n5. Preserve the original language of the text."
          },
          {
            role: "user",
            content: `Here is the raw text:\n\n${text}`
          }
        ],
        stream: false,
        max_tokens: 4000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      const enhancedText = response.data.choices[0].message.content;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        },
        body: JSON.stringify({
          text: enhancedText,
          enhanced: true,
          original: text
        })
      };
    }

    throw new Error('Invalid response from DeepSeek API');

  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);

    // Return a graceful fallback
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        text: JSON.parse(event.body).text,
        enhanced: false,
        error: 'AI enhancement failed. Using original OCR text.'
      })
    };
  }
};

// Handle OPTIONS requests for CORS
exports.handler.method = 'POST';
exports.handler.options = async () => ({
  statusCode: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});