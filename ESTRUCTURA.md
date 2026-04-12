# Estructura del Proyecto Actualizada

```
/root
├── /docs                          # Documentación del proyecto
│   └── README.md                  # Índice de documentación
│
├── /src                           # Código fuente principal
│   ├── /components                # Componentes reutilizables
│   │   ├── GameSelector.jsx
│   │   ├── RoomCreator.jsx
│   │   ├── RoomLobby.jsx
│   │   ├── PuzzleRoom.jsx
│   │   ├── PuzzleRoom3D.jsx
│   │   ├── MultiPlayerTest.jsx
│   │   └── UserNamePrompt.jsx
│   │
│   ├── /pages                     # Vistas y páginas principales
│   │   ├── /FirstPerson           # Escena 3D en primera persona
│   │   │   └── FirstPersonScene.jsx
│   │   └── /NodePuzzle            # Puzzle de nodos
│   │       ├── NodePuzzle.jsx
│   │       ├── /hooks
│   │       │   └── useNodePuzzle.js
│   │       └── /utils
│   │           └── puzzleLogic.js
│   │
│   ├── /services                  # Integración con APIs externas
│   │   └── (para futuros servicios)
│   │
│   ├── /hooks                     # Hooks personalizados
│   │   └── (hooks globales)
│   │
│   ├── /utils                     # Funciones auxiliares
│   │   └── three-helpers.js
│   │
│   ├── /styles                    # Archivos de estilos
│   │   ├── /components
│   │   │   ├── App.css
│   │   │   └── GameSelector.css
│   │   ├── App.css
│   │   ├── PuzzleRoom.css
│   │   ├── RoomCreator.css
│   │   ├── RoomLobby.css
│   │   └── index.css
│   │
│   ├── /assets                    # Recursos estáticos
│   │   └── (imágenes, iconos, etc.)
│   │
│   ├── App.jsx                    # Componente principal
│   ├── main.jsx                   # Punto de entrada
│   └── index.css                  # Estilos globales
│
├── /config                        # Configuraciones del proyecto
│   └── README.md
│
├── /tests                         # Pruebas unitarias e integración
│   └── README.md
│
├── /public                        # Assets públicos
├── /node_modules                  # Dependencias
├── /dist                          # Build de producción
│
├── package.json                   # Dependencias y scripts
├── README.md                      # Documentación principal
├── vite.config.js                 # Configuración de Vite
├── eslint.config.js               # Configuración de ESLint
└── index.html                     # HTML de entrada
```

## Cambios Realizados

### Nuevas Carpetas Creadas:
- **`/docs`**: Centraliza toda la documentación del proyecto
- **`/config`**: Configuraciones específicas del proyecto
- **`/tests`**: Estructura para pruebas unitarias e integración
- **`/src/pages`**: Vistas principales separadas de componentes reutilizables
- **`/src/services`**: Preparado para APIs externas
- **`/src/hooks`**: Hooks personalizados globales

### Archivos Movidos:
- `src/games/FirstPerson/` → `src/pages/FirstPerson/`
- `src/games/NodePuzzle/` → `src/pages/NodePuzzle/`

### Imports Actualizados:
- `PuzzleRoom.jsx`: `../games/NodePuzzle/` → `../pages/NodePuzzle/`
- `PuzzleRoom3D.jsx`: `../games/NodePuzzle/` → `../pages/NodePuzzle/`
- `FirstPersonScene.jsx`: Las rutas internas del puzzle

## Ventajas de esta Estructura

✅ **Separación clara**: Componentes reutilizables vs vistas específicas
✅ **Escalabilidad**: Fácil agregar servicios, hooks o pruebas
✅ **Mantenibilidad**: Organización coherente y profesional
✅ **Documentación centralizada**: `/docs` para toda la información
✅ **Preparado para testing**: Carpeta `/tests` lista para pruebas
✅ **Configuración organizada**: Todas las configs en un lugar

## Próximos Pasos

1. Agregar configuraciones específicas en `/config`
2. Crear pruebas en `/tests`
3. Documentar componentes principales en `/docs`
4. Agregar servicios en `/src/services` según sea necesario
