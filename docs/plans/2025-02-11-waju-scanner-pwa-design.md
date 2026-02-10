# Waju Scanner PWA - Design Document

**Date:** 2025-02-11
**Project:** Waju Scanner PWA (Progressive Web App)
**Purpose:** Local document scanner with native mobile share functionality for friends

---

## 1. Overview

A client-side PWA document scanner that saves data locally and uses native mobile share functionality. Designed for personal use among friends with simple workflow: Scan → Share → Save to Google Drive (if needed) → Delete.

### Key Requirements
- Pure client-side application (minimal backend for AI enhancement only)
- PWA installable on mobile devices
- Local storage (IndexedDB) with auto-cleanup
- Native Share API integration
- Optional AI enhancement using DeepSeek API

---

## 2. Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 19 + Vite | Modern UI framework with fast build tool |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Storage | IndexedDB | Local data persistence |
| OCR | Tesseract.js | Client-side text recognition |
| PDF Generation | jsPDF | Client-side PDF creation |
| PWA | Workbox | Offline capability & installability |
| Share | Web Share API | Native mobile sharing |
| AI Enhancement | DeepSeek API | Text refinement via serverless function |
| Hosting | Netlify/Vercel | Free cloud hosting with SSL |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Browser (PWA)                 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  UI Layer    │  │   State Mgr  │  │ Storage API  │ │
│  │  (React)     │  │  (Context)   │  │ (IndexedDB)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │         │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌──────▼───────┐│
│  │   Camera    │  │   Image     │  │     OCR      ││
│  │   Gallery   │  │  Processing │  │ (Tesseract)  ││
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘│
└─────────┼──────────────────┼──────────────────┼────────┘
          │                  │                  │
          │              ┌───▼──────────────────▼───┐
          │              │      Share API (Blob)    │
          │              └──────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│           Netlify Functions / Vercel API                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/enhance-text → DeepSeek API                │  │
│  │  - Receives raw OCR text                         │  │
│  │  - Returns enhanced text                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Flow Asas

1. User opens PWA → Local storage load
2. Scan image from camera/gallery → Save to IndexedDB (temporary)
3. Crop + Auto-enhance → Client-side processing
4. Generate PDF → Blob in memory
5. Native Share API → User chooses destination
6. Data auto-delete after sharing (optional)

---

## 3. Components & UI

### Screen 1: Home

```
┌─────────────────────────────────┐
│  Header: Waju Scanner     [⚙] │
├─────────────────────────────────┤
│                                 │
│  [ Scan Document ]              │
│  (Large gradient button)        │
│  Multi-page • OCR • PDF         │
│                                 │
│  [ Scan ID Card ]               │
│  (Large gradient button)        │
│  Front + Back • Quick Export    │
│                                 │
│  Recent Scans (3 items max)     │
│  • doc1.pdf (2 pages) • [PDF]   │
│  • idcard.pdf • [PDF]           │
│                                 │
└─────────────────────────────────┘
```

### Screen 2: Scan View (Document)

```
┌─────────────────────────────────┐
│  ← Back  Document Scan        + │
├─────────────────────────────────┤
│  Pages: 2     [+ Add Page]      │
│                                 │
│  [📷] [📄] [📄] [🖼️]            │
│   ↑    ↑                        │
│  Active Inactive                │
│                                 │
│  < Page 1 / 2 >                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    Document Preview       │  │
│  │                           │  │
│  └───────────────────────────┘  │
│   [Crop]                        │
│                                 │
│  [Original] [Auto] [B&W]        │
│                                 │
│  [Process OCR]                  │
│  [Share PDF] [Share Text]       │
└─────────────────────────────────┘
```

### Screen 2: Scan View (ID Card)

