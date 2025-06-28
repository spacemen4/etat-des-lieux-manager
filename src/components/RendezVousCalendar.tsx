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
import { toast } from '@/components/ui/use-toast';

interface RendezVous {
  date: Date;
  description: string;
  adresse: string;
  codePostal: string;
  ville: string;
  nomContact: string;
  telephoneContact: string;
  emailContact: string;
  heure: string;
  duree: string;
  latitude?: number;
  longitude?: number;
  notePersonnelle?: string;
  typeEtatDesLieux?: string;
  typeBien?: string;
}

export function RendezVousCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [nomContact, setNomContact] = useState('');
  const [telephoneContact, setTelephoneContact] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [heure, setHeure] = useState('');
  const [duree, setDuree] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [notePersonnelle, setNotePersonnelle] = useState('');
  const [typeEtatDesLieux, setTypeEtatDesLieux] = useState<string | undefined>(undefined);
  const [typeBien, setTypeBien] = useState<string | undefined>(undefined);

  // Fetch existing rendez-vous from Supabase
  useEffect(() => {
    const fetchRendezVous = async () => {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .order('date', { ascending: true }); // Assuming you want them ordered by date

      if (error) {
        console.error('Error fetching rendez-vous:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les rendez-vous depuis la base de données.",
          variant: "destructive",
        });
      } else if (data) {
        // Ensure date strings are converted to Date objects
        const formattedData = data.map(item => ({
          ...item,
          date: new Date(item.date),
        }));
        setRendezVous(formattedData);
      }
    };

    fetchRendezVous();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddRendezVous = async () => { // Made async to handle Supabase call
    if (date && description && adresse && codePostal && ville && nomContact && telephoneContact && emailContact && heure && duree && typeEtatDesLieux && typeBien) {
      const newRendezVousData = {
        date: date.toISOString().split('T')[0], // Format date as YYYY-MM-DD for Supabase
        description,
        adresse,
        codePostal,
        ville,
        nomContact,
        telephoneContact,
        emailContact,
        heure,
        duree,
        latitude: latitude,
        longitude: longitude,
        notePersonnelle: notePersonnelle,
        typeEtatDesLieux: typeEtatDesLieux,
        typeBien: typeBien,
        // Supabase will generate id, created_at, updated_at
      };

      const { data: insertedData, error } = await supabase
        .from('rendez_vous')
        .insert([newRendezVousData])
        .select(); // .select() returns the inserted row(s)

      if (error) {
        console.error('Error adding rendez-vous:', error);
        toast({
          title: "Erreur d'ajout",
          description: "Impossible d'ajouter le rendez-vous à la base de données. Message: " + error.message,
          variant: "destructive",
        });
      } else if (insertedData && insertedData.length > 0) {
        // Add to local state after successful insertion
        // Convert date back to Date object for local state consistency
        const newRendezVousWithDateObject: RendezVous = {
          ...insertedData[0],
          date: new Date(insertedData[0].date),
        };
        setRendezVous(prevRendezVous => [...prevRendezVous, newRendezVousWithDateObject].sort((a, b) => a.date.getTime() - b.date.getTime()));

        // Reset form fields
        setDescription('');
        setAdresse('');
        setCodePostal('');
        setVille('');
        setLatitude(undefined);
        setLongitude(undefined);
        setNomContact('');
        setTelephoneContact('');
        setEmailContact('');
        setHeure('');
        setDuree('');
        setNotePersonnelle('');
        setTypeEtatDesLieux(undefined);
        setTypeBien(undefined);
        // setDate(new Date()); // Optionally reset date, or keep it for next entry

        toast({
          title: "Rendez-vous ajouté",
          description: `Rendez-vous pour le ${date.toLocaleDateString()} à ${heure} avec ${nomContact} a été enregistré.`,
        });
      }
    } else {
      toast({
        title: "Erreur de formulaire",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
    }
  };

  // Original handleAddRendezVous for reference before Supabase integration
  // const handleAddRendezVous_local = () => {
  //   if (date && description && adresse && codePostal && ville && nomContact && telephoneContact && emailContact && heure && duree && typeEtatDesLieux && typeBien) {
  //     const newRendezVous: RendezVous = {
  // date,
  // description,
  // adresse,
  // codePostal,
  // ville,
  // nomContact,
  // telephoneContact,
  // emailContact,
  // heure,
  // duree,
  // latitude: latitude,
  // longitude: longitude,
  // notePersonnelle: notePersonnelle,
  // typeEtatDesLieux: typeEtatDesLieux,
  // typeBien: typeBien,
  //     };
  //     setRendezVous([...rendezVous, newRendezVous]);
  //     setDescription('');
  //     setAdresse('');
  //     setCodePostal('');
  //     setVille('');
  //     setLatitude(undefined);
  //     setLongitude(undefined);
  //     setNomContact('');
  //     setTelephoneContact('');
  //     setEmailContact('');
  //     setHeure('');
  //     setDuree('');
  //     setNotePersonnelle('');
  //     setTypeEtatDesLieux(undefined);
  //     setTypeBien(undefined);
  //     toast({
  //       title: "Rendez-vous ajouté",
  //       description: `Rendez-vous pour le ${date.toLocaleDateString()} à ${heure} avec ${nomContact}.`,
  //     });
  //   } else {
  //     toast({
  //       title: "Erreur",
  //       description: "Veuillez remplir tous les champs obligatoires.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Calendrier des États des Lieux</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <div className="mt-4">
            <Label htmlFor="description">Description du rendez-vous</Label>
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
            <Label htmlFor="typeEtatDesLieux">Type d'état des lieux</Label>
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
            <Label htmlFor="typeBien">Type de bien</Label>
            <Select value={typeBien} onValueChange={setTypeBien}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Etat des lieux Studio</SelectItem>
                <SelectItem value="t2-t3">Etat des lieux T2 – T3</SelectItem>
                <SelectItem value="t4-t5">Etat des lieux T4 – T5</SelectItem>
                <SelectItem value="mobilier">Inventaire du mobilier</SelectItem>
                <SelectItem value="bureau">Etat des lieux Bureau</SelectItem>
                <SelectItem value="local">Etat des lieux Local commercial</SelectItem>
                <SelectItem value="garage">Etat des lieux Garage / Box</SelectItem>
                <SelectItem value="pieces-supplementaires">Pièces supplémentaires</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label htmlFor="heure">Heure du rendez-vous</Label>
            <Input
              id="heure"
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="duree">Durée prévue (ex: 1h30)</Label>
            <Input
              id="duree"
              type="text"
              value={duree}
              onChange={(e) => setDuree(e.target.value)}
              placeholder="1h30"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="123 rue de la Paix"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="codePostal">Code Postal</Label>
            <Input
              id="codePostal"
              type="text"
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              placeholder="75000"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="ville">Ville</Label>
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
            <Label>Localisation du rendez-vous</Label>
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
            <Label htmlFor="nomContact">Personne à contacter (Nom)</Label>
            <Input
              id="nomContact"
              type="text"
              value={nomContact}
              onChange={(e) => setNomContact(e.target.value)}
              placeholder="Jean Dupont"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="telephoneContact">Téléphone du contact</Label>
            <Input
              id="telephoneContact"
              type="tel"
              value={telephoneContact}
              onChange={(e) => setTelephoneContact(e.target.value)}
              placeholder="0612345678"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="emailContact">Email du contact</Label>
            <Input
              id="emailContact"
              type="email"
              value={emailContact}
              onChange={(e) => setEmailContact(e.target.value)}
              placeholder="jean.dupont@example.com"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="notePersonnelle">Note personnelle</Label>
            <Textarea
              id="notePersonnelle"
              value={notePersonnelle}
              onChange={(e) => setNotePersonnelle(e.target.value)}
              placeholder="Ajouter une note personnelle ici..."
              className="mt-1"
            />
          </div>
          <Button onClick={handleAddRendezVous} className="mt-4">
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
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((rv, index) => (
                  <li key={index} className="p-2 border rounded-md">
                    <p className="font-medium">
                      {rv.date.toLocaleDateString()} à {rv.heure} (Durée: {rv.duree})
                    </p>
                    <p className="text-sm text-gray-600">{rv.description}</p>
                    {rv.typeEtatDesLieux && <p className="text-sm text-gray-600">Type d'EDL: {rv.typeEtatDesLieux}</p>}
                    {rv.typeBien && <p className="text-sm text-gray-600">Type de bien: {rv.typeBien}</p>}
                    <p className="text-sm text-gray-600">
                      Adresse: {rv.adresse}, {rv.codePostal} {rv.ville}
                    </p>
                    <p className="text-sm text-gray-600">
                      Contact: {rv.nomContact} - {rv.telephoneContact} - {rv.emailContact}
                    </p>
                    {(rv.latitude || rv.longitude) && (
                      <p className="text-sm text-gray-600">
                        Coordonnées: {rv.latitude}{rv.latitude && rv.longitude && ', '}
                        {rv.longitude}
                      </p>
                    )}
                    {rv.notePersonnelle && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Note: {rv.notePersonnelle}
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

  // This is to ensure the map renders correctly after initial load or tab switches
  const [map, setMap] = useState<L.Map | null>(null);
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100); // Small delay to ensure container is sized
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