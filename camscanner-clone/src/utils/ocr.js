// OCR Utilities for Client-Side Processing
import Tesseract from 'tesseract.js';

// Tesseract worker singleton to reuse across calls
let worker = null;

/**
 * Initialize Tesseract worker
 * @returns {Promise<Worker>} Tesseract worker
 */
async function getWorker() {
  if (!worker) {
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });
  }
  return worker;
}

/**
 * Process an image with Tesseract.js OCR
 * @param {string} imageSrc - Data URL of the image to process
 * @param {Object} options - OCR options
 * @param {string} options.language - Language code (default: 'eng')
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} OCR result with text and confidence
 */
export async function processImageWithOCR(imageSrc, options = {}) {
  const {
    language = 'eng',
    onProgress = () => {},
  } = options;

  const startTime = Date.now();

  try {
    const worker = await getWorker();

    // Set language if different from current
    if (language !== 'eng') {
      await worker.reinitialize(language);
    }

    onProgress({ status: 'processing', progress: 0 });

    // Recognize text from image
    const result = await worker.recognize(imageSrc, {}, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress({ status: 'processing', progress: m.progress });
        }
      },
    });

    const duration = Date.now() - startTime;

    console.log(`[OCR] Completed in ${duration}ms`);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      lines: result.data.lines.map(line => ({
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox
      })),
      duration,
      raw: result.data
    };

  } catch (error) {
    console.error('[OCR] Error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Enhance text using DeepSeek API via Netlify function
 * @param {string} text - Raw OCR text to enhance
 * @returns {Promise<Object>} Enhanced text result
 */
export async function enhanceTextWithAI(text) {
  try {
    const apiUrl = '/api/enhance-text';
    const isOnline = navigator.onLine;

    if (!isOnline) {
      return {
        text,
        enhanced: false,
        message: 'Offline mode - AI enhancement unavailable'
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI enhancement failed');
    }

    const data = await response.json();

    return {
      text: data.text,
      enhanced: data.enhanced,
      original: data.original,
      message: data.message
    };

  } catch (error) {
    console.error('[AI Enhancement] Error:', error);
    // Return original text on error
    return {
      text,
      enhanced: false,
      message: 'AI enhancement unavailable'
    };
  }
}

/**
 * Process image with OCR and optionally enhance with AI
 * @param {string} imageSrc - Data URL of the image
 * @param {Object} options - Processing options
 * @param {boolean} options.enhance - Whether to enhance with AI (default: false)
 * @param {string} options.language - OCR language (default: 'eng')
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Final result with OCR text and enhancement
 */
export async function processImageComplete(imageSrc, options = {}) {
  const {
    enhance = false,
    language = 'eng',
    onProgress = () => {},
  } = options;

  onProgress({ status: 'ocr', progress: 0 });

  // Step 1: OCR Processing
  const ocrResult = await processImageWithOCR(imageSrc, {
    language,
    onProgress: (p) => onProgress({ status: 'ocr', progress: p.progress }),
  });

  if (!ocrResult.text.trim()) {
    return {
      text: '',
      confidence: 0,
      enhanced: false,
      message: 'No text detected in image'
    };
  }

  onProgress({ status: 'ocr-complete', progress: 1 });

  // Step 2: AI Enhancement (if enabled)
  if (enhance && ocrResult.text.trim().length > 10) {
    onProgress({ status: 'enhancing', progress: 0 });
    const aiResult = await enhanceTextWithAI(ocrResult.text);

    return {
      text: aiResult.text,
      originalText: ocrResult.text,
      confidence: ocrResult.confidence,
      enhanced: aiResult.enhanced,
      duration: ocrResult.duration,
      message: aiResult.message
    };
  }

  return {
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    enhanced: false,
    duration: ocrResult.duration,
    message: 'OCR complete'
  };
}

/**
 * Terminate Tesseract worker (call when app unmounts)
 */
export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

/**
 * Check if OCR is available
 * @returns {boolean} True if OCR can be used
 */
export function isOCRAvailable() {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof Tesseract !== 'undefined'
  );
}

/**
 * Get OCR status information
 * @returns {Object} Status info
 */
export function getOCRStatus() {
  return {
    available: isOCRAvailable(),
    offline: !navigator.onLine,
    workerInitialized: worker !== null
  };
}