```
┌─────────────────────────────────┐
│  ← Back  ID Card Scan          │
├─────────────────────────────────┤
│      ┌─────┐ ─── ┌─────┐       │
│      │ (1) │       │ (2) │       │
│      │Front│       │ Back│       │
│      └─────┘       └─────┘       │
│                                 │
│  ┌────────────┐  ┌────────────┐ │
│  │   Front    │  │    Back    │ │
│  │  Preview   │  │  Preview   │ │
│  └────────────┘  └────────────┘ │
│                                 │
│  [Capture Front]  [Capture Back]│
│                                 │
│  Output Style:                  │
│  [ Color ]  [ Grayscale ]       │
│                                 │
│  [Export ID Card PDF]           │
└─────────────────────────────────┘
```

### Screen 3: Share View (Modal)

```
┌─────────────────────────────────┐
│     Share Document              │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │    PDF Thumbnail          │  │
│  │    waju_scan_2025.pdf     │  │
│  └───────────────────────────┘  │
│                                 │
│  [ Share ] (Primary - Large)    │
│                                 │
│  OCR Text (if available):       │
│  ┌───────────────────────────┐  │
│  │ Extracted text preview... │  │
│  └───────────────────────────┘  │
│  [Copy Text]                    │
│                                 │
│  [Delete] [Cancel]              │
└─────────────────────────────────┘
```

### UI Design Principles

- **Thumb-friendly**: Primary buttons at bottom, large touch targets (min 44px)
- **Mobile-first**: Optimized for vertical scrolling
- **Swipe gestures**: Navigate between pages
- **Bottom navigation**: Quick access to common actions
- **Progress indicators**: Clear feedback for multi-page scans

---

## 4. Data Flow & State Management

### Global State (React Context)

```javascript
const AppContext = {
  // Navigation
  currentMode: 'home' | 'document' | 'idcard' | 'share',

  // Document Mode State
  pages: [
    {
      id: string,
      image: DataURL,
      filter: 'original' | 'auto' | 'bw',
      timestamp: number
    }
  ],
  currentPageIndex: number,

  // ID Card Mode State
  idCard: {
    front: DataURL | null,
    back: DataURL | null,
    colorMode: 'color' | 'grayscale',
    step: 'front' | 'back'
  },

  // Processing State
  isProcessing: boolean,
  processingStage: string,

  // OCR State
  ocrResult: {
    raw: string | null,
    enhanced: string | null,
    isEnhancing: boolean
  },

  // Settings
  settings: {
    autoEnhance: boolean,
    defaultFilter: 'original' | 'auto' | 'bw',
    aiEnhancement: boolean,
    autoDelete: boolean,
    keepForHours: number
  }
}
```

### IndexedDB Schema

**Database:** `waju-scanner-db` (Version 1)

**Store: `scans`**
```javascript
{
  id: string (timestamp + random),
  type: 'document' | 'idcard',
  date: ISOString,
  pages: [
    {
      id: string,
      image: DataURL,
      filter: string
    }
  ],
  idCard: {
    front: DataURL | null,
    back: DataURL | null,
    colorMode: string
  },
  ocrResult: {
    raw: string | null,
    enhanced: string | null
  },
  expiresAt: timestamp
}
```

**Store: `settings`**
```javascript
{
  key: string,
  value: any
}
```

### Data Flow Diagrams

#### Image Capture Flow
```
Camera/Gallery → Blob → Canvas Resize → DataURL
                                  ↓
                              Add to State
                                  ↓
                         Save to IndexedDB
```

#### Filter Application Flow
```
Original Image → Canvas Filter Algorithm
                           ↓
                    Enhanced Pixel Data
                           ↓
                    New DataURL → Update State → Save to IndexedDB
```

#### PDF Generation Flow
```
State.pages → jsPDF → PDF Blob
                           ↓
                    File Object → Web Share API
```

#### OCR Processing Flow
```
Image → Tesseract.js (client-side)
           ↓
      Raw OCR Text
           ↓
      ┌──────┴──────┐
      ↓             ↓
   [AI ON]      [AI OFF]
      ↓             ↓
API Endpoint    Raw Text
      ↓             ↓
DeepSeek API    (Skip)
      ↓             ↓
Enhanced Text ───┴──→ State + UI
```

