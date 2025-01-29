import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const PixelCanvas = ({ isDrawer, gameState, defaultColor }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(defaultColor || "#000000");
  const [brushSize, setBrushSize] = useState(1);
  const GRID_SIZE = 20; //smaller is bigger
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;
  const [canvasSize, setCanvasSize] = useState({
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
  });

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentTool, setCurrentTool] = useState("brush"); // 'brush', 'eraser', 'bucket'

  const getCheckerboardColor = (x, y) => {
    return (Math.floor(x / GRID_SIZE) + Math.floor(y / GRID_SIZE)) % 2 === 0
      ? "#f0f0f0"
      : "#ffffff";
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      socket.emit("canvasState", { imageData: canvas.toDataURL() });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const newIndex = historyIndex + 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      socket.emit("canvasState", { imageData: canvas.toDataURL() });
    }
  };

  // Add helper function to compare colors with tolerance
  const colorsMatch = (color1, color2, tolerance = 1) => {
    return Math.abs(color1[0] - color2[0]) <= tolerance &&
           Math.abs(color1[1] - color2[1]) <= tolerance &&
           Math.abs(color1[2] - color2[2]) <= tolerance;
  };

  const floodFill = (startX, startY, fillColor) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    const gridX = Math.floor(startX / GRID_SIZE);
    const gridY = Math.floor(startY / GRID_SIZE);
    
    // Get the initial color at the clicked position
    const startData = ctx.getImageData(
      gridX * GRID_SIZE,
      gridY * GRID_SIZE,
      1,
      1
    ).data;
    
    // Convert fill color from hex to RGB
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);
    
    // If colors are too similar, no need to fill
    if (colorsMatch([startData[0], startData[1], startData[2]], [fillR, fillG, fillB])) {
      return;
    }
    
    const stack = [[gridX, gridY]];
    const visited = new Set();
    const maxX = Math.floor(canvas.width / GRID_SIZE);
    const maxY = Math.floor(canvas.height / GRID_SIZE);
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= maxX || y < 0 || y >= maxY) continue;
      
      const currentData = ctx.getImageData(x * GRID_SIZE, y * GRID_SIZE, 1, 1).data;
      
      if (colorsMatch([currentData[0], currentData[1], currentData[2]], [startData[0], startData[1], startData[2]])) {
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
    // Save initial state to history
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
    setCurrentColor(defaultColor);
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

      setCanvasSize({
        width: Math.floor(BASE_WIDTH * scale),
        height: Math.floor(BASE_HEIGHT * scale),
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const handleMouseDown = (e) => {
    if (!isDrawer && gameState === "playing") return;
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    draw(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (!isDrawer && gameState === "playing") return;
    setIsDrawing(true);
    const touch = e.touches[0];
    draw(touch);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    draw(touch);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawer && gameState === "playing") return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;

    const clientX = e.clientX || e.pageX;
    const clientY = e.clientY || e.pageY;

    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;

    if (currentTool === "bucket") {
      floodFill(x, y, currentColor);
      return;
    }

    const centerX = Math.floor(((clientX - rect.left) * scale) / GRID_SIZE);
    const centerY = Math.floor(((clientY - rect.top) * scale) / GRID_SIZE);

    const size = currentTool === "eraser" ? Math.max(brushSize, 1) : brushSize;
    const offset = Math.floor(size / 2);

    for (let y = -offset; y <= offset; y++) {
      for (let x = -offset; x <= offset; x++) {
        const currentX = centerX + x;
        const currentY = centerY + y;

        if (
          currentX >= 0 &&
          currentX < canvas.width / GRID_SIZE &&
          currentY >= 0 &&
          currentY < canvas.height / GRID_SIZE
        ) {
          const ctx = canvas.getContext("2d");
          const pixelColor =
            currentTool === "eraser"
              ? getCheckerboardColor(currentX * GRID_SIZE, currentY * GRID_SIZE)
              : currentColor;

          ctx.fillStyle = pixelColor;
          ctx.fillRect(
            currentX * GRID_SIZE,
            currentY * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE
          );

          const index = currentY * (canvas.width / GRID_SIZE) + currentX;
          socket.emit("draw", { index, color: pixelColor });
        }
      }
    }

    // Save history for both initial click and continuous drawing
    if (!isDrawing || currentTool === "bucket") {
      saveToHistory();
    }
  };

  const handleColorChange = (e) => {
    setCurrentColor(e.target.value);
    setCurrentTool("brush"); // Switch to brush when color is changed
  };

  const handleToolChange = (tool) => {
    setCurrentTool(tool);
  };

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
            width: canvasSize.width,
            height: canvasSize.height,
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
      <div className="w-full bg-white/90 backdrop-blur-sm p-2 rounded-lg mt-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="w-10 h-10"
            disabled={!isDrawer && gameState === "playing"}
          />
          <button
            onClick={() => handleToolChange("brush")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors
              ${
                currentTool === "brush"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }
              ${
                !isDrawer && gameState === "playing"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            disabled={!isDrawer && gameState === "playing"}
          >
            Brush
          </button>
          <button
            onClick={() => handleToolChange("bucket")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors
              ${
                currentTool === "bucket"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }
              ${
                !isDrawer && gameState === "playing"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            disabled={!isDrawer && gameState === "playing"}
          >
            Fill
          </button>
          <button
            onClick={() => handleToolChange("eraser")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors
              ${
                currentTool === "eraser"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }
              ${
                !isDrawer && gameState === "playing"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            disabled={!isDrawer && gameState === "playing"}
          >
            Eraser
          </button>
          <button
            onClick={undo}
            disabled={
              historyIndex <= 0 || (!isDrawer && gameState === "playing")
            }
            className="px-4 py-2 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={
              historyIndex >= history.length - 1 ||
              (!isDrawer && gameState === "playing")
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
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-16 sm:w-20"
              disabled={!isDrawer && gameState === "playing"}
            />
            <span className="text-xs w-4">{brushSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas;
