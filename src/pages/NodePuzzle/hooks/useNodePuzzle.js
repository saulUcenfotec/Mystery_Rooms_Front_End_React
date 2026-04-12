// useNodePuzzle.js - Hook personalizado para manejar la lógica del puzzle de nodos
// Contiene todo el estado y lógica del juego, incluyendo grid, puntos rojos, activaciones, etc.

import { useState, useMemo, useEffect } from 'react'
import { isActive, isAdjacentToActive, checkWin } from '../utils/puzzleLogic.js'

export const useNodePuzzle = () => {
  // Estado del grid: array 5x5 de booleanos, true si el nodo está activado
  const [grid, setGrid] = useState(() => {
    return Array(5).fill().map(() => Array(5).fill(false))
  })

  // Puntos verdes fijos: inicio (0,0) y fin (4,4)
  const fixedGreens = [
    { row: 0, col: 0 },
    { row: 4, col: 4 }
  ]

  // Función auxiliar para verificar si existe una solución válida
  const hasSolution = (redPoints) => {
    const redPointsSet = new Set(redPoints.map(p => `${p.row}-${p.col}`))
    
    // DFS para encontrar si existe un camino que pase por todos los puntos rojos
    const dfs = (row, col, visited, redVisited) => {
      const key = `${row}-${col}`
      
      // Si visitamos un punto rojo, marcarlo
      if (redPointsSet.has(key) && !redVisited.has(key)) {
        redVisited.add(key)
      }
      
      // Si alcanzamos el fin y visitamos todos los rojos
      if (row === 4 && col === 4 && redVisited.size === 3) {
        return true
      }
      
      // Explorar vecinos adyacentes
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dr, dc] of directions) {
        const nr = row + dr
        const nc = col + dc
        const nkey = `${nr}-${nc}`
        
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && !visited.has(nkey)) {
          visited.add(nkey)
          if (dfs(nr, nc, visited, new Set(redVisited))) {
            return true
          }
          visited.delete(nkey)
        }
      }
      
      return false
    }
    
    return dfs(0, 0, new Set(['0-0']), new Set())
  }

  // Función auxiliar para verificar que no haya puntos rojos en diagonal
  const hasNoRedDiagonals = (redPoints) => {
    for (let i = 0; i < redPoints.length; i++) {
      for (let j = i + 1; j < redPoints.length; j++) {
        const r1 = redPoints[i].row
        const c1 = redPoints[i].col
        const r2 = redPoints[j].row
        const c2 = redPoints[j].col
        
        // Verificar si están en diagonal (diferencia de 1 en ambas dimensiones)
        if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) {
          return false
        }
      }
    }
    return true
  }

  // Función auxiliar para verificar que no haya 2 puntos rojos adyacentes al mismo nodo verde
  const hasNoDoubleRedAdjacent = (redPoints) => {
    const redPointsSet = new Set(redPoints.map(p => `${p.row}-${p.col}`))
    const fixedGreens = [
      { row: 0, col: 0 },
      { row: 4, col: 4 }
    ]
    
    // Para cada nodo verde, contar cuántos puntos rojos hay adyacentes
    for (const green of fixedGreens) {
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      let redCount = 0
      for (const [dr, dc] of directions) {
        const nr = green.row + dr
        const nc = green.col + dc
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          if (redPointsSet.has(`${nr}-${nc}`)) {
            redCount++
          }
        }
      }
      // Si hay más de 1 punto rojo adyacente a este verde, la configuración es inválida
      if (redCount > 1) {
        return false
      }
    }
    
    return true
  }

  // Estado de los puntos rojos: array de objetos {row, col}
  const [redPoints, setRedPoints] = useState(() => {
    let points = []
    let attempts = 0
    const maxAttempts = 100
    
    // Intentar generar una configuración válida
    while (points.length === 0 && attempts < maxAttempts) {
      const candidates = []
      const used = new Set()
      const fixedGreensSet = new Set(['0-0', '4-4'])
      
      while (candidates.length < 3) {
        const row = Math.floor(Math.random() * 5)
        const col = Math.floor(Math.random() * 5)
        const key = `${row}-${col}`
        if (!used.has(key) && !fixedGreensSet.has(key)) {
          used.add(key)
          candidates.push({ row, col })
        }
      }
      
      // Verificar que la configuración tiene solución y cumple todas las reglas
      if (hasSolution(candidates) && hasNoDoubleRedAdjacent(candidates) && hasNoRedDiagonals(candidates)) {
        points = candidates
      }
      
      attempts++
    }
    
    return points.length > 0 ? points : []
  })

  // Estado para recordar qué nodos activados vinieron de puntos rojos
  const [activatedFromRed, setActivatedFromRed] = useState(() => new Set())

  // Conjunto de nodos activos (fijos + activados)
  const activeSet = useMemo(() => {
    const set = new Set()
    for (const green of fixedGreens) {
      set.add(`${green.row}-${green.col}`)
    }
    grid.forEach((row, r) => row.forEach((active, c) => {
      if (active) set.add(`${r}-${c}`)
    }))
    return set
  }, [grid])

  // Conjunto de nodos visitados (alcanzables desde el inicio)
  const visitedSet = useMemo(() => {
    const visited = new Set()
    const queue = []
    // Solo iniciar desde el primer punto verde (inicio)
    const start = fixedGreens[0]
    queue.push([start.row, start.col])
    visited.add(`${start.row}-${start.col}`)
    while (queue.length) {
      const [row, col] = queue.shift()
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dr, dc] of directions) {
        const nr = row + dr
        const nc = col + dc
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && isActive(nr, nc, fixedGreens, grid) && !visited.has(`${nr}-${nc}`)) {
          visited.add(`${nr}-${nc}`)
          queue.push([nr, nc])
        }
      }
    }
    return visited
  }, [grid])

  // Verificar si el juego terminó por tener un nodo con más de 2 conexiones
  const isGameOver = useMemo(() => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (isActive(r, c, fixedGreens, grid)) {
          let count = 0
          const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
          for (const [dr, dc] of directions) {
            const nr = r + dr
            const nc = c + dc
            if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && isActive(nr, nc, fixedGreens, grid)) {
              count++
            }
          }
          if (count > 2) return true
        }
      }
    }
    return false
  }, [grid])

  // Verificar si el puzzle ya está resuelto
  const isWon = useMemo(() => checkWin(redPoints, visitedSet, fixedGreens), [redPoints, visitedSet, fixedGreens])

  // Función para manejar clicks en nodos
  const toggle = (row, col) => {
    if (fixedGreens.some(p => p.row === row && p.col === col) || isGameOver) return

    const key = `${row}-${col}`
    const isRed = redPoints.some(p => p.row === row && p.col === col)
    const isFromRed = activatedFromRed.has(key)

    if (isRed) {
      // Si es rojo y está adyacente a activo, activarlo y remover de rojos
      if (!isAdjacentToActive(row, col, fixedGreens, grid)) return
      setGrid(prev => {
        const next = prev.map(r => r.slice())
        next[row][col] = true
        return next
      })
      setRedPoints(prev => prev.filter(p => !(p.row === row && p.col === col)))
      setActivatedFromRed(prev => {
        const next = new Set(prev)
        next.add(key)
        return next
      })
      return
    }

    if (grid[row][col]) {
      // Si está activado, desactivarlo
      setGrid(prev => {
        const next = prev.map(r => r.slice())
        next[row][col] = false
        return next
      })
      if (isFromRed) {
        // Si vino de rojo, volver a rojo
        setActivatedFromRed(prev => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        setRedPoints(prev => [...prev, { row, col }])
      }
    } else if (isAdjacentToActive(row, col, fixedGreens, grid)) {
      // Si no está activado y es adyacente, activarlo
      setGrid(prev => {
        const next = prev.map(r => r.slice())
        next[row][col] = true
        return next
      })
    }
  }

  // Efecto para manejar desconexiones: si se desconecta un nodo, las ramas perdidas se desactivan
  useEffect(() => {
    const startKey = `${fixedGreens[0].row}-${fixedGreens[0].col}`
    const reachable = new Set([startKey])
    const queue = [[fixedGreens[0].row, fixedGreens[0].col]]

    while (queue.length) {
      const [r, c] = queue.shift()
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dr, dc] of directions) {
        const nr = r + dr
        const nc = c + dc
        const key = `${nr}-${nc}`
        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && grid[nr][nc] && !reachable.has(key)) {
          reachable.add(key)
          queue.push([nr, nc])
        }
      }
    }

    const nextGrid = grid.map((row, r) => row.map((active, c) => {
      const key = `${r}-${c}`
      return active && reachable.has(key)
    }))

    const disconnectedFromRed = Array.from(activatedFromRed).filter(key => !reachable.has(key))

    if (JSON.stringify(nextGrid) !== JSON.stringify(grid) || disconnectedFromRed.length > 0) {
      if (JSON.stringify(nextGrid) !== JSON.stringify(grid)) {
        setGrid(nextGrid)
      }
      if (disconnectedFromRed.length > 0) {
        setActivatedFromRed(prev => {
          const next = new Set(prev)
          disconnectedFromRed.forEach(k => next.delete(k))
          return next
        })
        setRedPoints(prev => [
          ...prev,
          ...disconnectedFromRed.map(k => {
            const [r, c] = k.split('-').map(Number)
            return { row: r, col: c }
          })
        ])
      }
    }
  }, [grid, activatedFromRed])

  // Retornar todos los valores y funciones necesarios para el componente
  return {
    grid,
    fixedGreens,
    redPoints,
    activeSet,
    visitedSet,
    isGameOver,
    isWon,
    toggle,
    checkWin: () => checkWin(redPoints, visitedSet, fixedGreens)
  }
}
