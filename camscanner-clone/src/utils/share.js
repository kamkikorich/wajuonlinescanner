// Share Utilities for Waju Scanner PWA
import { jsPDF } from 'jspdf';

/**
 * Share a PDF blob via Web Share API
 * @param {Blob} pdfBlob - PDF blob to share
 * @param {string} filename - Filename for the PDF
 * @param {string} title - Share title
 * @param {string} text - Share text/description
 * @returns {Promise<boolean>} True if share was successful
 */
export async function sharePDF(pdfBlob, filename, title = 'Scanned Document', text = '') {
  // Check if Web Share API is supported
  if (!navigator.share) {
    console.warn('[Share] Web Share API not supported');
    return false;
  }

  try {
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    const shareData = {
      title: title,
      files: [file],
    };

    // Add text if provided
    if (text) {
      shareData.text = text;
    }

    await navigator.share(shareData);
    console.log('[Share] PDF shared successfully');
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('[Share] Error sharing PDF:', error);
    }
    return false;
  }
}

/**
 * Share text via Web Share API
 * @param {string} text - Text to share
 * @param {string} title - Share title
 * @returns {Promise<boolean>} True if share was successful
 */
export async function shareText(text, title = 'Scanned Text') {
  // Check if Web Share API is supported
  if (!navigator.share) {
    console.warn('[Share] Web Share API not supported');
    return false;
  }

  try {
    await navigator.share({
      title: title,
      text: text,
    });
    console.log('[Share] Text shared successfully');
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('[Share] Error sharing text:', error);
    }
    return false;
  }
}

/**
 * Create a PDF blob from image data URLs
 * @param {Array<string>} pages - Array of image data URLs
 * @param {string} ocrText - Optional OCR text to include
 * @param {Object} options - PDF options
 * @returns {Promise<Blob>} PDF blob
 */
export async function createPDFBlob(pages, ocrText = '', options = {}) {
  const { filename = 'scan.pdf' } = options;

  const doc = new jsPDF();

  pages.forEach((page, index) => {
    if (index > 0) doc.addPage();

    const imgProps = doc.getImageProperties(page);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.addImage(page, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Add page number
    doc.setFontSize(8);
    doc.text(`Page ${index + 1} of ${pages.length}`, pdfWidth / 2, pdfHeight + 5, { align: 'center' });
  });

  // Add OCR text on separate page if available
  if (ocrText) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Scanned Text:", 10, 20);

    const splitText = doc.splitTextToSize(ocrText, 180);
    doc.text(splitText, 10, 30);
  }

  return doc.output('blob');
}

/**
 * Download a blob as a file (fallback for unsupported browsers)
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share or download a PDF
 * @param {Array<string>} pages - Array of image data URLs
 * @param {string} ocrText - Optional OCR text
 * @param {Object} options - Share options
 * @returns {Promise<boolean>} True if shared, false if downloaded
 */
export async function shareOrDownloadPDF(pages, ocrText = '', options = {}) {
  const {
    filename = `scan_${new Date().toISOString().slice(0,10)}.pdf`,
    title = 'Scanned Document',
    text = '',
  } = options;

  try {
    const pdfBlob = await createPDFBlob(pages, ocrText, { filename });

    // Try to share via Web Share API
    const shared = await sharePDF(pdfBlob, filename, title, text);

    if (shared) {
      return true; // Successfully shared
    }

    // Fallback to download
    downloadBlob(pdfBlob, filename);
    return false; // Downloaded instead of shared
  } catch (error) {
    console.error('[Share] Error:', error);
    // Fallback to download on error
    const pdfBlob = await createPDFBlob(pages, ocrText, { filename });
    downloadBlob(pdfBlob, filename);
    return false;
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if copy was successful
 */
export async function copyToClipboard(text) {
  if (!navigator.clipboard) {
    console.warn('[Share] Clipboard API not supported');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('[Share] Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Check if share functionality is available
 * @returns {Object} Availability status
 */
export function getShareCapabilities() {
  return {
    shareApiSupported: typeof navigator.share !== 'undefined',
    canShareFiles: navigator.canShare ? navigator.canShare({ files: [new File([''], 'test.pdf')] }) : false,
    clipboardSupported: typeof navigator.clipboard !== 'undefined',
  };
}