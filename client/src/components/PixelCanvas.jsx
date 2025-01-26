import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const PixelCanvas = ({ isDrawer, gameState, defaultColor }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(defaultColor);
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(1);
  const ERASER_SIZE = 3; // This means 3x3 pixels
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 640 });

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleDraw = (data) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = data.color;
      const x = (data.index % 100) * 8;
      const y = Math.floor(data.index / 100) * 8;
      ctx.fillRect(x, y, 8, 8);
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
      const container = canvasRef.current?.parentElement;
      if (!container) return;

      // Calculate size based on screen width
      const screenWidth = window.innerWidth;
      const padding = screenWidth < 640 ? 16 : 32; // Less padding on mobile
      const maxWidth = Math.min(container.clientWidth - padding, 800);
      const scale = maxWidth / 800;

      setCanvasSize({
        width: maxWidth,
        height: Math.floor(640 * scale),
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
    const scale = 800 / rect.width; // Calculate actual scale

    // Get coordinates whether it's touch or mouse event
    const clientX = e.clientX || e.pageX;
    const clientY = e.clientY || e.pageY;

    const centerX = Math.floor(((clientX - rect.left) * scale) / 8);
    const centerY = Math.floor(((clientY - rect.top) * scale) / 8);

    const size = isErasing ? Math.max(brushSize, 3) : brushSize;
    const offset = Math.floor(size / 2);

    for (let y = -offset; y <= offset; y++) {
      for (let x = -offset; x <= offset; x++) {
        const currentX = centerX + x;
        const currentY = centerY + y;
        const index = currentY * 100 + currentX;

        if (currentX >= 0 && currentX < 100 && currentY >= 0 && currentY < 80) {
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = isErasing ? "#FFFFFF" : currentColor;
          ctx.fillRect(currentX * 8, currentY * 8, 8, 8);
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
    <div className="relative w-full max-w-[800px] mx-auto px-2 sm:px-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={640}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          touchAction: "none",
        }}
        className={`game-canvas ${
          isDrawer && gameState === "playing"
            ? "canvas-active"
            : "border-indigo-300"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="tools-panel-mobile sm:tools-panel">
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
