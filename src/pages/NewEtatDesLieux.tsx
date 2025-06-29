
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import EtatDesLieuxTypeSelector from '@/components/EtatDesLieuxTypeSelector';

const NewEtatDesLieux = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [typeEtatDesLieux, setTypeEtatDesLieux] = useState<'entree' | 'sortie'>('entree');
  const [typeBien, setTypeBien] = useState<'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires'>('studio');
  const [formData, setFormData] = useState({
    date_entree: '',
    adresse_bien: '',
    bailleur_nom: '',
    bailleur_adresse: '',
    locataire_nom: '',
    locataire_adresse: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.adresse_bien.trim()) {
      toast.error('L\'adresse du bien est obligatoire');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .insert([{
          type_etat_des_lieux: typeEtatDesLieux,
          type_bien: typeBien,
          date_entree: formData.date_entree || null,
          adresse_bien: formData.adresse_bien,
          bailleur_nom: formData.bailleur_nom || null,
          bailleur_adresse: formData.bailleur_adresse || null,
          locataire_nom: formData.locataire_nom || null,
          locataire_adresse: formData.locataire_adresse || null,
          statut: 'en_cours'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('État des lieux créé avec succès');
      
      // Redirect based on the type of inventory
      if (typeEtatDesLieux === 'sortie') {
        navigate(`/sortie/${data.id}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de l\'état des lieux');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Nouvel état des lieux
          </h2>
          <p className="text-slate-600">
            Sélectionnez le type d'état des lieux et de bien
          </p>
        </div>
      </div>

      <EtatDesLieuxTypeSelector
        typeEtatDesLieux={typeEtatDesLieux}
        typeBien={typeBien}
        onTypeEtatDesLieuxChange={setTypeEtatDesLieux}
        onTypeBienChange={setTypeBien}
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_entree">
                  {typeEtatDesLieux === 'entree' ? 'Date d\'entrée' : 'Date de sortie'}
                </Label>
                <Input
                  id="date_entree"
                  name="date_entree"
                  type="date"
                  value={formData.date_entree}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse_bien">Adresse du bien *</Label>
                <Input
                  id="adresse_bien"
                  name="adresse_bien"
                  value={formData.adresse_bien}
                  onChange={handleInputChange}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bailleur_nom">Nom du bailleur</Label>
                <Input
                  id="bailleur_nom"
                  name="bailleur_nom"
                  value={formData.bailleur_nom}
                  onChange={handleInputChange}
                  placeholder="Nom du propriétaire"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locataire_nom">Nom du locataire</Label>
                <Input
                  id="locataire_nom"
                  name="locataire_nom"
                  value={formData.locataire_nom}
                  onChange={handleInputChange}
                  placeholder="Nom du locataire"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bailleur_adresse">Adresse du bailleur</Label>
              <Textarea
                id="bailleur_adresse"
                name="bailleur_adresse"
                value={formData.bailleur_adresse}
                onChange={handleInputChange}
                placeholder="Adresse complète du bailleur"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locataire_adresse">Adresse du locataire</Label>
              <Textarea
                id="locataire_adresse"
                name="locataire_adresse"
                value={formData.locataire_adresse}
                onChange={handleInputChange}
                placeholder="Adresse complète du locataire"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Création...' : 'Créer l\'état des lieux'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewEtatDesLieux;
