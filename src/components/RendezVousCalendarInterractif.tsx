import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, Phone, Mail, Edit3, Trash2, Plus, MoreVertical } from 'lucide-react';

interface RendezVous {
  id: string;
  date: Date;
  heure: string;
  duree?: string;
  description?: string;
  adresse: string;
  code_postal: string;
  ville: string;
  latitude?: number;
  longitude?: number;
  nom_contact: string;
  telephone_contact: string;
  email_contact: string;
  note_personnelle?: string;
  type_etat_des_lieux: string;
  type_bien: string;
  statut: string;
  created_at: Date;
  user_id: string;
}

const RendezVousCalendar = ({ rendezVousData }: { rendezVousData: RendezVous[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>(rendezVousData);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // État pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    date: '',
    heure: '',
    duree: '',
    description: '',
    adresse: '',
    code_postal: '',
    ville: '',
    nom_contact: '',
    telephone_contact: '',
    email_contact: '',
    note_personnelle: '',
    type_etat_des_lieux: '',
    type_bien: '',
    statut: ''
  });

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getStatutColor = (statut: string) => {
    switch(statut) {
      case 'planifie': return 'bg-blue-500';
      case 'realise': return 'bg-green-500';
      case 'annule': return 'bg-red-500';
      case 'reporte': return 'bg-yellow-500';
      default: return 'bg-gray-500';
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

  const getTypeEtatLabel = (type: string) => {
    return type === 'entree' ? 'EDL Entrée' : 'EDL Sortie';
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      direction === 'prev' 
        ? newDate.setMonth(newDate.getMonth() - 1) 
        : newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      direction === 'prev' 
        ? newDate.setDate(newDate.getDate() - 7) 
        : newDate.setDate(newDate.getDate() + 7);
    } else {
      direction === 'prev' 
        ? newDate.setDate(newDate.getDate() - 1) 
        : newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Ajusté pour commencer par lundi

    const days = [];
    
    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajusté pour commencer par lundi
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      days.push(weekDay);
    }
    return days;
  };

  const getRendezVousForDate = (date: Date) => {
    return rendezVous.filter(rdv => {
      const rdvDate = new Date(rdv.date);
      return rdvDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.heure.localeCompare(b.heure));
  };

  const openEditModal = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setEditForm({
      date: rdv.date.toISOString().split('T')[0],
      heure: rdv.heure,
      duree: rdv.duree || '',
      description: rdv.description || '',
      adresse: rdv.adresse,
      code_postal: rdv.code_postal,
      ville: rdv.ville,
      nom_contact: rdv.nom_contact,
      telephone_contact: rdv.telephone_contact,
      email_contact: rdv.email_contact,
      note_personnelle: rdv.note_personnelle || '',
      type_etat_des_lieux: rdv.type_etat_des_lieux,
      type_bien: rdv.type_bien,
      statut: rdv.statut
    });
    setIsEditModalOpen(true);
  };

  const saveEditRendezVous = () => {
    if (!selectedRendezVous) return;

    const updatedRendezVous = {
      ...selectedRendezVous,
      date: new Date(editForm.date + 'T' + editForm.heure),
      heure: editForm.heure,
      duree: editForm.duree || undefined,
      description: editForm.description || undefined,
      adresse: editForm.adresse,
      code_postal: editForm.code_postal,
      ville: editForm.ville,
      nom_contact: editForm.nom_contact,
      telephone_contact: editForm.telephone_contact,
      email_contact: editForm.email_contact,
      note_personnelle: editForm.note_personnelle || undefined,
      type_etat_des_lieux: editForm.type_etat_des_lieux,
      type_bien: editForm.type_bien,
      statut: editForm.statut
    };

    setRendezVous(prev => prev.map(rdv => 
      rdv.id === selectedRendezVous.id ? updatedRendezVous : rdv
    ));

    setIsEditModalOpen(false);
    setSelectedRendezVous(null);
  };

  const deleteRendezVous = (id: string) => {
    setRendezVous(prev => prev.filter(rdv => rdv.id !== id));
  };

  const openCreateModal = (date: Date) => {
    setSelectedDate(date);
    setEditForm({
      date: date.toISOString().split('T')[0],
      heure: '09:00',
      duree: '',
      description: '',
      adresse: '',
      code_postal: '',
      ville: '',
      nom_contact: '',
      telephone_contact: '',
      email_contact: '',
      note_personnelle: '',
      type_etat_des_lieux: '',
      type_bien: '',
      statut: 'planifie'
    });
    setIsCreateModalOpen(true);
  };

  const createRendezVous = () => {
    const newRendezVous: RendezVous = {
      id: Date.now().toString(),
      date: new Date(editForm.date + 'T' + editForm.heure),
      heure: editForm.heure,
      duree: editForm.duree || undefined,
      description: editForm.description || undefined,
      adresse: editForm.adresse,
      code_postal: editForm.code_postal,
      ville: editForm.ville,
      nom_contact: editForm.nom_contact,
      telephone_contact: editForm.telephone_contact,
      email_contact: editForm.email_contact,
      note_personnelle: editForm.note_personnelle || undefined,
      type_etat_des_lieux: editForm.type_etat_des_lieux,
      type_bien: editForm.type_bien,
      statut: editForm.statut,
      created_at: new Date(),
      user_id: 'user1'
    };

    setRendezVous(prev => [...prev, newRendezVous]);
    setIsCreateModalOpen(false);
    setSelectedDate(null);
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
        {days.map((dayInfo, index) => {
          const dayRendezVous = getRendezVousForDate(dayInfo.date);
          const isToday = dayInfo.date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                !dayInfo.isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'bg-white'
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              onClick={() => openCreateModal(dayInfo.date)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {dayInfo.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayRendezVous.slice(0, 3).map(rdv => (
                  <div
                    key={rdv.id}
                    className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${getStatutColor(rdv.statut)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(rdv);
                    }}
                  >
                    {rdv.heure} - {getTypeEtatLabel(rdv.type_etat_des_lieux)}
                  </div>
                ))}
                {dayRendezVous.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayRendezVous.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const timeSlots = Array.from({ length: 24 }, (_, i) => 
      `${i.toString().padStart(2, '0')}:00`
    );
    
    return (
      <div className="flex">
        <div className="w-16 flex-shrink-0">
          <div className="h-12 border-b border-gray-200"></div>
          {timeSlots.map(time => (
            <div key={time} className="h-12 border-b border-gray-100 text-xs text-gray-500 px-2 py-1">
              {time}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map(day => {
            const dayRendezVous = getRendezVousForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div key={day.toDateString()} className="border-l border-gray-200">
                <div className={`h-12 border-b border-gray-200 p-2 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-xs text-gray-600">{daysOfWeek[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="relative">
                  {timeSlots.map(time => (
                    <div
                      key={time}
                      className="h-12 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => openCreateModal(day)}
                    />
                  ))}
                  {dayRendezVous.map(rdv => {
                    const startHour = parseInt(rdv.heure.split(':')[0]);
                    const startMinute = parseInt(rdv.heure.split(':')[1]);
                    const topPosition = (startHour * 48) + (startMinute * 48 / 60);
                    
                    return (
                      <div
                        key={rdv.id}
                        className={`absolute left-1 right-1 ${getStatutColor(rdv.statut)} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 z-10`}
                        style={{ top: `${topPosition}px`, height: '36px' }}
                        onClick={() => openEditModal(rdv)}
                      >
                        <div className="font-medium">{rdv.heure}</div>
                        <div className="truncate">{getTypeEtatLabel(rdv.type_etat_des_lieux)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayRendezVous = getRendezVousForDate(currentDate);
    const timeSlots = Array.from({ length: 24 }, (_, i) => 
      `${i.toString().padStart(2, '0')}:00`
    );
    
    return (
      <div className="flex">
        <div className="w-16 flex-shrink-0">
          <div className="h-12 border-b border-gray-200"></div>
          {timeSlots.map(time => (
            <div key={time} className="h-12 border-b border-gray-100 text-xs text-gray-500 px-2 py-1">
              {time}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative h-[1152px]">
            {timeSlots.map(time => (
              <div
                key={time}
                className="h-12 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => openCreateModal(currentDate)}
              />
            ))}
            {dayRendezVous.map(rdv => {
              const startHour = parseInt(rdv.heure.split(':')[0]);
              const startMinute = parseInt(rdv.heure.split(':')[1]);
              const topPosition = (startHour * 48) + (startMinute * 48 / 60);
              
              return (
                <div
                  key={rdv.id}
                  className={`absolute left-4 right-4 ${getStatutColor(rdv.statut)} text-white p-2 rounded cursor-pointer hover:opacity-80 z-10`}
                  style={{ top: `${topPosition}px`, minHeight: '48px' }}
                  onClick={() => openEditModal(rdv)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{rdv.heure} - {getTypeEtatLabel(rdv.type_etat_des_lieux)}</div>
                      <div className="text-sm">{rdv.description}</div>
                    </div>
                    <div className="text-xs bg-white bg-opacity-20 px-1 rounded">
                      {rdv.duree}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const EditModal = ({ isOpen, onClose, isCreate = false }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Créer un rendez-vous' : 'Modifier le rendez-vous'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="heure">Heure</Label>
              <Input
                id="heure"
                type="time"
                value={editForm.heure}
                onChange={(e) => setEditForm(prev => ({ ...prev, heure: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="duree">Durée prévue</Label>
            <Input
              id="duree"
              placeholder="Ex: 1h30"
              value={editForm.duree}
              onChange={(e) => setEditForm(prev => ({ ...prev, duree: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Description du rendez-vous"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="123 rue de la République"
                value={editForm.adresse}
                onChange={(e) => setEditForm(prev => ({ ...prev, adresse: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="code_postal">Code postal</Label>
              <Input
                id="code_postal"
                placeholder="75000"
                value={editForm.code_postal}
                onChange={(e) => setEditForm(prev => ({ ...prev, code_postal: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              placeholder="Paris"
              value={editForm.ville}
              onChange={(e) => setEditForm(prev => ({ ...prev, ville: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom_contact">Nom du contact</Label>
              <Input
                id="nom_contact"
                placeholder="Jean Dupont"
                value={editForm.nom_contact}
                onChange={(e) => setEditForm(prev => ({ ...prev, nom_contact: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="telephone_contact">Téléphone</Label>
              <Input
                id="telephone_contact"
                type="tel"
                placeholder="0612345678"
                value={editForm.telephone_contact}
                onChange={(e) => setEditForm(prev => ({ ...prev, telephone_contact: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email_contact">Email du contact</Label>
            <Input
              id="email_contact"
              type="email"
              placeholder="jean.dupont@example.com"
              value={editForm.email_contact}
              onChange={(e) => setEditForm(prev => ({ ...prev, email_contact: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_etat_des_lieux">Type d'état des lieux</Label>
              <Select 
                value={editForm.type_etat_des_lieux}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, type_etat_des_lieux: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">État des lieux d'entrée</SelectItem>
                  <SelectItem value="sortie">État des lieux de sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type_bien">Type de bien</Label>
              <Select 
                value={editForm.type_bien}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, type_bien: value }))}
              >
                <SelectTrigger>
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
            <Label htmlFor="statut">Statut</Label>
            <Select 
              value={editForm.statut}
              onValueChange={(value) => setEditForm(prev => ({ ...prev, statut: value }))}
            >
              <SelectTrigger>
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
            <Label htmlFor="note_personnelle">Note personnelle</Label>
            <Textarea
              id="note_personnelle"
              placeholder="Ajouter une note..."
              value={editForm.note_personnelle}
              onChange={(e) => setEditForm(prev => ({ ...prev, note_personnelle: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            {!isCreate && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedRendezVous) {
                    deleteRendezVous(selectedRendezVous.id);
                    onClose();
                  }
                }}
              >
                Supprimer
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={isCreate ? createRendezVous : saveEditRendezVous}>
              {isCreate ? 'Créer' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Calendrier des Rendez-vous</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mois
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Jour
            </Button>
          </div>
        </div>
        
        <Button onClick={() => openCreateModal(new Date())}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigatePeriod('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigatePeriod('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {viewMode === 'month' 
              ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : viewMode === 'week'
                ? `Semaine du ${getWeekDays(currentDate)[0].getDate()} ${months[getWeekDays(currentDate)[0].getMonth()]} ${getWeekDays(currentDate)[0].getFullYear()}`
                : `${currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
            }
          </h2>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Aujourd'hui
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {viewMode === 'month' 
          ? renderMonthView() 
          : viewMode === 'week' 
            ? renderWeekView() 
            : renderDayView()}
      </div>

      <EditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
      
      <EditModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        isCreate={true}
      />

      {selectedRendezVous && (
        <Dialog open={!!selectedRendezVous} onOpenChange={() => setSelectedRendezVous(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Détails du rendez-vous</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openEditModal(selectedRendezVous)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        deleteRendezVous(selectedRendezVous.id);
                        setSelectedRendezVous(null);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span>
                  {selectedRendezVous.date.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                  {' à '}
                  {selectedRendezVous.heure}
                  {selectedRendezVous.duree && ` (${selectedRendezVous.duree})`}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span>
                  {selectedRendezVous.adresse}, {selectedRendezVous.code_postal} {selectedRendezVous.ville}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span>{selectedRendezVous.nom_contact}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-gray-500" />
                <span>{selectedRendezVous.telephone_contact}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>{selectedRendezVous.email_contact}</span>
              </div>
              
              {selectedRendezVous.description && (
                <div>
                  <h4 className="font-medium">Description:</h4>
                  <p>{selectedRendezVous.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Type d'état des lieux:</h4>
                  <p>{getTypeEtatLabel(selectedRendezVous.type_etat_des_lieux)}</p>
                </div>
                <div>
                  <h4 className="font-medium">Type de bien:</h4>
                  <p>{selectedRendezVous.type_bien}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Statut:</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(selectedRendezVous.statut)} text-white`}>
                  {getStatutLabel(selectedRendezVous.statut)}
                </span>
              </div>
              
              {selectedRendezVous.note_personnelle && (
                <div>
                  <h4 className="font-medium">Note personnelle:</h4>
                  <p className="text-gray-600">{selectedRendezVous.note_personnelle}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RendezVousCalendar;