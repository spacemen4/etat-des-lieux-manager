
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EtatDesLieuxTypeSelectorProps {
  typeEtatDesLieux: 'entree' | 'sortie';
  typeBien: 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires';
  onTypeEtatDesLieuxChange: (value: 'entree' | 'sortie') => void;
  onTypeBienChange: (value: 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires') => void;
  disabled?: boolean;
}

const EtatDesLieuxTypeSelector: React.FC<EtatDesLieuxTypeSelectorProps> = ({
  typeEtatDesLieux,
  typeBien,
  onTypeEtatDesLieuxChange,
  onTypeBienChange,
  disabled = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Type d'état des lieux</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={typeEtatDesLieux} 
            onValueChange={onTypeEtatDesLieuxChange}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="entree" id="entree" />
              <Label htmlFor="entree">État des lieux d'entrée</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sortie" id="sortie" />
              <Label htmlFor="sortie">État des lieux de sortie</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type de bien</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={typeBien} 
            onValueChange={onTypeBienChange}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="studio" id="studio" />
              <Label htmlFor="studio">Studio</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="t2_t3" id="t2_t3" />
              <Label htmlFor="t2_t3">T2 – T3</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="t4_t5" id="t4_t5" />
              <Label htmlFor="t4_t5">T4 – T5</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inventaire_mobilier" id="inventaire_mobilier" />
              <Label htmlFor="inventaire_mobilier">Inventaire du mobilier</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bureau" id="bureau" />
              <Label htmlFor="bureau">Bureau</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local_commercial" id="local_commercial" />
              <Label htmlFor="local_commercial">Local commercial</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="garage_box" id="garage_box" />
              <Label htmlFor="garage_box">Garage / Box</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pieces_supplementaires" id="pieces_supplementaires" />
              <Label htmlFor="pieces_supplementaires">Pièces supplémentaires</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtatDesLieuxTypeSelector;
