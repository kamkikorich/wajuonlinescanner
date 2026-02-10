# Waju Scanner PWA - Design Document

**Date:** 2026-02-11
**Version:** 1.0
**Purpose:** Design spec for a local-first document scanner with native share functionality

---

## Overview

A Progressive Web App (PWA) document scanner that stores data locally and uses the phone's native share functionality. Designed for personal/small-group use with friends.

### Core Workflow
```
Scan Document → Crop + Auto-Enhance → (Optional) OCR + AI Enhancement → Native Share → Save to Google Drive (if needed) → Delete
```

---

## Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Storage | IndexedDB (temporary scans), localStorage (preferences) |
| OCR | Tesseract.js (client-side) |
| AI Enhancement | DeepSeek API via serverless function |
| PDF Generation | jsPDF (client-side) |
| PWA | Workbox (offline capability, installability) |
| Share | Web Share API (native mobile share) |
| Hosting | Netlify (free tier) |
| Testing | Vitest (unit), Playwright (E2E) |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    React    │  │  Tesseract  │  │    jsPDF    │        │
│  │   (UI/State)│  │   (Client   │  │ (Generation)│        │
│  │             │  │   OCR)      │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘        │
│         │                │                                  │
│         └────────────────┴──────────────────┐               │
│                    │                        │               │
│  ┌─────────────────▼────────────────────┐   │               │
│  │         IndexedDB (Local Storage)     │   │               │
│  │  - Temporary scan data               │   │               │
│  │  - User preferences                  │   │               │
│  └──────────────────────────────────────┘   │               │
├─────────────────────────────────────────────┼───────────────┤
│                                             │               │
│  ┌─────────────────────────────────────┐   │               │
│  │       Web Share API                 │   │               │
│  │   (WhatsApp, Telegram, Drive, etc.) │   │               │
│  └─────────────────────────────────────┘   │               │
│                                             │               │
│                     HTTP                     │               │
│                     │                        │               │
└─────────────────────┼────────────────────────┘               │
                      │                                        │
┌─────────────────────▼──────────────────────────────────────┐
│              Netlify Functions (Serverless)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │  /api/enhance-text                                  │  │
│  │  - Receives raw OCR text                            │  │
│  │  - Calls DeepSeek API                               │  │
│  │  - Returns enhanced text                            │  │
│  │  - API key stored in environment variables          │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │    DeepSeek API       │
                └───────────────────────┘
```

### Key Principles

1. **Local-First**: All processing happens on the user's device
2. **No Persistent Server**: Data is temporary, auto-deleted after sharing
3. **Privacy**: Data never leaves the device except via user-initiated share
4. **Offline Capable**: Works without internet (except AI enhancement)
5. **Simple & Fast**: Minimal features, focus on core scanning workflow

---

## Components & UI

### Screen Structure

```
Home Screen
├── Header (App Name + Settings)
├── Main Actions
│   ├── Scan Document Button
│   └── Scan ID Card Button
└── Recent Scans (from IndexedDB)

Scan View (Document/ID Card)
├── Header (Back + Page Counter)
├── Camera/Gallery Capture
├── Multi-page Thumbnails
├── Crop Tool Overlay
├── Filter Buttons (Original | Auto-Enhance | B&W)
├── Preview Area
└── Action Buttons (Add Page | Next)

Share View
├── PDF Preview Thumbnail
├── OCR Result Preview (modal)
├── Primary: Share Button (Native Share API)
├── Secondary: Copy Text Button
└── Delete Option
```

### Component Hierarchy

```
App
├── Header
├── HomeScreen
│   ├── ActionButtons
│   └── RecentScans
├── ScanScreen
│   ├── CameraCapture
│   ├── GalleryUpload
│   ├── PageThumbnails
│   ├── CropOverlay
│   ├── FilterControls
│   └── ImagePreview
├── ShareScreen
│   ├── PDFPreview
│   ├── OCRPreview
│   └── ShareButtons
├── SettingsScreen
└── ToastNotification
```

### ID Card Special Flow

```
Step 1: Capture FRONT
    ↓
Step 2: Capture BACK
    ↓
Preview: Side-by-side or stacked
    ↓
Combine: Generate single PDF with both sides
    ↓