#### Share Flow
```
PDF Blob +/or Text → Web Share API
                           ↓
              User Chooses Destination
                           ↓
           (WhatsApp | Telegram | Drive | Email)
                           ↓
                Success → Auto-delete (if enabled)
```

### Auto-Cleanup Logic

```javascript
// Clean up expired scans on app load
const cleanupExpiredScans = async () => {
  const now = Date.now();
  const expiredScans = await db.scans
    .where('expiresAt')
    .below(now)
    .toArray();

  await db.scans.bulkDelete(expiredScans.map(s => s.id));
};

// Set expiry: 1 hour after creation by default
const saveScan = async (scan) => {
  const expireHours = settings.keepForHours || 1;
  scan.expiresAt = Date.now() + (expireHours * 60 * 60 * 1000);
  await db.scans.add(scan);
};
```

---

## 5. DeepSeek Integration

### Backend Minimal (Serverless Function)

**File:** `netlify/api/enhance-text.js`

```javascript
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { text } = JSON.parse(event.body);

  try {
    const response = await axios.post(
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        enhanced: response.data.choices[0].message.content
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AI enhancement failed' })
    };
  }
};
```

### Environment Variables (Netlify)

```bash
# .env (local) or Netlify Environment Variables
DEEPSEEK_API_KEY=your_api_key_here
```

### Rate Limiting

```javascript
// Simple rate limiting using Netlify Functions
const rateLimit = new Map();

exports.handler = async (event) => {
  const ip = event.headers['client-ip'] || 'unknown';
  const now = Date.now();
  const oneMinute = 60 * 1000;

  // Clean old entries
  for (const [key, value] of rateLimit.entries()) {
    if (now - value > oneMinute) rateLimit.delete(key);
  }

  // Check rate limit
  const requests = rateLimit.get(ip) || 0;
  if (requests >= 10) {
    return { statusCode: 429, body: 'Too many requests' };
  }

  rateLimit.set(ip, requests + 1);

  // ... rest of the function
};
```

### Fallback Mechanism

```javascript
const enhanceText = async (rawText) => {
  if (!settings.aiEnhancement) return rawText;

  try {
    const response = await fetch('/.netlify/functions/enhance-text', {
      method: 'POST',
      body: JSON.stringify({ text: rawText })
    });
    const data = await response.json();
    return data.enhanced;
  } catch (error) {
    console.warn('AI enhancement failed, using raw text');
    return rawText; // Fallback to raw text
  }
};
```

---

## 6. Error Handling & Edge Cases

### Error Scenarios & Solutions

| Scenario | User Action | System Response |
|----------|-------------|-----------------|
| **Camera Access Denied** | Enable permission or use gallery | Show prominent gallery button |
| **Tesseract OCR Failed** | Retry or skip | "Retry" button + PDF-only option |
| **DeepSeek API Error** | Use raw text | Auto-fallback + "Disable AI" toggle |
| **Storage Full** | Delete old scans | "Clear Old Scans" button |
| **Share API Not Supported** | Download PDF | Fallback to download |
| **Offline Mode** | Continue with limited features | "Offline" badge + disable AI |
| **Large Image** | Auto-compress | Resize to max 2048px + progress |
| **Network Error** | Auto-retry | 3x retry with backoff + cache |

### Offline Capability

**Available Offline:**
- ✓ Camera capture
- ✓ Gallery upload
- ✓ Image filters
- ✓ OCR (Tesseract.js - WASM bundled)
- ✓ PDF generation
- ✗ AI Enhancement (DeepSeek API)
- ✗ Share API (browser limitation)

**Offline UI Indicators:**
```
┌─────────────────────────────────┐
│  🔴 Offline  Waju Scanner  [⚙] │
├─────────────────────────────────┤
│  AI Enhancement disabled        │
│  Share available when online    │
│                                 │
└─────────────────────────────────┘
```

