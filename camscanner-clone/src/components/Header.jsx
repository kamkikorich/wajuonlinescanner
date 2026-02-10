// Header Component
import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export function Header() {
  const { appMode } = useApp();

  return (
    <header className="w-full max-w-md mx-auto bg-white shadow-sm sticky top-0 z-10">
      <div className="p-4 flex items-center justify-between">
        {appMode === 'home' && (
          <>
            <h1 className="text-xl font-bold text-gray-800">Waju Scanner</h1>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </>
        )}
      </div>
    </header>
  );
}