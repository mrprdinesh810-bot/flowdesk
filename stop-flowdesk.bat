@echo off
title Stop FlowDesk
echo Stopping FlowDesk servers...

:: Find and terminate processes listening on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    echo Stopping process on port 3000 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Find and terminate processes listening on port 4000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000.*LISTENING"') do (
    echo Stopping process on port 4000 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] FlowDesk services stopped.
timeout /t 2 /nobreak >nul
exit /b 0
