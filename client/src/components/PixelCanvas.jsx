import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';

const PixelCanvas = ({ isDrawer, gameState }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    socket.on('drawUpdate', (data) => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = data.color;
      const x = (data.index % 100) * 8;
      const y = Math.floor(data.index / 100) * 8;
      ctx.fillRect(x, y, 8, 8);
    });

    socket.on('clearCanvas', () => {
      clearCanvas();
    });

    return () => {
      socket.off('drawUpdate');
      socket.off('clearCanvas');
    };
  }, []);

  useEffect(() => {
    // Clear canvas when game state changes to 'playing'
    if (gameState === 'playing') {
      clearCanvas();
    }
  }, [gameState]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleMouseDown = (e) => {
    if (!isDrawer && gameState === 'playing') return;
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
    const x = Math.floor((e.clientX - rect.left) / 8);
    const y = Math.floor((e.clientY - rect.top) / 8);
    const index = y * 100 + x;

    if (x >= 0 && x < 100 && y >= 0 && y < 80) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = isErasing ? '#FFFFFF' : currentColor;
      ctx.fillRect(x * 8, y * 8, 8, 8);
      
      socket.emit('draw', {
        index,
        color: isErasing ? '#FFFFFF' : currentColor
      });
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={640}
        className="border-4 border-indigo-300 rounded-lg cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isDrawer && gameState === 'playing' && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow flex gap-2">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 cursor-pointer"
          />
          <button
            onClick={() => setIsErasing(!isErasing)}
            className={`px-2 py-1 rounded ${
              isErasing ? 'bg-indigo-500 text-white' : 'bg-gray-200'
            }`}
          >
            Eraser
          </button>
          <button
            onClick={() => {
              clearCanvas();
              socket.emit('clearCanvas');
            }}
            className="px-2 py-1 rounded bg-red-500 text-white"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
