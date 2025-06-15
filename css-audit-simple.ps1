# CSS Audit Script - Extract all used CSS classes and IDs
Write-Host "CSS AUDIT: Scanning HTML files for used CSS selectors..." -ForegroundColor Green

$usedClasses = @()
$usedIds = @()

# Get all HTML files
$htmlFiles = Get-ChildItem -Path . -Recurse -Filter "*.html" | Where-Object { $_.Name -notlike "*backup*" }

Write-Host "Found HTML files:" -ForegroundColor Yellow
$htmlFiles | ForEach-Object { Write-Host "  $($_.Name)" }

# Analyze each HTML file
foreach ($file in $htmlFiles) {
    Write-Host "Analyzing: $($file.Name)" -ForegroundColor Cyan
    
    $content = Get-Content -Path $file.FullName -Raw
    
    # Extract class attributes
    $classMatches = [regex]::Matches($content, 'class="([^"]*)"')
    foreach ($match in $classMatches) {
        $classes = $match.Groups[1].Value -split '\s+' | Where-Object { $_ -ne '' }
        $usedClasses += $classes
    }
    
    # Extract single quote classes
    $classMatches2 = [regex]::Matches($content, "class='([^']*)'")
    foreach ($match in $classMatches2) {
        $classes = $match.Groups[1].Value -split '\s+' | Where-Object { $_ -ne '' }
        $usedClasses += $classes
    }
    
    # Extract id attributes
    $idMatches = [regex]::Matches($content, 'id="([^"]*)"')
    foreach ($match in $idMatches) {
        $usedIds += $match.Groups[1].Value
    }
    
    # Extract single quote ids  
    $idMatches2 = [regex]::Matches($content, "id='([^']*)'")
    foreach ($match in $idMatches2) {
        $usedIds += $match.Groups[1].Value
    }
}

# Get unique selectors
$uniqueClasses = $usedClasses | Sort-Object | Get-Unique
$uniqueIds = $usedIds | Sort-Object | Get-Unique

Write-Host "`nAUDIT RESULTS:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green

Write-Host "`nUSED CSS CLASSES:" -ForegroundColor Yellow
$uniqueClasses | ForEach-Object { Write-Host "  .$_" }

Write-Host "`nUSED IDS:" -ForegroundColor Yellow  
$uniqueIds | ForEach-Object { Write-Host "  #$_" }

# Save results
$uniqueClasses | Out-File -FilePath "css-classes-used.txt"
$uniqueIds | Out-File -FilePath "css-ids-used.txt"

Write-Host "`nResults saved to css-classes-used.txt and css-ids-used.txt" -ForegroundColor Green

# Find CSS files
$cssFiles = Get-ChildItem -Path . -Recurse -Filter "*.css"
Write-Host "`nCSS FILES FOUND:" -ForegroundColor Yellow
$cssFiles | ForEach-Object { Write-Host "  $($_.FullName)" }

Write-Host "`nReady for cleanup!" -ForegroundColor Green
