cat > ~/Documents/GitHub/TriageAI/start.bat << 'EOF'
@echo off
cls

echo.
echo  TriageAI - AI-Powered Medical Triage
echo  AI-Powered Medical Triage for Mass Casualty Events
echo.
echo ============================================================
echo.

SET PROJECT_DIR=%~dp0

echo [1/3] Starting Ollama AI Engine...
start /B "" cmd /c "set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve"
timeout /t 3 /nobreak > nul
echo       OK: Ollama running on port 11434

echo.
echo [2/3] Starting Backend Server...
cd /d "%PROJECT_DIR%triageai-server"
start /B "" cmd /c "node server.js"
timeout /t 2 /nobreak > nul
echo       OK: Backend running on port 3000

echo.
echo [3/3] Starting Frontend...
cd /d "%PROJECT_DIR%"
start /B "" cmd /c "npm run dev"
timeout /t 4 /nobreak > nul
echo       OK: Frontend running on port 5174

echo.
echo ============================================================

FOR /F "tokens=2 delims=:" %%a IN ('ipconfig ^| findstr /i "IPv4 Address" ^| findstr /v "169"') DO (
    SET IP=%%a
    goto :done
)
:done
SET IP=%IP: =%

echo.
echo   Responder URL:  https://%IP%:5174
echo   Commander URL:  https://%IP%:5174/commander
echo.
echo ============================================================
echo.
echo   TriageAI is ready. Lives can be saved.
echo.
pause
EOF