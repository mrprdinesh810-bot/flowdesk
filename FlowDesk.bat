@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"
title FlowDesk Launcher

:: Check if Node is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Check if backend server is already running on port 4000
netstat -ano | findstr ":4000.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] FlowDesk Backend is already running.
) else (
    echo [..] Starting FlowDesk Backend on port 4000...
    start "FlowDesk-Backend" /min cmd /c "cd /d %~dp0 && npm --workspace=apps/server run dev"
)

:: Check if web frontend is already running on port 3000
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] FlowDesk Frontend is already running.
) else (
    echo [..] Starting FlowDesk Web Frontend on port 3000...
    start "FlowDesk-Web" /min cmd /c "cd /d %~dp0 && npm --workspace=apps/web run dev"
)

:: Brief pause to allow servers to bind
timeout /t 2 /nobreak >nul

:: Try launching in dedicated App Mode (Chromeless standalone desktop window)
set LAUNCHED=0

:: Check for Microsoft Edge
where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" msedge --app=http://localhost:3000 --window-size=1280,850
    set LAUNCHED=1
    goto :done
)

:: Check for Google Chrome
where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" chrome --app=http://localhost:3000 --window-size=1280,850
    set LAUNCHED=1
    goto :done
)

:: Common Edge path fallback
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1280,850
    set LAUNCHED=1
    goto :done
)

:: Common Chrome path fallback
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1280,850
    set LAUNCHED=1
    goto :done
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1280,850
    set LAUNCHED=1
    goto :done
)

:: Default browser fallback
start http://localhost:3000

:done
echo [OK] FlowDesk launched successfully!
exit /b 0
