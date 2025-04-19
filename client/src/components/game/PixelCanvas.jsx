import { useRef, useState, useEffect } from "react";
import {
  FaPaintBrush,
  FaFill,
  FaEraser,
  FaUndo,
  FaRedo,
  FaDownload,
  FaTrash,
} from "react-icons/fa";
import { socketManager } from "../../services/socketManager";
import { GAME_CONSTANTS, GAME_STATE } from "../../constants";
``;
const PixelCanvas = ({
  isDrawer,
  drawerUsername,
  canvasState,
  gameState,
  roundTime,
  startTime,
  lobbyId,
  roomId,
  gridSize,
}) => {
  const canvasRef = useRef(null);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentTool, setCurrentTool] = useState("brush");
  const [history, setHistory] = useState([]);
  const [redoStates, setRedoStates] = useState([]);
  const CANVAS_HEIGHT = GAME_CONSTANTS.CANVAS_HEIGHT;
  const CANVAS_WIDTH = GAME_CONSTANTS.CANVAS_WIDTH;
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const lastPixelRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const UPDATE_INTERVAL = 50; // Increased to reduce network traffic
  const FORCE_UPDATE_DELAY = 200; // Increased batching window
  const DRAW_THROTTLE = 16; // ~60fps throttle for draw operations

  // Track drawn pixels for batching
  const drawnPixelsRef = useRef(new Map());
  const lastDrawTime = useRef(0);

  const canDraw = () => {
    if (!socketManager.isConnected()) return false;
    if (gameState === GAME_STATE.WAITING) return true;
    if (gameState === GAME_STATE.DRAWING) return isDrawer;
    return false;
  };

  const shouldBeChecked = (x, y) => (x + y) % 2 === 0;

  const drawPixel = (ctx, gridX, gridY, color) => {
    if (gridX < 0 || gridX >= pixelsWide || gridY < 0 || gridY >= pixelsHigh)
      return false;
    ctx.fillStyle =
      color === "#FFFFFF" && currentTool === "eraser"
        ? shouldBeChecked(gridX, gridY)
          ? "#e5e5e5"
          : "#FFFFFF"
        : color;
    const x = gridX * gridSize;
    const y = gridY * gridSize;
    ctx.fillRect(x, y, gridSize, gridSize);
    return true;
  };

  const getPixelColor = (ctx, x, y) => {
    const imageData = ctx.getImageData(x * gridSize, y * gridSize, 1, 1).data;
    // Convert to hex
    return `#${imageData[0].toString(16).padStart(2, "0")}${imageData[1]
      .toString(16)
      .padStart(2, "0")}${imageData[2]
      .toString(16)
      .padStart(2, "0")}`.toUpperCase();
  };

  const normalizeColor = (color) => {
    // Normalize background colors to white
    if (color === "#E5E5E5" || color === "#FFFFFF") {
      return "#FFFFFF";
    }
    return color.toUpperCase();
  };

  const isSameColor = (color1, color2) => {
    return normalizeColor(color1) === normalizeColor(color2);
  };

  const getPixelFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return {
      x: Math.floor(x / gridSize),
      y: Math.floor(y / gridSize),
    };
  };

  const updateCanvasState = (force = false) => {
    if (!canvasRef.current || !canDraw()) return;

    const now = Date.now();
    if (!force && now - lastUpdateTime < UPDATE_INTERVAL) return;

    // Only send updates if we have new pixels
    if (drawnPixelsRef.current.size > 0 || force) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL("image/png", 0.8), // Reduced quality for performance
          timestamp: now,
        },
        roomId,
      });
      setLastUpdateTime(now);
      drawnPixelsRef.current.clear();
    }
  };

  const throttledDraw = (ctx, x, y, color) => {
    const now = performance.now();
    if (now - lastDrawTime.current < DRAW_THROTTLE) return false;

    lastDrawTime.current = now;
    if (drawPixel(ctx, x, y, color)) {
      drawnPixelsRef.current.set(`${x},${y}`, color);
      return true;
    }
    return false;
  };

  // Calculate actual pixels in grid
  const pixelsWide = Math.floor(CANVAS_WIDTH / gridSize);
  const pixelsHigh = Math.floor(CANVAS_HEIGHT / gridSize);

  const handleDrawStart = (e) => {
    if (!canDraw()) return;
    setIsDrawing(true);
    const pixel = getPixelFromEvent(e);
    if (!pixel) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    lastPixelRef.current = pixel;
    const color = currentTool === "eraser" ? "#FFFFFF" : currentColor;

    if (currentTool === "fill") {
      saveState(); // Save state before filling
      if (floodFill(ctx, pixel.x, pixel.y, color)) {
        updateCanvasState(true); // Force immediate update for fill
      }
      setIsDrawing(false);
    } else {
      throttledDraw(ctx, pixel.x, pixel.y, color);
      scheduleUpdate();
    }
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || !canDraw() || currentTool === "fill") return;
    const pixel = getPixelFromEvent(e);
    if (
      !pixel ||
      (lastPixelRef.current?.x === pixel.x &&
        lastPixelRef.current?.y === pixel.y)
    )
      return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (
      throttledDraw(
        ctx,
        pixel.x,
        pixel.y,
        currentTool === "eraser" ? "#FFFFFF" : currentColor
      )
    ) {
      lastPixelRef.current = pixel;
      scheduleUpdate();
    }
  };

  const handleDrawEnd = () => {
    if (!canDraw()) return;
    setIsDrawing(false);
    lastPixelRef.current = null;

    // Force final update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    if (drawnPixelsRef.current.size > 0) {
      updateCanvasState(true);
    }
  };

  const floodFill = (ctx, startX, startY, fillColor) => {
    const startColor = normalizeColor(getPixelColor(ctx, startX, startY));
    const normalizedFillColor = normalizeColor(fillColor);

    // If target color is the same as fill color, return
    if (startColor === normalizedFillColor) return false;

    const stack = [[startX, startY]];
    const seen = new Set();

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;

      if (x < 0 || x >= pixelsWide || y < 0 || y >= pixelsHigh || seen.has(key))
        continue;

      // Check if current pixel matches start color
      const currentColor = normalizeColor(getPixelColor(ctx, x, y));
      if (currentColor !== startColor) continue;

      seen.add(key);

      // Fill the pixel, preserving checkerboard pattern for white/eraser
      const actualFillColor =
        fillColor === "#FFFFFF"
          ? shouldBeChecked(x, y)
            ? "#E5E5E5"
            : "#FFFFFF"
          : fillColor;

      drawPixel(ctx, x, y, actualFillColor);

      // Add adjacent pixels
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return true;
  };

  const saveState = () => {
    if (!canvasRef.current) return;
    const currentState = canvasRef.current.toDataURL();
    setHistory((prev) => [...prev, currentState]);
    setRedoStates([]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const prevState = history[history.length - 2];
    setRedoStates((prev) => [...prev, history[history.length - 1]]);
    setHistory((prev) => prev.slice(0, -1));
    loadCanvasState(prevState);

    // Notify other users about the undo action
    socketManager.updateCanvas({
      canvasState: {
        data: prevState,
        timestamp: Date.now(),
      },
      roomId,
    });
  };

  const redo = () => {
    if (redoStates.length === 0) return;
    const nextState = redoStates[redoStates.length - 1];
    setHistory((prev) => [...prev, nextState]);
    setRedoStates((prev) => prev.slice(0, -1));
    loadCanvasState(nextState);

    // Notify other users about the redo action
    socketManager.updateCanvas({
      canvasState: {
        data: nextState,
        timestamp: Date.now(),
      },
      roomId,
    });
  };

  const loadCanvasState = (state) => {
    if (!canvasRef.current) return;
    const img = new Image();
    img.src = state;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, 0, 0);
      if (canDraw()) {
        updateCanvasState();
      }
    };
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCheckerPattern(ctx);

    // Save blank state if not in drawing mode
    if (gameState !== GAME_STATE.DRAWING) {
      socketManager.updateCanvas({
        canvasState: {
          data: canvasRef.current.toDataURL(),
          timestamp: Date.now(),
        },
        roomId,
        isLobbyCanvas: true,
      });
    }
  };

  const drawCheckerPattern = (ctx) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let y = 0; y < pixelsHigh; y++) {
      for (let x = 0; x < pixelsWide; x++) {
        if ((x + y) % 2 === 0) {
          drawPixel(ctx, x, y, "#e5e5e5");
        }
      }
    }
  };

  const saveToPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "pixel-art.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const scheduleUpdate = () => {
    if (updateTimeoutRef.current) return;

    // Immediate update if enough time has passed
    if (Date.now() - lastUpdateTime >= UPDATE_INTERVAL) {
      updateCanvasState();
      return;
    }

    // Schedule a force update
    updateTimeoutRef.current = setTimeout(() => {
      updateCanvasState(true);
      updateTimeoutRef.current = null;
    }, FORCE_UPDATE_DELAY);
  };

  // Canvas initialization and update effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true, // Enable desynchronized hint for better performance
    });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCheckerPattern(ctx);

    setHistory([canvas.toDataURL()]);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, gridSize]);

  // Handle incoming canvas updates
  useEffect(() => {
    const handleCanvasUpdate = (data) => {
      if (!data?.canvasState?.data) return;
      loadCanvasState(data.canvasState.data);
    };

    const unsubscribe = socketManager.onCanvasUpdate(handleCanvasUpdate);
    return () => unsubscribe();
  }, []);

  // Handle canvas state changes and save to lobbyCanvas when not drawing
  useEffect(() => {
    if (canvasState?.data) {
      loadCanvasState(canvasState.data);

      // Save to lobbyCanvas when not in DRAWING state
      if (gameState !== GAME_STATE.DRAWING) {
        socketManager.updateCanvas({
          canvasState: {
            data: canvasState.data,
            timestamp: Date.now(),
          },
          roomId,
          isLobbyCanvas: true,
        });
      }
    }
  }, [canvasState?.data, gameState]);

  // Reset canvas on game state changes
  useEffect(() => {
    if (
      gameState === GAME_STATE.PICKING_WORD ||
      gameState === GAME_STATE.WAITING
    ) {
      clearCanvas();
    }
  }, [gameState]);

  const [showWaitingMessage, setShowWaitingMessage] = useState(true);
  const [showDrawerMessage, setShowDrawerMessage] = useState(true);

  return (
    <div className="relative flex flex-col items-center w-full h-full bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 rounded-xl shadow-lg p-4 space-y-3 transition-all duration-300">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {gameState === GAME_STATE.WAITING && showWaitingMessage && (
          <div
            className="animate-in slide-in-from-right fade-in duration-300"
            onClick={() => setShowWaitingMessage(false)}
          >
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm transform transition hover:scale-[1.02]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Draw together while waiting for the game to start
                </p>
                <button
                  onClick={() => setShowWaitingMessage(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {!isDrawer && gameState === GAME_STATE.DRAWING && showDrawerMessage && (
          <div
            className="animate-in slide-in-from-right fade-in duration-300"
            onClick={() => setShowDrawerMessage(false)}
          >
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm transform transition hover:scale-[1.02]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {drawerUsername ? drawerUsername : "Unknown User"}
                  </span>{" "}
                  is drawing...
                </p>
                <button
                  onClick={() => setShowDrawerMessage(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative w-full h-full flex flex-col gap-4">
        {/* Canvas Container */}
        <div className="relative flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex">
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              imageRendering: "pixelated",
            }}
            className={`rounded-xl shadow-md transition-all duration-300 ${
              canDraw()
                ? "ring-2 ring-indigo-500 dark:ring-indigo-400 cursor-crosshair hover:ring-4"
                : "ring-1 ring-gray-200 dark:ring-gray-700"
            }`}
            onMouseDown={handleDrawStart}
            onMouseMove={handleDrawMove}
            onMouseUp={handleDrawEnd}
            onMouseLeave={handleDrawEnd}
            onTouchStart={(e) => {
              e.preventDefault();
              handleDrawStart(e.touches[0]);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              handleDrawMove(e.touches[0]);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleDrawEnd();
            }}
          />
        </div>

        {/* Drawing Tools */}
        <div className="flex flex-wrap gap-2 justify-center">
          <ToolButton
            onClick={() => setCurrentTool("brush")}
            active={currentTool === "brush"}
            disabled={!canDraw()}
            title="Brush Tool (B)"
          >
            <FaPaintBrush />
          </ToolButton>
          <ToolButton
            onClick={() => setCurrentTool("fill")}
            active={currentTool === "fill"}
            disabled={!canDraw()}
            title="Fill Tool (F)"
          >
            <FaFill />
          </ToolButton>
          <ToolButton
            onClick={() => setCurrentTool("eraser")}
            active={currentTool === "eraser"}
            disabled={!canDraw()}
            title="Eraser (E)"
          >
            <FaEraser />
          </ToolButton>

          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />

          <ToolButton
            onClick={undo}
            disabled={!canDraw() || history.length <= 1}
            title="Undo (Ctrl+Z)"
          >
            <FaUndo />
          </ToolButton>
          <ToolButton
            onClick={redo}
            disabled={!canDraw() || redoStates.length === 0}
            title="Redo (Ctrl+Y)"
          >
            <FaRedo />
          </ToolButton>

          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />

          <ToolButton onClick={saveToPng} title="Save as PNG">
            <FaDownload />
          </ToolButton>
          <ToolButton
            onClick={clearCanvas}
            disabled={!canDraw()}
            title="Clear Canvas"
            className="text-red-500 dark:text-red-400"
          >
            <FaTrash />
          </ToolButton>

          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            disabled={!canDraw()}
            className={`w-10 h-10 rounded-lg cursor-pointer ${
              !canDraw() && "opacity-50 cursor-not-allowed"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({
  active,
  onClick,
  children,
  title,
  disabled,
  className = "",
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2.5 rounded-lg text-sm transition-all duration-200 ${
      disabled
        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
        : active
        ? "bg-indigo-500 text-white shadow-md hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700"
        : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
    } ${className}`}
  >
    {children}
  </button>
);

export default PixelCanvas;
