// Scan Screen Component for Document Mode
import React, { useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useApp } from '../context/AppContext.jsx';
import { jsPDF } from 'jspdf';
import { shareText, shareOrDownloadPDF, copyToClipboard, getShareCapabilities } from '../utils/share.js';

export function ScanScreen() {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const {
    appMode,
    setAppMode,
    resetDocumentMode,
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    showCamera,
    currentImage,
    videoRef,
    fileInputRef,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    imgRef,
    isCropping,
    setIsCropping,
    ocrResult,
    setOcrResult,
    loading,
    processingPageIndex,
    ocrStatus,
    activeFilter,
    setActiveFilter,
    startCamera,
    stopCamera,
    captureImage,
    handleFileUpload,
    applyFilterToPage,
    applyCrop,
    addPage,
    processOCR,
    deletePage,
    addScan,
  } = useApp();

  const exportPDF = async () => {
    if (pages.length === 0) return;

    const doc = new jsPDF();

    pages.forEach((page, index) => {
      if (index > 0) doc.addPage();

      const imgProps = doc.getImageProperties(page);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      doc.addImage(page, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      doc.setFontSize(8);
      doc.text(`Page ${index + 1} of ${pages.length}`, pdfWidth / 2, pdfHeight + 5, { align: 'center' });
    });

    if (ocrResult) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text("Scanned Text:", 10, 20);

      const splitText = doc.splitTextToSize(ocrResult, 180);
      doc.text(splitText, 10, 30);
    }

    const filename = `waju_scan_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);

    await addScan({
      type: 'document',
      pageCount: pages.length,
      filename: filename,
      ocrText: ocrResult
    });
  };

  const shareContent = async () => {
    const capabilities = getShareCapabilities();

    if (pages.length > 0) {
      // Share PDF with pages
      const filename = `waju_scan_${new Date().toISOString().slice(0,10)}.pdf`;
      const shared = await shareOrDownloadPDF(pages, ocrResult, {
        filename,
        title: 'Scanned Document',
        text: ocrResult || 'Scanned document with ' + pages.length + ' page(s)',
      });

      if (!shared && !capabilities.shareApiSupported) {
        alert('Download started. Web Share API not supported in this browser.');
      }
    } else if (ocrResult) {
      // Share text only
      const shared = await shareText(ocrResult, 'Scanned Text');
      if (!shared && !capabilities.shareApiSupported) {
        await copyToClipboard(ocrResult);
        alert('Text copied to clipboard. Web Share API not supported.');
      }
    } else {
      alert('Nothing to share. Please scan a document or process OCR first.');
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setAppMode('home'); resetDocumentMode(); }}
          className="flex items-center text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="font-bold text-gray-800">Document Scan</h2>
        <div className="w-10"></div>
      </div>

      {/* Page Navigation */}
      {pages.length > 0 && (
        <div className="bg-white rounded-xl p-3 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Pages: {pages.length}</span>
            <button onClick={startCamera} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              + Add Page
            </button>
          </div>

          {/* Page Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pages.map((page, index) => (
              <div
                key={index}
                onClick={() => setCurrentPageIndex(index)}
                className={`relative flex-shrink-0 w-16 h-20 rounded-lg border-2 cursor-pointer overflow-hidden ${
                  currentPageIndex === index ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <img src={page} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                  {index + 1}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePage(index); }}
                  className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Page Controls */}
          <div className="flex justify-center gap-2 mt-2">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-2 bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 px-2">{currentPageIndex + 1} / {pages.length}</span>
            <button
              onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="p-2 bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Current Page / Camera Preview */}
      {showCamera ? (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full h-full"></video>
          <div className="absolute bottom-0 w-full p-6 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
            <button onClick={stopCamera} className="text-white p-2">Cancel</button>
            <button onClick={captureImage} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 active:scale-95 transition-transform"></button>
            <div className="w-10"></div>
          </div>
        </div>
      ) : isCropping && currentImage ? (
        <div className="bg-black/90 p-4 rounded-xl h-full flex flex-col">
          <h3 className="text-white text-center mb-2 text-sm font-medium">Crop Document</h3>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              className="max-h-[50vh]"
            >
              <img ref={imgRef} src={currentImage} alt="Crop target" className="max-w-full max-h-[50vh] object-contain" />
            </ReactCrop>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setIsCropping(false); setCurrentImage(null); }} className="flex-1 bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
            <button onClick={applyCrop} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">Done</button>
          </div>
        </div>
      ) : currentImage ? (
        <div className="bg-black rounded-xl overflow-hidden shadow-lg mb-4 h-[40vh] relative">
          <img src={currentImage} alt="Captured" className="w-full h-full object-contain" />
          <button
            onClick={() => setCurrentImage(null)}
            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setIsCropping(true)}
            className="absolute bottom-2 right-2 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
          >
            Crop
          </button>
          <button
            onClick={addPage}
            className="absolute bottom-2 left-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm"
          >
            Add Page
          </button>
        </div>
      ) : pages.length > 0 ? (
        <div className="bg-black rounded-xl overflow-hidden shadow-lg mb-4 h-[40vh] relative">
          <img src={pages[currentPageIndex]} alt={`Page ${currentPageIndex + 1}`} className="w-full h-full object-contain" />
          <button
            onClick={() => { setIsCropping(true); setCurrentImage(pages[currentPageIndex]); }}
            className="absolute bottom-2 right-2 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
          >
            Crop
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mb-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Document Scan</h3>
          <p className="text-gray-500 text-sm mb-4">Capture multiple pages to create a complete document</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={startCamera} className="flex flex-col items-center p-3 bg-blue-600 text-white rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <span className="text-xs font-medium">Camera</span>
            </button>
            <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center p-3 bg-gray-100 text-gray-700 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Gallery</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Options */}
      {pages.length > 0 && !isCropping && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['Original', 'Magic Color', 'B&W', 'Gray'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter.toLowerCase());
                applyFilterToPage(currentPageIndex, filter.toLowerCase());
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {pages.length > 0 && !isCropping && (
        <div className="space-y-3">
          <button
            onClick={() => processOCR(currentPageIndex)}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && processingPageIndex === currentPageIndex ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {ocrStatus || 'Processing...'}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Process with OCR
              </>
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={exportPDF}
              disabled={pages.length === 0}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>

            <button
              onClick={shareContent}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      )}

      {/* OCR Result */}
      {ocrResult && !isCropping && (
        <div className="mt-4 p-4 bg-gray-100 rounded-xl border border-gray-200 animate-fade-in-up">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-700">Scanned Text:</h3>
            <button
              onClick={() => navigator.clipboard.writeText(ocrResult)}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Copy
            </button>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono leading-relaxed">{ocrResult}</pre>
          </div>
        </div>
      )}
    </div>
  );
}