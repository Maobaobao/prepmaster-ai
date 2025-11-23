@echo off
echo Installing dependencies...
python -m pip install -r backend/requirements.txt
npm install

echo.
echo Starting Backend and Frontend servers...
echo Backend will run at: http://localhost:8000
echo Frontend will run at: http://localhost:5173
echo.

start "Backend Server" cmd /k "cd /d %~dp0 && waitress-serve --listen=0.0.0.0:8000 backend.app:app"
timeout /t 3 /nobreak >nul
start "Frontend Dev Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Press any key to stop all servers...
pause >nul

echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Dev Server*" /T /F >nul 2>&1
echo Servers stopped.
