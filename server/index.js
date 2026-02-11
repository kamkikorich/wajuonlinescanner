const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const filePath = req.file.path;

  try {
    console.log('Processing image with Tesseract...');

    // 1. OCR Step: Use Tesseract to extract raw text
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng',
      { logger: m => console.log(m) }
    );

    console.log('Raw OCR Text:', text);

    if (!text.trim()) {
      throw new Error("No text detected in image");
    }

    let finalResult = text;

    // 2. Refinement Step: Use DeepSeek API to clean/format if API key exists
    if (process.env.DEEPSEEK_API_KEY) {
      console.log('Refining text with DeepSeek...');

      try {
        const deepSeekResponse = await axios.post(
          'https://api.deepseek.com/chat/completions',
          {
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "You are a professional document editor. I will give you raw OCR text from a scanned document. Your job is to:\n1. Fix common OCR typos (misspelled words, broken lines).\n2. Format the text nicely (headers, bullet points, paragraphs).\n3. Do NOT summarize or change the meaning. Keep all information.\n4. Output ONLY the corrected text, no conversational filler."
              },
              {
                role: "user",
                content: `Here is the raw text:\n\n${text}`
              }
            ],
            stream: false
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            }
          }
        );

        if (deepSeekResponse.data && deepSeekResponse.data.choices && deepSeekResponse.data.choices[0]) {
          finalResult = deepSeekResponse.data.choices[0].message.content;
        }
      } catch (apiError) {
        console.error("DeepSeek API Error:", apiError.response ? apiError.response.data : apiError.message);
        console.log("Falling back to raw OCR text.");
        // We just keep finalResult as the raw text if DeepSeek fails
      }
    }

    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    res.json({ text: finalResult });

  } catch (error) {
    console.error('OCR Error:', error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.post('/api/enhance-text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  console.log('Received request to enhance text...');

  if (!process.env.DEEPSEEK_API_KEY) {
    console.log('No DeepSeek API key found. Returning original text.');
    return res.json({
      text,
      enhanced: false,
      message: 'DeepSeek API key not configured'
    });
  }

  try {
    const deepSeekResponse = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional document editor. I will give you raw OCR text from a scanned document. Your job is to:\n1. Fix common OCR typos (misspelled words, broken lines).\n2. Format the text nicely (headers, bullet points, paragraphs).\n3. Do NOT summarize or change the meaning. Keep all information.\n4. Output ONLY the corrected text, no conversational filler."
          },
          {
            role: "user",
            content: `Here is the raw text:\n\n${text}`
          }
        ],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    if (deepSeekResponse.data && deepSeekResponse.data.choices && deepSeekResponse.data.choices[0]) {
      const enhancedText = deepSeekResponse.data.choices[0].message.content;
      return res.json({
        text: enhancedText,
        enhanced: true,
        original: text
      });
    } else {
      throw new Error('Invalid response from DeepSeek API');
    }
  } catch (error) {
    console.error("DeepSeek API Error:", error.response ? error.response.data : error.message);
    return res.status(500).json({
      error: 'Failed to enhance text',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
