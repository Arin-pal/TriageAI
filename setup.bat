cat > ~/Documents/GitHub/TriageAI/setup.bat << 'EOF'
@echo off
cls

echo.
echo  TriageAI - First Time Setup
echo  AI-Powered Medical Triage for Mass Casualty Events
echo.
echo ============================================================
echo.

SET PROJECT_DIR=%~dp0

REM Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo       ERROR: Node.js not found!
    echo       Install from: https://nodejs.org
    echo       Then run this script again.
    pause
    exit /b 1
)
FOR /F "tokens=*" %%i IN ('node --version') DO echo       OK: Node.js %%i found

REM Check Ollama
echo.
echo [2/6] Checking Ollama...
ollama --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo       ERROR: Ollama not found!
    echo       Install from: https://ollama.com
    echo       Then run this script again.
    pause
    exit /b 1
)
echo       OK: Ollama found

REM Download Gemma model
echo.
echo [3/6] Checking Gemma 4 model (~9.6GB)...
ollama list | findstr "gemma4:e4b" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo       Downloading gemma4:e4b - this may take 10-20 minutes...
    ollama pull gemma4:e4b
    echo       OK: gemma4:e4b downloaded
) ELSE (
    echo       OK: gemma4:e4b already downloaded
)

REM Install frontend dependencies
echo.
echo [4/6] Installing frontend dependencies...
cd /d "%PROJECT_DIR%"
call npm install --silent
echo       OK: Frontend dependencies installed

REM Install backend dependencies
echo.
echo [5/6] Installing backend dependencies...
cd /d "%PROJECT_DIR%triageai-server"
call npm install --silent
echo       OK: Backend dependencies installed

REM Generate SSL certificate
echo.
echo [6/6] Generating security certificate...
IF EXIST "%PROJECT_DIR%triageai-server\key.pem" (
    echo       OK: Certificate already exists
) ELSE (
    cd /d "%PROJECT_DIR%triageai-server"
    openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=triageai" -addext "subjectAltName=IP:0.0.0.0,IP:127.0.0.1,DNS:localhost"
    echo       OK: Certificate generated
)

echo.
echo ============================================================
echo.
echo   Setup complete!
echo.
echo   Now run: start.bat
echo.
echo ============================================================
echo.
pause
EOF