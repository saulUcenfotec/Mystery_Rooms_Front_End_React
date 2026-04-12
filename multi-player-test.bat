@echo off
REM multi-player-test.bat
REM Script simple para abrir múltiples instancias del navegador

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
echo 📋 Instrucciones:
echo 1. Se abrirán 3 ventanas del navegador
echo 2. Cada ventana representa un jugador diferente
echo 3. Crea salas con el mismo nombre en cada ventana
echo 4. Juega por turnos o simultáneamente
echo.

REM Crear directorios temporales para perfiles
if not exist "C:\temp" mkdir C:\temp
if not exist "C:\temp\firefox-profile-1" mkdir C:\temp\firefox-profile-1
if not exist "C:\temp\firefox-profile-2" mkdir C:\temp\firefox-profile-2
if not exist "C:\temp\firefox-profile-3" mkdir C:\temp\firefox-profile-3

echo 🖥️  Abriendo ventanas...
start firefox.exe -profile "C:\temp\firefox-profile-1" -new-instance http://localhost:5173
timeout /t 2 /nobreak >nul
start firefox.exe -profile "C:\temp\firefox-profile-2" -new-instance http://localhost:5173
timeout /t 2 /nobreak >nul
start firefox.exe -profile "C:\temp\firefox-profile-3" -new-instance http://localhost:5173

echo.
echo ✅ Todas las ventanas abiertas!
echo Presiona cualquier tecla para limpiar perfiles temporales y salir...
pause >nul

REM Limpiar perfiles temporales
echo 🧹 Limpiando perfiles temporales...
rmdir /s /q C:\temp\firefox-profile-1 2>nul
rmdir /s /q C:\temp\firefox-profile-2 2>nul
rmdir /s /q C:\temp\firefox-profile-3 2>nul

echo 👋 ¡Hasta luego!
timeout /t 3 >nul