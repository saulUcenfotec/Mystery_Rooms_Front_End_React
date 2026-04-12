// ========================================
// three-helpers.js - Utilidades Three.js
// ========================================
// Funciones reutilizables para crear objetos 3D,
// gestionar sincronización y manejar entrada.
// ========================================

import * as THREE from 'three'

/**
 * Crea la escena base con iluminación
 * @returns {Object} { scene, camera, renderer }
 */
export const createScene = (container) => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 1.7, 5)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x1a1a2e)
  renderer.domElement.style.cssText = 'display: block; position: absolute; top: 0; left: 0;'
  container.appendChild(renderer.domElement)

  // Luces
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(10, 15, 10)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  scene.add(dirLight)

  return { scene, camera, renderer }
}

/**
 * Crea el piso de la escena
 */
export const createFloor = (scene) => {
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a4a,
    metalness: 0.1,
    roughness: 0.8
  })
  const floorGeo = new THREE.PlaneGeometry(50, 50)
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0
  floor.receiveShadow = true
  scene.add(floor)
}

/**
 * Crea las paredes de la sala
 */
export const createWalls = (scene) => {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0f3460,
    metalness: 0.05,
    roughness: 0.9
  })

  const walls = [
    { pos: [0, 2.5, -25], geo: new THREE.BoxGeometry(50, 5, 1) },
    { pos: [0, 2.5, 25], geo: new THREE.BoxGeometry(50, 5, 1) },
    { pos: [-25, 2.5, 0], geo: new THREE.BoxGeometry(1, 5, 50) },
    { pos: [25, 2.5, 0], geo: new THREE.BoxGeometry(1, 5, 50) }
  ]

  walls.forEach(wall => {
    const mesh = new THREE.Mesh(wall.geo, wallMat)
    mesh.position.set(...wall.pos)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
  })
}

/**
 * Crea objetos decorativos alrededor de la sala
 */
export const createDecorativeObjects = (scene, count = 8) => {
  const decorMat = new THREE.MeshStandardMaterial({
    color: 0x444466,
    metalness: 0.2,
    roughness: 0.8
  })

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const distance = 15
    const boxGeo = new THREE.BoxGeometry(1.5, 3, 1.5)
    const box = new THREE.Mesh(boxGeo, decorMat.clone())
    box.position.set(Math.cos(angle) * distance, 1.5, Math.sin(angle) * distance)
    box.rotation.y = angle
    box.castShadow = true
    box.receiveShadow = true
    scene.add(box)
  }
}

/**
 * Crea una puerta interactuable
 */
export const createExitDoor = (scene) => {
  const exitDoorGeo = new THREE.BoxGeometry(3, 3.5, 0.3)
  const exitDoorMat = new THREE.MeshStandardMaterial({
    color: 0x2ed573,
    metalness: 0.4,
    roughness: 0.6
  })
  const exitDoor = new THREE.Mesh(exitDoorGeo, exitDoorMat)
  exitDoor.position.set(0, 1.75, 18)
  exitDoor.castShadow = true
  exitDoor.receiveShadow = true
  exitDoor.userData = {
    interactable: true,
    isExit: true
  }
  scene.add(exitDoor)
  return exitDoor
}

/**
 * Crea estaciones de puzzle con plataformas e interactables
 */
export const createPuzzleStations = (scene, stations) => {
  const stationMaterial = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    emissive: 0x00d4ff,
    emissiveIntensity: 0.3,
    metalness: 0.6,
    roughness: 0.2
  })

  const stationMeshes = []

  stations.forEach(station => {
    // Plataforma
    const platformGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32)
    const platform = new THREE.Mesh(platformGeo, stationMaterial.clone())
    platform.position.set(station.position.x, 0.15, station.position.z)
    platform.castShadow = true
    platform.receiveShadow = true
    scene.add(platform)

    // Cilindro interactuable
    const cylinderGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 32)
    const cylinder = new THREE.Mesh(cylinderGeo, stationMaterial.clone())
    cylinder.position.set(station.position.x, 1.2, station.position.z)
    cylinder.castShadow = true
    cylinder.receiveShadow = true
    cylinder.userData = {
      interactable: true,
      puzzleId: station.id,
      puzzleName: station.name,
      completed: false
    }
    scene.add(cylinder)
    stationMeshes.push(cylinder)

    // Letrero
    const signGeo = new THREE.BoxGeometry(2.5, 0.5, 0.2)
    const signMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff })
    const sign = new THREE.Mesh(signGeo, signMat)
    sign.position.set(station.position.x, 2.5, station.position.z)
    sign.castShadow = true
    scene.add(sign)
  })

  return stationMeshes
}

