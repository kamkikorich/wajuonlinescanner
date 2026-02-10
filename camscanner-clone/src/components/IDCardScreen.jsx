// ID Card Scan Screen Component
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { jsPDF } from 'jspdf';

export function IDCardScreen() {
  const {
    appMode,
    setAppMode,
    resetIDCardMode,
    idCard,
    setIdCard,
    showCamera,
    currentImage,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    handleFileUpload,
    combineIDCardImages,
  } = useApp();

  const exportIDCardPDF = async () => {
    if (!idCard.front || !idCard.back) {
      alert('Please capture both front and back of the ID card');
      return;
    }

    const combinedImage = await combineIDCardImages(idCard.front, idCard.back, idCard.colorMode);

    const doc = new jsPDF();
    const imgProps = doc.getImageProperties(combinedImage);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.addImage(combinedImage, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const filename = `idcard_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setAppMode('home'); resetIDCardMode(); }}
          className="flex items-center text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="font-bold text-gray-800">ID Card Scan</h2>
        <div className="w-10"></div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6">
        <div className={`flex items-center px-4 py-2 rounded-lg ${idCard.step === 'front' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs">1</span>
          <span className="text-sm font-medium">FRONT</span>
        </div>
        <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
        <div className={`flex items-center px-4 py-2 rounded-lg ${idCard.step === 'back' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2 text-xs">2</span>
          <span className="text-sm font-medium">BACK</span>
        </div>
      </div>

      {/* Camera / Capture Area */}
      {showCamera ? (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full h-full"></video>
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              Capture {idCard.step === 'front' ? 'FRONT' : 'BACK'} side
            </div>
          </div>
          <div className="absolute bottom-0 w-full p-6 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
            <button onClick={stopCamera} className="text-white p-2">Cancel</button>
            <button onClick={captureImage} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 active:scale-95 transition-transform"></button>
            <div className="w-10"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Captured Images Preview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`bg-gray-100 rounded-xl p-3 text-center ${idCard.front ? 'border-2 border-green-500' : ''}`}>
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {idCard.front ? (
                  <img src={idCard.front} alt="Front" className="w-full h-full object-contain" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600">FRONT</span>
            </div>

            <div className={`bg-gray-100 rounded-xl p-3 text-center ${idCard.back ? 'border-2 border-green-500' : ''}`}>
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {idCard.back ? (
                  <img src={idCard.back} alt="Back" className="w-full h-full object-contain" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600">BACK</span>
            </div>
          </div>

          {/* Capture Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => { setIdCard({ ...idCard, step: 'front' }); startCamera(); }}
              className="flex flex-col items-center p-4 bg-blue-600 text-white rounded-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <span className="text-sm font-medium">Capture Front</span>
            </button>
            <button
              onClick={() => { setIdCard({ ...idCard, step: 'back' }); startCamera(); }}
              className="flex flex-col items-center p-4 bg-blue-600 text-white rounded-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <span className="text-sm font-medium">Capture Back</span>
            </button>
          </div>

          {/* Color Mode Selection */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Output Style</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setIdCard({ ...idCard, colorMode: 'color' })}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  idCard.colorMode === 'color'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-full h-8 bg-gradient-to-r from-red-400 via-green-400 to-blue-400 rounded mb-2"></div>
                <span className="text-sm font-medium">Color</span>
              </button>
              <button
                onClick={() => setIdCard({ ...idCard, colorMode: 'grayscale' })}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  idCard.colorMode === 'grayscale'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-full h-8 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 rounded mb-2"></div>
                <span className="text-sm font-medium">Grayscale</span>
              </button>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportIDCardPDF}
            disabled={!idCard.front || !idCard.back}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg shadow-purple-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export ID Card PDF
          </button>
        </>
      )}
    </div>
  );
}