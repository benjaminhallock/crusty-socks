import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

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

const PixelCanvas = ({ isDrawer, gameState, defaultColor = "#000000" }) => {
  // References to DOM elements
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Canvas configuration
  const GRID_SIZE = 20; // Size of each pixel
  const BASE_WIDTH = 800; // Default canvas width
  const BASE_HEIGHT = 600; // Default canvas height

  // Main state for canvas operations
  const [canvasState, setCanvasState] = useState({
    isDrawing: false, // Whether user is currently drawing
    currentColor: defaultColor, // Selected color
    brushSize: 1, // Size of brush (1-5)
    currentTool: "brush", // Current tool (brush, bucket, eraser)
    history: [], // Array of canvas states for undo/redo
    historyIndex: -1, // Current position in history
    canvasSize: { width: BASE_WIDTH, height: BASE_HEIGHT }, // Current canvas size
  });

  // Disable drawing if not the drawer and game is playing
  const isDisabled = !isDrawer && gameState === "playing";

  // Convert mouse/touch position to grid coordinates
  const getGridPosition = (clientX, clientY, rect, scale) => {
    const x = Math.floor(((clientX - rect.left) * scale) / GRID_SIZE);
    const y = Math.floor(((clientY - rect.top) * scale) / GRID_SIZE);
    return [x, y];
  };

  // Draw a single pixel and emit to other players
  const drawPixel = (ctx, x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // Tell other players about this pixel
    const index = y * (BASE_WIDTH / GRID_SIZE) + x;
    socket.emit("draw", { index, color });
  };

  // Handle start of drawing (mouse down or touch start)
  const handleInteractionStart = (e) => {
    if (isDisabled) return;
    setCanvasState((prev) => ({ ...prev, isDrawing: true }));
    handleDraw(e);
  };

  // Handle drawing motion (mouse move or touch move)
  const handleInteractionMove = (e) => {
    if (!canvasState.isDrawing) return;
    handleDraw(e);
  };

  // Handle end of drawing (mouse up or touch end)
  const handleInteractionEnd = () => {
    setCanvasState((prev) => ({ ...prev, isDrawing: false }));
  };

  // Main drawing function
  const handleDraw = (e) => {
    if (isDisabled) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;

    // Get cursor position (works for both mouse and touch)
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    if (!clientX || !clientY) return;

    const [centerX, centerY] = getGridPosition(clientX, clientY, rect, scale);

    // Handle paint bucket tool separately
    if (canvasState.currentTool === "bucket") {
      floodFill(
        clientX - rect.left,
        clientY - rect.top,
        canvasState.currentColor
      );
      return;
    }

    // Draw pixels based on brush size
    drawBrush(centerX, centerY);
  };

  // Draw multiple pixels for brush tool
  const drawBrush = (centerX, centerY) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size =
      canvasState.currentTool === "eraser"
        ? Math.max(canvasState.brushSize, 1)
        : canvasState.brushSize;
    const offset = Math.floor(size / 2);

    // Draw a square of pixels centered on the cursor
    for (let y = -offset; y <= offset; y++) {
      for (let x = -offset; x <= offset; x++) {
        const currentX = centerX + x;
        const currentY = centerY + y;

        // Check if pixel is within canvas bounds
        if (isWithinCanvas(currentX, currentY)) {
          const color = getPixelColor(currentX, currentY);
          drawPixel(ctx, currentX, currentY, color);
        }
      }
    }

    if (!canvasState.isDrawing || canvasState.currentTool === "bucket") {
      saveToHistory();
    }
  };

  // Check if coordinates are within canvas bounds
  const isWithinCanvas = (x, y) => {
    const canvas = canvasRef.current;
    return (
      x >= 0 &&
      x < canvas.width / GRID_SIZE &&
      y >= 0 &&
      y < canvas.height / GRID_SIZE
    );
  };

  // Get color for pixel based on tool
  const getPixelColor = (x, y) => {
    if (canvasState.currentTool === "eraser") {
      return (x + y) % 2 === 0 ? "#f0f0f0" : "#ffffff";
    }
    return canvasState.currentColor;
  };

  // Save current canvas state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const newHistory = canvasState.history.slice(
      0,
      canvasState.historyIndex + 1
    );
    newHistory.push(imageData);

    setCanvasState((prev) => ({
      ...prev,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    }));
  };

  // Undo the last action
  const undo = () => {
    if (canvasState.historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const newIndex = canvasState.historyIndex - 1;
      ctx.putImageData(canvasState.history[newIndex], 0, 0);
      setCanvasState((prev) => ({ ...prev, historyIndex: newIndex }));
      socket.emit("canvasState", { imageData: canvas.toDataURL() });
    }
  };

  // Redo the last undone action
  const redo = () => {
    if (canvasState.historyIndex < canvasState.history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const newIndex = canvasState.historyIndex + 1;
      ctx.putImageData(canvasState.history[newIndex], 0, 0);
      setCanvasState((prev) => ({ ...prev, historyIndex: newIndex }));
      socket.emit("canvasState", { imageData: canvas.toDataURL() });
    }
  };

  // Check if two colors match within a tolerance
  const colorsMatch = (color1, color2, tolerance = 1) => {
    return (
      Math.abs(color1[0] - color2[0]) <= tolerance &&
      Math.abs(color1[1] - color2[1]) <= tolerance &&
      Math.abs(color1[2] - color2[2]) <= tolerance
    );
  };

  // Flood fill algorithm for paint bucket tool
  const floodFill = (startX, startY, fillColor) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const gridX = Math.floor(startX / GRID_SIZE);
    const gridY = Math.floor(startY / GRID_SIZE);

    const startData = ctx.getImageData(
      gridX * GRID_SIZE,
      gridY * GRID_SIZE,
      1,
      1
    ).data;

    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);

    if (
      colorsMatch(
        [startData[0], startData[1], startData[2]],
        [fillR, fillG, fillB]
      )
    ) {
      return;
    }

    const stack = [[gridX, gridY]];
    const visited = new Set();
    const maxX = Math.floor(canvas.width / GRID_SIZE);
    const maxY = Math.floor(canvas.height / GRID_SIZE);

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;

      if (visited.has(key) || x < 0 || x >= maxX || y < 0 || y >= maxY)
        continue;

      const currentData = ctx.getImageData(
        x * GRID_SIZE,
        y * GRID_SIZE,
        1,
        1
      ).data;

      if (
        colorsMatch(
          [currentData[0], currentData[1], currentData[2]],
          [startData[0], startData[1], startData[2]]
        )
      ) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

        const index = y * maxX + x;
        socket.emit("draw", { index, color: fillColor });

        visited.add(key);
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    saveToHistory();
  };

  // Clear the entire canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
      for (let x = 0; x < canvas.width; x += GRID_SIZE) {
        ctx.fillStyle =
          (x / GRID_SIZE + y / GRID_SIZE) % 2 === 0 ? "#f0f0f0" : "#ffffff";
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawCheckerboard = () => {
      for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        for (let x = 0; x < canvas.width; x += GRID_SIZE) {
          ctx.fillStyle =
            (x / GRID_SIZE + y / GRID_SIZE) % 2 === 0 ? "#f0f0f0" : "#ffffff";
          ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
        }
      }
    };

    drawCheckerboard();
    saveToHistory();

    const handleDraw = (data) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = data.color;
      const x = (data.index % (canvas.width / GRID_SIZE)) * GRID_SIZE;
      const y = Math.floor(data.index / (canvas.width / GRID_SIZE)) * GRID_SIZE;
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    };

    const handleClear = () => clearCanvas();

    socket.on("drawUpdate", handleDraw);
    socket.on("clearCanvas", handleClear);

    return () => {
      socket.off("drawUpdate", handleDraw);
      socket.off("clearCanvas", handleClear);
    };
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      clearCanvas();
    }
  }, [gameState]);

  useEffect(() => {
    setCanvasState((prev) => ({ ...prev, currentColor: defaultColor }));
  }, [defaultColor]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 60;

      const scaleWidth = containerWidth / BASE_WIDTH;
      const scaleHeight = containerHeight / BASE_HEIGHT;
      const scale = Math.min(scaleWidth, scaleHeight);

      setCanvasState((prev) => ({
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
          onMouseDown={handleInteractionStart}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
        />
      </div>

      <div className="w-full bg-white/90 backdrop-blur-sm p-2 rounded-lg mt-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
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
            className="w-10 h-10"
            disabled={isDisabled}
          />

          {["brush", "fill", "eraser"].map((tool) => (
            <ToolButton
              key={tool}
              active={canvasState.currentTool === tool}
              disabled={isDisabled}
              onClick={() =>
                setCanvasState((prev) => ({ ...prev, currentTool: tool }))
              }
            >
              {tool.charAt(0).toUpperCase() + tool.slice(1)}
            </ToolButton>
          ))}

          <button
            onClick={undo}
            disabled={canvasState.historyIndex <= 0 || isDisabled}
            className="px-4 py-2 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={
              canvasState.historyIndex >= canvasState.history.length - 1 ||
              isDisabled
            }
            className="px-4 py-2 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 disabled:opacity-50"
          >
            Redo
          </button>

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
            />
            <span className="text-xs w-4">{canvasState.brushSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas;
