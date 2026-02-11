// App Context for Waju Scanner PWA
// Centralized state management using React Context

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useScans, useSetting } from '../hooks/useIndexedDB.js';
import { processImageComplete, terminateWorker, getOCRStatus } from '../utils/ocr.js';

const AppContext = createContext(null);

// Camera error types for better error handling
const CAMERA_ERRORS = {
  NOT_ALLOWED: 'NotAllowedError',
  NOT_FOUND: 'NotFoundError',
  NOT_READABLE: 'NotReadableError',
  OVERCONSTRAINED: 'OverconstrainedError',
  SECURITY: 'SecurityError',
  ABORT: 'AbortError',
};

// Get user-friendly error message
const getCameraErrorMessage = (error) => {
  switch (error.name) {
    case CAMERA_ERRORS.NOT_ALLOWED:
      return 'Camera access denied. Please allow camera access in your browser settings and try again.';
    case CAMERA_ERRORS.NOT_FOUND:
      return 'No camera found. Check that a camera is connected and allowed in your browser or OS settings, or use file upload instead.';
    case CAMERA_ERRORS.NOT_READABLE:
      return 'Camera is already in use by another application. Please close other apps using the camera.';
    case CAMERA_ERRORS.OVERCONSTRAINED:
      return 'Camera does not support the required resolution. Using default settings.';
    case CAMERA_ERRORS.SECURITY:
      return 'Camera access blocked for security reasons. Please use HTTPS or localhost.';
    case CAMERA_ERRORS.ABORT:
      return 'Camera access was cancelled. Please try again.';
    default:
      return `Camera error: ${error.message}. Please try file upload instead.`;
  }
};

// ===== IMAGE FILTERS =====
const applyFilter = (imageSrc, filterType) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        switch (filterType) {
          case 'grayscale':
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
            break;
          case 'bw':
            const bw = r * 0.299 + g * 0.587 + b * 0.114 > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = bw;
            break;
          case 'magic':
            const brightness = 1.2;
            const contrast = 1.3;
            const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
            const magicGray = r * 0.299 + g * 0.587 + b * 0.114;
            const enhanced = ((factor * (magicGray - 128)) + 128) * brightness;
            const clamped = Math.max(0, Math.min(255, enhanced));
            data[i] = data[i + 1] = data[i + 2] = clamped;
            break;
          default:
            break;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  });
};

// ===== COMBINE ID CARD IMAGES =====
const combineIDCardImages = async (front, back, colorMode) => {
  const frontImg = new Image();
  const backImg = new Image();

  await Promise.all([
    new Promise(resolve => { frontImg.onload = resolve; frontImg.src = front; }),
    new Promise(resolve => { backImg.onload = resolve; backImg.src = back; })
  ]);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const cardWidth = Math.max(frontImg.width, backImg.width);
  const cardHeight = Math.max(frontImg.height, backImg.height);

  canvas.width = cardWidth;
  canvas.height = cardHeight * 2 + 20;

  if (colorMode === 'grayscale') {
    front = await applyFilter(front, 'grayscale');
    back = await applyFilter(back, 'grayscale');

    const frontFiltered = new Image();
    const backFiltered = new Image();

    await Promise.all([
      new Promise(resolve => { frontFiltered.onload = resolve; frontFiltered.src = front; }),
      new Promise(resolve => { backFiltered.onload = resolve; backFiltered.src = back; })
    ]);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(frontFiltered, 0, 0, cardWidth, cardHeight);
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT', cardWidth / 2, cardHeight - 10);

    ctx.drawImage(backFiltered, 0, cardHeight + 20, cardWidth, cardHeight);
    ctx.fillText('BACK', cardWidth / 2, canvas.height - 10);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(frontImg, 0, 0, cardWidth, cardHeight);
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT', cardWidth / 2, cardHeight - 10);

    ctx.drawImage(backImg, 0, cardHeight + 20, cardWidth, cardHeight);
    ctx.fillText('BACK', cardWidth / 2, canvas.height - 10);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};

// ===== CROP FUNCTION =====
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

  return canvas.toDataURL('image/jpeg', 0.9);
};

