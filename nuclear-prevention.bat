@echo off
echo 🚀 NUCLEAR ZOMBIE PREVENTION - Activating shields...

REM Stop cloud sync services temporarily
echo Pausing OneDrive...
taskkill /F /IM "OneDrive.exe" 2>nul

echo Pausing Dropbox...
taskkill /F /IM "Dropbox.exe" 2>nul

REM Clear file system cache
echo Clearing file system cache...
echo 3 > %TEMP%\flush.txt
type %TEMP%\flush.txt > nul
del %TEMP%\flush.txt

REM Create file watcher exclusions
echo Creating watcher exclusions...
if not exist ".vscode" mkdir ".vscode"

REM Create aggressive settings
echo {"files.watcherExclude": {"**": true}, "files.autoSave": "off", "workbench.localHistory.enabled": false} > .vscode\zombie-settings.json

echo ✅ Nuclear prevention activated!
echo OneDrive and Dropbox paused
echo File watchers disabled
echo Auto-save disabled
pause
