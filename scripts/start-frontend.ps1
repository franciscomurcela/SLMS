# Frontend Startup Script for Windows (PowerShell)
# This script installs dependencies and starts the React development server

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SLMS Frontend Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $ProjectRoot "react-frontend\frontend"

# Check if Node.js is installed
Write-Host "[1/4] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Navigate to frontend directory
Write-Host "[2/4] Navigating to frontend directory..." -ForegroundColor Yellow
if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: Frontend directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

Set-Location $FrontendDir
Write-Host "Current directory: $FrontendDir" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
Write-Host "[3/4] Checking dependencies..." -ForegroundColor Yellow
$NodeModulesDir = Join-Path $FrontendDir "node_modules"

if (-not (Test-Path $NodeModulesDir)) {
    Write-Host "node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        npm install
        Write-Host ""
        Write-Host "Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dependencies already installed" -ForegroundColor Green
    
    # Check if package.json has changed
    $PackageJson = Join-Path $FrontendDir "package.json"
    $PackageLock = Join-Path $FrontendDir "package-lock.json"
    
    if ((Test-Path $PackageJson) -and (Test-Path $PackageLock)) {
        $PackageJsonTime = (Get-Item $PackageJson).LastWriteTime
        $PackageLockTime = (Get-Item $PackageLock).LastWriteTime
        
        if ($PackageJsonTime -gt $PackageLockTime) {
            Write-Host "package.json has been updated. Reinstalling dependencies..." -ForegroundColor Yellow
            try {
                npm install
                Write-Host "Dependencies updated successfully" -ForegroundColor Green
            } catch {
                Write-Host "WARNING: Failed to update dependencies" -ForegroundColor Yellow
                Write-Host "Continuing with existing dependencies..." -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""

# Start development server
Write-Host "[4/4] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to start development server" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