/**
 * Crea avatares de jugadores
 */
export const createPlayerAvatars = (scene, playerCount, playerNames = null) => {
  const avatarMeshes = {}
  const playerColors = [
    0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4,
    0xfeca57, 0xff9ff3, 0x54a0ff, 0x5f27cd
  ]

  for (let i = 0; i < playerCount; i++) {
    const avatarGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16)
    const avatarMat = new THREE.MeshStandardMaterial({
      color: playerColors[i % playerColors.length],
      emissive: playerColors[i % playerColors.length],
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.7
    })
    const avatar = new THREE.Mesh(avatarGeo, avatarMat)

    const angle = (i / playerCount) * Math.PI * 2
    const distance = 8 + (i * 2)
    avatar.position.set(Math.cos(angle) * distance, 0.9, Math.sin(angle) * distance)
    avatar.castShadow = true
    avatar.receiveShadow = true
    avatar.userData = {
      isPlayerAvatar: true,
      playerIndex: i
    }
    scene.add(avatar)
    avatarMeshes[i] = avatar

    // Etiqueta de nombre
    const playerName = playerNames && playerNames[i] ? playerNames[i] : `Jugador ${i + 1}`
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.font = 'Bold 20px Arial'
    context.textAlign = 'center'
    context.fillText(playerName, 128, 40)

    const texture = new THREE.CanvasTexture(canvas)
    const labelGeo = new THREE.PlaneGeometry(2, 0.5)
    const labelMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    })
    const label = new THREE.Mesh(labelGeo, labelMat)
    label.position.set(avatar.position.x, avatar.position.y + 1.5, avatar.position.z)
    label.rotation.x = -Math.PI / 2
    label.userData = { isPlayerLabel: true, playerIndex: i }
    scene.add(label)
    avatarMeshes[`label_${i}`] = label
  }

  return avatarMeshes
}

/**
 * Sincroniza posición del jugador actual a localStorage
 */
export const syncPlayerPosition = (roomName, playerId, camera) => {
  try {
    const syncKey = `PLAYERS_SYNC:${roomName}`
    let playersData = JSON.parse(localStorage.getItem(syncKey) || '{}')

    // Obtener nombre de usuario del sessionStorage
    const userName = sessionStorage.getItem(`PLAYER_NAME:${roomName}:${playerId}`) || `Jugador ${playerId + 1}`

    playersData[playerId] = {
      name: userName,
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      }
    }

    localStorage.setItem(syncKey, JSON.stringify(playersData))
  } catch (error) {
    // Ignorar errores de localStorage
  }
}

/**
 * Lee posiciones de otros jugadores desde localStorage
 */
export const readOtherPlayersPositions = (roomName) => {
  try {
    const syncKey = `PLAYERS_SYNC:${roomName}`
    const stored = localStorage.getItem(syncKey)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    return {}
  }
}

/**
 * Actualiza posición de avatar en la escena
 */
export const updateAvatarPosition = (avatarMesh, position) => {
  if (!avatarMesh || !position) return
  const target = new THREE.Vector3(position.x, position.y + 0.3, position.z)
  avatarMesh.position.lerp(target, 0.18)
}

/**
 * Actualiza rotacion de avatar en la escena
 */
export const updateAvatarRotation = (avatarMesh, rotation) => {
  if (!avatarMesh || !rotation) return
  avatarMesh.rotation.y += ((rotation.y || 0) - avatarMesh.rotation.y) * 0.18
}

/**
 * Actualiza la etiqueta de nombre de un avatar
 */
export const updateAvatarLabel = (labelMesh, playerName) => {
  if (!labelMesh || !playerName) return

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.font = 'Bold 20px Arial'
  context.textAlign = 'center'
  context.fillText(playerName, 128, 40)

  const texture = new THREE.CanvasTexture(canvas)
  if (labelMesh.material.map) {
    labelMesh.material.map.dispose()
  }
  labelMesh.material.map = texture
  labelMesh.material.needsUpdate = true
}
