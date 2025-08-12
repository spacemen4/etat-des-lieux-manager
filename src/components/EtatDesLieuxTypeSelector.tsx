
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUser } from '@/context/UserContext';
import { LogIn, LogOut, Home, Building, Warehouse, Car, Plus } from 'lucide-react';

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
  const { userUuid } = useUser();

  const typeEtatOptions = [
    {
      value: 'entree' as const,
      label: 'État des lieux d\'entrée',
      icon: LogIn,
      description: 'Pour un nouveau locataire',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      value: 'sortie' as const,
      label: 'État des lieux de sortie',
      icon: LogOut,
      description: 'Pour un départ de locataire',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  const typeBienOptions = [
    {
      value: 'studio' as const,
      label: 'Studio',
      icon: Home,
      description: 'Logement une pièce'
    },
    {
      value: 't2_t3' as const,
      label: 'T2 – T3',
      icon: Home,
      description: '2 à 3 pièces principales'
    },
    {
      value: 't4_t5' as const,
      label: 'T4 – T5',
      icon: Home,
      description: '4 à 5 pièces principales'
    },
    {
      value: 'inventaire_mobilier' as const,
      label: 'Inventaire du mobilier',
      icon: Plus,
      description: 'Mobilier et équipements'
    },
    {
      value: 'bureau' as const,
      label: 'Bureau',
      icon: Building,
      description: 'Espace professionnel'
    },
    {
      value: 'local_commercial' as const,
      label: 'Local commercial',
      icon: Warehouse,
      description: 'Commerce ou activité'
    },
    {
      value: 'garage_box' as const,
      label: 'Garage / Box',
      icon: Car,
      description: 'Stationnement fermé'
    },
    {
      value: 'pieces_supplementaires' as const,
      label: 'Pièces supplémentaires',
      icon: Plus,
      description: 'Annexes et dépendances'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Type d'état des lieux avec design moderne */}
      <Card className="glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
        <CardHeader className="gradient-primary text-white p-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <LogIn className="w-6 h-6" />
            </div>
            Type d'état des lieux
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <RadioGroup 
            value={typeEtatDesLieux} 
            onValueChange={onTypeEtatDesLieuxChange}
            disabled={disabled}
            className="space-y-4"
          >
            {typeEtatOptions.map((option, index) => (
              <div 
                key={option.value}
                className={`relative glass-light p-4 rounded-xl border transition-all duration-300 hover:glass-heavy hover:scale-[1.02] cursor-pointer animate-slide-up ${
                  typeEtatDesLieux === option.value 
                    ? `${option.borderColor} ring-2 ring-offset-2 ring-offset-white ${option.bgColor}/50` 
                    : 'border-white/20 hover:border-white/40'
                }`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-start space-x-4">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="mt-1 data-[state=checked]:border-current"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${option.bgColor}`}>
                        <option.icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <Label 
                        htmlFor={option.value}
                        className={`text-lg font-semibold cursor-pointer transition-colors duration-300 ${
                          typeEtatDesLieux === option.value ? option.color : 'text-slate-900'
                        }`}
                      >
                        {option.label}
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 ml-11">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Type de bien avec design moderne */}
      <Card className="glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
        <CardHeader className="gradient-secondary text-white p-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Building className="w-6 h-6" />
            </div>
            Type de bien
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <RadioGroup 
            value={typeBien} 
            onValueChange={onTypeBienChange}
            disabled={disabled}
            className="space-y-3"
          >
            {typeBienOptions.map((option, index) => (
              <div 
                key={option.value}
                className={`relative glass-light p-3 rounded-xl border transition-all duration-300 hover:glass-heavy hover:scale-[1.01] cursor-pointer animate-slide-up ${
                  typeBien === option.value 
                    ? 'border-purple-200 ring-2 ring-offset-2 ring-offset-white bg-purple-50/50' 
                    : 'border-white/20 hover:border-white/40'
                }`}
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="data-[state=checked]:border-purple-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${typeBien === option.value ? 'bg-purple-100' : 'bg-slate-100'}`}>
                      <option.icon className={`w-4 h-4 ${typeBien === option.value ? 'text-purple-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor={option.value}
                        className={`text-base font-semibold cursor-pointer transition-colors duration-300 block ${
                          typeBien === option.value ? 'text-purple-600' : 'text-slate-900'
                        }`}
                      >
                        {option.label}
                      </Label>
                      <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtatDesLieuxTypeSelector;
