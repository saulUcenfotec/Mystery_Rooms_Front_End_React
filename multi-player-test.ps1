# multi-player-test.ps1
# Script para abrir múltiples instancias del navegador para testing de multijugadores

param(
    [int]$playerCount = 2,
    [string]$url = "http://localhost:5173"
)

Write-Host "🚀 Iniciando prueba multijugador con $playerCount jugadores..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host ""

# Verificar que el servidor esté corriendo
try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Servidor detectado en $url" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: No se puede conectar al servidor en $url" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar 'npm run dev' primero" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Instrucciones para testing:" -ForegroundColor Magenta
Write-Host "1. Cada ventana del navegador representa un jugador" -ForegroundColor White
Write-Host "2. Crea una sala con $playerCount jugadores en cada ventana" -ForegroundColor White
Write-Host "3. Juega por turnos o simultáneamente según el diseño" -ForegroundColor White
Write-Host "4. Observa cómo se sincroniza el progreso" -ForegroundColor White
Write-Host ""

# Abrir múltiples instancias del navegador
for ($i = 1; $i -le $playerCount; $i++) {
    Write-Host "🖥️  Abriendo ventana para Jugador $i..." -ForegroundColor Cyan

    # Crear directorio de perfil si no existe
    $profileDir = "C:\temp\firefox-profile-$i"
    if (!(Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }

    # Usar start-process para abrir Firefox sin bloquear
    Start-Process "firefox.exe" -ArgumentList "-profile", "`"$profileDir`"", "-new-instance", "`"$url`""

    # Pequeña pausa entre aperturas
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ Todas las ventanas abiertas!" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para cerrar este script" -ForegroundColor Gray

# Mantener el script corriendo
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "👋 Script terminado" -ForegroundColor Yellow
}
