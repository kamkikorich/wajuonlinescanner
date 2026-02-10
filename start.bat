@echo off
echo ===================================================
echo   Starting WajuScanner-Online System
echo ===================================================

echo Starting Backend Server...
cd server
start "WajuScanner Backend" cmd /k "node index.js"
cd ..

echo Starting Frontend Application...
cd camscanner-clone
start "WajuScanner Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo   System Started!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ===================================================
echo.
pause
