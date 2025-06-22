# Fall Forward Cleanup - Keep only the elegant neon drop card
Write-Host "Falling forward to elegant SimpleGameOver architecture..." -ForegroundColor Green

# Remove overlapping identity systems
Write-Host "Removing overlapping systems..." -ForegroundColor Cyan

# Remove UnifiedSystemsIntegration complexity
Remove-Item "shared\platform\UnifiedSystemsIntegration.js" -Force -ErrorAction SilentlyContinue
Remove-Item "shared\platform\systems\UnifiedPlayerSystem.js" -Force -ErrorAction SilentlyContinue
Remove-Item "shared\platform\systems\UniversalIdentity.js" -Force -ErrorAction SilentlyContinue
Remove-Item "shared\platform\systems\UnifiedTournamentSystem.js" -Force -ErrorAction SilentlyContinue
Remove-Item "shared\ui\UnifiedPlayerCard.js" -Force -ErrorAction SilentlyContinue

# Keep only what we need for the elegant neon drop experience
Write-Host "Preserving elegant SimpleGameOver system..." -ForegroundColor Green

# Remove old status/documentation files
Remove-Item "CONSOLIDATION_PLAN.md" -Force -ErrorAction SilentlyContinue
Remove-Item "CONSOLIDATION_COMPLETE.md" -Force -ErrorAction SilentlyContinue

# Remove test files
Remove-Item "games\neondrop\syntax-test.html" -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete! Ready for elegant neon drop experience." -ForegroundColor Green
