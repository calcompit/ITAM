# IT Asset Monitor - Windows PowerShell Script
Write-Host "🚀 Starting IT Asset Monitor - Windows PowerShell Mode" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Set environment variables for Production
$env:NODE_ENV = "production"
$env:PYTHON_COMMAND = "python"
$env:BACKEND_URL = "http://10.51.101.49:3002"
$env:FRONTEND_URL = "http://10.51.101.49:8081"
$env:NOVNC_URL = "http://10.51.101.49:6081"

Write-Host "📱 Platform: Windows Production" -ForegroundColor Cyan
Write-Host "🐍 Python Command: $env:PYTHON_COMMAND" -ForegroundColor Cyan
Write-Host "🔗 Backend URL: $env:BACKEND_URL" -ForegroundColor Cyan
Write-Host "🌐 Frontend URL: $env:FRONTEND_URL" -ForegroundColor Cyan
Write-Host "🖥️  noVNC URL: $env:NOVNC_URL" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Node.js is not installed" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Python is not installed" -ForegroundColor Red
        Write-Host "Please install Python from https://www.python.org/downloads/" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python is not installed" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if websockify is installed
try {
    python -c "import websockify" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📦 Installing websockify..." -ForegroundColor Yellow
        pip install websockify
    } else {
        Write-Host "✅ websockify found" -ForegroundColor Green
    }
} catch {
    Write-Host "📦 Installing websockify..." -ForegroundColor Yellow
    pip install websockify
}

# Install npm dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ npm dependencies found" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Dependencies checked" -ForegroundColor Green
Write-Host ""

# Start the application
Write-Host "🎯 Starting application..." -ForegroundColor Green
Write-Host ""
Write-Host "Frontend will be available at: $env:FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend will be available at: $env:BACKEND_URL" -ForegroundColor Cyan
Write-Host "WebSockify will be available at: $env:NOVNC_URL" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host ""

# Start backend server in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:NODE_ENV = "production"
    npm run server
}

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host "Starting frontend..." -ForegroundColor Yellow
Write-Host ""

# Start frontend in background
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:NODE_ENV = "production"
    npm run dev
}

Write-Host ""
Write-Host "✅ Both servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: $env:BACKEND_URL" -ForegroundColor Cyan
Write-Host "Frontend: $env:FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Keep the script running and show job status
try {
    while ($true) {
        $backendStatus = Get-Job -Id $backendJob.Id | Select-Object -ExpandProperty State
        $frontendStatus = Get-Job -Id $frontendJob.Id | Select-Object -ExpandProperty State
        
        Write-Host "Backend: $backendStatus | Frontend: $frontendStatus" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
} catch {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "Services stopped" -ForegroundColor Green
}
