import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const PixelCanvas = ({ isDrawer, gameState, defaultColor }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(defaultColor);
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(1);
  const ERASER_SIZE = 3; // This means 3x3 pixels

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#FFFFFF';
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

  const draw = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const centerX = Math.floor((e.clientX - rect.left) / 8);
    const centerY = Math.floor((e.clientY - rect.top) / 8);

    const size = isErasing ? Math.max(brushSize, 3) : brushSize;
    const offset = Math.floor(size / 2);
    
    for (let y = -offset; y <= offset; y++) {
      for (let x = -offset; x <= offset; x++) {
        const currentX = centerX + x;
        const currentY = centerY + y;
        const index = currentY * 100 + currentX;

        if (currentX >= 0 && currentX < 100 && currentY >= 0 && currentY < 80) {
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = isErasing ? '#FFFFFF' : currentColor;
          ctx.fillRect(currentX * 8, currentY * 8, 8, 8);
          socket.emit("draw", { 
            index, 
            color: isErasing ? '#FFFFFF' : currentColor 
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
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={640}
        className={`border-4 rounded-lg cursor-crosshair ${
          isDrawer && gameState === "playing"
            ? "border-indigo-400 shadow-lg shadow-indigo-200 animate-[pulse_3s_ease-in-out_infinite]"
            : "border-indigo-300"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-lg backdrop-blur-sm flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className={`w-8 h-8 cursor-pointer ${
              !isDrawer && gameState === "playing" ? "opacity-50" : ""
            }`}
            disabled={!isDrawer && gameState === "playing"}
          />
          <button
            onClick={() => setIsErasing(!isErasing)}
            className={`px-2 py-1 rounded ${
              isErasing 
                ? "bg-indigo-500 text-white" 
                : "bg-gray-200"
            } ${!isDrawer && gameState === "playing" ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={(!isDrawer && gameState === "playing")}
          >
            Eraser
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Size:</span>
          <input
            type="range"
            min="1"
            max="5"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20"
            disabled={!isDrawer && gameState === "playing"}
          />
          <span className="text-xs w-4">{brushSize}</span>
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas;