Share via Native Share API
```

### Mobile-First UX Guidelines

- **Touch Targets**: Minimum 44x44px
- **Thumb Zone**: Place primary actions in bottom 30% of screen
- **Gestures**: Swipe for page navigation, pinch for zoom (preview)
- **Feedback**: Visual loading states, haptic feedback on actions
- **Animations**: Smooth transitions (300-500ms), no jarring movements

---

## Data Flow & State Management

### Global State Schema

```javascript
{
  // App Mode
  currentMode: 'home' | 'document' | 'idcard' | 'share',

  // Document Mode
  pages: [
    {
      id: string,
      image: string (DataURL),
      filter: 'original' | 'auto' | 'bw',
      createdAt: timestamp
    }
  ],
  currentPageIndex: number,
  isCropping: boolean,
  cropSelection: { x, y, width, height },

  // ID Card Mode
  idCard: {
    front: string | null,
    back: string | null,
    step: 'front' | 'back',
    colorMode: 'color' | 'grayscale'
  },

  // Processing State
  isProcessing: boolean,
  processingType: 'capture' | 'filter' | 'ocr' | 'pdf' | 'share',

  // OCR Results
  ocrResult: {
    raw: string | null,
    enhanced: string | null,
    sourcePageIndex: number
  },

  // Settings
  settings: {
    autoEnhance: boolean,
    defaultFilter: 'auto' | 'original' | 'bw',
    aiEnhancement: boolean,
    autoDelete: boolean,
    deleteAfterHours: number
  }
}
```

### IndexedDB Schema

```javascript
// Database: 'waju-scanner-db', Version: 1

Stores:
{
  'scans': {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'date', keyPath: 'date' },
      { name: 'type', keyPath: 'type' }
    ],
    schema: {
      id: number,
      date: timestamp,
      type: 'document' | 'idcard',
      pages: array,
      metadata: object
    }
  },

  'settings': {
    keyPath: 'key',
    schema: {
      key: string,
      value: any
    }
  }
}
```

### Data Flow Diagrams

#### 1. Image Capture Flow
```
User Action (Camera/Gallery)
    ↓
File Input / MediaDevices API
    ↓
Canvas (resize to max 2048px)
    ↓
DataURL Generation
    ↓
Add to State (pages array)
    ↓
Save to IndexedDB (temporary)
```

#### 2. Filter Application Flow
```
User Selects Filter
    ↓
Get Original Image (from State)
    ↓
Canvas Processing (apply filter)
    ↓
Generate New DataURL
    ↓
Update State (replace image)
    ↓
Update IndexedDB
```

#### 3. OCR + AI Enhancement Flow
```
User Clicks "Process OCR"
    ↓
Extract Image (from State)
    ↓
Tesseract.js Recognize
    ↓
Raw OCR Text
    ↓
[Optional] Send to DeepSeek API
    ↓
Enhanced Text
    ↓
Update State (ocrResult)
    ↓
Display to User
```

#### 4. PDF Generation & Share Flow
```
User Clicks "Share"
    ↓
Generate PDF (jsPDF from State.pages)
    ↓
Create Blob
    ↓
Create File Object
    ↓
Web Share API (PDF Blob)
    ↓
User Chooses App (WhatsApp, Drive, etc.)
    ↓
[Optional] Auto-delete from State/IndexedDB
```

### State Management Implementation

Using React Context API with custom hooks:

```javascript
// contexts/AppContext.jsx
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = {
    state,
    actions: {
      addPage: (image) => dispatch({ type: 'ADD_PAGE', payload: image }),
      removePage: (index) => dispatch({ type: 'REMOVE_PAGE', payload: index }),
      applyFilter: (index, filter) => dispatch({ type: 'APPLY_FILTER', payload: { index, filter } }),
      setOCRResult: (result) => dispatch({ type: 'SET_OCR', payload: result }),
      clearAll: () => dispatch({ type: 'CLEAR_ALL' })
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// hooks/useApp.js
export const useApp = () => useContext(AppContext);
```

---

## DeepSeek API Integration

### Serverless Function Structure

```javascript
// netlify/api/enhance-text.js
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { text } = JSON.parse(event.body);

    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Raw OCR dari scanned document. Fix common OCR errors, format teks dengan baik (headers, bullet points). Jangan ringkaskan atau ubah makna. Output teks yang dipermudahkan saja."
          },
          {
            role: "user",
            content: text
          }
        ]
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
      body: JSON.stringify({ text: response.data.choices[0].message.content })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to enhance text' })
    };
  }
};
```

### Prompt Engineering

```
System Prompt:
"You are a professional document editor. I will give you raw OCR text from a scanned document.

