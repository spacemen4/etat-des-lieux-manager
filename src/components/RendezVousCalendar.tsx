import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

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
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      };
      setRendezVous([...rendezVous, newRendezVous]);
      setDescription('');
      setAdresse('');
      setCodePostal('');
      setVille('');
      setLatitude('');
      setLongitude('');
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
          <div className="mt-4">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Ex: 48.8566"
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Ex: 2.3522"
              className="mt-1"
            />
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
