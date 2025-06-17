@echo off
REM ZOMBIE FILE ELIMINATION SCRIPT
REM ================================
REM This script aggressively removes all backup, temp, and duplicate files
REM Safe - only removes known backup/temp patterns, never source code

echo.
echo [ZOMBIE CLEANER] Starting aggressive file cleanup...
echo.
for /r %%i in (*.backup, *.old, *-copy.*, *.tmp, *.temp, *~) do (
    if exist "%%i" (
        echo Deleting: %%i
        del /f /q "%%i"
    )
)

REM Clean history folders
echo Cleaning history folders...
for /d /r %%i in (.history, .vscode\history) do (
    if exist "%%i" (
        echo Removing: %%i
        rmdir /s /q "%%i"
    )
)

REM Clean OS files
echo Cleaning OS zombie files...
for /r %%i in (.DS_Store, Thumbs.db, desktop.ini) do (
    if exist "%%i" (
        echo Deleting: %%i
        del /f /q "%%i"
    )
)

REM Clean swap files
echo Cleaning swap files...
for /r %%i in (*.swp, *.swo, *.bak) do (
    if exist "%%i" (
        echo Deleting: %%i
        del /f /q "%%i"
    )
)

echo ✅ Zombie cleanup complete!
echo Total files cleaned: 
dir /s /b *.backup *.old *-copy.* *.tmp *.temp *~ 2>nul | find /c /v ""
pause
