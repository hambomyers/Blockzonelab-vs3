@echo off
echo 🎯 STARTING CLEAN WORK SESSION...

REM Kill all VS Code processes
echo Terminating VS Code...
taskkill /F /IM "Code.exe" 2>nul
taskkill /F /IM "Code - Insiders.exe" 2>nul
timeout /t 2 /nobreak > nul

REM Run zombie cleaner
echo Running zombie cleaner...
call clean-zombies.bat

REM Clear VS Code workspace cache
echo Clearing VS Code cache...
if exist "%APPDATA%\Code\User\workspaceStorage" (
    rmdir /s /q "%APPDATA%\Code\User\workspaceStorage"
)

REM Run nuclear prevention
echo Activating zombie shields...
call nuclear-prevention.bat

REM Start VS Code with clean flags
echo Starting VS Code with zombie protection...
timeout /t 3 /nobreak > nul
code . --no-restore --disable-extensions --new-window

echo ✅ Clean work session started!
pause
