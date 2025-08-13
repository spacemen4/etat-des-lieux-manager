import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eraser, Save, RotateCcw, PenTool } from 'lucide-react';
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
    <Card className="glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden animate-fade-in">
      <CardHeader className="gradient-primary text-white p-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <PenTool className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">{title}</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={isEmpty}
              className="bg-red-500/90 border-red-400 text-white hover:bg-red-600 hover:border-red-500 disabled:bg-gray-500/50 disabled:border-gray-400/50 disabled:text-gray-300 transition-all duration-300 shadow-lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Effacer
            </Button>
            {!autoSave && (
              <Button
                variant="default"
                size="sm"
                onClick={saveSignature}
                disabled={isEmpty}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-300 micro-bounce"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative glass-light border-2 border-dashed border-white/30 rounded-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-48 cursor-crosshair touch-none transition-all duration-300 hover:bg-white/90"
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
              <div className="text-center">
                <PenTool className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-float" />
                <p className="text-slate-500 text-sm font-medium">Signez ici avec votre doigt ou stylet</p>
                <p className="text-slate-400 text-xs mt-1">Votre signature sera enregistrée automatiquement</p>
              </div>
            </div>
          )}
          {!isEmpty && (
            <div className="absolute top-2 right-2">
              <div className="glass-light px-2 py-1 rounded-lg backdrop-blur-sm">
                <span className="text-xs text-slate-600 font-medium">✓ Signé</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};