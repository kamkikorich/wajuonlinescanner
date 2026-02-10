// Main App Component - Waju Scanner PWA
import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { Header } from './components/Header.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { ScanScreen } from './components/ScanScreen.jsx';
import { IDCardScreen } from './components/IDCardScreen.jsx';

// Inner App component that uses the context
function AppContent() {
  const { appMode, fileInputRef, handleFileUpload } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {appMode === 'home' && <HomeScreen />}
        {appMode === 'document' && <ScanScreen />}
        {appMode === 'idcard' && <IDCardScreen />}
      </main>

      {/* Hidden File Input */}
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

// Main App component with context provider
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}