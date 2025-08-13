import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eraser, Save, RotateCcw, PenTool, Upload, Camera, User, MapPin, Calendar } from 'lucide-react';
import { debounce } from 'lodash';

export interface EidasSignatureData {
  signature: string;
  nom: string;
  lieu: string;
  lu_approuve: boolean;
  photo_identite?: string;
  date: string;
}

interface EidasSignatureCanvasProps {
  onSignatureSave: (signatureData: EidasSignatureData) => void;
  initialSignature?: Partial<EidasSignatureData>;
  title?: string;
  autoSave?: boolean;
  debounceTime?: number;
  required?: boolean;
}

export const EidasSignatureCanvas: React.FC<EidasSignatureCanvasProps> = ({
  onSignatureSave,
  initialSignature,
  title = "Signature",
  autoSave = false,
  debounceTime = 1000,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Form state
  const [nom, setNom] = useState(initialSignature?.nom || '');
  const [lieu, setLieu] = useState(initialSignature?.lieu || '');
  const [luApprouve, setLuApprouve] = useState(initialSignature?.lu_approuve || false);
  const [photoIdentite, setPhotoIdentite] = useState(initialSignature?.photo_identite || '');
  
  // Validation
  const isFormValid = nom.trim() !== '' && lieu.trim() !== '' && luApprouve && !isCanvasEmpty;

  // Debounced save function
  const debouncedSave = debounce(() => {
    if (autoSave && isFormValid) {
      saveSignature();
    }
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
    if (initialSignature?.signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setIsCanvasEmpty(false);
      };
      img.src = initialSignature.signature;
    } else {
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, [initialSignature?.signature]);

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
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
    setIsCanvasEmpty(false);
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
    debouncedSave();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setIsCanvasEmpty(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('La photo ne doit pas dépasser 5 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoIdentite(result);
      debouncedSave();
    };
    reader.readAsDataURL(file);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isFormValid) return;

    const signatureDataURL = canvas.toDataURL('image/png');
    const signatureData: EidasSignatureData = {
      signature: signatureDataURL,
      nom: nom.trim(),
      lieu: lieu.trim(),
      lu_approuve: luApprouve,
      photo_identite: photoIdentite,
      date: new Date().toISOString(),
    };

    onSignatureSave(signatureData);
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
            {required && <span className="text-red-300">*</span>}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={isCanvasEmpty}
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
                disabled={!isFormValid}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`nom-${title}`} className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom complet {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={`nom-${title}`}
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                debouncedSave();
              }}
              placeholder="Prénom NOM"
              required={required}
              className="glass-light border-slate-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`lieu-${title}`} className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lieu de signature {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={`lieu-${title}`}
              value={lieu}
              onChange={(e) => {
                setLieu(e.target.value);
                debouncedSave();
              }}
              placeholder="Paris, France"
              required={required}
              className="glass-light border-slate-300"
            />
          </div>
        </div>

        {/* Photo d'identité (optionnel) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photo d'identité (optionnel)
          </Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="glass-light"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter une photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {photoIdentite && (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 border-2 border-slate-300 rounded-lg overflow-hidden">
                  <img 
                    src={photoIdentite} 
                    alt="Pièce d'identité" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoIdentite('');
                    debouncedSave();
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Format accepté : JPG, PNG. Taille max : 5 MB
          </p>
        </div>

        {/* Canvas de signature */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            Signature manuscrite {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="relative glass-light border-2 border-dashed border-slate-300 rounded-2xl bg-white/80 backdrop-blur-lg overflow-hidden">
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
            {isCanvasEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <PenTool className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-float" />
                  <p className="text-slate-500 text-sm font-medium">Signez ici avec votre doigt ou stylet</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {autoSave ? 'Signature enregistrée automatiquement' : 'Cliquez sur Sauvegarder après avoir signé'}
                  </p>
                </div>
              </div>
            )}
            {!isCanvasEmpty && (
              <div className="absolute top-2 right-2">
                <div className="glass-light px-2 py-1 rounded-lg backdrop-blur-sm">
                  <span className="text-xs text-slate-600 font-medium">✓ Signé</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acceptation des conditions */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id={`lu-approuve-${title}`}
            checked={luApprouve}
            onCheckedChange={(checked) => {
              setLuApprouve(checked as boolean);
              debouncedSave();
            }}
            required={required}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor={`lu-approuve-${title}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              J'ai lu et j'approuve le contenu de cet état des lieux {required && <span className="text-red-500">*</span>}
            </Label>
            <p className="text-xs text-muted-foreground">
              En cochant cette case, je certifie avoir pris connaissance du document et être d'accord avec son contenu.
            </p>
          </div>
        </div>

        {/* Indicateur de validation */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">
            {isFormValid ? (
              <span className="text-green-600 font-medium">✓ Signature valide et complète</span>
            ) : (
              <span className="text-amber-600">⚠ Veuillez remplir tous les champs requis</span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};