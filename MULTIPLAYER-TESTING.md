# Guía de Testing Multijugador

## 🎯 Cómo Probar Múltiples Jugadores en Local

### Método 1: Modo Prueba Integrado (Recomendado)
1. **Ejecuta el servidor:**
   ```bash
   npm run dev
   ```

2. **Abre el navegador** y ve a `http://localhost:5173`

3. **Selecciona "🧪 Modo Prueba Multijugador"** en el menú principal

4. **Observa el sistema de turnos:**
   - La sala se crea automáticamente con 3 jugadores
   - Puedes cambiar entre vistas de diferentes jugadores
   - Los turnos avanzan automáticamente al completar puzzles
   - Se muestra el progreso individual y total

### Método 2: Múltiples Ventanas del Navegador (Automático)
1. **Ejecuta el servidor:**
   ```bash
   npm run dev
   ```

2. **Usa el script automático:**
   ```bash
   .\multi-player-test-auto.bat
   ```
   - **Detecta automáticamente** Firefox, Edge o Chrome
   - Abre 3 ventanas automáticamente
   - Cada ventana es un "jugador" independiente

### Método 3: Múltiples Ventanas del Navegador (Manual)
1. **Ejecuta el servidor:**
   ```bash
   npm run dev
   ```

2. **Usa el script PowerShell:**
   ```powershell
   .\multi-player-test.ps1 -playerCount 3
   ```

   O manualmente abre múltiples pestañas/ventanas con perfiles separados:
   - Ventana 1: `firefox.exe -profile "C:\temp\firefox-profile-1" -new-instance http://localhost:5173`
   - Ventana 2: `firefox.exe -profile "C:\temp\firefox-profile-2" -new-instance http://localhost:5173`
   - Ventana 3: `firefox.exe -profile "C:\temp\firefox-profile-3" -new-instance http://localhost:5173`

3. **En cada ventana:**
   - Crea una sala con el mismo nombre y configuración
   - Juega por turnos o simultáneamente

### Método 3: Múltiples Dispositivos en la Red Local
1. **Ejecuta el servidor:**
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

2. **Encuentra la IP local:**
   ```bash
   ipconfig  # En Windows
   ```

3. **Otros dispositivos** acceden a `http://[TU_IP]:5173`

## 🏆 Características del Sistema Multijugador

### Sistema de Turnos
- **Jugador Actual:** Se resalta en amarillo en la tabla de jugadores
- **Rotación Automática:** Al completar un puzzle, pasa al siguiente jugador
- **Puntuación Individual:** 100 puntos por puzzle completado

### Interfaz Mejorada
- **HUD del Jugador:** Muestra información del jugador actual
- **Tabla de Jugadores:** Progreso y puntuación de todos
- **Indicador en Puzzle:** Muestra qué jugador está jugando actualmente

### Sala 3D Compartida
- **Entorno Compartido:** Todos los jugadores ven la misma sala
- **Estaciones Interactivas:** Cilindros que representan puzzles
- **Puerta de Salida:** Verde, permite salir cuando todos terminan

## 🐛 Troubleshooting

### Problemas Comunes:
1. **Servidor no inicia:** Asegúrate de tener Node.js instalado y ejecutar `npm install`
2. **Múltiples ventanas no se abren:** Los scripts requieren Firefox, Edge o Chrome instalado
3. **Perfiles separados:** Si usas el mismo perfil, las sesiones se compartirán
4. **Script automático:** Si no detecta tu navegador, verifica que esté en el PATH del sistema

### Comandos Útiles:
```bash
# Ver procesos de Node.js
tasklist | findstr node

# Matar procesos de Node.js
taskkill /F /IM node.exe

# Limpiar perfiles temporales
Remove-Item -Recurse -Force C:\temp\chrome-profile-*
```

## 📊 Métricas de Testing

- ✅ Sistema de turnos funcionando
- ✅ Interfaz multijugador responsive
- ✅ Progreso individual y grupal
- ✅ Navegación 3D compartida
- ✅ Indicadores visuales claros

¡El sistema está listo para pruebas multijugador! 🎉