import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

interface RendezVous {
  id?: string;
  date: Date; // Obligatoire dans la DB
  heure: string; // Obligatoire dans la DB
  duree?: string;
  description?: string;
  adresse: string; // Obligatoire dans la DB
  code_postal: string; // Obligatoire dans la DB
  ville: string; // Obligatoire dans la DB
  latitude?: number;
  longitude?: number;
  nom_contact: string; // Obligatoire dans la DB
  telephone_contact: string; // Obligatoire dans la DB
  email_contact: string; // Obligatoire dans la DB
  note_personnelle?: string;
  type_etat_des_lieux?: string; // Optionnel dans la DB
  type_bien?: string; // Optionnel dans la DB
  created_at?: Date;
  statut?: string; // planifie, realise, annule, reporte
  etat_des_lieux_id?: string;
}

interface ValidationErrors {
  date: boolean;
  heure: boolean;
  adresse: boolean;
  code_postal: boolean;
  ville: boolean;
  nom_contact: boolean;
  telephone_contact: boolean;
  email_contact: boolean;
}

export default function RendezVousCalendar() {
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
  const [typeEtatDesLieux, setTypeEtatDesLieux] = useState<string>('');
  const [typeBien, setTypeBien] = useState<string>('');
  const [statut, setStatut] = useState<string>('planifie');
  
  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    date: false,
    heure: false,
    adresse: false,
    code_postal: false,
    ville: false,
    nom_contact: false,
    telephone_contact: false,
    email_contact: false
  });

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      date: !date,
      heure: !heure.trim(),
      adresse: !adresse.trim(),
      code_postal: !code_postal.trim(),
      ville: !ville.trim(),
      nom_contact: !nom_contact.trim(),
      telephone_contact: !telephone_contact.trim(),
      email_contact: !email_contact.trim() || !email_contact.includes('@')
    };

    setValidationErrors(errors);

    // Retourne true si aucune erreur
    return !Object.values(errors).some(error => error);
  };

  const handleAddRendezVous = () => {
    // Validation des champs obligatoires
    if (!validateForm()) {
      toast({
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir tous les champs obligatoires marqués d'un astérisque (*)",
        variant: "destructive",
      });
      return;
    }

    const newRendezVous: RendezVous = {
      id: `rdv-${Date.now()}`, // Génération d'un ID temporaire
      date: date!,
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
      type_etat_des_lieux: typeEtatDesLieux || undefined,
      type_bien: typeBien || undefined,
      created_at: new Date(),
      statut: statut,
      etat_des_lieux_id: undefined
    };
      
    setRendezVous(prevRendezVous => [...prevRendezVous, newRendezVous].sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
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
    setTypeEtatDesLieux('');
    setTypeBien('');
    setStatut('planifie');
    setValidationErrors({ 
      date: false, 
      heure: false, 
      adresse: false, 
      code_postal: false, 
      ville: false, 
      nom_contact: false, 
      telephone_contact: false, 
      email_contact: false 
    });

    toast({
      title: "Rendez-vous ajouté",
      description: `Rendez-vous ${date!.toLocaleDateString()} à ${heure} enregistré avec succès.`,
    });
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
        <h3 className="font-semibold text-blue-800 mb-2">Champs obligatoires dans la base de données :</h3>
        <ul className="text-sm text-blue-700 list-disc list-inside grid grid-cols-2 gap-1">
          <li>Date du rendez-vous</li>
          <li>Heure du rendez-vous</li>
          <li>Adresse complète</li>
          <li>Code postal</li>
          <li>Ville</li>
          <li>Nom du contact</li>
          <li>Téléphone du contact</li>
          <li>Email du contact</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
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
          
          <div className="mt-4">
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
          
          <div className="mt-4">
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
          
          <div className="mt-4">
            <RequiredLabel 
              htmlFor="nom_contact" 
              isRequired={true} 
              hasError={validationErrors.nom_contact}
            >
              Personne à contacter
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
          
          <div className="mt-4">
            <RequiredLabel 
              htmlFor="telephone_contact" 
              isRequired={true} 
              hasError={validationErrors.telephone_contact}
            >
              Téléphone du contact
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
          
          <div className="mt-4">
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
          
          <div className="mt-4 grid grid-cols-2 gap-4">
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
          
          <div className="mt-4">
            <Label htmlFor="typeEtatDesLieux">Type d'état des lieux (optionnel)</Label>
            <Select value={typeEtatDesLieux} onValueChange={setTypeEtatDesLieux}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entree">État des lieux d'entrée</SelectItem>
                <SelectItem value="sortie">État des lieux de sortie</SelectItem>
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
          
          <Button onClick={handleAddRendezVous} className="mt-4 w-full">
            Ajouter un rendez-vous
          </Button>
        </div>
        
        <div>
          {rendezVous.length === 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-2">Rendez-vous :</h3>
              <p className="text-gray-500">Aucun rendez-vous planifié.</p>
            </div>
          ) : (
            <div>
              {(() => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                // Séparer les rendez-vous en deux catégories
                const rdvAVenir = rendezVous.filter(rv => {
                  const rvDateOnly = new Date(rv.date.getFullYear(), rv.date.getMonth(), rv.date.getDate());
                  return rvDateOnly >= today;
                }).sort((a, b) => a.date.getTime() - b.date.getTime());
                
                const rdvPasses = rendezVous.filter(rv => {
                  const rvDateOnly = new Date(rv.date.getFullYear(), rv.date.getMonth(), rv.date.getDate());
                  return rvDateOnly < today;
                }).sort((a, b) => b.date.getTime() - a.date.getTime());

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

                const renderRendezVous = (rv: RendezVous, index: number, isPast: boolean = false) => (
                  <li key={index} className={`p-3 border rounded-md ${isPast ? 'bg-gray-50 border-gray-300' : 'bg-white border-blue-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-medium ${isPast ? 'text-gray-600' : 'text-black'}`}>
                        {rv.date.toLocaleDateString()}
                        {rv.heure && ` à ${rv.heure}`}
                        {rv.duree && ` (Durée: ${rv.duree})`}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatutColor(rv.statut || 'planifie')}`}>
                          {getStatutLabel(rv.statut || 'planifie')}
                        </span>
                      </div>
                    </div>
                    {rv.description && <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>{rv.description}</p>}
                    {rv.type_etat_des_lieux && <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>Type d'EDL: {rv.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}</p>}
                    {rv.type_bien && <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>Type de bien: {rv.type_bien}</p>}
                    <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                      Adresse: {rv.adresse}, {rv.code_postal} {rv.ville}
                    </p>
                    <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                      Contact: {rv.nom_contact} - {rv.telephone_contact} - {rv.email_contact}
                    </p>
                    {(rv.latitude && rv.longitude) && (
                      <p className={`text-sm ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                        Coordonnées: {rv.latitude}, {rv.longitude}
                      </p>
                    )}
                    {rv.note_personnelle && (
                      <p className={`text-sm ${isPast ? 'text-gray-400' : 'text-gray-500'} mt-1 italic`}>
                        Note: {rv.note_personnelle}
                      </p>
                    )}
                  </li>
                );

                return (
                  <div>
                    {/* Rendez-vous à venir */}
                    {rdvAVenir.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-blue-700 flex items-center">
                          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                          Rendez-vous à venir ({rdvAVenir.length})
                        </h3>
                        <ul className="space-y-3">
                          {rdvAVenir.map((rv, index) => renderRendezVous(rv, index, false))}
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
                          {rdvPasses.map((rv, index) => renderRendezVous(rv, index + rdvAVenir.length, true))}
                        </ul>
                      </div>
                    )}

                    {/* Message si aucun rendez-vous */}
                    {rdvAVenir.length === 0 && rdvPasses.length === 0 && (
                      <p className="text-gray-500">Aucun rendez-vous planifié.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}