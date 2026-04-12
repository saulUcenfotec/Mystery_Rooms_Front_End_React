// puzzleLogic.js - Utilidades para la lógica del puzzle de nodos
// Contiene funciones auxiliares para determinar si un nodo está activo y verificar si se ganó

// Función para determinar si un nodo en (row, col) está activo
// Un nodo está activo si es uno de los verdes fijos o si está activado en el grid
export const isActive = (row, col, fixedGreens, grid) => {
  return fixedGreens.some(p => p.row === row && p.col === col) || grid[row][col]
}

// Función para determinar si un nodo está adyacente a un nodo activo
// Revisa las 4 direcciones: arriba, abajo, izquierda, derecha
export const isAdjacentToActive = (row, col, fixedGreens, grid) => {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] // Arriba, abajo, izquierda, derecha
  return directions.some(([dr, dc]) => {
    const nr = row + dr
    const nc = col + dc
    return nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && isActive(nr, nc, fixedGreens, grid)
  })
}

// Función para verificar si se ganó el juego
// Se gana si no quedan puntos rojos y están conectados todos los puntos verdes fijos
export const checkWin = (redPoints, visitedSet, fixedGreens) => {
  const allGreensConnected = fixedGreens.every(green => visitedSet.has(`${green.row}-${green.col}`))
  return redPoints.length === 0 && allGreensConnected
}
