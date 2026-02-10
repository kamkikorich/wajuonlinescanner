import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import { jsPDF } from "jspdf";
import 'react-image-crop/dist/ReactCrop.css';

function App() {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Crop state
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 0 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setIsCropping(true); // Start crop mode when new image loads
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => image.onload = resolve);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const applyCrop = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      // Calculate scale if image is displayed smaller than natural size
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedImage = await getCroppedImg(image, pixelCrop);
      setImage(croppedImage);
      setIsCropping(false);
    } else {
        // If no crop selected, just accept the full image
        setIsCropping(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please upload a file instead.");
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      setImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
      setIsCropping(true); // Auto-enter crop mode after capture
    }
  };

  const [ocrResult, setOcrResult] = useState('');
  const [loading, setLoading] = useState(false);

  const processOCR = async () => {
    if (!image) return;
    
    setLoading(true);
    setOcrResult('');
    
    try {
      // Convert data URL to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');

      const res = await fetch('http://localhost:5000/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.text) {
        setOcrResult(data.text);
      } else {
        alert('No text detected or API error');
      }
    } catch (error) {
      console.error('Error processing OCR:', error);
      alert('Failed to process OCR. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!image || !ocrResult) return;

    const doc = new jsPDF();
    
    // Add scanned image
    const imgProps = doc.getImageProperties(image);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    doc.addImage(image, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Add a new page for text if there's OCR result
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Scanned Text:", 10, 20);
    
    const splitText = doc.splitTextToSize(ocrResult, 180);
    doc.text(splitText, 10, 30);
    
    doc.save("scanned_document.pdf");
  };

  const shareContent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Scanned Document',
          text: ocrResult,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      alert('Web Share API not supported in this browser');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <header className="w-full max-w-md bg-white shadow-sm rounded-xl p-4 mb-6 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Scanner Clone</h1>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center">
        {!image && !showCamera && (
          <div className="w-full flex flex-col gap-4 animate-fade-in-up">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Start Scanning</h2>
              <p className="text-gray-500 text-sm mb-6">Capture documents or upload images to convert them to text.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl active:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span className="text-sm font-medium">Camera</span>
                </button>
                
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-700 rounded-xl active:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Gallery</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full h-full"></video>
            <div className="absolute bottom-0 w-full p-6 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
              <button onClick={stopCamera} className="text-white p-2">
                Cancel
              </button>
              <button onClick={captureImage} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 active:scale-95 transition-transform"></button>
              <div className="w-10"></div> {/* Spacer */}
            </div>
          </div>
        )}

        {image && (
          <div className="w-full flex flex-col h-full">
            <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-lg mb-4">
              {isCropping ? (
                 <div className="bg-black/90 p-4 h-full flex flex-col">
                   <h3 className="text-white text-center mb-2 text-sm font-medium">Crop Document</h3>
                   <div className="flex-1 flex items-center justify-center overflow-auto">
                     <ReactCrop 
                       crop={crop} 
                       onChange={c => setCrop(c)} 
                       onComplete={c => setCompletedCrop(c)}
                       className="max-h-[60vh]"
                     >
                       <img ref={imgRef} src={image} alt="Crop target" className="max-w-full max-h-[60vh] object-contain" />
                     </ReactCrop>
                   </div>
                   <div className="flex gap-2 mt-4">
                     <button onClick={() => setIsCropping(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
                     <button onClick={applyCrop} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">Done</button>
                   </div>
                 </div>
              ) : (
              <>
                <img src={image} alt="Captured" className="w-full h-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
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
              </>
              )}
            </div>
            
            {!isCropping && (
             <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['Original', 'Magic Color', 'B&W', 'Gray'].map((filter) => (
                <button key={filter} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium whitespace-nowrap active:bg-gray-50">
                  {filter}
                </button>
              ))}
            </div>

            <button 
              onClick={processOCR}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
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

            {ocrResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-xl border border-gray-200 w-full animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-700">Scanned Result:</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={shareContent}
                      className="text-xs text-purple-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                    <button 
                      onClick={exportPDF}
                      className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(ocrResult)}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      Copy Text
                    </button>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono leading-relaxed">{ocrResult}</pre>
                </div>
              </div>
            )}
            </>
            )}
          </div>
        )}
      </main>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}

export default App;