Your job is to:
1. Fix common OCR typos (misspelled words, broken lines)
2. Format the text nicely (headers, bullet points, paragraphs)
3. Do NOT summarize or change the meaning. Keep all information.
4. Output ONLY the corrected text, no conversational filler.

Keep the output simple and clean."
```

### Fallback Mechanism

```javascript
// utils/ocr.js
export async function processOCR(image, options = { ai: true }) {
  try {
    // Step 1: Client-side OCR
    const rawText = await Tesseract.recognize(image, 'eng');

    // Step 2: AI Enhancement (if enabled)
    if (options.ai) {
      try {
        const enhanced = await fetch('/.netlify/functions/enhance-text', {
          method: 'POST',
          body: JSON.stringify({ text: rawText })
        });
        const result = await enhanced.json();
        return { raw: rawText, enhanced: result.text };
      } catch (error) {
        console.warn('AI enhancement failed, using raw text');
        return { raw: rawText, enhanced: null };
      }
    }

    return { raw: rawText, enhanced: null };
  } catch (error) {
    throw new Error('OCR processing failed');
  }
}
```

### Rate Limiting

```javascript
// Simple rate limiting in serverless function
const rateLimit = new Map();

exports.handler = async (event) => {
  const ip = event.headers['client-ip'] || 'unknown';
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];

  // Remove requests older than 1 minute
  const recentRequests = requests.filter(t => now - t < 60000);

  if (recentRequests.length >= 10) {
    return { statusCode: 429, body: 'Too many requests' };
  }

  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);

  // ... rest of the handler
};
```

---

## Error Handling & Edge Cases

### Error Scenarios

| Scenario | User Message | Action |
|----------|--------------|--------|
| Camera Access Denied | "Camera access denied. Please enable camera permission or use gallery upload." | Show gallery button |
| Tesseract Failed | "OCR failed. Please try again with better lighting." | Provide Retry, Skip option |
| DeepSeek API Error | "AI enhancement unavailable. Using raw text." | Use raw text, show disable toggle |
| Storage Full | "Storage almost full. Please delete old scans." | Show clear button |
| Share Not Supported | "Native share not supported in this browser." | Download PDF fallback |
| Network Error | "Network error. Please check your connection." | Retry button |
| Large Image | "Processing large image. Please wait..." | Progress indicator |
| Processing Timeout | "Taking too long. Would you like to cancel?" | Cancel/Continue option |

### Offline Handling

```javascript
// utils/offline.js
export function checkOnlineStatus() {
  return navigator.onLine;
}

export function setupOnlineListeners() {
  window.addEventListener('online', () => {
    showToast('Back online!', 'success');
  });

  window.addEventListener('offline', () => {
    showToast('Offline mode enabled', 'warning');
  });
}

// Feature availability based on status
export function getAvailableFeatures(online) {
  return {
    camera: true,
    gallery: true,
    filters: true,
    ocrBasic: true,
    ocrAI: online,
    share: online && navigator.share,
    upload: online
  };
}
```

### Storage Management

```javascript
// utils/storage.js
export async function checkStorageQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const percentage = (usage / quota) * 100;

    if (percentage > 80) {
      showToast('Storage almost full. Consider clearing old scans.', 'warning');
    }

    return { usage, quota, percentage };
  }
  return null;
}

