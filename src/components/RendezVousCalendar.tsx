import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RendezVous {
  id?: number;
  date?: Date;
  description?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  nom_contact?: string;
  telephone_contact?: string;
  email_contact?: string;
  heure: string; // Obligatoire
  duree?: string;
  latitude?: number;
  longitude?: number;
  note_personnelle?: string;
  type_etat_des_lieux: string; // Obligatoire
  type_bien: string; // Obligatoire
  validation_finale?: boolean;
  releves_compteurs?: string;
  etat_pieces?: string;
  remise_cles?: boolean;
}

interface ValidationErrors {
  type_etat_des_lieux: boolean;
  type_bien: boolean;
  heure: boolean;
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
  const [validationFinale, setValidationFinale] = useState(false);
  const [relevesCompteurs, setRelevesCompteurs] = useState('');
  const [etatPieces, setEtatPieces] = useState('');
  const [remiseCles, setRemiseCles] = useState(false);
  
  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    type_etat_des_lieux: false,
    type_bien: false,
    heure: false
  });

  // Simulation de l'état avec des données en mémoire
  useEffect(() => {
    // Données d'exemple pour la démonstration
    const exampleData: RendezVous[] = [
      {
        id: 1,
        date: new Date('2025-07-01'),
        description: 'État des lieux d\'entrée',
        adresse: '123 rue de la Paix',
        ville: 'Paris',
        heure: '14:00',
        type_etat_des_lieux: 'entree',
        type_bien: 't2-t3',
        validation_finale: true
      }
    ];
    setRendezVous(exampleData);
  }, []);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      type_etat_des_lieux: !typeEtatDesLieux.trim(),
      type_bien: !typeBien.trim(),
      heure: !heure.trim()
    };

    setValidationErrors(errors);

    // Retourne true si aucune erreur
    return !Object.values(errors).some(error => error);
  };

  const handleAddRendezVous = () => {
    // Validation des champs obligatoires
    if (!validateForm()) {
      alert("Veuillez remplir tous les champs obligatoires : Type d'état des lieux, Type de bien et Heure du rendez-vous.");
      return;
    }

    // Utilise la date du jour si aucune date n'est sélectionnée
    const finalDate = date || new Date();

    const newRendezVous: RendezVous = {
      id: rendezVous.length + 1,
      date: finalDate,
      description: description.trim() || undefined,
      adresse: adresse.trim() || undefined,
      code_postal: code_postal.trim() || undefined,
      ville: ville.trim() || undefined,
      nom_contact: nom_contact.trim() || undefined,
      telephone_contact: telephone_contact.trim() || undefined,
      email_contact: email_contact.trim() || undefined,
      heure: heure.trim(),
      duree: duree.trim() || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      note_personnelle: note_personnelle.trim() || undefined,
      type_etat_des_lieux: typeEtatDesLieux,
      type_bien: typeBien,
      validation_finale: validationFinale,
      releves_compteurs: relevesCompteurs.trim() || undefined,
      etat_pieces: etatPieces.trim() || undefined,
      remise_cles: remiseCles,
    };
      
    setRendezVous(prevRendezVous => [...prevRendezVous, newRendezVous].sort((a, b) => {
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
    setTypeEtatDesLieux('');
    setTypeBien('');
    setValidationFinale(false);
    setRelevesCompteurs('');
    setEtatPieces('');
    setRemiseCles(false);
    setValidationErrors({ type_etat_des_lieux: false, type_bien: false, heure: false });

    alert(`Rendez-vous ${finalDate.toLocaleDateString()} à ${heure} enregistré avec succès.`);
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
          <li>Type d'état des lieux</li>
          <li>Type de bien</li>
          <li>Heure du rendez-vous</li>
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
              <SelectTrigger className={`mt-1 ${validationErrors.type_etat_des_lieux ? 'border-red-500 focus:border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entree">État des lieux d'entrée</SelectItem>
                <SelectItem value="sortie">État des lieux de sortie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4">
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
              <SelectTrigger className={`mt-1 ${validationErrors.type_bien ? 'border-red-500 focus:border-red-500' : ''}`}>
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
            <Label htmlFor="adresse">Adresse du bien (optionnel)</Label>
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
              onCheckedChange={(checked) => setValidationFinale(checked as boolean)}
            />
            <Label htmlFor="validation_finale">Validation finale (optionnel)</Label>
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
                    {rv.type_etat_des_lieux && <p className="text-sm text-gray-600">Type d'EDL: {rv.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}</p>}
                    {rv.type_bien && <p className="text-sm text-gray-600">Type de bien: {rv.type_bien}</p>}
                    {rv.adresse && (
                      <p className="text-sm text-gray-600">
                        Adresse: {rv.adresse}
                        {rv.code_postal && `, ${rv.code_postal}`}
                        {rv.ville && ` ${rv.ville}`}
                      </p>
                    )}
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
