# Zombie File Detective - PowerShell monitoring script
param(
    [string]$ProjectPath = (Get-Location).Path,
    [int]$Duration = 300  # 5 minutes
)

Write-Host "🕵️ ZOMBIE DETECTIVE - Starting surveillance..." -ForegroundColor Green
Write-Host "Monitoring: $ProjectPath" -ForegroundColor Yellow
Write-Host "Duration: $Duration seconds" -ForegroundColor Yellow

# Create log file
$logFile = "zombie-diagnostic.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"=== ZOMBIE DETECTIVE LOG - $timestamp ===" | Out-File $logFile

# List current processes that might create files
Write-Host "`n📋 Current suspicious processes:" -ForegroundColor Cyan
$suspiciousProcesses = Get-Process | Where-Object {
    $_.ProcessName -like "*Code*" -or 
    $_.ProcessName -like "*OneDrive*" -or 
    $_.ProcessName -like "*Dropbox*" -or
    $_.ProcessName -like "*GoogleDrive*" -or
    $_.ProcessName -like "*backup*" -or
    $_.ProcessName -like "*sync*"
}

if ($suspiciousProcesses) {
    $suspiciousProcesses | ForEach-Object { 
        $processInfo = "$($_.ProcessName) (PID: $($_.Id))"
        Write-Host "   $processInfo" -ForegroundColor White
        "PROCESS: $processInfo" | Out-File -Append $logFile
    }
} else {
    Write-Host "   No suspicious processes found" -ForegroundColor Green
}

# Create file watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $ProjectPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Track file operations
$fileOperations = @()

# Event handler for file creation
$createAction = {
    $path = $Event.SourceEventArgs.FullPath
    $timeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fileName = Split-Path $path -Leaf
    
    # Check if it's a zombie file
    $isZombie = $fileName -like "*.backup" -or 
                $fileName -like "*.old" -or 
                $fileName -like "*-copy.*" -or
                $fileName -like "*.tmp" -or
                $fileName -like "*~" -or
                $fileName -like "*-clean.*" -or
                $fileName -like "*-minimal.*" -or
                $path -like "*modules*"
    
    if ($isZombie) {
        Write-Host "🚨 ZOMBIE ALERT: $fileName created at $timeStamp" -ForegroundColor Red
        Write-Host "   Path: $path" -ForegroundColor White
        
        # Try to identify the creating process
        try {
            $processes = Get-Process | Where-Object {$_.ProcessName -like "*Code*" -or $_.ProcessName -like "*OneDrive*"}
            if ($processes) {
                Write-Host "   Suspects: $($processes.ProcessName -join ', ')" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   Could not identify creating process" -ForegroundColor Yellow
        }
        
        # Log to file
        "$timeStamp - ZOMBIE CREATED: $path" | Out-File -Append $logFile
    } else {
        # Log normal file creation too
        "$timeStamp - FILE CREATED: $path" | Out-File -Append $logFile
    }
}

# Event handler for file changes
$changeAction = {
    $path = $Event.SourceEventArgs.FullPath
    $timeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timeStamp - FILE CHANGED: $path" | Out-File -Append $logFile
}

# Event handler for file deletion
$deleteAction = {
    $path = $Event.SourceEventArgs.FullPath
    $timeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timeStamp - FILE DELETED: $path" | Out-File -Append $logFile
}

# Register events
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $createAction
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $changeAction  
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $deleteAction

Write-Host "`n👀 Watching for zombie files... Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "Log file: $logFile" -ForegroundColor Cyan

# Wait for specified duration or user interrupt
try {
    Start-Sleep -Seconds $Duration
} catch {
    Write-Host "`n⏹️  Monitoring stopped by user" -ForegroundColor Yellow
}

# Cleanup
$watcher.EnableRaisingEvents = $false
$watcher.Dispose()
Get-EventSubscriber | Unregister-Event

Write-Host "`n🏁 Surveillance complete. Check $logFile for detailed results." -ForegroundColor Green

# Show summary
if (Test-Path $logFile) {
    $zombieAlerts = Get-Content $logFile | Where-Object { $_ -like "*ZOMBIE*" }
    if ($zombieAlerts) {
        Write-Host "`n🚨 ZOMBIE ACTIVITY DETECTED:" -ForegroundColor Red
        $zombieAlerts | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    } else {
        Write-Host "`n✅ No zombie activity detected during monitoring period" -ForegroundColor Green
    }
}
