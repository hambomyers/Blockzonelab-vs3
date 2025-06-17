# Verify Clean Environment - PowerShell script
Write-Host "🔍 ENVIRONMENT VERIFICATION" -ForegroundColor Green

# Check for zombie files
Write-Host "`n📁 Checking for zombie files..." -ForegroundColor Yellow
$zombies = Get-ChildItem -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -like "*.backup" -or 
    $_.Name -like "*.old" -or 
    $_.Name -like "*-copy.*" -or
    $_.Name -like "*.tmp" -or
    $_.Name -like "*~" -or
    $_.Name -like "*-clean.*" -or
    $_.Name -like "*-minimal.*"
}

if ($zombies) {
    Write-Host "⚠️  ZOMBIES DETECTED:" -ForegroundColor Red
    $zombies | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor White }
} else {
    Write-Host "✅ No zombie files found" -ForegroundColor Green
}

# Check for hidden folders
Write-Host "`n📂 Checking for hidden folders..." -ForegroundColor Yellow
$hiddenFolders = Get-ChildItem -Hidden -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -like "*history*" -or $_.Name -like "*backup*" -or $_.Name -like "*modules*"
}

if ($hiddenFolders) {
    Write-Host "⚠️  SUSPICIOUS HIDDEN FOLDERS:" -ForegroundColor Red
    $hiddenFolders | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor White }
} else {
    Write-Host "✅ No suspicious hidden folders" -ForegroundColor Green
}

# Check Git status
Write-Host "`n📝 Checking Git status..." -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-Host "⚠️  UNCOMMITTED CHANGES:" -ForegroundColor Yellow
        $gitStatus | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    } else {
        Write-Host "✅ Git working tree is clean" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Not a Git repository or Git not available" -ForegroundColor Yellow
}

# Check for duplicate files in modules folder (our main issue)
Write-Host "`n🔍 Checking for resurrected modules folder..." -ForegroundColor Yellow
if (Test-Path "games/neondrop/modules") {
    Write-Host "🚨 MODULES FOLDER DETECTED - ZOMBIE ALERT!" -ForegroundColor Red
    Get-ChildItem "games/neondrop/modules" | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
} else {
    Write-Host "✅ No modules folder detected" -ForegroundColor Green
}

# Check running processes
Write-Host "`n🔄 Checking suspicious processes..." -ForegroundColor Yellow
$suspiciousProcesses = Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessName -like "*OneDrive*" -or
    $_.ProcessName -like "*Dropbox*" -or
    $_.ProcessName -like "*GoogleDrive*" -or
    $_.ProcessName -like "*backup*"
}

if ($suspiciousProcesses) {
    Write-Host "⚠️  CLOUD SYNC PROCESSES RUNNING:" -ForegroundColor Yellow
    $suspiciousProcesses | ForEach-Object { Write-Host "   $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor White }
} else {
    Write-Host "✅ No cloud sync processes detected" -ForegroundColor Green
}

# File count verification
Write-Host "`n📊 File count verification..." -ForegroundColor Yellow
$totalFiles = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue).Count
$jsFiles = (Get-ChildItem -Recurse -File -Include "*.js" -ErrorAction SilentlyContinue).Count
Write-Host "   Total files: $totalFiles" -ForegroundColor White
Write-Host "   JavaScript files: $jsFiles" -ForegroundColor White

# Check project structure
Write-Host "`n🏗️  Project structure verification..." -ForegroundColor Yellow
$expectedFolders = @("games/neondrop/core", "games/neondrop/ui", "games/neondrop/gameplay", "shared/web3", "shared/api", "shared/tournaments")
foreach ($folder in $expectedFolders) {
    if (Test-Path $folder) {
        $fileCount = (Get-ChildItem $folder -File).Count
        Write-Host "   ✅ $folder ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $folder (missing)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 VERIFICATION COMPLETE!" -ForegroundColor Green
Write-Host "Run this script anytime to check for zombie file resurrection." -ForegroundColor Cyan