### Image Processing Limits

```javascript
const MAX_IMAGE_SIZE = 2048; // px
const MAX_IMAGE_MB = 10; // file size limit

const processImage = async (file) => {
  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Validate file size
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error('File too large');
  }

  // Resize image
  const canvas = await resizeImage(file, MAX_IMAGE_SIZE);
  return canvas.toDataURL('image/jpeg', 0.85);
};
```

### Timeout Handling

```javascript
const withTimeout = async (promise, ms, errorMessage) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
};

// Usage
try {
  const ocrResult = await withTimeout(
    Tesseract.recognize(image, 'eng'),
    30000, // 30 seconds
    'OCR processing timeout'
  );
} catch (error) {
  // Handle timeout
}
```

---

## 7. Testing Strategy

### Test Layers

#### 1. Unit Testing (Vitest)

**Test Files:**
```
src/utils/__tests__/
  - imageFilters.test.js
  - imageResize.test.js
  - indexedDB.test.js
  - pdfGeneration.test.js
  - ocrHelpers.test.js

src/context/__tests__/
  - AppContext.test.js
```

**Example Test:**
```javascript
describe('imageFilters', () => {
  it('should apply grayscale filter correctly', () => {
    const result = applyGrayscale(mockImageData);
    expect(result[0]).toBe(result[1]); // r = g
    expect(result[1]).toBe(result[2]); // g = b
  });

  it('should apply auto-enhance filter', () => {
    const result = applyAutoEnhance(mockImageData);
    expect(result.brightness).toBeGreaterThan(100);
  });
});
```

#### 2. Component Testing (React Testing Library)

**Test Files:**
```
src/components/__tests__/
  - HomeScreen.test.jsx
  - ScanView.test.jsx
  - ShareModal.test.jsx
  - CropTool.test.jsx
```

**Example Test:**
```javascript
describe('HomeScreen', () => {
  it('should show scan buttons', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Scan Document')).toBeInTheDocument();
    expect(screen.getByText('Scan ID Card')).toBeInTheDocument();
  });

  it('should navigate to document scan on click', () => {
    const mockNavigate = vi.fn();
    render(<HomeScreen onNavigate={mockNavigate} />);
    fireEvent.click(screen.getByText('Scan Document'));
    expect(mockNavigate).toHaveBeenCalledWith('document');
  });
});
```

#### 3. E2E Testing (Playwright)

**Test Files:**
```
e2e/
  - single-document.spec.js
  - multi-page.spec.js
  - idcard.spec.js
  - ocr.spec.js
```

**Example Test:**
```javascript
test('scan single document and share', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Scan Document');

  // Simulate camera capture
  await page.click('[data-testid="camera-button"]');
  await page.click('[data-testid="capture-button"]');

  // Apply filter
  await page.click('text=Auto');

  // Share
  await page.click('text=Share PDF');
  // Verify share sheet would open (mocked)
});

test('multi-page document workflow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Scan Document');

  // Add first page
  await captureImage(page);
  await page.click('text=Add Page');

  // Add second page
  await captureImage(page);
  await page.click('text=Add Page');

  // Verify 2 pages
  expect(await page.locator('.page-thumbnail').count()).toBe(2);
});
```

#### 4. Manual Testing Matrix

| Platform | Browser | Camera | Gallery | Share | OCR | PWA Install |
|----------|---------|--------|---------|-------|-----|-------------|
| Android | Chrome | ✅ | ✅ | ✅ | ✅ | ✅ |
| Android | Firefox | ✅ | ✅ | ✅ | ✅ | ✅ |
| Android | Samsung Browser | ✅ | ✅ | ✅ | ✅ | ✅ |
| iOS | Safari | ✅ | ✅ | ✅ | ✅ | ✅ |
| iOS | Chrome | ✅ | ✅ | ✅ | ✅ | ✅ |
| Desktop | Chrome | ❌ | ✅ | ❌ | ✅ | ✅ |
| Desktop | Edge | ❌ | ✅ | ❌ | ✅ | ✅ |
| Desktop | Firefox | ❌ | ✅ | ❌ | ✅ | ✅ |

