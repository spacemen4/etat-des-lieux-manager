import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { MapPin, Search } from 'lucide-react';

interface RendezVous {
  id?: string;
  date?: Date;
  heure: string;
  duree?: string;
  description?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  nom_contact?: string;
  telephone_contact?: string;
  email_contact?: string;
  note_personnelle?: string;
  type_etat_des_lieux: string;
  type_bien: string;
  created_at?: Date;
  statut?: string;
  etat_des_lieux_id?: string;
}

interface ValidationErrors {
  type_etat_des_lieux: boolean;
  type_bien: boolean;
  heure: boolean;
  date?: boolean;
  adresse?: boolean;
  code_postal?: boolean;
  ville?: boolean;
  nom_contact?: boolean;
  telephone_contact?: boolean;
  email_contact?: boolean;
}

// Composant de carte interactive
const MapSelector = ({ 
  latitude, 
  longitude, 
  onLocationSelect, 
  address 
}: {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  address?: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Charger Leaflet dynamiquement
    const loadLeaflet = async () => {
      try {
        // Charger CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Charger JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        
        return new Promise((resolve, reject) => {
          script.onload = () => resolve(window.L);
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (error) {
        console.error('Erreur lors du chargement de Leaflet:', error);
        return null;
      }
    };

    loadLeaflet().then((L) => {
      if (!L || !mapRef.current) return;

      // Initialiser la carte
      const initialLat = latitude || 48.8566; // Paris par défaut
      const initialLng = longitude || 2.3522;
      
      const mapInstance = (L as any).map(mapRef.current).setView([initialLat, initialLng], 13);
      
      // Ajouter les tuiles
      (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      // Ajouter le marqueur
      const markerInstance = (L as any).marker([initialLat, initialLng], {
        draggable: true
      }).addTo(mapInstance);

      // Événement de glissement du marqueur
      markerInstance.on('dragend', (e) => {
        const position = e.target.getLatLng();
        onLocationSelect(position.lat, position.lng);
      });

      // Clic sur la carte
      mapInstance.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerInstance.setLatLng([lat, lng]);
        onLocationSelect(lat, lng);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    });

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Mettre à jour la position du marqueur quand les coordonnées changent
  useEffect(() => {
    if (map && marker && latitude && longitude) {
      marker.setLatLng([latitude, longitude]);
      map.setView([latitude, longitude], 13);
    }
  }, [latitude, longitude, map, marker]);

  // Géocoder l'adresse
  const geocodeAddress = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        onLocationSelect(latitude, longitude);
        
        if (map && marker) {
          marker.setLatLng([latitude, longitude]);
          map.setView([latitude, longitude], 15);
        }
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={geocodeAddress}
          disabled={!address || isLoading}
          className="flex items-center space-x-1"
        >
          <Search className="w-4 h-4" />
          <span>{isLoading ? 'Recherche...' : 'Localiser l\'adresse'}</span>
        </Button>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-64 border rounded-md"
        style={{ minHeight: '250px' }}
      />
      <p className="text-xs text-gray-500">
        Cliquez sur la carte ou glissez le marqueur pour sélectionner une position
      </p>
    </div>
  );
};

export default function RendezVousCalendar({ userUuid }) {
  console.log("[RENDEZVOUS] Initialisation du composant");
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
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
  const [typeEtatDesLieux, setTypeEtatDesLieux] = useState<string>('');
  const [typeBien, setTypeBien] = useState<string>('');
  const [statut, setStatut] = useState<string>('planifie');
  const [showMap, setShowMap] = useState(false);
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    type_etat_des_lieux: false,
    type_bien: false,
    heure: false,
    date: false,
    adresse: false,
    code_postal: false,
    ville: false,
    nom_contact: false,
    telephone_contact: false,
    email_contact: false
  });

  useEffect(() => {
    checkSupabaseConnection();
    if (userUuid) {
      fetchRendezVous();
    }
  }, [userUuid]);

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .limit(1);

      if (error) {
        console.error("[SUPABASE] Connection error:", error);
        setSupabaseConnected(false);
        return;
      }

      console.log("[SUPABASE] Connected successfully");
      setSupabaseConnected(true);
    } catch (error) {
      console.error("[SUPABASE] Unexpected error:", error);
      setSupabaseConnected(false);
    }
  };

  const fetchRendezVous = async () => {
    try {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .eq('user_id', userUuid)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedData = data?.map(rv => ({
        ...rv,
        date: new Date(rv.date),
        created_at: new Date(rv.created_at)
      })) || [];

      setRendezVous(formattedData);
    } catch (error) {
      console.error("[ERREUR] Erreur lors du chargement des rendez-vous:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive",
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      type_etat_des_lieux: !typeEtatDesLieux.trim(),
      type_bien: !typeBien.trim(),
      heure: !heure.trim(),
      date: !date,
      adresse: !adresse.trim(),
      code_postal: !code_postal.trim(),
      ville: !ville.trim(),
      nom_contact: !nom_contact.trim(),
      telephone_contact: !telephone_contact.trim(),
      email_contact: !email_contact.trim() || !email_contact.includes('@')
    };

    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleAddRendezVous = async () => {
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const finalDate = date || new Date();

    const nouveauRendezVous: RendezVous = {
      id: Date.now().toString(),
      date: finalDate,
      heure: heure.trim(),
      duree: duree.trim() || undefined,
      description: description.trim() || undefined,
      adresse: adresse.trim(),
      code_postal: code_postal.trim(),
      ville: ville.trim(),
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      nom_contact: nom_contact.trim(),
      telephone_contact: telephone_contact.trim(),
      email_contact: email_contact.trim(),
      note_personnelle: note_personnelle.trim() || undefined,
      type_etat_des_lieux: typeEtatDesLieux,
      type_bien: typeBien,
      statut: statut,
      created_at: new Date(),
      user_id: userUuid
    };

    try {
      const { data, error } = await supabase
        .from('rendez_vous')
        .insert([nouveauRendezVous])
        .select();

      if (error) throw error;

      if (data) {
        setRendezVous(prev => [...prev, { ...nouveauRendezVous, id: data[0].id }]);
      resetForm();
      toast({
        title: "Succès",
        description: `Rendez-vous du ${finalDate.toLocaleDateString()} à ${heure} ajouté avec succès!`,
      });
      }
    } catch (error) {
      console.error("[ERREUR] Erreur lors de l'ajout du rendez-vous:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du rendez-vous",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setTypeEtatDesLieux('');
    setTypeBien('');
    setStatut('planifie');
    setShowMap(false);
    setValidationErrors({
      type_etat_des_lieux: false,
      type_bien: false,
      heure: false,
      date: false,
      adresse: false,
      code_postal: false,
      ville: false,
      nom_contact: false,
      telephone_contact: false,
      email_contact: false
    });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
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

  const getStatutColor = (statut: string) => {
    switch(statut) {
      case 'planifie': return 'bg-blue-100 text-blue-700';
      case 'realise': return 'bg-green-100 text-green-700';
      case 'annule': return 'bg-red-100 text-red-700';
      case 'reporte': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch(statut) {
      case 'planifie': return 'Planifié';
      case 'realise': return 'Réalisé';
      case 'annule': return 'Annulé';
      case 'reporte': return 'Reporté';
      default: return statut;
    }
  };

  // Séparer les rendez-vous en deux catégories
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const rdvAVenir = rendezVous.filter(rv => {
    const rvDate = rv.date ? new Date(rv.date) : null;
    return rvDate && rvDate >= today;
  }).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  
  const rdvPasses = rendezVous.filter(rv => {
    const rvDate = rv.date ? new Date(rv.date) : null;
    return rvDate && rvDate < today;
  }).sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  const fullAddress = `${adresse}, ${code_postal} ${ville}`.trim();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h2 className="text-2xl font-bold mb-4">Calendrier des États des Lieux</h2>
      
      {/* Indicateur de statut Supabase */}
      <div className={`mb-4 p-4 rounded-md ${supabaseConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${supabaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className={`font-semibold ${supabaseConnected ? 'text-green-800' : 'text-red-800'}`}>
            {supabaseConnected ? '✅ Supabase connecté' : '❌ Supabase non connecté'}
          </h3>
        </div>
        {!supabaseConnected && (
          <div className="mt-2">
            <p className="text-sm text-red-700 mb-2">
              Erreur de connexion à la base de données.
            </p>
            <Button 
              onClick={checkSupabaseConnection} 
              className="mt-2 bg-red-600 hover:bg-red-700"
              size="sm"
            >
              Réessayer la connexion
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <RequiredLabel 
                htmlFor="date" 
                isRequired={true} 
                hasError={validationErrors.date}
              >
                Date du rendez-vous
              </RequiredLabel>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  if (validationErrors.date && newDate) {
                    setValidationErrors(prev => ({ ...prev, date: false }));
                  }
                }}
                className={`rounded-md border mt-1 ${validationErrors.date ? 'border-red-500' : ''}`}
              />
            </div>
            
            <div>
              <RequiredLabel 
                htmlFor="heure" 
                isRequired={true} 
                hasError={validationErrors.heure}
              >
                Heure du rendez-vous
              </RequiredLabel>
              <Input
                id="heure"
                type="time"
                value={heure}
                onChange={(e) => {
                  setHeure(e.target.value);
                  if (validationErrors.heure && e.target.value) {
                    setValidationErrors(prev => ({ ...prev, heure: false }));
                  }
                }}
                className={`mt-1 ${validationErrors.heure ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              
              <div className="mt-2">
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
            </div>
          </div>

          <div>
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

          {/* Adresse */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
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
            
            <div>
              <RequiredLabel 
                htmlFor="code_postal" 
                isRequired={true} 
                hasError={validationErrors.code_postal}
              >
                Code Postal
              </RequiredLabel>
              <Input
                id="code_postal"
                type="text"
                value={code_postal}
                onChange={(e) => {
                  setCode_postal(e.target.value);
                  if (validationErrors.code_postal && e.target.value.trim()) {
                    setValidationErrors(prev => ({ ...prev, code_postal: false }));
                  }
                }}
                placeholder="75000"
                className={`mt-1 ${validationErrors.code_postal ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
          </div>

          <div>
            <RequiredLabel 
              htmlFor="ville" 
              isRequired={true} 
              hasError={validationErrors.ville}
            >
              Ville
            </RequiredLabel>
            <Input
              id="ville"
              type="text"
              value={ville}
              onChange={(e) => {
                setVille(e.target.value);
                if (validationErrors.ville && e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, ville: false }));
                }
              }}
              placeholder="Paris"
              className={`mt-1 ${validationErrors.ville ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>

          {/* Coordonnées GPS avec carte */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Localisation GPS (optionnel)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-1"
              >
                <MapPin className="w-4 h-4" />
                <span>{showMap ? 'Masquer la carte' : 'Afficher la carte'}</span>
              </Button>
            </div>
            
            {showMap && (
              <MapSelector
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={handleLocationSelect}
                address={fullAddress}
              />
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
              <Label htmlFor="latitude">Latitude (optionnel)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude || ''}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="48.8566"
                  className="mt-1"
                />
              </div>
              <div>
              <Label htmlFor="longitude">Longitude (optionnel)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude || ''}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="2.3522"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <RequiredLabel 
                htmlFor="nom_contact" 
                isRequired={true} 
                hasError={validationErrors.nom_contact}
              >
                Nom du contact
              </RequiredLabel>
              <Input
                id="nom_contact"
                type="text"
                value={nom_contact}
                onChange={(e) => {
                  setNom_contact(e.target.value);
                  if (validationErrors.nom_contact && e.target.value.trim()) {
                    setValidationErrors(prev => ({ ...prev, nom_contact: false }));
                  }
                }}
                placeholder="Jean Dupont"
                className={`mt-1 ${validationErrors.nom_contact ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            
            <div>
              <RequiredLabel 
                htmlFor="telephone_contact" 
                isRequired={true} 
                hasError={validationErrors.telephone_contact}
              >
                Téléphone
              </RequiredLabel>
              <Input
                id="telephone_contact"
                type="tel"
                value={telephone_contact}
                onChange={(e) => {
                  setTelephone_contact(e.target.value);
                  if (validationErrors.telephone_contact && e.target.value.trim()) {
                    setValidationErrors(prev => ({ ...prev, telephone_contact: false }));
                  }
                }}
                placeholder="0612345678"
                className={`mt-1 ${validationErrors.telephone_contact ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
          </div>

          <div>
            <RequiredLabel 
              htmlFor="email_contact" 
              isRequired={true} 
              hasError={validationErrors.email_contact}
            >
              Email du contact
            </RequiredLabel>
            <Input
              id="email_contact"
              type="email"
              value={email_contact}
              onChange={(e) => {
                setEmail_contact(e.target.value);
                if (validationErrors.email_contact && e.target.value.trim() && e.target.value.includes('@')) {
                  setValidationErrors(prev => ({ ...prev, email_contact: false }));
                }
              }}
              placeholder="jean.dupont@example.com"
              className={`mt-1 ${validationErrors.email_contact ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>

          {/* Types et statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <RequiredLabel 
                htmlFor="typeEtatDesLieux" 
                isRequired={true} 
                hasError={validationErrors.type_etat_des_lieux}
              >
                Type d'état des lieux
              </RequiredLabel>
              <Select 
                value={typeEtatDesLieux} 
                onValueChange={(value) => {
                  setTypeEtatDesLieux(value);
                  if (validationErrors.type_etat_des_lieux && value) {
                    setValidationErrors(prev => ({ ...prev, type_etat_des_lieux: false }));
                  }
                }}
              >
                <SelectTrigger className={`mt-1 ${validationErrors.type_etat_des_lieux ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">État des lieux d'entrée</SelectItem>
                  <SelectItem value="sortie">État des lieux de sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <RequiredLabel 
                htmlFor="typeBien" 
                isRequired={true} 
                hasError={validationErrors.type_bien}
              >
                Type de bien
              </RequiredLabel>
              <Select 
                value={typeBien} 
                onValueChange={(value) => {
                  setTypeBien(value);
                  if (validationErrors.type_bien && value) {
                    setValidationErrors(prev => ({ ...prev, type_bien: false }));
                  }
                }}
              >
                <SelectTrigger className={`mt-1 ${validationErrors.type_bien ? 'border-red-500' : ''}`}>
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
          </div>

          <div>
            <Label htmlFor="statut">Statut du rendez-vous</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planifie">Planifié</SelectItem>
                <SelectItem value="realise">Réalisé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
                <SelectItem value="reporte">Reporté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="note_personnelle">Note personnelle (optionnel)</Label>
            <Textarea
              id="note_personnelle"
              value={note_personnelle}
              onChange={(e) => setNote_personnelle(e.target.value)}
              placeholder="Ajouter une note personnelle ici..."
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleAddRendezVous} 
              className="mt-4 w-full" 
              disabled={loading}
            >
              {loading ? "Enregistrement en cours..." : "Ajouter un rendez-vous"}
            </Button>
          </div>
        </div>
        
        {/* Liste des rendez-vous */}
        <div>
          {rendezVous.length === 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-2">Rendez-vous :</h3>
              <p className="text-gray-500">Aucun rendez-vous planifié.</p>
            </div>
          ) : (
            <div>
              {/* Rendez-vous à venir */}
              {rdvAVenir.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3 text-blue-700 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Rendez-vous à venir ({rdvAVenir.length})
                  </h3>
                  <ul className="space-y-3">
                    {rdvAVenir.map((rv, index) => (
                      <li key={rv.id || index} className="p-3 border rounded-md bg-white border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-black">
                            {rv.date?.toLocaleDateString()}
                            {rv.heure && ` à ${rv.heure}`}
                            {rv.duree && ` (Durée: ${rv.duree})`}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${getStatutColor(rv.statut || 'planifie')}`}>
                              {getStatutLabel(rv.statut || 'planifie')}
                            </span>
                          </div>
                        </div>
                        {rv.description && <p className="text-sm text-gray-600">{rv.description}</p>}
                        {rv.type_etat_des_lieux && <p className="text-sm text-gray-600">Type d'EDL: {rv.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}</p>}
                        {rv.type_bien && <p className="text-sm text-gray-600">Type de bien: {rv.type_bien}</p>}
                        <p className="text-sm text-gray-600">
                          Adresse: {rv.adresse}, {rv.code_postal} {rv.ville}
                        </p>
                        <p className="text-sm text-gray-600">
                          Contact: {rv.nom_contact} - {rv.telephone_contact} - {rv.email_contact}
                        </p>
                        {(rv.latitude && rv.longitude) && (
                          <p className="text-sm text-gray-600">
                            Coordonnées: {rv.latitude}, {rv.longitude}
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
                </div>
              )}

              {/* Rendez-vous passés */}
              {rdvPasses.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-600 flex items-center">
                    <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                    Rendez-vous terminés ({rdvPasses.length})
                  </h3>
                  <ul className="space-y-3">
                    {rdvPasses.map((rv, index) => (
                      <li key={rv.id || index} className="p-3 border rounded-md bg-gray-50 border-gray-300">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-600">
                            {rv.date?.toLocaleDateString()}
                            {rv.heure && ` à ${rv.heure}`}
                            {rv.duree && ` (Durée: ${rv.duree})`}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${getStatutColor(rv.statut || 'planifie')}`}>
                              {getStatutLabel(rv.statut || 'planifie')}
                            </span>
                          </div>
                        </div>
                        {rv.description && <p className="text-sm text-gray-500">{rv.description}</p>}
                        {rv.type_etat_des_lieux && <p className="text-sm text-gray-500">Type d'EDL: {rv.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}</p>}
                        {rv.type_bien && <p className="text-sm text-gray-500">Type de bien: {rv.type_bien}</p>}
                        <p className="text-sm text-gray-500">
                          Adresse: {rv.adresse}, {rv.code_postal} {rv.ville}
                        </p>
                        <p className="text-sm text-gray-500">
                          Contact: {rv.nom_contact} - {rv.telephone_contact} - {rv.email_contact}
                        </p>
                        {(rv.latitude && rv.longitude) && (
                          <p className="text-sm text-gray-400">
                            Coordonnées: {rv.latitude}, {rv.longitude}
                          </p>
                        )}
                        {rv.note_personnelle && (
                          <p className="text-sm text-gray-400 mt-1 italic">
                            Note: {rv.note_personnelle}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}