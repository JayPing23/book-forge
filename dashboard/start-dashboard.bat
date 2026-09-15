@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  book-forge dashboard launcher
REM
REM  Double-click this file. It starts the dashboard and opens
REM  your browser. Close this window to stop it.
REM
REM  The workspace is this file's own folder, so keep it in the
REM  workspace root (next to projects\ and vault\).
REM ============================================================

REM --- Edit this if you move the book-forge repo ---
set "PLUGIN_DIR=C:\book-forge"
REM -------------------------------------------------

set "WORKSPACE=%~dp0"
if "%WORKSPACE:~-1%"=="\" set "WORKSPACE=%WORKSPACE:~0,-1%"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=5173"

title book-forge dashboard (port %PORT%)

echo.
echo   book-forge dashboard
echo   workspace : %WORKSPACE%
echo   plugin    : %PLUGIN_DIR%
echo   port      : %PORT%
echo.

if not exist "%PLUGIN_DIR%\dashboard\server.py" (
    echo   [ERROR] Could not find the dashboard at:
    echo           %PLUGIN_DIR%\dashboard\server.py
    echo.
    echo   Edit PLUGIN_DIR at the top of this file to point at
    echo   wherever the book-forge repo lives.
    echo.
    pause
    exit /b 1
)

REM Find Python. The py launcher is the most reliable on Windows.
set "PY_CMD="
where py >nul 2>&1 && set "PY_CMD=py"
if not defined PY_CMD ( where python >nul 2>&1 && set "PY_CMD=python" )
if not defined PY_CMD (
    echo   [ERROR] Python not found on PATH.
    echo   Install it from https://www.python.org/downloads/
    echo   ^(tick "Add Python to PATH" during install^)
    echo.
    pause
    exit /b 1
)

REM The frontend only needs building if dist/ is missing. Normal use
REM never needs Node -- server.py serves the prebuilt files directly.
if not exist "%PLUGIN_DIR%\dashboard\frontend\dist\index.html" (
    echo   First run: building the dashboard once. This needs Node.js.
    echo.
    where npm >nul 2>&1
    if errorlevel 1 (
        echo   [ERROR] npm not found, and the dashboard has not been built yet.
        echo   Install Node.js from https://nodejs.org/ then run this again.
        echo   ^(Only needed for this one-time build, not for daily use.^)
        echo.
        pause
        exit /b 1
    )
    pushd "%PLUGIN_DIR%\dashboard\frontend"
    call npm install
    call npm run build
    popd
    echo.
)

REM Open the browser a moment after the server starts listening.
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:%PORT%/"

echo   Starting... your browser will open in a moment.
echo   Close this window to stop the dashboard.
echo.

"%PY_CMD%" "%PLUGIN_DIR%\dashboard\server.py" --workspace "%WORKSPACE%" --port %PORT%

REM Only reached if the server exits on its own (e.g. port in use).
echo.
echo   Dashboard stopped.
echo   If that was immediate, port %PORT% may already be in use --
echo   try: dashboard.bat 5174
echo.
pause
