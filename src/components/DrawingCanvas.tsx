import { useRef, useEffect, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore';

const BRUSH_SIZES = [2, 5, 10, 18, 28, 40];

// Quick color presets (in addition to the hex picker)
const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#78716C',
];

interface CanvasState {
  imageData: ImageData | null;
}

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(10);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<CanvasState[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasState[]>([]);
  const maxHistorySize = 50;

  const {
    phase,
    addDrawCommand,
    clearCanvas,
    isCurrentPlayerDrawing,
  } = useGameStore();

  const canDraw = isCurrentPlayerDrawing() && phase === 'drawing';

  // Save current canvas state to undo stack
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    setUndoStack(prev => {
      const newStack = [...prev, { imageData }];
      if (newStack.length > maxHistorySize) {
        newStack.shift();
      }
      return newStack;
    });
    
    setRedoStack([]);
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !canDraw) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoStack(prev => [...prev, { imageData: currentImageData }]);
    
    const newUndoStack = [...undoStack];
    const previousState = newUndoStack.pop();
    setUndoStack(newUndoStack);
    
    if (previousState?.imageData) {
      ctx.putImageData(previousState.imageData, 0, 0);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [undoStack, canDraw]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !canDraw) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev, { imageData: currentImageData }]);
    
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop();
    setRedoStack(newRedoStack);
    
    if (nextState?.imageData) {
      ctx.putImageData(nextState.imageData, 0, 0);
    }
  }, [redoStack, canDraw]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canDraw) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canDraw, handleUndo, handleRedo]);

  // Set up canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const ctx = canvas.getContext('2d');
      let savedImage: ImageData | null = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        savedImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const newCtx = canvas.getContext('2d');
      if (newCtx) {
        newCtx.scale(dpr, dpr);
        newCtx.lineCap = 'round';
        newCtx.lineJoin = 'round';
        
        newCtx.fillStyle = '#FFFFFF';
        newCtx.fillRect(0, 0, rect.width, rect.height);
        
        if (savedImage) {
          newCtx.putImageData(savedImage, 0, 0);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Get position from mouse/touch event
  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Flood fill algorithm
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const x = Math.floor(startX * dpr);
    const y = Math.floor(startY * dpr);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Convert hex to RGB
    const hex = fillColor.replace('#', '');
    const fillR = parseInt(hex.substring(0, 2), 16);
    const fillG = parseInt(hex.substring(2, 4), 16);
    const fillB = parseInt(hex.substring(4, 6), 16);

    // Get target color at click position
    const startIdx = (y * width + x) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    // Don't fill if clicking on same color
    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const colorMatch = (idx: number) => {
      return Math.abs(data[idx] - targetR) < 10 &&
             Math.abs(data[idx + 1] - targetG) < 10 &&
             Math.abs(data[idx + 2] - targetB) < 10 &&
             Math.abs(data[idx + 3] - targetA) < 10;
    };

    const setPixel = (idx: number) => {
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = 255;
    };

    const stack: [number, number][] = [[x, y]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      
      if (visited.has(key)) continue;
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
      
      const idx = (cy * width + cx) * 4;
      if (!colorMatch(idx)) continue;
      
      visited.add(key);
      setPixel(idx);

      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Draw on canvas
  const draw = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : currentColor;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  // Drawing handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    e.preventDefault();

    const pos = getPosition(e);
    if (!pos) return;

    saveToHistory();

    // Fill tool - just fill and return
    if (tool === 'fill') {
      floodFill(pos.x, pos.y, currentColor);
      addDrawCommand({
        type: 'start',
        x: pos.x,
        y: pos.y,
        color: currentColor,
        size: 0, // Indicates fill
      });
      return;
    }

    setIsDrawing(true);
    lastPosRef.current = pos;
    draw(pos, pos);

    addDrawCommand({
      type: 'start',
      x: pos.x,
      y: pos.y,
      color: tool === 'eraser' ? '#FFFFFF' : currentColor,
      size: tool === 'eraser' ? brushSize * 2 : brushSize,
    });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw || !isDrawing || !lastPosRef.current) return;
    e.preventDefault();

    const pos = getPosition(e);
    if (!pos) return;

    draw(lastPosRef.current, pos);

    addDrawCommand({
      type: 'draw',
      x: pos.x,
      y: pos.y,
    });

    lastPosRef.current = pos;
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;
    addDrawCommand({ type: 'end' });
  };

  const handleClear = () => {
    if (!canDraw) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    saveToHistory();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    clearCanvas();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
      {/* Canvas */}
      <div 
        ref={containerRef}
        className="canvas-container"
        style={{ 
          flex: 1, 
          minHeight: '400px',
          cursor: canDraw 
            ? tool === 'eraser' ? 'cell' 
            : tool === 'fill' ? 'pointer' 
            : 'crosshair' 
            : 'default',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ touchAction: 'none' }}
        />

        {phase === 'word-selection' && !isCurrentPlayerDrawing() && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 10, 20, 0.85)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎨</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                Waiting for word selection...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tools - Only show for drawer */}
      {canDraw && (
        <div className="tools-bar" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Undo / Redo */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="tool-btn"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              style={{ opacity: undoStack.length === 0 ? 0.4 : 1 }}
            >
              ↩️
            </button>
            <button
              className="tool-btn"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              style={{ opacity: redoStack.length === 0 ? 0.4 : 1 }}
            >
              ↪️
            </button>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(0, 240, 255, 0.2)' }} />

          {/* Tool selection - custom icons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`tool-btn ${tool === 'brush' ? 'active' : ''}`}
              onClick={() => setTool('brush')}
              title="Pencil"
              style={{ padding: '6px' }}
            >
              <img src="/pencil.png" alt="Pencil" style={{ width: '24px', height: '24px' }} />
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
              style={{ padding: '6px' }}
            >
              <img src="/eraser.png" alt="Eraser" style={{ width: '24px', height: '24px' }} />
            </button>
            <button
              className={`tool-btn ${tool === 'fill' ? 'active' : ''}`}
              onClick={() => setTool('fill')}
              title="Fill"
              style={{ padding: '6px' }}
            >
              <img src="/bucket.png" alt="Fill" style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(0, 240, 255, 0.2)' }} />

          {/* Color picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label 
              style={{ 
                position: 'relative',
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: tool === 'brush' ? `0 0 12px ${currentColor}` : 'none',
              }}
            >
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  setCurrentColor(e.target.value);
                  setTool('brush');
                }}
                style={{
                  position: 'absolute',
                  width: '150%',
                  height: '150%',
                  top: '-25%',
                  left: '-25%',
                  cursor: 'pointer',
                  border: 'none',
                }}
              />
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: currentColor,
                  pointerEvents: 'none',
                }} 
              />
            </label>
            
            {/* Quick color presets */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  style={{ 
                    backgroundColor: color, 
                    border: currentColor === color && tool === 'brush' 
                      ? '3px solid white' 
                      : color === '#FFFFFF' 
                        ? '2px solid #444' 
                        : '2px solid transparent',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: currentColor === color && tool === 'brush' 
                      ? '0 0 8px rgba(255,255,255,0.6)' 
                      : 'none',
                  }}
                  onClick={() => { 
                    setCurrentColor(color); 
                    setTool('brush'); 
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(0, 240, 255, 0.2)' }} />

          {/* Brush sizes - dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                className={`tool-btn ${brushSize === size ? 'active' : ''}`}
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setBrushSize(size)}
                title={`${size}px`}
              >
                <div 
                  style={{ 
                    width: `${Math.min(size, 24)}px`, 
                    height: `${Math.min(size, 24)}px`, 
                    borderRadius: '50%',
                    backgroundColor: brushSize === size ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }} 
                />
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(0, 240, 255, 0.2)' }} />

          {/* Clear button - trash icon */}
          <button
            className="tool-btn"
            onClick={handleClear}
            title="Clear canvas"
            style={{ background: 'var(--accent-secondary)' }}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
