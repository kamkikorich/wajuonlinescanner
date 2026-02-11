@echo off
echo Starting Backend...
start "WajuScanner Backend" cmd /k "cd server && node index.js"
echo Starting Frontend...
start "WajuScanner Frontend" cmd /k "cd camscanner-clone && npm run dev"
echo Application started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo.
echo For network access, use your computer's IP address (e.g. http://192.168.x.x:5173)
ipconfig | findstr "IPv4"
echo.
pause
