# Deep Cleanup - Remove all unnecessary files for a clean, elegant workspace
Write-Host "Starting deep cleanup of BlockZone Lab workspace..." -ForegroundColor Green

# Remove all documentation clutter
Write-Host "Removing documentation clutter..." -ForegroundColor Cyan
Remove-Item "CLAUDE_*.md" -Force -ErrorAction SilentlyContinue
Remove-Item "COMPLETE_FILE_TREE.md" -Force -ErrorAction SilentlyContinue
Remove-Item "COPILOT_CONSOLIDATION_PROMPTS.md" -Force -ErrorAction SilentlyContinue
Remove-Item "CURRENT_FILE_TREE.md" -Force -ErrorAction SilentlyContinue
Remove-Item "CURRENT_STATUS_FOR_CLAUDE.md" -Force -ErrorAction SilentlyContinue
Remove-Item "ENHANCED_*.md" -Force -ErrorAction SilentlyContinue
Remove-Item "FINAL_INTEGRATION_CHECKLIST.md" -Force -ErrorAction SilentlyContinue
Remove-Item "GAME_OVER_IMPLEMENTATION_GUIDE.md" -Force -ErrorAction SilentlyContinue
Remove-Item "KEY_FILES_FOR_CLAUDE.md" -Force -ErrorAction SilentlyContinue
Remove-Item "MISSING_UI_COMPONENTS_FOUND.md" -Force -ErrorAction SilentlyContinue
Remove-Item "MISSION_COMPLETE_SUMMARY.md" -Force -ErrorAction SilentlyContinue
Remove-Item "PHASE3_CURRENT_STATE.md" -Force -ErrorAction SilentlyContinue
Remove-Item "UI_RESTORATION_SUCCESS.md" -Force -ErrorAction SilentlyContinue
Remove-Item "UNIFIED_*.md" -Force -ErrorAction SilentlyContinue

# Remove legacy archives
Write-Host "Removing legacy archives..." -ForegroundColor Cyan
Remove-Item "__legacy_archive__" -Recurse -Force -ErrorAction SilentlyContinue

# Remove test and debug files
Write-Host "Removing test and debug files..." -ForegroundColor Cyan
Remove-Item "debug-syntax-checker.js" -Force -ErrorAction SilentlyContinue
Remove-Item "test-identity.html" -Force -ErrorAction SilentlyContinue
Remove-Item "test-unified-systems.js" -Force -ErrorAction SilentlyContinue
Remove-Item "unified-systems-demo.html" -Force -ErrorAction SilentlyContinue
Remove-Item "dev-commands.bat" -Force -ErrorAction SilentlyContinue
Remove-Item "cleanup.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "platform-transform.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "transform-simple.ps1" -Force -ErrorAction SilentlyContinue

# Remove deployment and utility files that aren't needed
Write-Host "Removing unnecessary utility files..." -ForegroundColor Cyan
Remove-Item "_deploy-trigger.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "EverythingCard-beautiful.js" -Force -ErrorAction SilentlyContinue

# Clean up any remaining unified system files
Write-Host "Final cleanup of unified systems..." -ForegroundColor Cyan
Get-ChildItem -Recurse -Name "*unified*" -ErrorAction SilentlyContinue | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $_" -ForegroundColor Yellow
    }
}

Get-ChildItem -Recurse -Name "*Universal*" -ErrorAction SilentlyContinue | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $_" -ForegroundColor Yellow
    }
}

# Remove empty directories
Write-Host "Removing empty directories..." -ForegroundColor Cyan
Get-ChildItem -Recurse -Directory | Where-Object { (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0 } | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Deep cleanup complete! Workspace is now clean and elegant." -ForegroundColor Green
Write-Host "Only essential files remain for the SimpleGameOver neon drop experience." -ForegroundColor Cyan
