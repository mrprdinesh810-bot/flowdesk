@echo off
setlocal
echo ===================================================
echo   FlowDesk Android APK Builder
echo ===================================================

set "JAVA_HOME=C:\Users\KiTE\AppData\Local\jdk-21\jdk-21.0.12.1+1"
set "ANDROID_HOME=C:\Users\KiTE\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=C:\Users\KiTE\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0apps\web"
echo [1/3] Building Web Assets...
call npm run build
if %errorlevel% neq 0 (
  echo Error: Web build failed!
  pause
  exit /b %errorlevel%
)

echo [2/3] Syncing Android Native Project...
call npx cap sync android
if %errorlevel% neq 0 (
  echo Error: Capacitor sync failed!
  pause
  exit /b %errorlevel%
)

cd /d "%~dp0apps\web\android"
echo [3/3] Compiling Android APK with Gradle...
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
  echo Error: Gradle build failed!
  pause
  exit /b %errorlevel%
)

echo.
echo [4/4] Archiving Versioned Release APK...
set "APP_VERSION=1.0.1"

if not exist "%~dp0releases" mkdir "%~dp0releases"
if not exist "%~dp0apps\server\public\releases" mkdir "%~dp0apps\server\public\releases"

copy /Y "%~dp0apps\web\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0releases\FlowDesk-v%APP_VERSION%.apk"
copy /Y "%~dp0apps\web\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0apps\server\public\releases\FlowDesk-v%APP_VERSION%.apk"
copy /Y "%~dp0apps\web\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0FlowDesk.apk"
copy /Y "%~dp0apps\web\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0apps\server\public\FlowDesk.apk"

echo.
echo ===================================================
echo   SUCCESS! FlowDesk v%APP_VERSION% APK is ready!
echo   Versioned Archive: %~dp0releases\FlowDesk-v%APP_VERSION%.apk
echo   Latest Pointer:    %~dp0FlowDesk.apk
echo ===================================================
pause
