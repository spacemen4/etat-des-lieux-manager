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
  code_postal: string; // Changed from codePostal
  ville: string;
  nom_contact: string;
  telephone_contact: string;
  email_contact: string;
  heure: string;
  duree: string;
  latitude?: number;
  longitude?: number;
  note_personnelle?: string; // Changed from notePersonnelle
  type_etat_des_lieux?: string; // Schema alignment
  type_bien?: string;         // Schema alignment
}

export function RendezVousCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [code_postal, setCode_postal] = useState(''); // Changed from codePostal
  const [ville, setVille] = useState('');
  const [nom_contact, setNom_contact] = useState('');
  const [telephone_contact, setTelephone_contact] = useState('');
  const [email_contact, setEmail_contact] = useState('');
  const [heure, setHeure] = useState('');
  const [duree, setDuree] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [note_personnelle, setNote_personnelle] = useState(''); // Changed from notePersonnelle
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
        // And ensure all fields match the RendezVous interface, including code_postal
        const formattedData: RendezVous[] = data.map(item => ({
          ...item,
          date: new Date(item.date),
          code_postal: item.code_postal, // Ensure this mapping if it's not automatic
        }));
        setRendezVous(formattedData);
      }
    };

    fetchRendezVous();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddRendezVous = async () => { // Made async to handle Supabase call
    if (date && description && adresse && code_postal && ville && nom_contact && telephone_contact && email_contact && heure && duree && typeEtatDesLieux && typeBien) { // Changed codePostal to code_postal
      const newRendezVousData = {
        date: date.toISOString().split('T')[0], // Format date as YYYY-MM-DD for Supabase
        description,
        adresse,
        code_postal: code_postal, // Changed codePostal to code_postal
        ville,
        nom_contact: nom_contact,
        telephone_contact: telephone_contact,
        email_contact: email_contact,
        heure,
        duree,
        latitude: latitude,
        longitude: longitude,
        note_personnelle: note_personnelle, // Changed from notePersonnelle
        type_etat_des_lieux: typeEtatDesLieux, // Schema alignment
        type_bien: typeBien,                 // Schema alignment
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
        setCode_postal(''); // Changed from setCodePostal
        setVille('');
        setLatitude(undefined);
        setLongitude(undefined);
        setNom_contact('');
        setTelephone_contact('');
        setEmail_contact('');
        setHeure('');
        setDuree('');
        setNote_personnelle(''); // Changed from setNotePersonnelle
        setTypeEtatDesLieux(undefined);
        setTypeBien(undefined);
        // setDate(new Date()); // Optionally reset date, or keep it for next entry

        toast({
          title: "Rendez-vous ajouté",
          description: `Rendez-vous pour le ${date.toLocaleDateString()} à ${heure} avec ${nom_contact} a été enregistré.`,
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
  //   if (date && description && adresse && code_postal && ville && nom_contact && telephone_contact && email_contact && heure && duree && typeEtatDesLieux && typeBien) { // Changed codePostal
  //     const newRendezVous: RendezVous = {
  // date,
  // description,
  // adresse,
  // code_postal, // Changed codePostal
  // ville,
  // nom_contact,
  // telephone_contact,
  // email_contact,
  // heure,
  // duree,
  // latitude: latitude,
  // longitude: longitude,
  // note_personnelle: note_personnelle, // Changed from notePersonnelle
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
  //     setNom_contact('');
  //     setTelephone_contact('');
  //     setEmail_contact('');
  //     setHeure('');
  //     setDuree('');
  //     setNotePersonnelle('');
  //     setTypeEtatDesLieux(undefined);
  //     setTypeBien(undefined);
  //     toast({
  //       title: "Rendez-vous ajouté",
  //       description: `Rendez-vous pour le ${date.toLocaleDateString()} à ${heure} avec ${nom_contact}.`,
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
            <Label htmlFor="code_postal">Code Postal</Label> {/* Changed htmlFor */}
            <Input
              id="code_postal" // Changed id
              type="text"
              value={code_postal} // Changed value
              onChange={(e) => setCode_postal(e.target.value)} // Changed onChange
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
            <Label htmlFor="nom_contact">Personne à contacter (Nom)</Label>
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
            <Label htmlFor="telephone_contact">Téléphone du contact</Label>
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
            <Label htmlFor="email_contact">Email du contact</Label>
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
            <Label htmlFor="note_personnelle">Note personnelle</Label>
            <Textarea
              id="note_personnelle" // Matches htmlFor for label linking
              value={note_personnelle} // Changed from notePersonnelle
              onChange={(e) => setNote_personnelle(e.target.value)} // Changed from setNotePersonnelle
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
                    {rv.type_etat_des_lieux && <p className="text-sm text-gray-600">Type d'EDL: {rv.type_etat_des_lieux}</p>}
                    {rv.type_bien && <p className="text-sm text-gray-600">Type de bien: {rv.type_bien}</p>}
                    <p className="text-sm text-gray-600">
                      Adresse: {rv.adresse}, {rv.code_postal} {rv.ville} {/* Changed rv.codePostal */}
                    </p>
                    <p className="text-sm text-gray-600">
                      Contact: {rv.nom_contact} - {rv.telephone_contact} - {rv.email_contact}
                    </p>
                    {(rv.latitude || rv.longitude) && (
                      <p className="text-sm text-gray-600">
                        Coordonnées: {rv.latitude}{rv.latitude && rv.longitude && ', '}
                        {rv.longitude}
                      </p>
                    )}
                    {rv.note_personnelle && ( // Changed from rv.notePersonnelle
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Note: {rv.note_personnelle} {/* Changed from rv.notePersonnelle */}
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