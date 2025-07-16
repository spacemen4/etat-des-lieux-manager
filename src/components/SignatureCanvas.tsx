import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eraser, Save, RotateCcw } from 'lucide-react';
import { debounce } from 'lodash';

interface SignatureCanvasProps {
  onSignatureSave: (signatureData: string) => void;
  initialSignature?: string;
  title?: string;
  autoSave?: boolean;
  debounceTime?: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureSave,
  initialSignature,
  title = "Signature",
  autoSave = false,
  debounceTime = 1000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Debounced save function
  const debouncedSave = debounce((dataURL: string) => {
    onSignatureSave(dataURL);
  }, debounceTime);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setIsEmpty(false);
      };
      img.src = initialSignature;
    } else {
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, [initialSignature]);

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getPointFromEvent(e);
    setIsDrawing(true);
    setLastPoint(point);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const currentPoint = getPointFromEvent(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    setLastPoint(currentPoint);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
    if (autoSave) {
      saveSignature();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setIsEmpty(true);
    if (autoSave) {
      debouncedSave(''); // Save empty signature
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isEmpty) {
      if (autoSave) debouncedSave('');
      return;
    }

    const dataURL = canvas.toDataURL('image/png');
    if (autoSave) {
      debouncedSave(dataURL);
    } else {
      onSignatureSave(dataURL);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={isEmpty}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Effacer
            </Button>
            {!autoSave && (
              <Button
                variant="default"
                size="sm"
                onClick={saveSignature}
                disabled={isEmpty}
              >
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-48 cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-500 text-sm">Signez ici avec votre doigt ou stylet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};