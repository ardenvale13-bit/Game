import { useRef, useEffect, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import type { DrawCommand } from '../store/gameStore';

const BRUSH_SIZES = [2, 5, 10, 18, 28, 40];

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#808080', '#4B3621',
  '#EF4444', '#FF6B6B', '#F97316', '#EAB308',
  '#22C55E', '#15803D', '#3B82F6', '#1D4ED8',
  '#8B5CF6', '#EC4899', '#F472B6', '#78716C',
];

interface CanvasState {
  imageData: ImageData | null;
}

interface DrawingCanvasProps {
  onDrawBroadcast?: (cmd: DrawCommand) => void;
  onClearBroadcast?: () => void;
  onSnapshotBroadcast?: (dataUrl: string) => void;
}

export default function DrawingCanvas({ onDrawBroadcast, onClearBroadcast, onSnapshotBroadcast }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(10);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Replay state for non-drawers
  const replayLastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastRenderedRef = useRef(0);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<CanvasState[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasState[]>([]);
  const maxHistorySize = 50;

  const {
    phase,
    drawCommands,
    canvasSnapshot,
    addDrawCommand,
    clearCanvas,
    isCurrentPlayerDrawing,
  } = useGameStore();

  const canDraw = isCurrentPlayerDrawing() && phase === 'drawing';

  // Get canvas display dimensions
  const getCanvasRect = () => containerRef.current?.getBoundingClientRect() || null;

  // --- SNAPSHOT: render canvas snapshot from undo/redo sync ---
  useEffect(() => {
    if (canDraw || !canvasSnapshot) return; // Only for non-drawers

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      // Reset transform to draw at pixel level then restore
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Clear the snapshot so it doesn't re-trigger
      useGameStore.setState({ canvasSnapshot: null });
    };
    img.src = canvasSnapshot;
  }, [canvasSnapshot, canDraw]);

  // Clear canvas and reset replay on new round
  useEffect(() => {
    if (phase === 'word-selection') {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const ctx = canvas.getContext('2d');
        const rect = container.getBoundingClientRect();
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, rect.width, rect.height);
        }
      }
      lastRenderedRef.current = 0;
      replayLastPosRef.current = null;
      // Clear the store draw commands for non-host
      useGameStore.setState({ drawCommands: [] });
    }
  }, [phase]);

  // --- REPLAY: render incoming draw commands for non-drawers ---
  useEffect(() => {
    if (canDraw) return; // Drawer draws directly, skip replay

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    if (drawCommands.length <= lastRenderedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();

    for (let i = lastRenderedRef.current; i < drawCommands.length; i++) {
      const cmd = drawCommands[i];

      if (cmd.type === 'clear') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);
        replayLastPosRef.current = null;
      } else if (cmd.type === 'start') {
        if (cmd.size === 0 && cmd.color) {
          // Fill command — denormalize coords
          floodFill((cmd.x ?? 0) * rect.width, (cmd.y ?? 0) * rect.height, cmd.color);
        } else {
          // Start a stroke — denormalize coords
          const x = (cmd.x ?? 0) * rect.width;
          const y = (cmd.y ?? 0) * rect.height;
          replayLastPosRef.current = { x, y };

          ctx.strokeStyle = cmd.color || '#000000';
          ctx.lineWidth = cmd.size || 10;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Draw dot at start
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      } else if (cmd.type === 'draw') {
        if (replayLastPosRef.current) {
          const x = (cmd.x ?? 0) * rect.width;
          const y = (cmd.y ?? 0) * rect.height;
          ctx.beginPath();
          ctx.moveTo(replayLastPosRef.current.x, replayLastPosRef.current.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          replayLastPosRef.current = { x, y };
        }
      } else if (cmd.type === 'end') {
        replayLastPosRef.current = null;
      }
    }

    lastRenderedRef.current = drawCommands.length;
  }, [drawCommands.length, canDraw]);

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

  // Broadcast canvas snapshot after undo/redo so other players see the change
  const broadcastCanvasSnapshot = useCallback(() => {
    if (!onSnapshotBroadcast) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Use low-quality JPEG to reduce payload size
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    onSnapshotBroadcast(dataUrl);
  }, [onSnapshotBroadcast]);

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

    // Sync the undo visually to other players
    broadcastCanvasSnapshot();
  }, [undoStack, canDraw, broadcastCanvasSnapshot]);

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

    // Sync the redo visually to other players
    broadcastCanvasSnapshot();
  }, [redoStack, canDraw, broadcastCanvasSnapshot]);

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

  // Persistent bitmap ref — survives across resize calls so rotation never loses the drawing
  const savedBitmapRef = useRef<HTMLCanvasElement | null>(null);

  // Set up canvas dimensions using ResizeObserver for reliable resize/rotation handling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let rafId: number | null = null;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      // Skip if container has no size yet (hidden or mid-layout)
      if (rect.width < 2 || rect.height < 2) return;

      const dpr = window.devicePixelRatio || 1;
      const newW = Math.round(rect.width * dpr);
      const newH = Math.round(rect.height * dpr);

      // Skip if canvas is already the correct size
      if (canvas.width === newW && canvas.height === newH) return;

      // Save current drawing to persistent bitmap ref (only if canvas has content)
      if (canvas.width > 0 && canvas.height > 0) {
        const saveBitmap = document.createElement('canvas');
        saveBitmap.width = canvas.width;
        saveBitmap.height = canvas.height;
        const tmpCtx = saveBitmap.getContext('2d');
        if (tmpCtx) {
          tmpCtx.drawImage(canvas, 0, 0);
          savedBitmapRef.current = saveBitmap;
        }
      }

      const oldWidth = canvas.width;
      const oldHeight = canvas.height;

      // Resize the canvas
      canvas.width = newW;
      canvas.height = newH;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const newCtx = canvas.getContext('2d');
      if (newCtx) {
        newCtx.scale(dpr, dpr);
        newCtx.lineCap = 'round';
        newCtx.lineJoin = 'round';

        // Fill white background
        newCtx.fillStyle = '#FFFFFF';
        newCtx.fillRect(0, 0, rect.width, rect.height);

        // Restore drawing from persistent bitmap, scaled to new dimensions
        const bitmap = savedBitmapRef.current;
        if (bitmap && bitmap.width > 0 && bitmap.height > 0 && oldWidth > 0 && oldHeight > 0) {
          newCtx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, rect.width, rect.height);
        }
      }
    };

    // Use rAF to batch with the browser's paint cycle — no debounce delay
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(resizeCanvas);
    };

    // Initial sizing (immediate, no rAF needed)
    resizeCanvas();

    // ResizeObserver fires when the container actually changes dimensions
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
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

  // Draw on canvas (local drawing for the drawer)
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

    const rect = getCanvasRect();

    saveToHistory();

    // Fill tool
    if (tool === 'fill') {
      floodFill(pos.x, pos.y, currentColor);
      addDrawCommand({
        type: 'start',
        x: pos.x,
        y: pos.y,
        color: currentColor,
        size: 0,
      });
      // Broadcast normalized fill command
      if (onDrawBroadcast && rect) {
        onDrawBroadcast({
          type: 'start',
          x: pos.x / rect.width,
          y: pos.y / rect.height,
          color: currentColor,
          size: 0,
        });
      }
      return;
    }

    setIsDrawing(true);
    lastPosRef.current = pos;
    draw(pos, pos);

    const color = tool === 'eraser' ? '#FFFFFF' : currentColor;
    const size = tool === 'eraser' ? brushSize * 2 : brushSize;

    addDrawCommand({
      type: 'start',
      x: pos.x,
      y: pos.y,
      color,
      size,
    });

    // Broadcast normalized
    if (onDrawBroadcast && rect) {
      onDrawBroadcast({
        type: 'start',
        x: pos.x / rect.width,
        y: pos.y / rect.height,
        color,
        size,
      });
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw || !isDrawing || !lastPosRef.current) return;
    e.preventDefault();

    const pos = getPosition(e);
    if (!pos) return;

    const rect = getCanvasRect();

    draw(lastPosRef.current, pos);

    addDrawCommand({
      type: 'draw',
      x: pos.x,
      y: pos.y,
    });

    // Broadcast normalized
    if (onDrawBroadcast && rect) {
      onDrawBroadcast({
        type: 'draw',
        x: pos.x / rect.width,
        y: pos.y / rect.height,
      });
    }

    lastPosRef.current = pos;
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;
    addDrawCommand({ type: 'end' });
    onDrawBroadcast?.({ type: 'end' });
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
    onClearBroadcast?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Canvas */}
      <div
        ref={containerRef}
        className="canvas-container"
        style={{
          flex: 1,
          minHeight: 0,
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
              <img src="/palette-icon.png" alt="" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                Waiting for word selection...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tools - Only show for drawer */}
      {canDraw && (
        <div className="tools-bar" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {/* Undo / Redo */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="tool-btn"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              style={{ opacity: undoStack.length === 0 ? 0.4 : 1 }}
            >
              <img src="/undo.png" alt="Undo" style={{ width: '20px', height: '20px' }} />
            </button>
            <button
              className="tool-btn"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              style={{ opacity: redoStack.length === 0 ? 0.4 : 1 }}
            >
              <img src="/redo.png" alt="Redo" style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(0, 240, 255, 0.2)' }} />

          {/* Tool selection */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`tool-btn ${tool === 'brush' ? 'active' : ''}`}
              onClick={() => setTool('brush')}
              title="Pencil"
              style={{ padding: '6px' }}
            >
              <img src="/pencil.png" alt="Pencil" style={{ width: '48px', height: '48px' }} />
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
              style={{ padding: '6px' }}
            >
              <img src="/eraser.png" alt="Eraser" style={{ width: '48px', height: '48px' }} />
            </button>
            <button
              className={`tool-btn ${tool === 'fill' ? 'active' : ''}`}
              onClick={() => setTool('fill')}
              title="Fill"
              style={{ padding: '6px' }}
            >
              <img src="/bucket.png" alt="Fill" style={{ width: '48px', height: '48px' }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px', maxWidth: '220px' }}>
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
                    width: '24px',
                    height: '24px',
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

          {/* Brush sizes */}
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

          {/* Clear button */}
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
