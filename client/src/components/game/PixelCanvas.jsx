import { useRef, useState, useEffect } from "react";

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
  const [history, setHistory] = useState([]);
  const [redoStates, setRedoStates] = useState([]);
  const [startPos, setStartPos] = useState(null);
  
  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 700; // Reduced width
  const CANVAS_HEIGHT = 500; // Reduced height

  const drawPixel = (ctx, x, y, color) => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    
    if (gridX >= 0 && gridX < CANVAS_WIDTH / GRID_SIZE && 
        gridY >= 0 && gridY < CANVAS_HEIGHT / GRID_SIZE) {
      ctx.fillStyle = currentTool === "eraser" ? "#ffffff" : color;
      ctx.fillRect(gridX * GRID_SIZE, gridY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    setHistory([...history, canvas.toDataURL()]);
    setRedoStates([]); // Clear redo states when new action is performed
  };

  const drawLine = (ctx, start, end) => {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const steps = Math.max(dx, dy);
    
    for (let i = 0; i <= steps; i++) {
      const x = start.x + (end.x - start.x) * (i / steps);
      const y = start.y + (end.y - start.y) * (i / steps);
      drawPixel(ctx, x, y, currentColor);
    }
  };

  const getPixelColor = (ctx, x, y) => {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return `#${[...pixel.slice(0, 3)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  };

  const floodFill = (ctx, startX, startY, fillColor) => {
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const pixels = imageData.data;
    
    const startPos = (Math.floor(startY / GRID_SIZE) * GRID_SIZE * CANVAS_WIDTH + Math.floor(startX / GRID_SIZE) * GRID_SIZE) * 4;
    const targetColor = getPixelColor(ctx, Math.floor(startX / GRID_SIZE) * GRID_SIZE, Math.floor(startY / GRID_SIZE) * GRID_SIZE);
    
    if (targetColor === fillColor) return;

    const fillPixel = (x, y) => {
      ctx.fillStyle = fillColor;
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    };

    const stack = [[Math.floor(startX / GRID_SIZE), Math.floor(startY / GRID_SIZE)]];
    const visited = new Set();

    while (stack.length) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= CANVAS_WIDTH / GRID_SIZE || y < 0 || y >= CANVAS_HEIGHT / GRID_SIZE) continue;
      if (getPixelColor(ctx, x * GRID_SIZE, y * GRID_SIZE) !== targetColor) continue;

      visited.add(key);
      fillPixel(x, y);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
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

    if (currentTool === "fill") {
      saveState();
      floodFill(ctx, x, y, currentColor);
      setIsDrawing(false);
    } else if (currentTool === "line" && startPos) {
      const prevImg = new Image();
      prevImg.src = history[history.length - 1];
      prevImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(prevImg, 0, 0);
        drawLine(ctx, startPos, { x, y });
      };
    } else {
      drawPixel(ctx, x, y, currentColor);
    }
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    if (currentTool === "line") {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      setStartPos({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      });
      saveState();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentTool !== "line") {
      saveState();
    }
    setStartPos(null);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  return (
    <div id="canvas" className="flex flex-col items-center gap-4 w-full h-full p-4 bg-white/90 rounded-lg">
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleDraw}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {isDrawer && (
        <div className="flex items-center gap-4 bg-white/50 p-3 rounded-lg">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
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
              active={currentTool === "line"}
              onClick={() => setCurrentTool("line")}
            >
              Line
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
