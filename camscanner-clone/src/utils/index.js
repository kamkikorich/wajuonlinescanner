// Utility exports for easier imports
export {
  processImageWithOCR,
  enhanceTextWithAI,
  processImageComplete,
  terminateWorker,
  isOCRAvailable,
  getOCRStatus,
} from './ocr.js';

export {
  sharePDF,
  shareText,
  createPDFBlob,
  downloadBlob,
  shareOrDownloadPDF,
  copyToClipboard,
  getShareCapabilities,
} from './share.js';

export {
  initDB,
  saveScan,
  getScan,
  getAllScans,
  deleteScan,
  clearAllScans,
  clearOldScans,
  saveSetting,
  getSetting,
  getAllSettings,
  deleteSetting,
  getStorageSize,
  clearAllData,
} from './storage.js';