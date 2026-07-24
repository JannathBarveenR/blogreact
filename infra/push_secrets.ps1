param (
    [string]$EnvironmentName = "prod",
    [string]$Region = "ap-south-1"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " PetOLife Secrets Uploader" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure AWS CLI is installed
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CLI is not installed or not in your PATH." -ForegroundColor Red
    exit 1
}

$env:AWS_DEFAULT_REGION = $Region
Write-Host "Target Region: $Region" -ForegroundColor DarkGray
Write-Host "Target Environment: $EnvironmentName`n" -ForegroundColor DarkGray

# 1. Upload Root .env
if (Test-Path "..\.env") {
    Write-Host "Pushing root .env to Secrets Manager..." -ForegroundColor Yellow
    $rootEnv = Get-Content -Raw ..\.env
    aws secretsmanager put-secret-value `
        --secret-id "$EnvironmentName/petolife/app-env" `
        --secret-string $rootEnv | Out-Null
    Write-Host " [OK] Root .env pushed successfully." -ForegroundColor Green
} elseif (Test-Path ".\.env") {
    Write-Host "Pushing root .env to Secrets Manager..." -ForegroundColor Yellow
    $rootEnv = Get-Content -Raw .\.env
    aws secretsmanager put-secret-value `
        --secret-id "$EnvironmentName/petolife/app-env" `
        --secret-string $rootEnv | Out-Null
    Write-Host " [OK] Root .env pushed successfully." -ForegroundColor Green
} else {
    Write-Host " [WARNING] Root .env file not found!" -ForegroundColor Red
}

# 2. Upload Backend .env
if (Test-Path "..\backend\.env") {
    Write-Host "Pushing backend/.env to Secrets Manager..." -ForegroundColor Yellow
    $backendEnv = Get-Content -Raw ..\backend\.env
    aws secretsmanager put-secret-value `
        --secret-id "$EnvironmentName/petolife/backend-env" `
        --secret-string $backendEnv | Out-Null
    Write-Host " [OK] Backend .env pushed successfully.`n" -ForegroundColor Green
} elseif (Test-Path ".\backend\.env") {
    Write-Host "Pushing backend/.env to Secrets Manager..." -ForegroundColor Yellow
    $backendEnv = Get-Content -Raw .\backend\.env
    aws secretsmanager put-secret-value `
        --secret-id "$EnvironmentName/petolife/backend-env" `
        --secret-string $backendEnv | Out-Null
    Write-Host " [OK] Backend .env pushed successfully.`n" -ForegroundColor Green
} else {
    Write-Host " [WARNING] backend\.env file not found!" -ForegroundColor Red
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Secrets uploaded successfully! " -ForegroundColor Green
Write-Host "If your EC2 instances are already running, terminate them in the EC2 Console so the Auto Scaling Group launches new ones with these updated secrets." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