---

## 8. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Image processing (crop + filter) | < 2s | Per image |
| OCR (Tesseract.js) | < 10s | English text |
| AI Enhancement (DeepSeek) | < 5s | Network dependent |
| PDF Generation | < 3s | 10 pages max |
| First Contentful Paint | < 1.5s | PWA install |
| Time to Interactive | < 3s | |
| Bundle Size (gzipped) | < 500KB | |
| IndexedDB Storage Limit | 90% of quota | Auto-cleanup |

### Performance Optimization

```javascript
// Lazy load heavy dependencies
const Tesseract = lazy(() => import('tesseract.js'));
const jsPDF = lazy(() => import('jspdf'));

// Image compression
const compressImage = async (file, quality = 0.85) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Resize logic...
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Debounce OCR requests
const debouncedOCR = debounce(async (image) => {
  return Tesseract.recognize(image, 'eng');
}, 1000);
```

---

## 9. Security & Privacy

### Security Measures

#### 1. API Key Protection
- DeepSeek API key in environment variables only
- Serverless function hides key from client
- Rate limiting: 10 req/min per IP

#### 2. Content Security Policy
```javascript
// vite.config.js
export default {
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        img-src 'self' data: blob:;
        connect-src 'self' https://api.deepseek.com;
      `.replace(/\s+/g, ' ')
    }
  }
};
```

#### 3. Data Privacy
- All scans in IndexedDB (client-side only)
- No tracking by default
- Optional anonymous analytics (opt-in)
- Auto-delete after configurable time

#### 4. HTTPS Enforcement
```javascript
// Force HTTPS in production
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace('https://' + location.href.substring(7));
}
```

#### 5. Input Validation
```javascript
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP allowed');
  }
  if (file.size > maxSize) {
    throw new Error('File too large (max 10MB)');
  }
  return true;
};
```

#### 6. Share API Safety
```javascript
const shareContent = async (pdfBlob, text) => {
  const files = [new File([pdfBlob], 'scan.pdf', { type: 'application/pdf' })];

  try {
    await navigator.share({
      title: 'Scanned Document',
      text: text || 'Document scanned with Waju Scanner',
      files
    });
    // Share successful
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled
    } else {
      // Share failed, fallback to download
      downloadFile(pdfBlob, 'scan.pdf');
    }
  }
};
```

#### 7. DeepSeek API Safety
```javascript
// PII Masking (optional)
const maskPII = (text) => {
  return text
    .replace(/\d{6}-\d{2}-\d{4}/g, 'XXXXXX-XX-XXXX') // MyKad pattern
    .replace(/\b\d{10,}\b/g, 'XXXXXXXXXX'); // Long numbers
};

// Disclaimer in UI
<div className="ai-disclaimer">
  ⚠️ Text enhancement uses external AI. Do not share sensitive information.
</div>
```

---

## 10. Deployment

### Netlify Deployment

**netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

**Environment Variables (Netlify Dashboard)**
```
DEEPSEEK_API_KEY=your_api_key_here
NODE_ENV=production
```

### Vercel Alternative

**vercel.json**
```json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 11. Project Structure

