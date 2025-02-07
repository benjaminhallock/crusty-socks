import { useRef, useState } from "react";

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
  const [currentTool, setCurrentTool] = useState("brush");
  
  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const drawPixel = (ctx, x, y, color) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    if (gridX >= 0 && gridX < CANVAS_WIDTH / GRID_SIZE && 
        gridY >= 0 && gridY < CANVAS_HEIGHT / GRID_SIZE) {
      ctx.fillStyle = currentTool === "eraser" ? "#ffffff" : color;
      ctx.fillRect(gridX * GRID_SIZE, gridY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
  };

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
        className={`border-2 rounded-lg bg-white/100 ${
          isDrawer ? "border-indigo-800 cursor-crosshair" : "border-gray-200"
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
