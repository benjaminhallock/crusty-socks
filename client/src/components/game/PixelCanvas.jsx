import { useEffect, useRef, useState } from 'react'
import { FaDownload, FaEraser, FaFill, FaPaintBrush, FaRedo, FaTrash, FaUndo } from 'react-icons/fa'

import { GAME_CONSTANTS, GAME_STATE } from '../../constants'
import { socketManager } from '../../services/socketManager'
import Button from '../common/ui/Button'

const PixelCanvas = ({ lobby, isDrawer }) => {
  const { currentDrawer: drawerUsername, canvasState, gameState, roomId, gridSize } = lobby

  // Canvas manipulation refs
  const canvasRef = useRef(null) // Reference to the canvas DOM element
  const lastPixelRef = useRef(null) // Tracks the last pixel drawn for continuous lines
  const updateTimeoutRef = useRef(null) // Controls debounced updates to server
  const drawnPixelsRef = useRef(new Map()) // Tracks pixels modified since last update
  const lastDrawTime = useRef(0) // Used for draw operation throttling

  // User interface state
  const [currentColor, setCurrentColor] = useState('#000000') // Selected color for drawing
  const [currentTool, setCurrentTool] = useState('brush') // Active drawing tool
  const [history, setHistory] = useState([]) // History of canvas states for undo
  const [redoStates, setRedoStates] = useState([]) // States for redo functionality
  const [isDrawing, setIsDrawing] = useState(false) // Tracks if user is currently drawing
  const [lastUpdateTime, setLastUpdateTime] = useState(0) // Timestamp of last canvas update
  const [showTooltip, setShowTooltip] = useState({
    // Tooltip visibility state
    waiting: true,
    drawer: true,
  })
  const [showCheckerboard, setShowCheckerboard] = useState(true) // Checkerboard pattern visibility
  const [gridInitialized, setGridInitialized] = useState(false) // Tracks if grid is initialized

  // Constants
  const CANVAS_HEIGHT = GAME_CONSTANTS.CANVAS_HEIGHT
  const CANVAS_WIDTH = GAME_CONSTANTS.CANVAS_WIDTH
  const UPDATE_INTERVAL = 50
  const FORCE_UPDATE_DELAY = 200
  const DRAW_THROTTLE = 16
  const effectiveGridSize = gridSize || GAME_CONSTANTS.CANVAS_GRID_SIZE
  const pixelsWide = Math.ceil(CANVAS_WIDTH / effectiveGridSize) //divide by grid size round up
  const pixelsHigh = Math.ceil(CANVAS_HEIGHT / effectiveGridSize)
  const actualHeight = pixelsHigh * effectiveGridSize
  const actualWidth = pixelsWide * effectiveGridSize

  // Initialize canvas on mount
  useEffect(() => {
    if (!canvasRef.current || gridInitialized) return
    const canvas = canvasRef.current
    canvas.width = actualWidth // Use actual width instead of CANVAS_WIDTH
    canvas.height = actualHeight // Use actual height instead of CANVAS_HEIGHT

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return

    ctx.imageSmoothingEnabled = false // Disable image smoothing for pixel art
    drawCheckerPattern(ctx)
    setHistory([canvas.toDataURL()])
    setGridInitialized(true)
  }, [effectiveGridSize, gridSize])

  // draw
  const drawPixel = (ctx, x, y, color) => {
    if (x < 0 || x >= pixelsWide || y < 0 || y >= pixelsHigh) return false

    const isEraser = color === '#FFFFFF' && currentTool === 'eraser'

    // Only apply checkerboard pattern to eraser if it's enabled
    if (isEraser && showCheckerboard) {
      ctx.fillStyle = shouldBeChecked(x, y) ? '#e5e5e5' : '#FFFFFF'
    } else {
      ctx.fillStyle = isEraser ? '#FFFFFF' : color
    }

    ctx.fillRect(x * effectiveGridSize, y * effectiveGridSize, effectiveGridSize, effectiveGridSize)
    return true
  }

  const getPixelColor = (ctx, x, y) => {
    const data = ctx.getImageData(x * effectiveGridSize, y * effectiveGridSize, 1, 1).data
    return `#${data[0].toString(16).padStart(2, '0')}${data[1]
      .toString(16)
      .padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`.toUpperCase()
  }

  // Canvas interaction handlers
  const getPixelFromEvent = e => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    return {
      x: Math.floor(x / effectiveGridSize),
      y: Math.floor(y / effectiveGridSize),
    }
  }

  // Update canvas state and notify server
  const updateCanvasState = (force = false) => {
    if (!canvasRef.current || !canDraw()) return

    const now = Date.now()
    if (!force && now - lastUpdateTime < UPDATE_INTERVAL) return

    if (drawnPixelsRef.current.size > 0 || force) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL('image/png', 0.8),
          timestamp: now,
        },
        roomId,
      })
      setLastUpdateTime(now)
      drawnPixelsRef.current.clear()
    }
  }

  const scheduleUpdate = () => {
    if (updateTimeoutRef.current) return

    if (Date.now() - lastUpdateTime >= UPDATE_INTERVAL) {
      updateCanvasState()
      return
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateCanvasState(true)
      updateTimeoutRef.current = null
    }, FORCE_UPDATE_DELAY)
  }

  // Add a helper function to check if history operations are allowed
  const canUseHistory = () => canDraw() && gameState !== GAME_STATE.WAITING

  const throttledDraw = (ctx, x, y, color) => {
    const now = performance.now()
    if (now - lastDrawTime.current < DRAW_THROTTLE) return false

    lastDrawTime.current = now
    if (drawPixel(ctx, x, y, color)) {
      drawnPixelsRef.current.set(`${x},${y}`, color)

      // Save state after delay to batch brush strokes
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      updateTimeoutRef.current = setTimeout(() => {
        saveState()
        updateTimeoutRef.current = null
      }, FORCE_UPDATE_DELAY)

      return true
    }
    return false
  }

  // Modified handleDrawStart to save state before flood fill
  const handleDrawStart = e => {
    if (!canDraw()) return
    setIsDrawing(true)

    const pixel = getPixelFromEvent(e)
    if (!pixel) return

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    lastPixelRef.current = pixel
    const color = currentTool === 'eraser' ? '#FFFFFF' : currentColor

    if (currentTool === 'fill') {
      saveState() // Save before flood fill
      if (floodFill(ctx, pixel.x, pixel.y, color)) {
        saveState() // Save after flood fill
        updateCanvasState(true)
      }
      setIsDrawing(false)
    } else {
      throttledDraw(ctx, pixel.x, pixel.y, color)
      scheduleUpdate()
    }
  }

  // Modify the handleDrawMove function to emit updates immediately
  const handleDrawMove = e => {
    if (!isDrawing || !canDraw() || currentTool === 'fill') return

    // Get the pixel location from the event
    const pixel = getPixelFromEvent(e)
    if (!pixel || (lastPixelRef.current?.x === pixel.x && lastPixelRef.current?.y === pixel.y))
      return

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    if (throttledDraw(ctx, pixel.x, pixel.y, currentTool === 'eraser' ? '#FFFFFF' : currentColor)) {
      lastPixelRef.current = pixel

      // Emit immediately for real-time updates
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL('image/png', 0.8),
          timestamp: Date.now(),
          isDrawing: true, // Flag to indicate ongoing drawing
        },
        roomId,
      })
    }
  }

  // Modified handleDrawEnd to save state after drawing
  const handleDrawEnd = () => {
    if (!canDraw()) return
    setIsDrawing(false)
    lastPixelRef.current = null

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
      saveState() // Save state when drawing ends
    }

    if (drawnPixelsRef.current.size > 0) {
      updateCanvasState(true)
    }

    if (canvasRef.current) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL('image/png', 0.8),
          timestamp: Date.now(),
          isDrawing: false, // Flag to indicate drawing has ended
        },
        roomId,
      })
    }
  }

  // Flood fill algorithm to fill connected pixels
  const floodFill = (ctx, startX, startY, fillColor) => {
    const startColor = normalizeColor(getPixelColor(ctx, startX, startY))
    const normalizedFillColor = normalizeColor(fillColor)

    if (startColor === normalizedFillColor) return false

    const stack = [[startX, startY]]
    const seen = new Set()

    while (stack.length > 0) {
      const [x, y] = stack.pop()
      const key = `${x},${y}`

      if (x < 0 || x >= pixelsWide || y < 0 || y >= pixelsHigh || seen.has(key)) continue

      const currentColor = normalizeColor(getPixelColor(ctx, x, y))
      if (currentColor !== startColor) continue

      seen.add(key)

      const actualFillColor =
        fillColor === '#FFFFFF' ? (shouldBeChecked(x, y) ? '#E5E5E5' : '#FFFFFF') : fillColor

      drawPixel(ctx, x, y, actualFillColor)

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    return true
  }

  // input a canvas state and load it with ctx.drawImage
  const loadCanvasState = state => {
    if (!canvasRef.current) return

    const img = new Image()
    img.src = state
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.drawImage(img, 0, 0)
      if (canDraw()) updateCanvasState()
    }
  }

  const saveState = () => {
    if (!canvasRef.current) return
    const currentState = canvasRef.current.toDataURL()
    setHistory(prev => [...prev, currentState])
    setRedoStates([])
  }

  const drawCheckerPattern = ctx => {
    // Always clear with white first
    ctx.fillStyle = '#FFFFFF'
    // Extend the fill to cover the entire canvas
    ctx.fillRect(0, 0, pixelsWide * effectiveGridSize, pixelsHigh * effectiveGridSize)

    if (!showCheckerboard) return

    // Draw checkerboard pattern using the grid size
    ctx.fillStyle = '#e5e5e5'
    for (let y = 0; y < pixelsHigh; y++) {
      for (let x = 0; x < pixelsWide; x++) {
        if (shouldBeChecked(x, y)) {
          ctx.fillRect(
            x * effectiveGridSize,
            y * effectiveGridSize,
            effectiveGridSize,
            effectiveGridSize,
          )
        }
      }
    }
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    drawCheckerPattern(ctx)

    if (gameState !== GAME_STATE.DRAWING) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL(),
          timestamp: Date.now(),
        },
        roomId,
        isLobbyCanvas: true,
      })
    }
  }

  // History operations
  const undo = () => {
    if (!canUseHistory() || history.length <= 1) return

    const prevState = history[history.length - 2]
    setRedoStates(prev => [...prev, history[history.length - 1]])
    setHistory(prev => prev.slice(0, -1))
    loadCanvasState(prevState)

    socketManager.updateCanvas({
      canvasState: {
        data: prevState,
        timestamp: Date.now(),
      },
      roomId,
    })
  }

  const redo = () => {
    if (!canUseHistory() || redoStates.length === 0) return

    const nextState = redoStates[redoStates.length - 1]
    setHistory(prev => [...prev, nextState])
    setRedoStates(prev => prev.slice(0, -1))
    loadCanvasState(nextState)

    socketManager.updateCanvas({
      canvasState: {
        data: nextState,
        timestamp: Date.now(),
      },
      roomId,
    })
  }

  const saveToPng = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'pixel-art.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  // load socketManager canvas state on mount and when game state changes
  useEffect(() => {
    const handleCanvasUpdate = data => {
      if (!data?.canvasState?.data) return
      loadCanvasState(data.canvasState.data)
    }

    const unsubscribe = socketManager.onCanvasUpdate(handleCanvasUpdate)
    return () => unsubscribe()
  }, [])

  const normalizeColor = color =>
    ['#E5E5E5', '#FFFFFF'].includes(color) ? '#FFFFFF' : color.toUpperCase()

  // Load initial canvas state from lobby
  useEffect(() => {
    if (canvasState?.data) {
      loadCanvasState(canvasState.data)
    }
  }, [lobby.canvasState, lobby.gameState])

  // clear canvas when game state changes
  useEffect(() => {
    if ([GAME_STATE.PICKING_WORD, GAME_STATE.WAITING].includes(gameState)) {
      clearCanvas()
    }
  }, [gameState])

  // Check if user can draw
  const canDraw = () =>
    socketManager.isConnected() &&
    (gameState === GAME_STATE.WAITING || (gameState === GAME_STATE.DRAWING && isDrawer))

  // Drawing helpers
  const shouldBeChecked = (x, y) => (x + y) % 2 === 0

  // Tool selection style helper
  const getToolButtonStyle = toolName => {
    if (currentTool === toolName) {
      return {
        variant: 'primary',
        className: 'relative ring-2 ring-offset-1 ring-indigo-500 dark:ring-indigo-400',
      }
    }
    return {
      variant: 'secondary',
      className: 'relative',
    }
  }

  // Determine canvas style based on game state
  const getCanvasClass = () => {
    if (gameState === GAME_STATE.DRAWING) {
      return 'ring-2 ring-purple-500/30 dark:ring-purple-400/30 cursor-crosshair'
    } else if (canDraw()) {
      return 'ring-1 ring-indigo-500/25 dark:ring-indigo-400/25 cursor-crosshair hover:ring-2'
    }
    return 'ring-1 ring-gray-200/50 dark:ring-gray-600/50'
  }

  return (
    <div className='relative flex flex-col items-center w-full h-full bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 rounded-xl shadow-lg p-4 pb-2 border border-gray-200 dark:border-gray-700'>
      {/* Status tooltips */}
      <div className='fixed top-4 right-4 z-50 space-y-2'>
        {gameState === GAME_STATE.WAITING && showTooltip.waiting && (
          <div className='bg-white/95 dark:bg-gray-800/95 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm animate-in slide-in-from-right fade-in duration-300'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                Draw together while waiting for the game to start
              </p>
              <button
                onClick={() => setShowTooltip(prev => ({ ...prev, waiting: false }))}
                className='text-gray-500 hover:text-gray-700'>
                <svg
                  className='w-4 h-4'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!isDrawer && gameState === GAME_STATE.DRAWING && showTooltip.drawer && (
          <div className='bg-white/95 dark:bg-gray-800/95 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm animate-in slide-in-from-right fade-in duration-300'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                <span className='text-indigo-600 dark:text-indigo-400'>
                  {drawerUsername || 'Unknown User'}
                </span>{' '}
                is drawing...
              </p>
              <button
                onClick={() => setShowTooltip(prev => ({ ...prev, drawer: false }))}
                className='text-gray-500 hover:text-gray-700'>
                <svg
                  className='w-4 h-4'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className='relative w-full h-full flex flex-col gap-2'>
        {/* Canvas - Updated container styles */}
        <div
          className={`relative flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center ${
            gameState === GAME_STATE.DRAWING ? 'shadow-[0_0_20px_2px_rgba(168,85,247,0.15)]' : ''
          }`}
          style={{
            // Add padding bottom to maintain aspect ratio
            paddingBottom: `${(actualHeight / actualWidth) * 100}%`,
          }}>
          <div className='absolute inset-0 flex items-center justify-center'>
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                imageRendering: 'pixelated',
              }}
              className={getCanvasClass()}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              onTouchStart={e => {
                e.preventDefault()
                handleDrawStart(e.touches[0])
              }}
              onTouchMove={e => {
                e.preventDefault()
                handleDrawMove(e.touches[0])
              }}
              onTouchEnd={e => {
                e.preventDefault()
                handleDrawEnd()
              }}
            />
          </div>
        </div>

        {/* Tools */}
        <div className='flex flex-wrap gap-2 justify-center'>
          {/* Current tool display */}
          {isDrawer && (
            <div className='absolute bottom-16 left-4 bg-white/80 dark:bg-gray-800/80 text-sm px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-700'>
              Tool:{' '}
              <span className='font-medium text-indigo-600 dark:text-indigo-400'>
                {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
              </span>
            </div>
          )}

          {/* Move color picker to start */}
          <Button
            variant='primary'
            size='pic'
            className='flex items-center'
            disabled={!canDraw()}
            title='Select Color'>
            <input
              type='color'
              value={currentColor}
              onChange={e => setCurrentColor(e.target.value)}
              disabled={!canDraw()}
              className={`w-8 h-8 rounded-md cursor-pointer ${!canDraw() && 'opacity-50'}`}
            />
          </Button>

          <div className='w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2' />

          <Button
            onClick={() => setCurrentTool('brush')}
            {...getToolButtonStyle('brush')}
            disabled={!canDraw()}
            title='Brush Tool (B)'
            size='sm'>
            <FaPaintBrush />
            {currentTool === 'brush' && (
              <span className='absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full'></span>
            )}
          </Button>

          <Button
            onClick={() => setCurrentTool('fill')}
            {...getToolButtonStyle('fill')}
            disabled={!canDraw()}
            title='Fill Tool (F)'
            size='sm'>
            <FaFill />
            {currentTool === 'fill' && (
              <span className='absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full'></span>
            )}
          </Button>

          <Button
            onClick={() => setCurrentTool('eraser')}
            {...getToolButtonStyle('eraser')}
            disabled={!canDraw()}
            title='Eraser (E)'
            size='sm'>
            <FaEraser />
            {currentTool === 'eraser' && (
              <span className='absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full'></span>
            )}
          </Button>

          <div className='w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2' />

          <Button
            onClick={undo}
            disabled={!canUseHistory() || history.length <= 1}
            title='Undo (Ctrl+Z)'
            variant='secondary'
            size='sm'>
            <FaUndo />
          </Button>

          <Button
            onClick={redo}
            disabled={!canUseHistory() || redoStates.length === 0}
            title='Redo (Ctrl+Y)'
            variant='secondary'
            size='sm'>
            <FaRedo />
          </Button>

          <div className='w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2' />

          <Button
            onClick={saveToPng}
            title='Save as PNG'
            variant='secondary'
            size='sm'>
            <FaDownload />
          </Button>

          <Button
            onClick={clearCanvas}
            disabled={!canDraw()}
            title='Clear Canvas'
            variant='danger'
            size='sm'>
            <FaTrash />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PixelCanvas
