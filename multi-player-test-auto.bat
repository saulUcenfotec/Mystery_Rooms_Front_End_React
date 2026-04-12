@echo off
REM multi-player-test-auto.bat
REM Script que detecta automáticamente el navegador disponible

echo 🚀 Iniciando prueba multijugador...
echo.

REM Verificar que el servidor esté corriendo
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: No se puede conectar al servidor en http://localhost:5173
    echo Asegúrate de ejecutar 'npm run dev' primero
    pause
    exit /b 1
)

echo ✅ Servidor detectado en http://localhost:5173
echo.

REM Detectar navegador disponible
set BROWSER_FOUND=0
set BROWSER_NAME=
set BROWSER_CMD=

REM Verificar Firefox
where firefox >nul 2>&1
if %errorlevel% == 0 (
    set BROWSER_FOUND=1
    set BROWSER_NAME=Firefox
    set BROWSER_CMD=firefox.exe
    goto :browser_detected
)

REM Verificar Microsoft Edge
where msedge >nul 2>&1
if %errorlevel% == 0 (
    set BROWSER_FOUND=1
    set BROWSER_NAME=Microsoft Edge
    set BROWSER_CMD=msedge.exe
    goto :browser_detected
)

REM Verificar Chrome
where chrome >nul 2>&1
if %errorlevel% == 0 (
    set BROWSER_FOUND=1
    set BROWSER_NAME=Chrome
    set BROWSER_CMD=chrome.exe
    goto :browser_detected
)

:browser_detected
if %BROWSER_FOUND% == 0 (
    echo ❌ Error: No se encontró ningún navegador compatible (Firefox, Edge, Chrome)
    echo Instala Firefox, Edge o Chrome para usar este script
    pause
    exit /b 1
)

echo 📋 Navegador detectado: %BROWSER_NAME%
echo 📋 Instrucciones:
echo 1. Se abrirán 3 ventanas del navegador
echo 2. Cada ventana representa un jugador diferente
echo 3. Crea salas con el mismo nombre en cada ventana
echo 4. Juega por turnos o simultáneamente
echo.

REM Crear directorios temporales para perfiles
if not exist "C:\temp" mkdir C:\temp

REM Configurar comandos según el navegador
if "%BROWSER_NAME%" == "Firefox" (
    if not exist "C:\temp\firefox-profile-1" mkdir C:\temp\firefox-profile-1
    if not exist "C:\temp\firefox-profile-2" mkdir C:\temp\firefox-profile-2
    if not exist "C:\temp\firefox-profile-3" mkdir C:\temp\firefox-profile-3

    echo 🖥️  Abriendo ventanas de Firefox...
    start %BROWSER_CMD% -profile "C:\temp\firefox-profile-1" -new-instance http://localhost:5173
    timeout /t 2 /nobreak >nul
    start %BROWSER_CMD% -profile "C:\temp\firefox-profile-2" -new-instance http://localhost:5173
    timeout /t 2 /nobreak >nul
    start %BROWSER_CMD% -profile "C:\temp\firefox-profile-3" -new-instance http://localhost:5173
) else if "%BROWSER_NAME%" == "Microsoft Edge" (
    if not exist "C:\temp\edge-profile-1" mkdir C:\temp\edge-profile-1
    if not exist "C:\temp\edge-profile-2" mkdir C:\temp\edge-profile-2
    if not exist "C:\temp\edge-profile-3" mkdir C:\temp\edge-profile-3

    echo 🖥️  Abriendo ventanas de Edge...
    start %BROWSER_CMD% --new-window --user-data-dir=C:\temp\edge-profile-1 http://localhost:5173
    timeout /t 2 /nobreak >nul
    start %BROWSER_CMD% --new-window --user-data-dir=C:\temp\edge-profile-2 http://localhost:5173
    timeout /t 2 /nobreak >nul
    start %BROWSER_CMD% --new-window --user-data-dir=C:\temp\edge-profile-3 http://localhost:5173
) else (
    if not exist "C:\temp\chrome-profile-1" mkdir C:\temp\chrome-profile-1
    if not exist "C:\temp\chrome-profile-2" mkdir C:\temp\chrome-profile-2
    if not exist "C:\temp\chrome-profile-3" mkdir C:\temp\chrome-profile-3

    echo 🖥️  Abriendo ventanas de Chrome...
    start %BROWSER_CMD% --new-window --user-data-dir=C:\temp\chrome-profile-1 http://localhost:5173
    timeout /t 2 /nobreak >nul
    start %BROWSER_CMD% --new-window --user-data-dir=C:\temp\chrome-profile-2 http://localhost:5173
    timeout /t 2 /nobreak >nul
    start %BROWSER_CMD% --new-window --user-data-dir=C:\temp\chrome-profile-3 http://localhost:5173
)

echo.
echo ✅ Todas las ventanas abiertas!
echo Presiona cualquier tecla para limpiar perfiles temporales y salir...
pause >nul

REM Limpiar perfiles temporales
echo 🧹 Limpiando perfiles temporales...
if "%BROWSER_NAME%" == "Firefox" (
    rmdir /s /q C:\temp\firefox-profile-1 2>nul
    rmdir /s /q C:\temp\firefox-profile-2 2>nul
    rmdir /s /q C:\temp\firefox-profile-3 2>nul
) else if "%BROWSER_NAME%" == "Microsoft Edge" (
    rmdir /s /q C:\temp\edge-profile-1 2>nul
    rmdir /s /q C:\temp\edge-profile-2 2>nul
    rmdir /s /q C:\temp\edge-profile-3 2>nul
) else (
    rmdir /s /q C:\temp\chrome-profile-1 2>nul
    rmdir /s /q C:\temp\chrome-profile-2 2>nul
    rmdir /s /q C:\temp\chrome-profile-3 2>nul
)

echo 👋 ¡Hasta luego!
timeout /t 3 >nul