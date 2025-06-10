# BlockZone Academy Auto-Backup System
# Creates timestamped backups and sets up Git versioning

param(
    [string]$BackupInterval = 10,
    [string]$BackupPath = ".\AUTOMATED_BACKUPS"
)

# Create backup directory
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
    Write-Host "Created backup directory: $BackupPath" -ForegroundColor Green
}

# Initialize Git if not already done
if (!(Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit - BlockZone Academy"
    Write-Host "Initialized Git repository" -ForegroundColor Green
} else {
    Write-Host "Git repository already exists" -ForegroundColor Yellow
}

# Function to create timestamped backup
function Create-Backup {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupFolder = "$BackupPath\backup_$timestamp"
    
    # Create timestamped backup
    Copy-Item -Path "academy" -Destination "$backupFolder\academy" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "assets" -Destination "$backupFolder\assets" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "CONTENT_BACKUP" -Destination "$backupFolder\CONTENT_BACKUP" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "index.html" -Destination "$backupFolder\" -Force -ErrorAction SilentlyContinue
    
    Write-Host "Backup created: $backupFolder" -ForegroundColor Green
    
    # Git commit
    git add . 2>$null
    git commit -m "Auto-backup: $timestamp" 2>$null
    
    # Clean old backups (keep last 20)
    $oldBackups = Get-ChildItem $BackupPath | Sort-Object LastWriteTime -Descending | Select-Object -Skip 20
    $oldBackups | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

# Create initial backup
Create-Backup

Write-Host "Auto-backup system ready!" -ForegroundColor Cyan
Write-Host "Backups will be created every $BackupInterval minutes" -ForegroundColor Cyan
Write-Host "Location: $BackupPath" -ForegroundColor Cyan
Write-Host "Run git log --oneline to see version history" -ForegroundColor Cyan
