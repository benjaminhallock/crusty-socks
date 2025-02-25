import { useRef, useState, useEffect } from "react";

import { socketManager } from "../../services/socket";

/**
 * ToolButton Component
 * Reusable button component for drawing tools with active state styling
 */
const ToolButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
      active ? "bg-indigo-600 text-white" : "bg-white text-gray-700 border border-gray-300"
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
const PixelCanvas = ({ isDrawer, drawerUsername, canvasState }) => {
  // console.log('PixelCanvas rendered:', { isDrawer, drawerUsername });
  // Core canvas state and refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentTool, setCurrentTool] = useState("brush");
  const [history, setHistory] = useState([]); // For undo functionality
  const [redoStates, setRedoStates] = useState([]); // For redo functionality

  // Canvas configuration constants
  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 500;

  /**
   * Draws a single pixel on the grid
   * Handles both regular drawing and eraser functionality
   */
  const drawPixel = (ctx, x, y, color) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    if (gridX >= 0 && gridX < CANVAS_WIDTH / GRID_SIZE && 
        gridY >= 0 && gridY < CANVAS_HEIGHT / GRID_SIZE) {
      ctx.fillStyle = currentTool === "eraser" ? "#ffffff" : color;
      ctx.fillRect(gridX * GRID_SIZE, gridY * GRID_SIZE, GRID_SIZE, GRID_SIZE);

      // Send canvas update through socket
      const canvasData = canvasRef.current.toDataURL();
      socketManager.updateCanvas(canvasData);
    }
  };

  /**
   * Saves current canvas state for undo functionality
   */
  const saveState = () => {
    console.log('Saving canvas state');
    const canvas = canvasRef.current;
    setHistory([...history, canvas.toDataURL()]);
    setRedoStates([]); // Clear redo stack on new action
  };

  /**
   * Gets color of pixel at specific coordinates
   */
  const getPixelColor = (ctx, x, y) => {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return `#${[...pixel.slice(0, 3)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  };

  /**
   * Implements flood fill (paint bucket) tool using stack-based approach
   */
  const floodFill = (ctx, startX, startY, fillColor) => {
    if (!ctx) return;

    // Convert to grid coordinates immediately
    const gridX = Math.floor(startX / GRID_SIZE);
    const gridY = Math.floor(startY / GRID_SIZE);
    
    // Get target color once
    const targetColor = getPixelColor(ctx, gridX * GRID_SIZE, gridY * GRID_SIZE);
    if (targetColor === fillColor) return;

    const visited = new Set();
    const stack = [[gridX, gridY]];
    
    // Batch all fill operations
    ctx.fillStyle = fillColor;
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= CANVAS_WIDTH / GRID_SIZE || y < 0 || y >= CANVAS_HEIGHT / GRID_SIZE) continue;
      
      const currentColor = getPixelColor(ctx, x * GRID_SIZE, y * GRID_SIZE);
      if (currentColor !== targetColor) continue;
      
      visited.add(key);
      
      // Fill current pixel
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      
      // Add neighbors to stack
      stack.push(
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      );
    }
  };

  const handleDraw = (e) => {
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
      // Move socket update outside of fill operation
      const canvasData = canvas.toDataURL();
      requestAnimationFrame(() => {
        socketManager.updateCanvas(canvasData);
      });
      setIsDrawing(false);
    } else {
      drawPixel(ctx, x, y, currentColor);
    }
  };

  const handleMouseDown = (e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
  };

  const handleMouseUp = () => {
    if (!isDrawer) return;
    setIsDrawing(false);
    saveState();
    const canvasData = canvasRef.current.toDataURL();
    socketManager.updateCanvas(canvasData);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    handleMouseDown(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    handleDraw(e.touches[0]);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const undo = () => {
    if (history.length > 1) { // Keep at least initial state
      const currentState = history[history.length - 1];
      const prevState = history[history.length - 2];
      
      setRedoStates([...redoStates, currentState]);
      setHistory(history.slice(0, -1));

      const img = new Image();
      img.src = prevState;
      img.onload = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (redoStates.length > 0) {
      const nextState = redoStates[redoStates.length - 1];
      
      setHistory([...history, nextState]);
      setRedoStates(redoStates.slice(0, -1));

      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const saveToPng = () => {
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  // Initialize canvas and load saved state
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Ensure context is valid

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
  }, []);

  // Add useEffect to listen for canvas updates from other players
  useEffect(() => {
    if (!isDrawer) {
      socketManager.onCanvasUpdate((canvasData) => {
        const img = new Image();
        img.src = canvasData;
        img.onload = () => {
          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) return; // Ensure context is valid
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.drawImage(img, 0, 0);
        };
      });
    }
  }, [isDrawer]);

  // Add effect to load initial canvas state
  useEffect(() => {
    if (canvasState?.data) {
      const img = new Image();
      img.src = canvasState.data;
      img.onload = () => {
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return; // Ensure context is valid
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0);
        saveState(); // Save this as the initial state for undo/redo
      };
    }
  }, [canvasState]);

  return (
    <div id="canvas" className="flex flex-col items-center gap-4 w-full h-full p-4 bg-white/90 dark:bg-gray-800/90 rounded-lg transition-colors">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: "100%",
          maxWidth: CANVAS_WIDTH,
          height: "auto",
          touchAction: "none"
        }}
        className={`border-2 rounded-lg bg-white/100 ${
          isDrawer ? "border-indigo-800 dark:border-indigo-400 cursor-crosshair" : "border-gray-200 dark:border-gray-700"
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
        <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-700/50 p-3 rounded-lg transition-colors">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
            title="Choose color"
            aria-label="Choose color"
          />
          <div className="flex gap-2">
            <ToolButton
              active={currentTool === "brush"}
              onClick={() => setCurrentTool("brush")}
            >
              Brush
            </ToolButton>
            <ToolButton
              active={currentTool === "fill"}
              onClick={() => setCurrentTool("fill")}
            >
              Fill
            </ToolButton>
            <ToolButton
              active={currentTool === "eraser"}
              onClick={() => setCurrentTool("eraser")}
            >
              Eraser
            </ToolButton>
            <ToolButton onClick={undo}>Undo</ToolButton>
            <ToolButton onClick={redo}>Redo</ToolButton>
            <ToolButton onClick={saveToPng}>Save</ToolButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
