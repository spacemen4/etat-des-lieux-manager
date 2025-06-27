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
}

export function RendezVousCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [description, setDescription] = useState('');

  const handleAddRendezVous = () => {
    if (date && description) {
      const newRendezVous: RendezVous = { date, description };
      setRendezVous([...rendezVous, newRendezVous]);
      setDescription('');
      toast({
        title: "Rendez-vous ajouté",
        description: `Rendez-vous pour le ${date.toLocaleDateString()} avec la description : ${description}`,
      });
    } else {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date et entrer une description.",
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
                    <p className="font-medium">{rv.date.toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{rv.description}</p>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
