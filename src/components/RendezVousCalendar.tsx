import React, { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

  const handleAddRendezVous = () => {
    if (date && description && adresse && codePostal && ville && nomContact && telephoneContact && emailContact && heure && duree) {
      const newRendezVous: RendezVous = {
        date,
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
      };
      setRendezVous([...rendezVous, newRendezVous]);
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
      toast({
        title: "Rendez-vous ajouté",
        description: `Rendez-vous pour le ${date.toLocaleDateString()} à ${heure} avec ${nomContact}.`,
      });
    } else {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
    }
  };

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