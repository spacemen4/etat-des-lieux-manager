import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Calendar, MapPin, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import EtatDesLieuxTypeSelector from '@/components/EtatDesLieuxTypeSelector';
import { useUser } from '@/context/UserContext';

interface RendezVous {
  id: string;
  date: string;
  heure: string;
  duree?: string;
  description?: string;
  adresse: string;
  code_postal: string;
  ville: string;
  nom_contact: string;
  telephone_contact: string;
  email_contact: string;
  type_etat_des_lieux: 'entree' | 'sortie';
  type_bien: string;
  statut: string;
}

// Helper function to map rendez_vous type_bien to form type_bien
const mapRdvTypeBienToFormTypeBien = (rdvTypeBien: string): 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires' => {
  switch (rdvTypeBien) {
    case 'studio':
      return 'studio';
    case 't2-t3': // from RendezVousCalendar
      return 't2_t3';
    case 't4-t5': // from RendezVousCalendar
      return 't4_t5';
    case 'mobilier': // from RendezVousCalendar
      return 'inventaire_mobilier';
    case 'bureau':
      return 'bureau';
    case 'local': // from RendezVousCalendar
      return 'local_commercial';
    case 'garage': // from RendezVousCalendar
      return 'garage_box';
    case 'pieces-supplementaires': // from RendezVousCalendar
      return 'pieces_supplementaires';
    // Add fallbacks for existing underscore versions if they might still appear
    case 't2_t3':
      return 't2_t3';
    case 't4_t5':
      return 't4_t5';
    case 'inventaire_mobilier':
      return 'inventaire_mobilier';
    case 'local_commercial':
      return 'local_commercial';
    case 'garage_box':
      return 'garage_box';
    case 'pieces_supplementaires':
      return 'pieces_supplementaires';
    default:
      // Default to 'studio' or handle as an error/log
      console.warn(`Unknown type_bien from rendez_vous: ${rdvTypeBien}, defaulting to 'studio'.`);
      return 'studio'; 
  }
};

const NewEtatDesLieux = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userUuid } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [typeEtatDesLieux, setTypeEtatDesLieux] = useState<'entree' | 'sortie'>('entree');
  const [typeBien, setTypeBien] = useState<'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires'>('studio');
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [formData, setFormData] = useState({
    date_entree: '',
    adresse_bien: '',
    bailleur_nom: '',
    bailleur_adresse: '',
    locataire_nom: '',
    locataire_adresse: ''
  });

  // Pré-sélectionner le type d'état des lieux basé sur le paramètre URL
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const rdvParam = searchParams.get('rdv');
    
    if (typeParam === 'entree' || typeParam === 'sortie') {
      setTypeEtatDesLieux(typeParam);
    }

    // Si un rendez-vous est spécifié, le charger et pré-remplir les données
    if (rdvParam) {
      loadRendezVous(rdvParam);
    }
  }, [searchParams]);

  const loadRendezVous = async (rdvId: string) => {
    try {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .eq('id', rdvId)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedRendezVous(data);
        setTypeEtatDesLieux(data.type_etat_des_lieux);
        setTypeBien(mapRdvTypeBienToFormTypeBien(data.type_bien));
        
        // Pré-remplir les données du formulaire avec les informations du rendez-vous
        setFormData(prev => ({
          ...prev,
          date_entree: new Date().toISOString().split('T')[0], // Date du jour par défaut
          adresse_bien: `${data.adresse}, ${data.code_postal} ${data.ville}`,
          locataire_nom: data.nom_contact,
          // On laisse les autres champs vides pour que l'utilisateur les remplisse
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rendez-vous:', error);
      toast.error('Erreur lors du chargement du rendez-vous');
    }
  };

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
      // Créer l'état des lieux
      const etatDesLieuxData = {
        user_id: userUuid,
        type_etat_des_lieux: typeEtatDesLieux,
        type_bien: typeBien,
        date_entree: formData.date_entree || null,
        adresse_bien: formData.adresse_bien,
        bailleur_nom: formData.bailleur_nom || null,
        bailleur_adresse: formData.bailleur_adresse || null,
        locataire_nom: formData.locataire_nom || null,
        locataire_adresse: formData.locataire_adresse || null,
        statut: 'en_cours',
        rendez_vous_id: selectedRendezVous?.id || null // Lier au rendez-vous si applicable
      };

      const { data, error } = await supabase
        .from('etat_des_lieux')
        .insert([etatDesLieuxData])
        .select()
        .single();

      if (error) throw error;

      // Si c'est lié à un rendez-vous, mettre à jour le statut du rendez-vous
      if (selectedRendezVous) {
        const { error: rdvError } = await supabase
          .from('rendez_vous')
          .update({ 
            statut: 'realise',
            etat_des_lieux_id: data.id
          })
          .eq('id', selectedRendezVous.id);

        if (rdvError) {
          console.error('Erreur lors de la mise à jour du rendez-vous:', rdvError);
          // On continue même si la mise à jour du rendez-vous échoue
        }
      }

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

  const getTypeBienLabel = (typeBien: string) => {
    const labels: Record<string, string> = {
      'studio': 'Studio',
      't2_t3': 'T2 - T3',
      't4_t5': 'T4 - T5',
      'inventaire_mobilier': 'Inventaire mobilier',
      'bureau': 'Bureau',
      'local_commercial': 'Local commercial',
      'garage_box': 'Garage / Box',
      'pieces_supplementaires': 'Pièces supplémentaires',
      't2-t3': 'T2 - T3',
      't4-t5': 'T4 - T5',
      'mobilier': 'Inventaire mobilier',
      'local': 'Local commercial',
      'garage': 'Garage / Box',
      'pieces-supplementaires': 'Pièces supplémentaires'
    };
    return labels[typeBien] || typeBien;
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
            {selectedRendezVous ? 'Basé sur le rendez-vous planifié' : 'Sélectionnez le type d\'état des lieux et de bien'}
          </p>
        </div>
      </div>

      {/* Afficher les informations du rendez-vous si applicable */}
      {selectedRendezVous && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              Rendez-vous lié
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {new Date(selectedRendezVous.date).toLocaleDateString()} à {selectedRendezVous.heure}
                  </span>
                  {selectedRendezVous.duree && (
                    <Badge variant="outline" className="ml-2">
                      {selectedRendezVous.duree}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {selectedRendezVous.adresse}, {selectedRendezVous.code_postal} {selectedRendezVous.ville}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {selectedRendezVous.nom_contact} - {selectedRendezVous.telephone_contact}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">
                  {selectedRendezVous.type_etat_des_lieux === 'entree' ? 'État d\'entrée' : 'État de sortie'}
                </Badge>
                <Badge variant="outline" className="w-fit ml-2">
                  {getTypeBienLabel(selectedRendezVous.type_bien)}
                </Badge>
                {selectedRendezVous.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedRendezVous.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EtatDesLieuxTypeSelector
        typeEtatDesLieux={typeEtatDesLieux}
        typeBien={typeBien}
        onTypeEtatDesLieuxChange={setTypeEtatDesLieux}
        onTypeBienChange={setTypeBien}
        disabled={!!selectedRendezVous} // Désactiver si lié à un rendez-vous
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
