# BlockZone Lab Cleanup Script
# Removes temporary files, logs, and optimizes the project

Write-Host "🧹 Starting BlockZone Lab cleanup..." -ForegroundColor Green

# Remove temporary files
Write-Host "📁 Cleaning temporary files..." -ForegroundColor Yellow
Remove-Item -Path "*.tmp" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "*.log" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".DS_Store" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "Thumbs.db" -Force -ErrorAction SilentlyContinue

# Clean node_modules if they exist
if (Test-Path "node_modules") {
    Write-Host "📦 Cleaning node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clean any backup files
Write-Host "🗂️ Removing backup files..." -ForegroundColor Yellow
Remove-Item -Path "*.bak" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "*.backup" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "*~" -Force -ErrorAction SilentlyContinue

# Clean any empty directories
Write-Host "📂 Removing empty directories..." -ForegroundColor Yellow
Get-ChildItem -Directory -Recurse | Where-Object { (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0 } | Remove-Item -Force -ErrorAction SilentlyContinue

# Git cleanup
if (Test-Path ".git") {
    Write-Host "🔧 Running git cleanup..." -ForegroundColor Yellow
    git gc --prune=now --aggressive 2>$null
    git remote prune origin 2>$null
}

# Show final status
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "📊 Current directory size:" -ForegroundColor Cyan
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum | ForEach-Object { 
    "{0:N2} MB" -f ($_.Sum / 1MB) 
}

Write-Host "🎯 Ready for development!" -ForegroundColor Green
