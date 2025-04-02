import { useRef, useState, useEffect, useCallback } from "react";
import {
  FaPaintBrush,
  FaFill,
  FaEraser,
  FaUndo,
  FaRedo,
  FaDownload,
} from "react-icons/fa";

import { socketManager } from "../../services/socket";
import {
  GAME_CONSTANTS,
  SOCKET_EVENTS,
  GAME_STATE,
} from "../../../../shared/constants";

/**
 * ToolButton Component
 * Reusable button component for drawing tools with active state styling
 */
const ToolButton = ({ active, onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md text-sm transition-colors ${
      active
        ? "bg-indigo-600 text-white hover:bg-indigo-700"
        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
    }`}
  >
    {children}
  </button>
);

/**
 * PixelCanvas Component
 * Main drawing interface for the game
 * Handles all drawing tools, canvas interactions, and state management
 */
const PixelCanvas = ({
  isDrawer,
  drawerUsername,
  canvasState,
  gameState,
  roundTime,
  startTime,
  roomId,
}) => {
  // Core canvas state and refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentTool, setCurrentTool] = useState("brush");
  const [history, setHistory] = useState([]); // For undo functionality
  const [redoStates, setRedoStates] = useState([]); // For redo functionality
  const [gridSize, setGridSize] = useState(GAME_CONSTANTS.CANVAS_GRID_SIZE); // Add grid size state
  
  // Refs for update optimization
  const updateTimeoutRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const pixelUpdateCountRef = useRef(0);
  const lastPositionRef = useRef(null);

  // Canvas configuration constants
  const CANVAS_HEIGHT = GAME_CONSTANTS.CANVAS_HEIGHT;
  const CANVAS_WIDTH = GAME_CONSTANTS.CANVAS_WIDTH;
  const UPDATE_THROTTLE_MS = 50; // Only send updates every 50ms max
  const MIN_PIXELS_FOR_UPDATE = 3; // Batch at least 3 pixels before sending update

  /**
   * Debounced canvas update function to reduce network traffic
   * Only sends updates after drawing activity has paused or enough pixels changed
   */
  const debouncedCanvasUpdate = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !isDrawer) return;
    
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Send update if enough time has passed or enough pixels have changed
    if (timeSinceLastUpdate > UPDATE_THROTTLE_MS || pixelUpdateCountRef.current >= MIN_PIXELS_FOR_UPDATE) {
      lastUpdateTimeRef.current = now;
      pixelUpdateCountRef.current = 0;
      
      // Use a lower quality setting for faster transfers
      const canvasData = canvas.toDataURL('image/jpeg', 0.8);
      socketManager.updateCanvas(canvasData);
    } else {
      // Schedule update for later
      updateTimeoutRef.current = setTimeout(() => {
        lastUpdateTimeRef.current = Date.now();
        pixelUpdateCountRef.current = 0;
        const canvasData = canvas.toDataURL('image/jpeg', 0.8);
        socketManager.updateCanvas(canvasData);
        updateTimeoutRef.current = null;
      }, UPDATE_THROTTLE_MS);
    }
  }, [isDrawer]);

  /**
   * Draws a single pixel on the grid
   * Handles both regular drawing and eraser functionality
   */
  const drawPixel = (ctx, x, y, color) => {
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);

    if (
      gridX >= 0 &&
      gridX < CANVAS_WIDTH / gridSize &&
      gridY >= 0 &&
      gridY < CANVAS_HEIGHT / gridSize
    ) {
      ctx.fillStyle = currentTool === "eraser" ? "#ffffff" : color;
      ctx.fillRect(gridX * gridSize, gridY * gridSize, gridSize, gridSize);
      
      // Increment the pixel update counter
      pixelUpdateCountRef.current++;
      
      // Batch updates instead of sending each pixel
      debouncedCanvasUpdate();
    }
  };

  /**
   * Draw a line between two points using Bresenham's algorithm
   * This helps create smooth lines even when moving the mouse quickly
   */
  const drawLine = (ctx, x0, y0, x1, y1, color) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      drawPixel(ctx, x0, y0, color);
      
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  /**
   * Saves current canvas state for undo functionality
   */
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Add null check

    setHistory([...history, canvas.toDataURL()]);
    setRedoStates([]); // Clear redo stack on new action
  };

  /**
   * Gets color of pixel at specific coordinates
   * Optimized for performance by directly accessing pixel data
   */
  const getPixelColor = (ctx, x, y) => {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    // Compare by individual components rather than creating string for better performance
    return [pixel[0], pixel[1], pixel[2]];
  };

  /**
   * Converts RGB array to hex color string
   */
  const rgbToHex = (r, g, b) => {
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  /**
   * Converts hex color string to RGB array
   */
  const hexToRgb = (hex) => {
    hex = hex.replace("#", "");
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
  };

  /**
   * Compare if two colors are the same (within tolerance)
   */
  const colorsEqual = (color1, color2) => {
    return (
      color1[0] === color2[0] &&
      color1[1] === color2[1] &&
      color1[2] === color2[2]
    );
  };

  /**
   * Implements simplified flood fill (paint bucket) tool
   * Uses a simple, reliable approach for filling connected pixels
   */
  const floodFill = (ctx, startX, startY, fillColorHex) => {
    if (!ctx) return;

    // Convert to grid coordinates
    const gridX = Math.floor(startX / gridSize);
    const gridY = Math.floor(startY / gridSize);

    // Get target color at starting position
    const targetColorData = ctx.getImageData(
      gridX * gridSize,
      gridY * gridSize,
      1,
      1
    ).data;
    const targetColor = `rgb(${targetColorData[0]}, ${targetColorData[1]}, ${targetColorData[2]})`;

    // Don't fill if target is the same as fill color
    if (targetColor === fillColorHex) return false;

    // Simple stack-based flood fill
    const stack = [[gridX, gridY]];
    const width = Math.floor(CANVAS_WIDTH / gridSize);
    const height = Math.floor(CANVAS_HEIGHT / gridSize);
    const visited = new Set();
    const pixelsToFill = [];

    // Reasonable limit to prevent browser hanging
    const maxPixels = 2500;

    while (stack.length > 0 && pixelsToFill.length < maxPixels) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;

      // Skip if outside canvas or already visited
      if (x < 0 || y < 0 || x >= width || y >= height || visited.has(key)) {
        continue;
      }

      // Check if pixel matches target color
      const pixelData = ctx.getImageData(x * gridSize, y * gridSize, 1, 1).data;
      const pixelColor = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

      if (pixelColor !== targetColor) {
        continue;
      }

      // Mark as visited and add to fill list
      visited.add(key);
      pixelsToFill.push([x, y]);

      // Add 4-connected neighbors to stack
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    // Fill all the collected pixels
    ctx.fillStyle = fillColorHex;
    for (const [x, y] of pixelsToFill) {
      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }

    // Only send update once after all pixels are filled
    if (pixelsToFill.length > 0) {
      pixelUpdateCountRef.current = MIN_PIXELS_FOR_UPDATE;
      debouncedCanvasUpdate();
    }

    return pixelsToFill.length > 0;
  };

  // Throttled mouse move handler to improve performance
  const handleDraw = useCallback((e) => {
    if (!isDrawing || !isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return; // Ensure canvas is valid

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Ensure context is valid

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (currentTool === "fill") {
      saveState();
      floodFill(ctx, x, y, currentColor);
      setIsDrawing(false);
    } else {
      // For brush/eraser, draw lines between points for smoother drawing
      // This prevents gaps when moving the mouse quickly
      if (lastPositionRef.current) {
        const [lastX, lastY] = lastPositionRef.current;
        drawLine(ctx, lastX, lastY, x, y, currentColor);
      } else {
        drawPixel(ctx, x, y, currentColor);
      }
      lastPositionRef.current = [x, y];
    }
  }, [isDrawing, isDrawer, currentTool, currentColor, gridSize, debouncedCanvasUpdate]);

  const handleMouseDown = useCallback((e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    lastPositionRef.current = null; // Reset last position for a new stroke
    
    // Add drawing on click without requiring drag
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // For fill tool, handle it directly here
    if (currentTool === "fill") {
      saveState();
      floodFill(ctx, x, y, currentColor);
    } else {
      // For brush/eraser, draw a single pixel
      drawPixel(ctx, x, y, currentColor);
      lastPositionRef.current = [x, y];
    }
  }, [isDrawer, currentTool, currentColor, gridSize, debouncedCanvasUpdate]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawer) return;
    setIsDrawing(false);
    lastPositionRef.current = null; // Reset last position
    
    // Force an update when mouse is released to ensure latest state is sent
    const canvas = canvasRef.current;
    if (canvas) {
      const currentState = canvas.toDataURL();
      setHistory(prevHistory => [...prevHistory, currentState]);
      setRedoStates([]); // Clear redo stack on new action
      
      // Force immediate update
      lastUpdateTimeRef.current = Date.now();
      pixelUpdateCountRef.current = 0;
      socketManager.updateCanvas(currentState);
    }
  }, [isDrawer]);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    handleMouseDown(e.touches[0]);
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    handleDraw(e.touches[0]);
  }, [handleDraw]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  const undo = () => {
    if (history.length > 1) {
      // Keep at least initial state
      const currentState = history[history.length - 1];
      const prevState = history[history.length - 2];

      setRedoStates([...redoStates, currentState]);
      setHistory(history.slice(0, -1));

      const canvas = canvasRef.current;
      if (!canvas) return; // Add null check

      const img = new Image();
      img.src = prevState;
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return; // Add null check for context

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Send the updated canvas to other players
        if (isDrawer) {
          socketManager.updateCanvas(canvas.toDataURL());
        }
      };
    }
  };

  const redo = () => {
    if (redoStates.length > 0) {
      const nextState = redoStates[redoStates.length - 1];

      setHistory([...history, nextState]);
      setRedoStates(redoStates.slice(0, -1));

      const canvas = canvasRef.current;
      if (!canvas) return; // Add null check

      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return; // Add null check for context

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Send the updated canvas to other players
        if (isDrawer) {
          socketManager.updateCanvas(nextState);
        }
      };
    }
  };

  const saveToPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Add null check

    const link = document.createElement("a");
    link.download = "pixel-art.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Cleanup function to cancel any pending updates when component unmounts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Initialize canvas and load saved state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Add null check

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Wait for next tick to ensure canvas is fully initialized
    setTimeout(() => {
      if (canvasState?.data) {
        const img = new Image();
        img.src = canvasState.data;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          saveState(); // Save loaded state for undo/redo
        };
      } else {
        // Initialize with white background if no saved state
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    }, 0);
  }, []);

  // Add useEffect to listen for canvas updates from other players
  useEffect(() => {
    // Only non-drawers should listen for updates
    if (!isDrawer) {
      const unsubscribe = socketManager.onCanvasUpdate((canvasData) => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Add null check

        const img = new Image();
        img.src = canvasData;
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.drawImage(img, 0, 0);
        };
      });
      
      return unsubscribe; // Cleanup subscription when component unmounts or dependency changes
    }
  }, [isDrawer]);

  // Add effect to load initial canvas state
  useEffect(() => {
    if (canvasState?.data) {
      // Add a small delay to ensure canvas is fully initialized
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Add null check

        const img = new Image();
        img.src = canvasState.data;
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.drawImage(img, 0, 0);

          // Only save state if we successfully rendered
          if (canvasRef.current) {
            saveState();
          }
        };
      }, 50);
    }
  }, [canvasState]);

  // Add effect to handle grid size changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Only redraw if there's history (canvas has content)
    if (history.length > 0) {
      const currentState = history[history.length - 1];

      const img = new Image();
      img.src = currentState;
      img.onload = () => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0);

        // Send update to other players if you're the drawer
        if (isDrawer) {
          socketManager.updateCanvas(canvas.toDataURL());
        }
      };
    }
  }, [gridSize]);

  // Add timer effect for drawing round
  useEffect(() => {
    let timerId;
    if (gameState === GAME_STATE.DRAWING && startTime) {
      const endTime = new Date(startTime).getTime() + roundTime * 1000;

      const checkTime = () => {
        const now = Date.now();
        if (now >= endTime) {
          clearInterval(timerId);
          console.log("Time's up!");
        }
      };

      timerId = setInterval(checkTime, 1000);
      checkTime(); // Check immediately
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [gameState, startTime, roundTime, roomId]);

  // Update when drawer changes or game state changes to clear canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas when:
    // 1. Game transitions to PICKING_WORD state (new round/turn)
    // 2. Game transitions to DRAWING state with a new drawer
    // 3. Whenever drawer username changes
    if (gameState === GAME_STATE.PICKING_WORD || gameState === GAME_STATE.DRAWING) {
      console.log(`Clearing canvas for new drawing round (state: ${gameState}, drawer: ${drawerUsername})`);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Reset history for undo/redo
      setHistory([canvas.toDataURL()]);
      setRedoStates([]);
      
      // Reset update counters and last position
      pixelUpdateCountRef.current = 0;
      lastPositionRef.current = null;
      
      // If we're in DRAWING state, send the cleared canvas to all players
      if (gameState === GAME_STATE.DRAWING && isDrawer) {
        socketManager.updateCanvas(canvas.toDataURL());
      }
    }
  }, [gameState, drawerUsername]);

  return (
    <div
      id="canvas"
      className="flex flex-col items-center w-full h-full p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg transition-colors"
    >
      {!isDrawer && (
        <div className="bg-white/95 dark:bg-gray-800/95 px-3 py-1 rounded-lg shadow-sm mb-1 text-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {drawerUsername} is drawing...
          </p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          maxWidth: CANVAS_WIDTH,
          height: "auto",
          touchAction: "none",
        }}
        className={`border-2 rounded-lg bg-white/100 ${
          isDrawer
            ? "border-indigo-800 dark:border-indigo-400 cursor-crosshair"
            : "border-gray-200 dark:border-gray-700"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleDraw}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {isDrawer && (
        <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-700/50 p-1.5 rounded-lg transition-colors mt-1 w-full">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            title="Choose color"
            aria-label="Choose color"
          />
          
          <div className="flex flex-wrap gap-1">
            <ToolButton
              active={currentTool === "brush"}
              onClick={() => setCurrentTool("brush")}
              title="Brush Tool"
            >
              <FaPaintBrush className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              active={currentTool === "fill"}
              onClick={() => setCurrentTool("fill")}
              title="Fill Tool"
            >
              <FaFill className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              active={currentTool === "eraser"}
              onClick={() => setCurrentTool("eraser")}
              title="Eraser Tool"
            >
              <FaEraser className="w-4 h-4" />
            </ToolButton>
            <ToolButton onClick={undo} title="Undo">
              <FaUndo className="w-4 h-4" />
            </ToolButton>
            <ToolButton onClick={redo} title="Redo">
              <FaRedo className="w-4 h-4" />
            </ToolButton>
            <ToolButton onClick={saveToPng} title="Save as PNG">
              <FaDownload className="w-4 h-4" />
            </ToolButton>
          </div>
          
          <div className="flex items-center ml-auto">
            <span className="text-xs text-gray-700 dark:text-gray-300 mr-1 whitespace-nowrap">
              Size: {gridSize}px
            </span>
            <input
              type="range"
              min="8"
              max="40"
              step="4"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
              dark:bg-gray-600 accent-indigo-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
