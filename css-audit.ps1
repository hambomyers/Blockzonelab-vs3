# CSS Audit Script - Extract all used CSS classes and IDs
# This script scans all HTML files and extracts used CSS selectors

Write-Host "🔍 CSS AUDIT: Scanning HTML files for used CSS selectors..." -ForegroundColor Green

# Initialize collections
$usedClasses = @()
$usedIds = @()
$cssFiles = @()

# Get all HTML files
$htmlFiles = Get-ChildItem -Path . -Recurse -Name "*.html" | Where-Object { $_ -notlike "*backup*" -and $_ -notlike "*temp*" }

Write-Host "`n📄 Found HTML files:" -ForegroundColor Yellow
$htmlFiles | ForEach-Object { Write-Host "  $_" }

# Function to extract selectors from HTML content
function Get-CSSSelectors {
    param($content, $file)
    
    Write-Host "`n🔍 Analyzing: $file" -ForegroundColor Cyan
    
    # Extract class attributes
    $classMatches = [regex]::Matches($content, 'class\s*=\s*["'']([^"'']+)["'']')
    foreach ($match in $classMatches) {
        $classes = $match.Groups[1].Value -split '\s+' | Where-Object { $_ -ne '' }
        $script:usedClasses += $classes
    }
    
    # Extract id attributes  
    $idMatches = [regex]::Matches($content, 'id\s*=\s*["'']([^"'']+)["'']')
    foreach ($match in $idMatches) {
        $script:usedIds += $match.Groups[1].Value
    }
    
    # Extract data attributes (for state selectors)
    $dataMatches = [regex]::Matches($content, 'data-([a-zA-Z0-9\-]+)')
    foreach ($match in $dataMatches) {
        $script:usedClasses += "[data-$($match.Groups[1].Value)]"
    }
}

# Analyze each HTML file
foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file -Raw -ErrorAction Stop
        Get-CSSSelectors -content $content -file $file
    }
    catch {
        Write-Host "⚠️  Could not read: $file" -ForegroundColor Red
    }
}

# Get unique selectors
$uniqueClasses = $usedClasses | Sort-Object | Get-Unique
$uniqueIds = $usedIds | Sort-Object | Get-Unique

# Find CSS files
$cssFiles = Get-ChildItem -Path . -Recurse -Name "*.css" | Where-Object { $_ -notlike "*backup*" -and $_ -notlike "*temp*" }

Write-Host "`n📊 AUDIT RESULTS:" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

Write-Host "`n🎯 USED CSS CLASSES ($($uniqueClasses.Count) total):" -ForegroundColor Yellow
$uniqueClasses | ForEach-Object { Write-Host "  .$_" }

Write-Host "`n🆔 USED IDS ($($uniqueIds.Count) total):" -ForegroundColor Yellow  
$uniqueIds | ForEach-Object { Write-Host "  #$_" }

Write-Host "`n📁 FOUND CSS FILES:" -ForegroundColor Yellow
$cssFiles | ForEach-Object { Write-Host "  $_" }

# Save results to files for analysis
$uniqueClasses | Out-File -FilePath "css-audit-classes.txt" -Encoding UTF8
$uniqueIds | Out-File -FilePath "css-audit-ids.txt" -Encoding UTF8
$cssFiles | Out-File -FilePath "css-audit-files.txt" -Encoding UTF8

Write-Host "`n✅ Audit complete! Results saved to:" -ForegroundColor Green
Write-Host "   📝 css-audit-classes.txt" -ForegroundColor White
Write-Host "   📝 css-audit-ids.txt" -ForegroundColor White  
Write-Host "   📝 css-audit-files.txt" -ForegroundColor White

Write-Host "`n🚀 Ready for CSS cleanup!" -ForegroundColor Green
