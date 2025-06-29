import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Import Supabase client
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RendezVous {
  date?: Date; // Optionnel - utilise la date du jour si non renseigné
  description?: string; // Optionnel
  adresse: string; // Obligatoire - pour identifier le type de bien
  code_postal?: string; // Optionnel
  ville?: string; // Optionnel
  nom_contact?: string; // Optionnel
  telephone_contact?: string; // Optionnel
  email_contact?: string; // Optionnel
  heure?: string; // Optionnel
  duree?: string; // Optionnel
  latitude?: number;
  longitude?: number;
  note_personnelle?: string;
  type_etat_des_lieux?: string; // Optionnel
  type_bien?: string; // Optionnel
  validation_finale: boolean; // Obligatoire - case à cocher
  releves_compteurs?: string; // Optionnel
  etat_pieces?: string; // Optionnel
  remise_cles?: boolean; // Optionnel
}

interface ValidationErrors {
  adresse: boolean;
  validation_finale: boolean;
}

export function RendezVousCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [code_postal, setCode_postal] = useState('');
  const [ville, setVille] = useState('');
  const [nom_contact, setNom_contact] = useState('');
  const [telephone_contact, setTelephone_contact] = useState('');
  const [email_contact, setEmail_contact] = useState('');
  const [heure, setHeure] = useState('');
  const [duree, setDuree] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [note_personnelle, setNote_personnelle] = useState('');
  const [typeEtatDesLieux, setTypeEtatDesLieux] = useState<string | undefined>(undefined);
  const [typeBien, setTypeBien] = useState<string | undefined>(undefined);
  const [validationFinale, setValidationFinale] = useState(false);
  const [relevesCompteurs, setRelevesCompteurs] = useState('');
  const [etatPieces, setEtatPieces] = useState('');
  const [remiseCles, setRemiseCles] = useState(false);
  
  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    adresse: false,
    validation_finale: false
  });

  // Fetch existing rendez-vous from Supabase
  useEffect(() => {
    const fetchRendezVous = async () => {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching rendez-vous:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les rendez-vous depuis la base de données.",
          variant: "destructive",
        });
      } else if (data) {
        const formattedData: RendezVous[] = data.map(item => ({
          ...item,
          date: item.date ? new Date(item.date) : undefined,
          validation_finale: Boolean(item.validation_finale),
          remise_cles: Boolean(item.remise_cles),
        }));
        setRendezVous(formattedData);
      }
    };

    fetchRendezVous();
  }, []);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      adresse: !adresse.trim(),
      validation_finale: !validationFinale
    };

    setValidationErrors(errors);

    // Retourne true si aucune erreur
    return !Object.values(errors).some(error => error);
  };

  const handleAddRendezVous = async () => {
    // Validation des champs obligatoires
    if (!validateForm()) {
      toast({
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir l'adresse du bien et cocher la validation finale.",
        variant: "destructive",
      });
      return;
    }

    // Utilise la date du jour si aucune date n'est sélectionnée
    const finalDate = date || new Date();

    const newRendezVousData = {
      date: date ? finalDate.toISOString().split('T')[0] : null,
      description: description.trim() || null,
      adresse: adresse.trim(),
      code_postal: code_postal.trim() || null,
      ville: ville.trim() || null,
      nom_contact: nom_contact.trim() || null,
      telephone_contact: telephone_contact.trim() || null,
      email_contact: email_contact.trim() || null,
      heure: heure || null,
      duree: duree.trim() || null,
      latitude: latitude || null,
      longitude: longitude || null,
      note_personnelle: note_personnelle.trim() || null,
      type_etat_des_lieux: typeEtatDesLieux || null,
      type_bien: typeBien || null,
      validation_finale: validationFinale,
      releves_compteurs: relevesCompteurs.trim() || null,
      etat_pieces: etatPieces.trim() || null,
      remise_cles: remiseCles,
    };

    const { data: insertedData, error } = await supabase
      .from('rendez_vous')
      .insert([newRendezVousData])
      .select();

    if (error) {
      console.error('Error adding rendez-vous:', error);
      toast({
        title: "Erreur d'ajout",
        description: "Impossible d'ajouter le rendez-vous à la base de données. Message: " + error.message,
        variant: "destructive",
      });
    } else if (insertedData && insertedData.length > 0) {
      const newRendezVousWithDateObject: RendezVous = {
        ...insertedData[0],
        date: insertedData[0].date ? new Date(insertedData[0].date) : undefined,
        validation_finale: Boolean(insertedData[0].validation_finale),
        remise_cles: Boolean(insertedData[0].remise_cles),
      };
      
      setRendezVous(prevRendezVous => [...prevRendezVous, newRendezVousWithDateObject].sort((a, b) => {
        const dateA = a.date || new Date();
        const dateB = b.date || new Date();
        return dateA.getTime() - dateB.getTime();
      }));

      // Reset form fields
      setDescription('');
      setAdresse('');
      setCode_postal('');
      setVille('');
      setLatitude(undefined);
      setLongitude(undefined);
      setNom_contact('');
      setTelephone_contact('');
      setEmail_contact('');
      setHeure('');
      setDuree('');
      setNote_personnelle('');
      setTypeEtatDesLieux(undefined);
      setTypeBien(undefined);
      setValidationFinale(false);
      setRelevesCompteurs('');
      setEtatPieces('');
      setRemiseCles(false);
      setValidationErrors({ adresse: false, validation_finale: false });

      toast({
        title: "Rendez-vous ajouté",
        description: `Rendez-vous ${date ? `pour le ${finalDate.toLocaleDateString()}` : 'sans date spécifique'} ${heure ? `à ${heure}` : ''} enregistré avec succès.`,
      });
    }
  };

  const RequiredLabel = ({ htmlFor, children, isRequired = false, hasError = false }: {
    htmlFor: string;
    children: React.ReactNode;
    isRequired?: boolean;
    hasError?: boolean;
  }) => (
    <Label htmlFor={htmlFor} className={hasError ? "text-red-600" : ""}>
      {children}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
      {hasError && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-red-500 ml-1 cursor-help">⚠</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ce champ est obligatoire</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Label>
  );

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Calendrier des États des Lieux</h2>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">Champs obligatoires :</h3>
        <ul className="text-sm text-blue-700 list-disc list-inside">
          <li>Adresse du bien (pour identifier le type de bien)</li>
          <li>Validation finale (case à cocher)</li>
        </ul>
        <p className="text-sm text-blue-600 mt-2">
          <span className="text-red-500">*</span> Si la date n'est pas renseignée, la date du jour sera utilisée.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
            <Label>Date du rendez-vous (optionnel)</Label>
            <p className="text-sm text-gray-500 mb-2">Si non renseignée, la date du jour sera utilisée</p>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="description">Description du rendez-vous (optionnel)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: État des lieux d'entrée pour M. Dupont"
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="typeEtatDesLieux">Type d'état des lieux (optionnel)</Label>
            <Select value={typeEtatDesLieux} onValueChange={setTypeEtatDesLieux}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entree">Etat des lieux entrée</SelectItem>
                <SelectItem value="sortie">Etat des lieux de sortie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="typeBien">Type de bien (optionnel)</Label>
            <Select value={typeBien} onValueChange={setTypeBien}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="t2-t3">T2 – T3</SelectItem>
                <SelectItem value="t4-t5">T4 – T5</SelectItem>
                <SelectItem value="mobilier">Inventaire du mobilier</SelectItem>
                <SelectItem value="bureau">Bureau</SelectItem>
                <SelectItem value="local">Local commercial</SelectItem>
                <SelectItem value="garage">Garage / Box</SelectItem>
                <SelectItem value="pieces-supplementaires">Pièces supplémentaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="heure">Heure du rendez-vous (optionnel)</Label>
            <Input
              id="heure"
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="duree">Durée prévue (optionnel)</Label>
            <Input
              id="duree"
              type="text"
              value={duree}
              onChange={(e) => setDuree(e.target.value)}
              placeholder="Ex: 1h30"
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <RequiredLabel 
              htmlFor="adresse" 
              isRequired={true} 
              hasError={validationErrors.adresse}
            >
              Adresse du bien
            </RequiredLabel>
            <Input
              id="adresse"
              type="text"
              value={adresse}
              onChange={(e) => {
                setAdresse(e.target.value);
                if (validationErrors.adresse && e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, adresse: false }));
                }
              }}
              placeholder="123 rue de la Paix"
              className={`mt-1 ${validationErrors.adresse ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="code_postal">Code Postal (optionnel)</Label>
            <Input
              id="code_postal"
              type="text"
              value={code_postal}
              onChange={(e) => setCode_postal(e.target.value)}
              placeholder="75000"
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="ville">Ville (optionnel)</Label>
            <Input
              id="ville"
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Paris"
              className="mt-1"
            />
          </div>
          
          {/* Location Picker */}
          <div className="mt-4">
            <Label>Localisation du rendez-vous (optionnel)</Label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
            {latitude !== undefined && longitude !== undefined && (
              <div className="mt-2 text-sm text-gray-600">
                Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <Label htmlFor="nom_contact">Personne à contacter (optionnel)</Label>
            <Input
              id="nom_contact"
              type="text"
              value={nom_contact}
              onChange={(e) => setNom_contact(e.target.value)}
              placeholder="Jean Dupont"
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="telephone_contact">Téléphone du contact (optionnel)</Label>
            <Input
              id="telephone_contact"
              type="tel"
              value={telephone_contact}
              onChange={(e) => setTelephone_contact(e.target.value)}
              placeholder="0612345678"
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="email_contact">Email du contact (optionnel)</Label>
            <Input
              id="email_contact"
              type="email"
              value={email_contact}
              onChange={(e) => setEmail_contact(e.target.value)}
              placeholder="jean.dupont@example.com"
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="releves_compteurs">Relevés de compteurs (optionnel)</Label>
            <Textarea
              id="releves_compteurs"
              value={relevesCompteurs}
              onChange={(e) => setRelevesCompteurs(e.target.value)}
              placeholder="Électricité: 12345 kWh, Gaz: 6789 m³..."
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="etat_pieces">État détaillé des pièces (optionnel)</Label>
            <Textarea
              id="etat_pieces"
              value={etatPieces}
              onChange={(e) => setEtatPieces(e.target.value)}
              placeholder="Salon: bon état, cuisine: évier rayé..."
              className="mt-1"
            />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="note_personnelle">Note personnelle (optionnel)</Label>
            <Textarea
              id="note_personnelle"
              value={note_personnelle}
              onChange={(e) => setNote_personnelle(e.target.value)}
              placeholder="Ajouter une note personnelle ici..."
              className="mt-1"
            />
          </div>
          
          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="remise_cles"
              checked={remiseCles}
              onCheckedChange={(checked) => setRemiseCles(checked as boolean)}
            />
            <Label htmlFor="remise_cles">Remise des clés (optionnel)</Label>
          </div>
          
          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="validation_finale"
              checked={validationFinale}
              onCheckedChange={(checked) => {
                setValidationFinale(checked as boolean);
                if (validationErrors.validation_finale && checked) {
                  setValidationErrors(prev => ({ ...prev, validation_finale: false }));
                }
              }}
              className={validationErrors.validation_finale ? 'border-red-500' : ''}
            />
            <RequiredLabel 
              htmlFor="validation_finale" 
              isRequired={true} 
              hasError={validationErrors.validation_finale}
            >
              Validation finale
            </RequiredLabel>
          </div>
          
          <Button onClick={handleAddRendezVous} className="mt-4 w-full">
            Ajouter un rendez-vous
          </Button>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">Rendez-vous planifiés :</h3>
          {rendezVous.length === 0 ? (
            <p>Aucun rendez-vous planifié.</p>
          ) : (
            <ul className="space-y-2">
              {rendezVous
                .sort((a, b) => {
                  const dateA = a.date || new Date();
                  const dateB = b.date || new Date();
                  return dateA.getTime() - dateB.getTime();
                })
                .map((rv, index) => (
                  <li key={index} className="p-2 border rounded-md">
                    <p className="font-medium">
                      {rv.date ? rv.date.toLocaleDateString() : 'Date non spécifiée'}
                      {rv.heure && ` à ${rv.heure}`}
                      {rv.duree && ` (Durée: ${rv.duree})`}
                      {rv.validation_finale && <span className="ml-2 text-green-600 font-semibold">✓ Validé</span>}
                    </p>
                    {rv.description && <p className="text-sm text-gray-600">{rv.description}</p>}
                    {rv.type_etat_des_lieux && <p className="text-sm text-gray-600">Type d'EDL: {rv.type_etat_des_lieux}</p>}
                    {rv.type_bien && <p className="text-sm text-gray-600">Type de bien: {rv.type_bien}</p>}
                    <p className="text-sm text-gray-600">
                      Adresse: {rv.adresse}
                      {rv.code_postal && `, ${rv.code_postal}`}
                      {rv.ville && ` ${rv.ville}`}
                    </p>
                    {(rv.nom_contact || rv.telephone_contact || rv.email_contact) && (
                      <p className="text-sm text-gray-600">
                        Contact: {[rv.nom_contact, rv.telephone_contact, rv.email_contact].filter(Boolean).join(' - ')}
                      </p>
                    )}
                    {(rv.latitude && rv.longitude) && (
                      <p className="text-sm text-gray-600">
                        Coordonnées: {rv.latitude}, {rv.longitude}
                      </p>
                    )}
                    {rv.releves_compteurs && (
                      <p className="text-sm text-gray-500 mt-1">
                        Compteurs: {rv.releves_compteurs}
                      </p>
                    )}
                    {rv.etat_pieces && (
                      <p className="text-sm text-gray-500 mt-1">
                        État des pièces: {rv.etat_pieces}
                      </p>
                    )}
                    {rv.remise_cles && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Clés remises
                      </p>
                    )}
                    {rv.note_personnelle && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Note: {rv.note_personnelle}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// --- LocationPicker Component ---
interface LocationPickerProps {
  latitude: number | undefined;
  longitude: number | undefined;
  onLocationChange: (lat: number, lng: number) => void;
}

function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const defaultCenter: L.LatLngExpression = [46.603354, 1.888334]; // Center of France
  const defaultZoom = 6;

  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setMarkerPosition(L.latLng(latitude, longitude));
    } else {
      setMarkerPosition(null);
    }
  }, [latitude, longitude]);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  const [map, setMap] = useState<L.Map | null>(null);
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map]);

  return (
    <MapContainer
      center={markerPosition || defaultCenter}
      zoom={markerPosition ? 13 : defaultZoom}
      scrollWheelZoom={true}
      style={{ height: '300px', width: '100%', marginTop: '0.5rem', borderRadius: '0.375rem' }}
      whenCreated={setMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      {markerPosition && <Marker position={markerPosition}></Marker>}
    </MapContainer>
  );
}
