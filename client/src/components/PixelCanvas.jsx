import { useEffect, useRef, useState } from "react";
import { socketManager } from "../services/socket";

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

const PixelCanvas = ({ isDrawer = true }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentTool, setCurrentTool] = useState("brush"); // "brush" or "eraser"
  
  // Constants
  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const ERASER_SIZE = 2; // This will create a 2x2 eraser

  // Drawing helper
  const drawPixel = (ctx, x, y, color) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    const drawSinglePixel = (gX, gY, c) => {
      if (gX >= 0 && gX < CANVAS_WIDTH / GRID_SIZE && 
          gY >= 0 && gY < CANVAS_HEIGHT / GRID_SIZE) {
        ctx.fillStyle = c;
        ctx.fillRect(gX * GRID_SIZE, gY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        
        socketManager.socket?.emit("draw", { 
          index: gY * (CANVAS_WIDTH / GRID_SIZE) + gX, 
          color: c 
        });
      }
    };

    if (currentTool === "eraser") {
      // Draw multiple pixels for eraser
      for (let i = 0; i < ERASER_SIZE; i++) {
        for (let j = 0; j < ERASER_SIZE; j++) {
          const checkerColor = ((gridX + i + gridY + j) % 2 === 0) ? "#f0f0f0" : "#ffffff";
          drawSinglePixel(gridX + i, gridY + j, checkerColor);
        }
      }
    } else {
      drawSinglePixel(gridX, gridY, color);
    }
  };

  // Drawing handlers
  const handleDraw = (e) => {
    if (!isDrawing || !isDrawer) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    drawPixel(ctx, x, y, currentColor);
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Draw initial checkerboard
    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
      for (let x = 0; x < canvas.width; x += GRID_SIZE) {
        ctx.fillStyle = (x / GRID_SIZE + y / GRID_SIZE) % 2 === 0 
          ? "#f0f0f0" 
          : "#ffffff";
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
      }
    }

    // Handle remote drawing updates
    // socketManager.socket?.on("drawUpdate", ({ index, color }) => {
    //   const x = (index % (canvas.width / GRID_SIZE)) * GRID_SIZE;
    //   const y = Math.floor(index / (canvas.width / GRID_SIZE)) * GRID_SIZE;
    //   ctx.fillStyle = color;
    //   ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    // });

    return () => {
      // socketManager.socket?.off("drawUpdate");
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full p-4 bg-white/90 rounded-lg">
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
        className={`border-2 rounded-lg ${
          isDrawer ? "border-indigo-500 cursor-crosshair" : "border-gray-200"
        }`}
        onMouseDown={() => setIsDrawing(true)}
        onMouseMove={handleDraw}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
      />
      
      {isDrawer && (
        <div className="flex items-center gap-4 bg-white/50 p-3 rounded-lg">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => {
              setCurrentColor(e.target.value);
              setCurrentTool("brush");
            }}
            className="w-10 h-10 rounded cursor-pointer"
            title="Choose color"
          />
          <div className="flex gap-2">
            <ToolButton
              active={currentTool === "brush"}
              onClick={() => setCurrentTool("brush")}
            >
              Brush
            </ToolButton>
            <ToolButton
              active={currentTool === "eraser"}
              onClick={() => setCurrentTool("eraser")}
            >
              Eraser
            </ToolButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
