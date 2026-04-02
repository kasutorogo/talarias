@echo off
REM Template Launcher - Windows installer
REM Run: double-click install-win.bat or run from cmd

echo === Template Launcher - Windows Installer ===
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Downloading installer...
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Download the LTS version and run the installer.
    echo After installing, run this script again.
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)

echo Node.js: OK
node -v

REM Install dependencies
echo Installing dependencies...
cd /d "%~dp0"
call npm install

echo.
echo === Installation complete ===
echo.
echo To start the app, open a terminal in this folder and run:
echo   npm start
echo.
echo Shortcut: Alt+Shift+Z (brings the app to front)
echo.
pause
