import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const PixelCanvas = ({ isDrawer, gameState, defaultColor }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(defaultColor || "#000000");
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(1);
  const GRID_SIZE = 16;
  // Reduce base dimensions to 800x600 (4:3 ratio)
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;
  const [canvasSize, setCanvasSize] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });

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

    // Create checkerboard pattern
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
    // Clear canvas when game state changes to 'playing'
    if (gameState === "playing") {
      clearCanvas();
    }
  }, [gameState]);

  useEffect(() => {
    // Update color when defaultColor changes
    setCurrentColor(defaultColor);
  }, [defaultColor]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 60; // Space for tools

      // Calculate scale based on container dimensions while maintaining 4:3 ratio
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
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;

    // Get coordinates whether it's touch or mouse event
    const clientX = e.clientX || e.pageX;
    const clientY = e.clientY || e.pageY;

    const centerX = Math.floor(((clientX - rect.left) * scale) / GRID_SIZE);
    const centerY = Math.floor(((clientY - rect.top) * scale) / GRID_SIZE);

    const size = isErasing ? Math.max(brushSize, 1) : brushSize;
    const offset = Math.floor(size / 2);

    for (let y = -offset; y <= offset; y++) {
      for (let x = -offset; x <= offset; x++) {
        const currentX = centerX + x;
        const currentY = centerY + y;
        const index = currentY * (canvas.width / GRID_SIZE) + currentX;

        if (
          currentX >= 0 &&
          currentX < canvas.width / GRID_SIZE &&
          currentY >= 0 &&
          currentY < canvas.height / GRID_SIZE
        ) {
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = isErasing ? "#FFFFFF" : currentColor;
          ctx.fillRect(
            currentX * GRID_SIZE,
            currentY * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE
          );
          socket.emit("draw", {
            index,
            color: isErasing ? "#FFFFFF" : currentColor,
          });
        }
      }
    }
  };

  const handleColorChange = (e) => {
    setCurrentColor(e.target.value);
    setIsErasing(false);
  };

  return (
    <div ref={containerRef} className="relative h-full flex flex-col items-center justify-center max-w-[900px] mx-auto">
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
            onClick={() => setIsErasing(!isErasing)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors
              ${
                isErasing
                  ? "bg-indigo-600 dark:bg-indigo-700 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
              }
              ${
                !isDrawer && gameState === "playing"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-indigo-100 dark:hover:bg-indigo-900"
              }`}
            disabled={!isDrawer && gameState === "playing"}
          >
            Eraser
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