```
waju-scanner-pwa/
├── public/                    # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── service-worker.js     # Service worker
│   ├── icons/               # App icons (192x192, 512x512)
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── maskable-icon.png
│   └── robots.txt
│
├── src/
│   ├── components/          # React components
│   │   ├── HomeScreen.jsx
│   │   ├── ScanView.jsx
│   │   ├── ShareModal.jsx
│   │   ├── CropTool.jsx
│   │   ├── FilterButton.jsx
│   │   ├── PageThumbnail.jsx
│   │   └── CameraCapture.jsx
│   │
│   ├── context/             # React Context
│   │   └── AppContext.jsx
│   │
│   ├── utils/               # Utility functions
│   │   ├── indexedDB.js     # IndexedDB wrapper
│   │   ├── imageFilters.js  # Filter algorithms
│   │   ├── imageResize.js   # Image processing
│   │   ├── pdfGenerator.js  # jsPDF helper
│   │   ├── ocr.js           # Tesseract wrapper
│   │   └── share.js         # Share API helper
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useCamera.js
│   │   ├── useIndexedDB.js
│   │   └── useOCR.js
│   │
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
│
├── netlify/                 # Netlify functions
│   └── api/
│       └── enhance-text.js  # DeepSeek endpoint
│
├── tests/                   # Test files
│   ├── unit/                # Vitest tests
│   ├── components/          # Component tests
│   └── e2e/                 # Playwright tests
│
├── docs/
│   └── plans/
│       └── 2025-02-11-waju-scanner-pwa-design.md
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
└── README.md
```

---

## 12. Implementation Roadmap

### Phase 1: Core MVP (1-2 weeks)

**Week 1:**
- [ ] Project setup (Vite + React + Tailwind)
- [ ] PWA configuration (manifest + service worker)
- [ ] Basic UI scaffold (3 screens)
- [ ] Camera capture implementation
- [ ] Gallery upload implementation
- [ ] Basic crop tool

**Week 2:**
- [ ] PDF generation with jsPDF
- [ ] Share API integration
- [ ] IndexedDB storage wrapper
- [ ] Navigation between screens
- [ ] Basic error handling

### Phase 2: OCR & AI (1 week)

- [ ] Tesseract.js integration
- [ ] OCR result display
- [ ] Netlify Function for DeepSeek
- [ ] AI enhancement toggle
- [ ] Copy text to clipboard

### Phase 3: Filters & Polish (1 week)

- [ ] Auto-enhance filter algorithm
- [ ] B&W filter implementation
- [ ] Multi-page support
- [ ] Page management (add/delete/reorder)
- [ ] ID card special flow
- [ ] Filter state persistence

### Phase 4: Testing & Deployment (1 week)

- [ ] Unit tests (Vitest)
- [ ] Component tests (RTL)
- [ ] E2E tests (Playwright)
- [ ] Real device testing (Android/iOS)
- [ ] PWA testing (install, offline)
- [ ] Deploy to Netlify
- [ ] Bug fixes and polish

### Phase 5: Enhancement (Optional)

- [ ] Cloud storage integration
- [ ] Batch processing
- [ ] Advanced filters
- [ ] Document templates
- [ ] User preferences sync

---

## 13. Success Criteria

### Must Have (MVP)
- [ ] Scan document from camera/gallery
- [ ] Crop and basic filters
- [ ] Generate PDF
- [ ] Share via native API
- [ ] PWA installable
- [ ] Works offline (basic features)

### Should Have
- [ ] Multi-page document support
- [ ] OCR text extraction
- [ ] AI text enhancement
- [ ] ID card special flow
- [ ] Auto-cleanup old scans

### Nice to Have
- [ ] Advanced filters
- [ ] Batch processing
- [ ] Document templates
- [ ] Cloud backup
- [ ] User accounts

---

## Appendix

### A. References

- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Web Share API](https://web.dev/web-share/)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [DeepSeek API](https://platform.deepseek.com/docs)

### B. Open Questions

1. Should we support document templates (receipts, forms, etc.)?
2. Is email integration needed for share options?
3. Should we add a dark mode?

### C. Assumptions

1. Users primarily use mobile devices (Android/iOS)
2. DeepSeek API is available and stable
3. Netlify free tier is sufficient for deployment
4. IndexedDB storage is adequate for typical use

---

**Document Status:** ✅ Design Complete - Ready for Implementation Planning

**Next Steps:**
1. Review design with stakeholders
2. Create detailed implementation plan
3. Set up git worktree for isolated development
4. Begin Phase 1 implementation