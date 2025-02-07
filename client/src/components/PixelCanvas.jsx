import { useEffect, useRef, useState } from "react";
import { socketManager } from "../services/socket";

// Simple button component for drawing tools
const ToolButton = ({ active, disabled, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm transition-colors
      ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-white text-gray-700 border border-gray-300"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    disabled={disabled}
  >
    {children}
  </button>
);

// Separate component for drawing tools
const DrawingTools = ({ canvasState, setCanvasState, defaultColor, isDisabled }) => {
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm p-3 rounded-lg mt-2">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Color picker */}
        <input
          type="color"
          value={canvasState.currentColor || defaultColor}
          onChange={(e) =>
            setCanvasState((prev) => ({
              ...prev,
              currentColor: e.target.value,
              currentTool: "brush",
            }))
          }
          className="w-10 h-10 rounded cursor-pointer"
          disabled={isDisabled}
          title="Choose color"
        />

        {/* Tool buttons */}
        <div className="flex gap-2">
          {["brush", "bucket", "eraser"].map((tool) => (
            <ToolButton
              key={tool}
              active={canvasState.currentTool === tool}
              disabled={isDisabled}
              onClick={() =>
                setCanvasState((prev) => ({ ...prev, currentTool: tool }))
              }
              title={tool === "bucket" ? "Fill area" : `${tool} tool`}
            >
              {tool === "bucket" ? "Fill" : tool.charAt(0).toUpperCase() + tool.slice(1)}
            </ToolButton>
          ))}
        </div>

        {/* History controls */}
        <div className="flex gap-2">
          <ToolButton
            onClick={() => canvasState.historyIndex > 0 && canvasState.undo()}
            disabled={canvasState.historyIndex <= 0 || isDisabled}
            title="Undo last action"
          >
            Undo
          </ToolButton>
          <ToolButton
            onClick={() => 
              canvasState.historyIndex < canvasState.history.length - 1 && 
              canvasState.redo()
            }
            disabled={
              canvasState.historyIndex >= canvasState.history.length - 1 ||
              isDisabled
            }
            title="Redo last action"
          >
            Redo
          </ToolButton>
        </div>

        {/* Brush size control */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <input
            type="range"
            min="1"
            max="5"
            value={canvasState.brushSize}
            onChange={(e) =>
              setCanvasState((prev) => ({
                ...prev,
                brushSize: parseInt(e.target.value),
              }))
            }
            className="w-16 sm:w-20"
            disabled={isDisabled}
            title="Adjust brush size"
          />
          <span className="text-xs w-4">{canvasState.brushSize}</span>
        </div>
      </div>
    </div>
  );
};

// Main PixelCanvas component
const PixelCanvas = ({ isDrawer, gameState, defaultColor = "#000000" }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Constants
  const GRID_SIZE = 20;
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;

  // Canvas state with action methods
  const [canvasState, setCanvasState] = useState({
    isDrawing: false,
    currentColor: defaultColor,
    brushSize: 1,
    currentTool: "brush",
    history: [],
    historyIndex: -1,
    canvasSize: { width: BASE_WIDTH, height: BASE_HEIGHT },
    undo: () => handleUndo(),
    redo: () => handleRedo(),
  });

  const isDisabled = !isDrawer && gameState === "playing";

  // Drawing helpers
  const getGridPosition = (clientX, clientY, rect, scale) => {
    return [
      Math.floor(((clientX - rect.left) * scale) / GRID_SIZE),
      Math.floor(((clientY - rect.top) * scale) / GRID_SIZE)
    ];
  };

  const getPixel = (ctx, x, y) => {
    const pixel = ctx.getImageData(x * GRID_SIZE, y * GRID_SIZE, 1, 1);
    return `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
  };

  const floodFill = (startX, startY, fillColor) => {
    if (!isWithinCanvas(startX, startY)) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const targetColor = getPixel(ctx, startX, startY);
    
    if (targetColor === fillColor) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;

      if (!isWithinCanvas(x, y) || visited.has(key) || getPixel(ctx, x, y) !== targetColor) {
        continue;
      }

      drawPixel(ctx, x, y, fillColor);
      visited.add(key);

      // Add adjacent pixels
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    saveToHistory();
  };

  const drawPixel = (ctx, x, y, color) => {
    if (!isWithinCanvas(x, y)) return;
    ctx.fillStyle = color;
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    socketManager.socket?.emit("draw", { 
      index: y * (BASE_WIDTH / GRID_SIZE) + x, 
      color 
    });
  };

  const isWithinCanvas = (x, y) => {
    const canvas = canvasRef.current;
    return (
      x >= 0 &&
      x < canvas.width / GRID_SIZE &&
      y >= 0 &&
      y < canvas.height / GRID_SIZE
    );
  };

  // Drawing handlers
  const handleDraw = (e) => {
    if (isDisabled || !canvasState.isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    if (!clientX || !clientY) return;

    const [x, y] = getGridPosition(clientX, clientY, rect, scale);

    if (canvasState.currentTool === "bucket") {
      floodFill(x, y, canvasState.currentColor);
      return;
    }

    drawBrush(x, y);
  };

  const drawBrush = (centerX, centerY) => {
    const ctx = canvasRef.current.getContext("2d");
    const size = canvasState.currentTool === "eraser" 
      ? 1 
      : canvasState.brushSize;
    
    const offset = Math.floor(size / 2);
    const color = canvasState.currentTool === "eraser"
      ? ((centerX + centerY) % 2 === 0 ? "#f0f0f0" : "#ffffff")
      : canvasState.currentColor;

    // Draw brush pixels
    for (let y = -offset; y <= offset; y++) {
      for (let x = -offset; x <= offset; x++) {
        drawPixel(ctx, centerX + x, centerY + y, color);
      }
    }

    if (!canvasState.isDrawing || canvasState.currentTool === "bucket") {
      saveToHistory();
    }
  };

  // Canvas history management
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(imageData);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  const handleUndo = () => {
    if (canvasState.historyIndex <= 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const newIndex = canvasState.historyIndex - 1;
    
    ctx.putImageData(canvasState.history[newIndex], 0, 0);
    setCanvasState(prev => ({ ...prev, historyIndex: newIndex }));
    socketManager.socket?.emit("canvasState", { imageData: canvas.toDataURL() });
  };

  const handleRedo = () => {
    if (canvasState.historyIndex >= canvasState.history.length - 1) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const newIndex = canvasState.historyIndex + 1;
    
    ctx.putImageData(canvasState.history[newIndex], 0, 0);
    setCanvasState(prev => ({ ...prev, historyIndex: newIndex }));
    socketManager.socket?.emit("canvasState", { imageData: canvas.toDataURL() });
  };

  // Initialize canvas and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Draw initial checkerboard
    const drawCheckerboard = () => {
      for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        for (let x = 0; x < canvas.width; x += GRID_SIZE) {
          ctx.fillStyle = (x / GRID_SIZE + y / GRID_SIZE) % 2 === 0 
            ? "#f0f0f0" 
            : "#ffffff";
          ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
        }
      }
    };

    drawCheckerboard();
    saveToHistory();

    // Handle remote drawing updates
    socketManager.socket?.on("drawUpdate", ({ index, color }) => {
      const x = (index % (canvas.width / GRID_SIZE)) * GRID_SIZE;
      const y = Math.floor(index / (canvas.width / GRID_SIZE)) * GRID_SIZE;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    });

    // Handle canvas clear command
    socketManager.socket?.on("clearCanvas", drawCheckerboard);

    return () => {
      if (socketManager.socket) {
        socketManager.socket.off("drawUpdate");
        socketManager.socket.off("clearCanvas");
      }
    };
  }, []);

  // Handle game state changes
  useEffect(() => {
    if (gameState === "playing") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      // Clear canvas with checkerboard pattern
      for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        for (let x = 0; x < canvas.width; x += GRID_SIZE) {
          ctx.fillStyle = (x / GRID_SIZE + y / GRID_SIZE) % 2 === 0 
            ? "#f0f0f0" 
            : "#ffffff";
          ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
        }
      }
    }
  }, [gameState]);

  // Update color when default changes
  useEffect(() => {
    setCanvasState(prev => ({ ...prev, currentColor: defaultColor }));
  }, [defaultColor]);

  // Handle window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 60;
      const scaleWidth = containerWidth / BASE_WIDTH;
      const scaleHeight = containerHeight / BASE_HEIGHT;
      const scale = Math.min(scaleWidth, scaleHeight);

      setCanvasState(prev => ({
        ...prev,
        canvasSize: {
          width: Math.floor(BASE_WIDTH * scale),
          height: Math.floor(BASE_HEIGHT * scale),
        },
      }));
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full flex flex-col items-center justify-center max-w-[900px] mx-auto"
    >
      {/* Canvas container */}
      <div className="relative flex-grow flex items-center justify-center w-full px-4">
        <canvas
          ref={canvasRef}
          width={BASE_WIDTH}
          height={BASE_HEIGHT}
          style={{
            width: canvasState.canvasSize.width,
            height: canvasState.canvasSize.height,
            touchAction: "none",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
          className={`border-2 rounded-lg bg-white ${
            isDrawer && gameState === "playing"
              ? "border-indigo-500 cursor-crosshair"
              : "border-gray-200"
          }`}
          onMouseDown={e => {
            setCanvasState(prev => ({ ...prev, isDrawing: true }));
            handleDraw(e);
          }}
          onMouseMove={handleDraw}
          onMouseUp={() => setCanvasState(prev => ({ ...prev, isDrawing: false }))}
          onMouseLeave={() => setCanvasState(prev => ({ ...prev, isDrawing: false }))}
          onTouchStart={e => {
            setCanvasState(prev => ({ ...prev, isDrawing: true }));
            handleDraw(e);
          }}
          onTouchMove={handleDraw}
          onTouchEnd={() => setCanvasState(prev => ({ ...prev, isDrawing: false }))}
        />
      </div>

      {/* Drawing tools */}
      <DrawingTools
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        defaultColor={defaultColor}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default PixelCanvas;