export function AppProvider({ children }) {
  // ===== APP MODE =====
  const [appMode, setAppMode] = useState('home'); // 'home' | 'document' | 'idcard'

  // ===== INDEXEDDB STORAGE =====
  const { scans: scanHistory, addScan } = useScans({ limit: 10 });
  const [enableAIEnhancement, setEnableAIEnhancement] = useSetting('aiEnhancement', true);

  // ===== DOCUMENT MODE STATE =====
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // ===== ID CARD MODE STATE =====
  const [idCard, setIdCard] = useState({
    front: null,
    back: null,
    colorMode: 'color',
    step: 'front'
  });

  // ===== COMMON STATE =====
  const [showCamera, setShowCamera] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Crop state
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 0 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [isCropping, setIsCropping] = useState(false);

  // OCR state
  const [ocrResult, setOcrResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingPageIndex, setProcessingPageIndex] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('');

  // Filter state
  const [activeFilter, setActiveFilter] = useState('original');
  const [filteredImages, setFilteredImages] = useState({});

  // ===== CAMERA STATE =====
  const [cameraError, setCameraError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const streamRef = useRef(null);

  // Check camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' });
          setCameraPermission(result.state);

          result.addEventListener('change', () => {
            setCameraPermission(result.state);
          });
        }
      } catch (e) {
        // Permissions API not supported, will check on camera start
        console.log('Permissions API not supported');
      }
    };
    checkPermission();
  }, []);

  // Handle device orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      // Re-initialize camera if orientation changes while camera is active
      if (showCamera && streamRef.current) {
        stopCamera();
        setTimeout(() => startCamera(), 300);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, [showCamera]);

  // ===== CAMERA FUNCTIONS =====
  const startCamera = async () => {
    setCameraError(null);

    try {
      // Secure context required: camera only works over HTTPS or localhost
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw Object.assign(new Error('Secure context required'), { name: CAMERA_ERRORS.SECURITY });
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // CRITICAL: Call getUserMedia immediately while the button click is still the "user gesture".
      // Request with minimal constraints first so desktop (no "environment" camera) and strict
      // devices don't get NotFoundError; then prefer better quality if available.
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err) {
        throw err;
      }

      // Prefer rear camera + higher res on devices that support it (e.g. mobile)
      try {
        const better = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        stream.getTracks().forEach((t) => t.stop());
        stream = better;
      } catch (_) {
        // Keep current stream
      }

      streamRef.current = stream;

      // Now show camera UI and attach stream to video element
      setShowCamera(true);

      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');

        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(reject);
          };
          videoRef.current.onerror = reject;
          setTimeout(resolve, 1000);
        });

        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const capabilities = track.getCapabilities();
          setTorchSupported(capabilities.torch || false);
        }

        setCameraPermission('granted');
      } else {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError(getCameraErrorMessage(err));
      setShowCamera(false);

      if (err.name === CAMERA_ERRORS.NOT_ALLOWED) {
        setCameraPermission('denied');
      }

      alert(getCameraErrorMessage(err));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setTorchEnabled(false);
    setTorchSupported(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    if (!track || !track.applyConstraints) return;

    try {
      const newTorchState = !torchEnabled;
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setTorchEnabled(newTorchState);
    } catch (err) {
      console.error('Error toggling torch:', err);
      alert('Flash/Torch not supported on this device');
    }
  };

  const captureImage = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1920;
      canvas.height = videoRef.current.videoHeight || 1080;
      const ctx = canvas.getContext('2d');

      // Handle orientation for mobile devices
      const orientation = window.screen.orientation?.angle || 0;
      if (orientation !== 0 && orientation !== 180) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((orientation * Math.PI) / 180);
        ctx.drawImage(
          videoRef.current,
          -canvas.height / 2,
          -canvas.width / 2,
          canvas.height,
          canvas.width
        );
      } else {
        ctx.drawImage(videoRef.current, 0, 0);
      }

      const capturedImage = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();

      if (appMode === 'document') {
        setCurrentImage(capturedImage);
        setIsCropping(true);
      } else if (appMode === 'idcard') {
        if (idCard.step === 'front') {
          setIdCard({ ...idCard, front: capturedImage, step: 'back' });
        } else {
          setIdCard({ ...idCard, back: capturedImage });
        }
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const uploadedImage = e.target.result;

        if (appMode === 'document') {
          setCurrentImage(uploadedImage);
          setIsCropping(true);
        } else if (appMode === 'idcard') {
          if (idCard.step === 'front') {
            setIdCard({ ...idCard, front: uploadedImage, step: 'back' });
          } else {
            setIdCard({ ...idCard, back: uploadedImage });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== FILTER FUNCTIONS =====
  const applyFilterToPage = async (pageIndex, filterType) => {
    const filtered = await applyFilter(pages[pageIndex], filterType);
    const newFilteredImages = { ...filteredImages, [pageIndex]: filtered };
    setFilteredImages(newFilteredImages);

    const newPages = [...pages];
    newPages[pageIndex] = filtered;
    setPages(newPages);
  };

  // ===== CROP FUNCTIONS =====
  const applyCrop = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedImage = await getCroppedImg(currentImage, pixelCrop);
      setCurrentImage(croppedImage);
      setIsCropping(false);
    } else {
      setIsCropping(false);
    }
  };

  const addPage = () => {
    if (currentImage) {
      const newPages = [...pages, currentImage];
      setPages(newPages);
      setCurrentPageIndex(newPages.length - 1);
      setCurrentImage(null);
      setActiveFilter('original');
    }
  };

  // ===== OCR FUNCTIONS =====
  const processOCR = async (pageIndex = null) => {
    const imageToProcess = pageIndex !== null ? pages[pageIndex] : (pages[currentPageIndex] || currentImage);
    if (!imageToProcess) return;

    const status = getOCRStatus();
    if (!status.available) {
      alert('OCR is not available in this browser. Please use a modern browser with Web Worker support.');
      return;
    }

    if (status.offline && enableAIEnhancement) {
      console.warn('Offline mode detected - AI enhancement will be disabled');
    }

    setLoading(true);
    setProcessingPageIndex(pageIndex !== null ? pageIndex : currentPageIndex);
    setOcrResult('');

    try {
      const result = await processImageComplete(imageToProcess, {
        enhance: enableAIEnhancement,
        onProgress: (progress) => {
          if (progress.status === 'enhancing') {
            setOcrStatus('Enhancing with AI...');
          } else {
            setOcrStatus(`Scanning... ${Math.round(progress.progress * 100)}%`);
          }
        }
      });

      if (result.text && result.text.trim()) {
        setOcrResult(result.text);
        setOcrStatus('');
      } else {
        alert('No text detected in image. Try a clearer image or better lighting.');
      }
    } catch (error) {
      console.error('Error processing OCR:', error);
      alert(`Failed to process OCR: ${error.message}`);
    } finally {
      setLoading(false);
      setProcessingPageIndex(null);
    }
  };

  // ===== RESET FUNCTIONS =====
  const resetDocumentMode = () => {
    setPages([]);
    setCurrentPageIndex(0);
    setCurrentImage(null);
    setOcrResult('');
    setActiveFilter('original');
    setFilteredImages({});
    setIsCropping(false);
  };

  const resetIDCardMode = () => {
    setIdCard({
      front: null,
      back: null,
      colorMode: 'color',
      step: 'front'
    });
    setCurrentImage(null);
    setIsCropping(false);
  };

  // ===== PAGE MANAGEMENT =====
  const deletePage = (index) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, index - 1));
  };

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, []);

  const value = {
    // State
    appMode,
    scanHistory,
    pages,
    currentPageIndex,
    idCard,
    showCamera,
    currentImage,
    videoRef,
    fileInputRef,
    crop,
    completedCrop,
    imgRef,
    isCropping,
    ocrResult,
    loading,
    processingPageIndex,
    ocrStatus,
    activeFilter,
    filteredImages,
    enableAIEnhancement,
    // Camera state
    cameraError,
    cameraPermission,
    torchSupported,
    torchEnabled,

    // Setters
    setAppMode,
    setPages,
    setCurrentPageIndex,
    setIdCard,
    setCurrentImage,
    setCrop,
    setCompletedCrop,
    setIsCropping,
    setOcrResult,
    setLoading,
    setProcessingPageIndex,
    setOcrStatus,
    setActiveFilter,
    setFilteredImages,
    setEnableAIEnhancement,

    // Functions
    startCamera,
    stopCamera,
    toggleTorch,
    captureImage,
    handleFileUpload,
    applyFilter,
    applyFilterToPage,
    combineIDCardImages,
    applyCrop,
    addPage,
    processOCR,
    resetDocumentMode,
    resetIDCardMode,
    deletePage,
    addScan,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}