export async function clearOldScans() {
  const db = await openDB('waju-scanner-db');
  const tx = db.transaction('scans', 'readwrite');
  const store = tx.objectStore('scans');
  const index = store.index('date');

  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  let count = 0;

  for await (const cursor of index.iterate()) {
    if (cursor.value.date < cutoff) {
      await cursor.delete();
      count++;
    }
  }

  await tx.done;
  return count;
}
```

---

## Testing Strategy

### Unit Testing (Vitest)

```javascript
// tests/filters.test.js
describe('Image Filters', () => {
  test('grayscale filter converts to gray', async () => {
    const result = await applyFilter(mockImage, 'grayscale');
    expect(result).toBeGray();
  });

  test('bw filter creates black and white', async () => {
    const result = await applyFilter(mockImage, 'bw');
    expect(result).toBeBlackAndWhite();
  });

  test('auto-enhance improves contrast', async () => {
    const result = await applyFilter(mockImage, 'auto');
    expect(result.contrast).toBeGreaterThan(mockImage.contrast);
  });
});

// tests/ocr.test.js
describe('OCR Processing', () => {
  test('extracts text from image', async () => {
    const result = await processOCR(testImage);
    expect(result.raw).toContain('expected text');
  });

  test('falls back to raw text on AI error', async () => {
    const result = await processOCR(testImage, { ai: true, mockError: true });
    expect(result.raw).toBeTruthy();
    expect(result.enhanced).toBeNull();
  });
});
```

### Component Testing (React Testing Library)

```javascript
// tests/ScanScreen.test.jsx
describe('ScanScreen', () => {
  test('shows camera and gallery buttons', () => {
    render(<ScanScreen mode="document" />);
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Gallery')).toBeInTheDocument();
  });

  test('adds page to state on capture', async () => {
    const { getByText, user } = render(<ScanScreen mode="document" />);
    await user.click(getByText('Camera'));
    // Simulate capture
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)

```javascript
// tests/e2e/scan-workflow.spec.js
test('complete scan workflow', async ({ page }) => {
  await page.goto('/');

  // Click scan document
  await page.click('text=Scan Document');

  // Capture image
  await page.click('text=Camera');
  await page.waitForTimeout(1000);

  // Apply filter
  await page.click('text=Auto-Enhance');

  // Process OCR
  await page.click('text=Process OCR');
  await page.waitForSelector('text=Scanned Text:');

  // Share
  await page.click('text=Share');
  // Verify share dialog appears (platform-specific)
});

test('id card flow', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Scan ID Card');
  await page.click('text=Capture Front');
  await page.click('text=Capture Back');
  await page.click('text=Export ID Card PDF');

  expect(page).toHaveURL('/share');
});
```

### Testing Matrix

| Platform | Browser | Camera | Gallery | Share API | OCR | PWA Install |
|----------|---------|--------|---------|-----------|-----|-------------|
| Android | Chrome | ✓ | ✓ | ✓ | ✓ | ✓ |
| Android | Firefox | ✓ | ✓ | ✓ | ✓ | ✓ |
| iOS | Safari | ✓ | ✓ | ✓ | ✓ | ✓ |
| iOS | Chrome | ✓ | ✓ | ✓ | ✓ | ✓ |
| Desktop | Chrome | ✗ | ✓ | ✗ | ✓ | ✓ |
| Desktop | Firefox | ✗ | ✓ | ✗ | ✓ | ✓ |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Image Processing | <2s per image | Canvas filter operations |
| OCR (Tesseract) | <10s per page | Tesseract recognize() |
| OCR (DeepSeek) | <5s per page | API response time |
| PDF Generation | <3s per doc | jsPDF operations |
| Bundle Size | <500KB gzipped | Build output |
| FCP | <1.5s | Lighthouse score |
| Lighthouse Score | >90 | Accessibility, Best Practices, Performance |

---

## Security & Privacy

### Security Measures

1. **API Key Protection**
   - DeepSeek API key in Netlify environment variables
   - Serverless function hides key from client
   - Rate limiting: 10 requests/minute/IP

2. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy"
         content="default-src 'self';
                  script-src 'self' 'unsafe-inline' 'unsafe-eval';
                  img-src 'self' data: blob:;
                  connect-src 'self' https://api.deepseek.com;">
   ```

3. **Data Privacy**
   - All scans in IndexedDB (client-side only)
   - No analytics/tracking by default
   - Optional opt-in for anonymous stats
   - Auto-delete after 24 hours (configurable)

4. **HTTPS Enforcement**
   - PWA requires HTTPS for camera
   - Netlify provides free SSL
   - Service worker HTTPS-only

5. **Input Validation**
   - File types: jpg, png, webp only
   - File size: max 10MB per image
   - Filename sanitization

6. **Share Safety**
   - Validate data before sharing
   - Warning for sensitive info
   - No auto-share without confirmation

7. **DeepSeek Safety**
   - Sanitize text before API
   - Consider PII masking
   - Disclaimer about external API

### Privacy Policy Snippet

```
Waju Scanner processes all data locally on your device.
- No account required
- No data sent to our servers
- Scan data is temporary and auto-deleted
- AI enhancement sends text to DeepSeek API only when you request it
- You control when and what you share via native share functionality
```

---

## Deployment

### Netlify Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[dev]
  command = "npm run dev"
  port = 5173
  targetPort = 5173

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### Environment Variables

```bash
# Netlify Environment Variables
DEEPSEEK_API_KEY=your_api_key_here
NODE_ENV=production
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
      - run: npm run test
      - run: npm run build

      - uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Project Structure

```
waju-scanner-pwa/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── netlify/
│   └── api/
│       └── enhance-text.js
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   ├── sw.js
│   └── icons/
│       ├── icon-72.png
│       ├── icon-96.png
│       ├── icon-128.png
│       ├── icon-144.png
│       ├── icon-152.png
│       ├── icon-192.png
│       ├── icon-384.png
│       └── icon-512.png
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Toast.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── ScanScreen.jsx
│   │   ├── ShareScreen.jsx
│   │   └── SettingsScreen.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   ├── hooks/
│   │   ├── useApp.js
│   │   ├── useCamera.js
│   │   ├── useOCR.js
│   │   └── useIndexedDB.js
│   ├── utils/
│   │   ├── filters.js
│   │   ├── ocr.js
│   │   ├── pdf.js
│   │   └── storage.js
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   ├── unit/
│   ├── components/
│   └── e2e/
├── .eslintrc.js
├── .gitignore
├── index.html
├── netlify.toml
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── vitest.config.js
```

---

## Implementation Roadmap

### Phase 1: Core MVP (1-2 weeks)
- [ ] Project setup (Vite + React + Tailwind)
- [ ] PWA configuration (manifest + service worker)
- [ ] Basic UI (Home + Scan + Share screens)
- [ ] Camera & Gallery capture
- [ ] Simple crop tool
- [ ] PDF generation & export
- [ ] Basic state management

### Phase 2: OCR & AI (1 week)
- [ ] Tesseract.js integration
- [ ] Netlify Function for DeepSeek API
- [ ] OCR result display & copy
- [ ] AI enhancement toggle
- [ ] Error handling for OCR/AI

### Phase 3: Filters & Polish (1 week)
- [ ] Auto-enhance filter
- [ ] B&W filter
- [ ] Multi-page support
- [ ] ID card special flow
- [ ] Settings screen
- [ ] Toast notifications

### Phase 4: Testing & Deployment (1 week)
- [ ] Unit tests (Vitest)
- [ ] Component tests
- [ ] E2E tests (Playwright)
- [ ] PWA testing on real devices
- [ ] Deploy to Netlify
- [ ] Bug fixes & polish

---

## Success Criteria

### Functional Requirements
- [ ] Capture images from camera and gallery
- [ ] Apply filters (original, auto-enhance, B&W)
- [ ] Generate PDF from single or multiple pages
- [ ] Extract text using Tesseract.js
- [ ] Enhance text using DeepSeek API (optional)
- [ ] Share via native Web Share API
- [ ] ID card special flow (front + back)
- [ ] Work offline (except AI enhancement)

### Non-Functional Requirements
- [ ] Bundle size <500KB gzipped
- [ ] Lighthouse score >90
- [ ] PWA installable on iOS and Android
- [ ] Works offline (basic features)
- [ ] Auto-delete scans after 24 hours
- [ ] No sensitive data sent to external servers

---

## Appendix

### PWA Manifest

```json
{
  "name": "Waju Scanner",
  "short_name": "WajuScan",
  "description": "Local-first document scanner with native share",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tesseract.js": "^5.0.0",
    "jspdf": "^2.5.1",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.0.0",
    "playwright": "^1.40.0",
    "workbox-cli": "^7.0.0"
  }
}
```

---

**Document Status:** ✅ Complete
**Next Steps:** Implementation Planning or Development Setup