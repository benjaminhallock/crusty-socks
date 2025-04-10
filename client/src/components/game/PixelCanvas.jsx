import { useRef, useState, useEffect } from 'react'
import {
  FaPaintBrush,
  FaFill,
  FaEraser,
  FaUndo,
  FaRedo,
  FaDownload,
  FaTrash,
} from 'react-icons/fa'

import { socketManager } from '../../services/socketManager'
import { GAME_CONSTANTS, GAME_STATE } from '../../constants'

const PixelCanvas = ({
  isDrawer,
  drawerUsername,
  canvasState,
  gameState,
  roundTime,
  startTime,
  lobbyId,
}) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState('#800080')
  const [currentTool, setCurrentTool] = useState('brush')
  const [history, setHistory] = useState([])
  const [redoStates, setRedoStates] = useState([])
  const [gridSize, setGridSize] = useState(GAME_CONSTANTS.CANVAS_GRID_SIZE)
  const CANVAS_HEIGHT = GAME_CONSTANTS.CANVAS_HEIGHT
  const CANVAS_WIDTH = GAME_CONSTANTS.CANVAS_WIDTH
  const lastUpdateTimeRef = useRef(0)
  const UPDATE_INTERVAL = 50 // Reduced from 100 to 50ms for more responsive updates
  const batchTimeoutRef = useRef(null)
  const [lastPoint, setLastPoint] = useState(null)
  const drawQueueRef = useRef([])
  const isDrawingRef = useRef(false)
  const BATCH_INTERVAL = 16 // Changed to match 60fps (~16ms)
  const batchUpdateRef = useRef(null)

  // Determine if the user can draw based on game state and socket connection
  const canDraw = () => {
    // First check if socket is connected
    if (!socketManager.isConnected()) {
      return false
    }

    if (gameState === GAME_STATE.WAITING) {
      // Everyone can draw in the waiting state
      return true
    } else if (gameState === GAME_STATE.DRAWING) {
      // Only the drawer can draw during the drawing state
      return isDrawer
    }
    // No one can draw during other states
    return false
  }

  const drawPixel = (ctx, x, y, color) => {
    const gridX = Math.floor(x / gridSize)
    const gridY = Math.floor(y / gridSize)
    if (
      gridX >= 0 &&
      gridX < CANVAS_WIDTH / gridSize &&
      gridY >= 0 &&
      gridY < CANVAS_HEIGHT / gridSize
    ) {
      ctx.fillStyle = currentTool === 'eraser' ? '#ffffff' : color
      ctx.fillRect(gridX * gridSize, gridY * gridSize, gridSize, gridSize)

      // Send updates if we can draw and socket is connected
      if (canDraw() && socketManager.isConnected()) {
        const now = Date.now()
        const canvasState = {
          data: canvasRef.current.toDataURL(),
          timestamp: now,
        }

        if (now - lastUpdateTimeRef.current > UPDATE_INTERVAL) {
          lastUpdateTimeRef.current = now
          socketManager.updateCanvas({ canvasState, lobbyId })
        } else if (batchTimeoutRef.current === null) {
          batchTimeoutRef.current = setTimeout(() => {
            if (canvasRef.current && socketManager.isConnected()) {
              lastUpdateTimeRef.current = Date.now()
              socketManager.updateCanvas({
                canvasState: {
                  data: canvasRef.current.toDataURL(),
                  timestamp: Date.now(),
                },
                lobbyId,
              })
            }
            batchTimeoutRef.current = null
          }, UPDATE_INTERVAL)
        }
      }
    }
  }

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setHistory([...history, canvas.toDataURL()])
    setRedoStates([])
  }

  const floodFill = (ctx, startX, startY, fillColorHex) => {
    if (!ctx) return
    const gridX = Math.floor(startX / gridSize)
    const gridY = Math.floor(startY / gridSize)
    const targetColorData = ctx.getImageData(
      gridX * gridSize,
      gridY * gridSize,
      1,
      1
    ).data
    const targetColor = `rgb(${targetColorData[0]}, ${targetColorData[1]}, ${targetColorData[2]})`
    if (targetColor === fillColorHex) return false
    const stack = [[gridX, gridY]]
    const width = Math.floor(CANVAS_WIDTH / gridSize)
    const height = Math.floor(CANVAS_HEIGHT / gridSize)
    const visited = new Set()
    const pixelsToFill = []
    const maxPixels = 2500
    while (stack.length > 0 && pixelsToFill.length < maxPixels) {
      const [x, y] = stack.pop()
      const key = `${x},${y}`
      if (x < 0 || y < 0 || x >= width || y >= height || visited.has(key)) continue
      const pixelData = ctx.getImageData(x * gridSize, y * gridSize, 1, 1).data
      const pixelColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`
      if (pixelColor !== targetColor) continue
      visited.add(key)
      pixelsToFill.push([x, y])
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    ctx.fillStyle = fillColorHex
    for (const [x, y] of pixelsToFill) {
      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize)
    }
    return pixelsToFill.length > 0
  }

  const interpolatePoints = (x1, y1, x2, y2) => {
    const points = []
    const dx = Math.abs(x2 - x1)
    const dy = Math.abs(y2 - y1)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.max(1, Math.floor(distance / (gridSize / 2)))

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t
      points.push({ x, y })
    }
    return points
  }

  const drawPoints = (ctx, points, color) => {
    points.forEach((point) => {
      const gridX = Math.floor(point.x / gridSize)
      const gridY = Math.floor(point.y / gridSize)
      if (
        gridX >= 0 &&
        gridX < CANVAS_WIDTH / gridSize &&
        gridY >= 0 &&
        gridY < CANVAS_HEIGHT / gridSize
      ) {
        ctx.fillStyle = currentTool === 'eraser' ? '#ffffff' : color
        ctx.fillRect(gridX * gridSize, gridY * gridSize, gridSize, gridSize)
      }
    })
  }

  const processDrawQueue = () => {
    if (!canvasRef.current || drawQueueRef.current.length === 0) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    drawQueueRef.current.forEach(({ points, color }) => {
      drawPoints(ctx, points, color)
    })
    // Only send canvas update if we're actually drawing
    if (isDrawingRef.current && canDraw()) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL(),
          timestamp: Date.now(),
        },
        lobbyId,
      })
    }
    drawQueueRef.current = []
  }

  useEffect(() => {
    const processingInterval = setInterval(processDrawQueue, BATCH_INTERVAL)
    return () => clearInterval(processingInterval)
  }, [])

  const handleDraw = (e) => {
    if (!isDrawing || !canDraw()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (currentTool === 'fill' && !isDrawingRef.current) {
      saveState()
      if (floodFill(ctx, x, y, currentColor)) {
        socketManager.updateCanvas({
          canvasState: {
            data: canvas.toDataURL(),
            timestamp: Date.now(),
          },
          lobbyId,
        })
      }
      setIsDrawing(false)
      return
    }

    if (lastPoint) {
      const points = interpolatePoints(lastPoint.x, lastPoint.y, x, y)
      drawQueueRef.current.push({ points, color: currentColor })
      isDrawingRef.current = true
    }
    setLastPoint({ x, y })
  }

  const updateCanvas = () => {
    if (!canvasRef.current || !isDrawingRef.current || !canDraw()) return
    const now = Date.now()
    if (now - lastUpdateTimeRef.current > UPDATE_INTERVAL) {
      lastUpdateTimeRef.current = now
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL(),
          timestamp: now,
        },
        lobbyId,
      })
    }
  }

  // Add this effect for more efficient canvas updates
  useEffect(() => {
    const updateInterval = setInterval(updateCanvas, UPDATE_INTERVAL)
    return () => clearInterval(updateInterval)
  }, [])

  const handleMouseDown = (e) => {
    if (!canDraw()) return
    setIsDrawing(true)
    isDrawingRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    if (currentTool === 'fill') {
      saveState()
      if (floodFill(ctx, x, y, currentColor)) {
        socketManager.updateCanvas({
          canvasState: {
            data: canvas.toDataURL(),
            timestamp: Date.now(),
          },
          lobbyId,
        })
      }
    } else {
      setLastPoint({ x, y })
      drawQueueRef.current.push({
        points: [{ x, y }],
        color: currentColor,
      })
    }
  }

  const handleMouseUp = () => {
    if (!canDraw()) return
    setIsDrawing(false)
    isDrawingRef.current = false
    setLastPoint(null)
    saveState()
    // Final update after drawing is complete
    if (canvasRef.current) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL(),
          timestamp: Date.now(),
        },
        lobbyId,
      })
    }
  }

  // Add clear canvas function
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    isDrawingRef.current = false
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const clearedState = canvas.toDataURL()
    setHistory([...history, clearedState])
    setRedoStates([])
    socketManager.updateCanvas({
      canvasState: {
        data: clearedState,
        timestamp: Date.now(),
      },
      lobbyId,
    })
  }

  const undo = () => {
    if (history.length > 1) {
      const prevState = history[history.length - 2]
      setRedoStates((prevRedo) => [history.pop(), ...prevRedo])
      setHistory((prevHistory) => prevHistory.slice(0, -1))
      const canvas = canvasRef.current
      if (!canvas) return
      const img = new Image()
      img.src = prevState
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        if (isDrawer) {
          socketManager.updateCanvas({
            canvasState: {
              data: canvas.toDataURL(),
              timestamp: Date.now(),
            },
            lobbyId,
          })
        }
      }
    }
  }

  const redo = () => {
    if (redoStates.length > 0) {
      const nextState = redoStates[redoStates.length - 1]
      setHistory([...history, nextState])
      setRedoStates(redoStates.slice(0, -1))
      const canvas = canvasRef.current
      if (!canvas) return
      const img = new Image()
      img.src = nextState
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        if (isDrawer) {
          socketManager.updateCanvas({
            canvasState: {
              data: canvas.toDataURL(),
              timestamp: Date.now(),
            },
            lobbyId,
          })
        }
      }
    }
  }

  const saveToPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'pixel-art.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  useEffect(() => {
    const cleanupSocketHandler = socketManager.onStatusChange((status) => {
      if (status === 'disconnected' || status === 'error') {
        // Clear any pending updates when socket disconnects
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current)
          batchTimeoutRef.current = null
        }
      }
    })
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
      cleanupSocketHandler()
    }
  }, [])

  // Simplified canvas state handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Reset canvas for new game states
    if (gameState === GAME_STATE.PICKING_WORD || gameState === GAME_STATE.WAITING) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const newState = canvas.toDataURL()
      setHistory([newState])
      setRedoStates([])
      if (isDrawer || gameState === GAME_STATE.WAITING) {
        socketManager.updateCanvas({
          canvasState: {
            data: newState,
            timestamp: Date.now(),
          },
          lobbyId,
        })
      }
      return
    }
    // Handle incoming canvas state
    if (canvasState?.data) {
      const img = new Image()
      img.src = canvasState.data
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const currentState = canvas.toDataURL()
        if (!history.includes(currentState)) {
          setHistory((prev) => [...prev, currentState])
        }
      }
    }
  }, [canvasState?.data, gameState, CANVAS_WIDTH, CANVAS_HEIGHT, isDrawer, lobbyId])

  // Always subscribe to canvas updates regardless of drawer status
  useEffect(() => {
    const unsubscribe = socketManager.onCanvasUpdate((data) => {
      if (!data?.canvasState?.data) {
        console.warn('Received invalid canvas update')
        return
      }
      const canvas = canvasRef.current
      if (!canvas) return
      const img = new Image()
      img.src = data.canvasState.data
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.drawImage(img, 0, 0)
      }
    })
    return unsubscribe
  }, [canvasRef])

  useEffect(() => {
    if (canvasState?.data && socketManager.isConnected()) {
      const canvas = canvasRef.current
      if (!canvas) return
      const img = new Image()
      img.src = canvasState.data
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.drawImage(img, 0, 0)
        if (canvasRef.current) {
          saveState()
          // Initial sync of canvas state if we're the drawer
          if (isDrawer) {
            socketManager.updateCanvas({
              canvasState: {
                data: canvas.toDataURL(),
                timestamp: Date.now(),
              },
              lobbyId,
            })
          }
        }
      }
    }
  }, [canvasState?.data, canvasRef])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (history.length > 0) {
      const currentState = history[history.length - 1]
      const img = new Image()
      img.src = currentState
      img.onload = () => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.drawImage(img, 0, 0)
        if (isDrawer) {
          socketManager.updateCanvas({
            canvasState: {
              data: canvas.toDataURL(),
              timestamp: Date.now(),
            },
            lobbyId,
          })
        }
      }
    }
  }, [gridSize, history, isDrawer, canvasRef])

  useEffect(() => {
    let timerId
    if (gameState === GAME_STATE.DRAWING && startTime) {
      const endTime = new Date(startTime).getTime() + roundTime * 1000
      const checkTime = () => {
        const now = Date.now()
        if (now >= endTime) {
          clearInterval(timerId)
        }
      }
      timerId = setInterval(checkTime, 1000)
      checkTime()
    }
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [gameState, startTime, roundTime, lobbyId])

  // Initialize canvas dimensions and context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineCap = 'round'
      ctx.lineWidth = 2
      // Set initial white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      setHistory([canvas.toDataURL()])
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT])

  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current) return
      saveState()
      canvasRef.current.width = CANVAS_WIDTH
      canvasRef.current.height = CANVAS_HEIGHT
      const lastState = history[history.length - 1]
      if (lastState) {
        const img = new Image()
        img.src = lastState
        img.onload = () => {
          const ctx = canvasRef.current?.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
          }
        }
      }
    }
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, history])

  useEffect(() => {
    if (!canvasRef.current || !isDrawer) return
    canvasRef.current.width = CANVAS_WIDTH
    canvasRef.current.height = CANVAS_HEIGHT
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      ctx.lineCap = 'round'
      ctx.lineWidth = 2
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, isDrawer])

  return (
    <div
      id='canvas'
      className='flex flex-col items-center w-full h-full bg-white/90 dark:bg-gray-800/90 rounded-none transition-colors'
    >
      {gameState === GAME_STATE.WAITING && (
        <div className='bg-white/95 dark:bg-gray-800/95 px-3 py-1 rounded-lg shadow-sm mb-1 text-center'>
          <p className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
            Draw together while waiting for the game to start
          </p>
        </div>
      )}
      {!isDrawer && gameState === GAME_STATE.DRAWING && (
        <div className='bg-white/95 dark:bg-gray-800/95 px-3 py-1 rounded-lg shadow-sm mb-1 text-center'>
          <p className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
            {drawerUsername} is drawing...
          </p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: '100%',
          maxWidth: CANVAS_WIDTH,
          height: 'auto',
          touchAction: 'none',
        }}
        className={`border-2 rounded-lg bg-white/100 ${
          canDraw()
            ? 'border-indigo-800 dark:border-indigo-400 cursor-crosshair'
            : 'border-gray-200 dark:border-gray-700'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleDraw}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          e.preventDefault()
          handleMouseDown(e.touches[0])
        }}
        onTouchMove={(e) => {
          e.preventDefault()
          handleDraw(e.touches[0])
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleMouseUp()
        }}
      />
      {canDraw() && (
        <div className='flex items-center gap-2 bg-white/50 dark:bg-gray-700/50 p-1.5 rounded-lg transition-colors mt-1 w-full'>
          <input
            type='color'
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className='w-8 h-8 rounded cursor-pointer'
            title='Choose color'
            aria-label='Choose color'
          />
          <div className='flex flex-wrap gap-1'>
            <ToolButton
              active={currentTool === 'brush'}
              onClick={() => setCurrentTool('brush')}
              title='Brush Tool'
            >
              <FaPaintBrush className='w-4 h-4' />
            </ToolButton>
            <ToolButton
              active={currentTool === 'fill'}
              onClick={() => setCurrentTool('fill')}
              title='Fill Tool'
            >
              <FaFill className='w-4 h-4' />
            </ToolButton>
            <ToolButton
              active={currentTool === 'eraser'}
              onClick={() => setCurrentTool('eraser')}
              title='Eraser Tool'
            >
              <FaEraser className='w-4 h-4' />
            </ToolButton>
            <ToolButton
              onClick={undo}
              title='Undo'
            >
              <FaUndo className='w-4 h-4' />
            </ToolButton>
            <ToolButton
              onClick={redo}
              title='Redo'
            >
              <FaRedo className='w-4 h-4' />
            </ToolButton>
            <ToolButton
              onClick={clearCanvas}
              title='Clear Canvas'
            >
              <FaTrash className='w-4 h-4' />
            </ToolButton>
            <ToolButton
              onClick={saveToPng}
              title='Save as PNG'
            >
              <FaDownload className='w-4 h-4' />
            </ToolButton>
          </div>
          <div className='flex items-center ml-auto'>
            <span className='text-xs text-gray-700 dark:text-gray-300 mr-1 whitespace-nowrap'>
              Size: {gridSize}px
            </span>
            <input
              type='range'
              min='8'
              max='40'
              step='4'
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className='w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-indigo-600'
            />
          </div>
        </div>
      )}
    </div>
  )
}

const ToolButton = ({ active, onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md text-sm transition-colors ${
      active
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
    }`}
  >
    {children}
  </button>
)

export default PixelCanvas
