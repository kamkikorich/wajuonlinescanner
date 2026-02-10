// Home Screen Component
import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export function HomeScreen() {
  const {
    appMode,
    scanHistory,
    setAppMode,
    resetDocumentMode,
    resetIDCardMode,
    enableAIEnhancement,
    setEnableAIEnhancement,
  } = useApp();

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in-up">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Waju Scanner</h2>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
            PWA Ready
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-6">Choose scan mode to begin</p>

        <div className="space-y-3">
          <button
            onClick={() => { setAppMode('document'); resetDocumentMode(); }}
            className="w-full flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">Scan Document</div>
              <div className="text-xs text-blue-100">Multi-page scanning • OCR • PDF</div>
            </div>
          </button>

          <button
            onClick={() => { setAppMode('idcard'); resetIDCardMode(); }}
            className="w-full flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">Scan ID Card</div>
              <div className="text-xs text-purple-100">Front + Back • Color/B&W</div>
            </div>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">AI Text Enhancement</div>
              <div className="text-xs text-gray-400">Use DeepSeek API to improve OCR</div>
            </div>
            <button
              onClick={() => setEnableAIEnhancement(!enableAIEnhancement)}
              className={`w-12 h-6 rounded-full transition-colors ${
                enableAIEnhancement ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                enableAIEnhancement ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          {!navigator.onLine && (
            <div className="flex items-center text-yellow-600 text-xs bg-yellow-50 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Offline mode - AI enhancement unavailable
            </div>
          )}
        </div>
      </div>

      {scanHistory.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {scanHistory.slice(0, 3).map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">{doc.filename}</div>
                  <div className="text-xs text-gray-400">{doc.pageCount} pages • {new Date(doc.date).toLocaleDateString()}</div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">PDF</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}