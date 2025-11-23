# PrepMaster AI - Local Development Startup Script
# This script starts both the Flask backend and React frontend concurrently
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "Installing dependencies..." -ForegroundColor Cyan
Write-Host ""

# Install Python dependencies
Write-Host "Installing Python packages..." -ForegroundColor Yellow
python -m pip install -r backend/requirements.txt --quiet

# Install Node dependencies
Write-Host "Installing Node packages..." -ForegroundColor Yellow
npm install --silent

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""

# Start backend in a new PowerShell window (uses .env.local for database config)
$backendCommand = "cd '$PWD'; Write-Host 'Backend Server' -ForegroundColor Cyan; waitress-serve --listen=0.0.0.0:8000 backend.app:app"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Frontend Dev Server' -ForegroundColor Cyan; npm run dev"

Write-Host "Both servers are starting in separate windows..." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in each server window to stop them." -ForegroundColor Yellow
Write-Host "Or close this window to keep them running in the background." -ForegroundColor Yellow
