import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useEmployes } from '@/context/EmployeContext';

interface RendezVous {
  id?: string;
  date: string;
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
  type_etat_des_lieux?: string;
  type_bien?: string;
  statut?: string;
  created_at?: string | null;
  created_by_auth_user_id?: string | null;
  updated_at?: string | null;
  updated_by_auth_user_id?: string | null;
  user_id?: string | null;
  employe_id?: string | null;
  organisation_id?: string | null;
  organization_id?: string | null;
  etat_des_lieux_id?: string | null;
  photos?: any;
}

const RendezVousCalendar = ({ userUuid }: { userUuid?: string }) => {
  const { selectedEmployeId } = useEmployes();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

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

  useEffect(() => {
    if (userUuid) {
      fetchRendezVous();
    }
  }, [userUuid]);

  const fetchRendezVous = async () => {
    try {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .eq('user_id', userUuid)
        .order('date', { ascending: true });

      if (error) throw error;

      setRendezVous(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les rendez-vous.",
        variant: "destructive",
      });
    }
  };

  const getStatutColor = (statut: string) => {
    switch(statut) {
      case 'planifie': return 'bg-blue-500';
      case 'realise': return 'bg-green-500';
      case 'annule': return 'bg-red-500';
      case 'reporte': return 'bg-yellow-500';
      default: return 'bg-gray-500';
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
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
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
      date: new Date(rdv.date).toISOString().split('T')[0],
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
      type_etat_des_lieux: rdv.type_etat_des_lieux || '',
      type_bien: rdv.type_bien || '',
      statut: rdv.statut || 'planifie'
    });
    setIsEditModalOpen(true);
  };

  const saveEditRendezVous = async () => {
    if (!selectedRendezVous || !selectedRendezVous.id) return;

    const updatedRendezVous = {
      date: editForm.date,
      heure: editForm.heure,
      duree: editForm.duree || null,
      description: editForm.description || null,
      adresse: editForm.adresse,
      code_postal: editForm.code_postal,
      ville: editForm.ville,
      nom_contact: editForm.nom_contact,
      telephone_contact: editForm.telephone_contact,
      email_contact: editForm.email_contact,
      note_personnelle: editForm.note_personnelle || null,
      type_etat_des_lieux: editForm.type_etat_des_lieux,
      type_bien: editForm.type_bien,
      statut: editForm.statut,
      updated_at: new Date().toISOString(),
      updated_by_auth_user_id: userUuid
    };

    try {
      const { error } = await supabase
        .from('rendez_vous')
        .update(updatedRendezVous)
        .eq('id', selectedRendezVous.id);

      if (error) throw error;

      setRendezVous(prev => prev.map(rdv => 
        rdv.id === selectedRendezVous.id ? { ...selectedRendezVous, ...updatedRendezVous } : rdv
      ));

      toast({
        title: "Succès",
        description: "Rendez-vous modifié avec succès!",
      });

      setIsEditModalOpen(false);
      setSelectedRendezVous(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du rendez-vous",
        variant: "destructive",
      });
    }
  };

  const deleteRendezVous = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rendez_vous')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRendezVous(prev => prev.filter(rdv => rdv.id !== id));
      
      toast({
        title: "Succès",
        description: "Rendez-vous supprimé avec succès!",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du rendez-vous",
        variant: "destructive",
      });
    }
  };

  const openCreateModal = (date: Date, time?: string) => {
    setEditForm({
      date: date.toISOString().split('T')[0],
      heure: time || '09:00',
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

  const createRendezVous = async () => {
    const newRendezVousData = {
      date: editForm.date,
      heure: editForm.heure,
      duree: editForm.duree || null,
      description: editForm.description || null,
      adresse: editForm.adresse,
      code_postal: editForm.code_postal,
      ville: editForm.ville,
      nom_contact: editForm.nom_contact,
      telephone_contact: editForm.telephone_contact,
      email_contact: editForm.email_contact,
      note_personnelle: editForm.note_personnelle || null,
      type_etat_des_lieux: editForm.type_etat_des_lieux,
      type_bien: editForm.type_bien,
      statut: editForm.statut,
      user_id: userUuid,
      employe_id: selectedEmployeId,
      created_at: new Date().toISOString(),
      created_by_auth_user_id: userUuid
    };

    try {
      const { data, error } = await supabase
        .from('rendez_vous')
        .insert([newRendezVousData])
        .select()
        .single();

      if (error) throw error;

      setRendezVous(prev => [...prev, data]);
      
      toast({
        title: "Succès",
        description: `Rendez-vous du ${editForm.date} à ${editForm.heure} créé avec succès!`,
      });

      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du rendez-vous",
        variant: "destructive",
      });
    }
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <div className="overflow-hidden">
        {/* En-têtes des jours avec gradient moderne */}
        <div className="grid grid-cols-7 gradient-primary border-b border-white/20">
          {daysOfWeek.map((day, index) => (
            <div 
              key={day} 
              className={`p-3 sm:p-4 text-center font-bold text-white text-xs sm:text-sm uppercase tracking-wider backdrop-blur-sm animate-slide-in-left`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>
        
        {/* Grille des jours avec glassmorphism */}
        <div className="grid grid-cols-7 backdrop-blur-sm">
          {days.map((dayInfo, index) => {
            const dayRendezVous = getRendezVousForDate(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
            
            return (
              <div
                key={index}
                className={`min-h-24 sm:min-h-32 p-2 sm:p-3 border-r border-b border-white/10 cursor-pointer transition-all duration-300 hover:glass-light hover:backdrop-blur-lg group card-hover-subtle animate-fade-in ${
                  !dayInfo.isCurrentMonth 
                    ? 'text-slate-400 bg-slate-50/20' 
                    : isWeekend 
                      ? 'bg-slate-50/10' 
                      : 'bg-white/5 hover:bg-white/10'
                } ${isToday ? 'glass-heavy ring-2 ring-blue-400/50 bg-blue-50/20' : ''}`}
                onClick={() => openCreateModal(dayInfo.date)}
                style={{animationDelay: `${index * 0.02}s`}}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`text-sm sm:text-base font-semibold transition-all duration-300 micro-bounce ${
                    isToday 
                      ? 'gradient-primary text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg' 
                      : dayInfo.isCurrentMonth
                        ? 'text-slate-900 hover:text-blue-600'
                        : 'text-slate-400'
                  }`}>
                    {dayInfo.date.getDate()}
                  </div>
                  {dayRendezVous.length > 0 && (
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 gradient-neon rounded-full opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
                  )}
                </div>
                
                <div className="space-y-1 sm:space-y-1.5">
                  {dayRendezVous.slice(0, window.innerWidth < 640 ? 1 : 2).map((rdv, rdvIndex) => (
                    <div
                      key={rdv.id}
                      className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-white truncate cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg glass-card backdrop-blur-md border border-white/20 animate-slide-up ${getStatutColor(rdv.statut || 'planifie')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(rdv);
                      }}
                      title={`${rdv.heure} - ${getTypeEtatLabel(rdv.type_etat_des_lieux || '')}`}
                      style={{animationDelay: `${(index * 0.02) + (rdvIndex * 0.1)}s`}}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-xs">{rdv.heure}</span>
                        <span className="opacity-80 hidden sm:inline">•</span>
                        <span className="truncate text-xs hidden sm:inline font-medium">{getTypeEtatLabel(rdv.type_etat_des_lieux || '')}</span>
                      </div>
                    </div>
                  ))}
                  
                  {dayRendezVous.length > (window.innerWidth < 640 ? 1 : 2) && (
                    <div 
                      className="text-xs gradient-text font-bold cursor-pointer hover:animate-bounce transition-all duration-300 glass-light px-2 py-1 rounded-md backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      +{dayRendezVous.length - (window.innerWidth < 640 ? 1 : 2)} autres
                    </div>
                  )}
                  
                  {dayRendezVous.length === 0 && (
                    <div className="text-xs text-slate-500/60 opacity-0 group-hover:opacity-80 transition-all duration-300 italic hidden sm:block font-medium backdrop-blur-sm">
                      Cliquer pour ajouter
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // Calculer le début et la fin de la semaine
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer lundi
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="overflow-hidden">
        {/* En-têtes des jours de la semaine */}
        <div className="grid grid-cols-7 gradient-primary border-b border-white/20">
          {weekDays.map((date, index) => (
            <div 
              key={index} 
              className={`p-3 sm:p-4 text-center font-bold text-white text-xs sm:text-sm backdrop-blur-sm animate-slide-in-left`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="uppercase tracking-wider">{daysOfWeek[index]}</div>
              <div className="text-lg mt-1">{date.getDate()}</div>
            </div>
          ))}
        </div>
        
        {/* Grille des jours de la semaine */}
        <div className="grid grid-cols-7 backdrop-blur-sm min-h-96">
          {weekDays.map((date, index) => {
            const dayRendezVous = getRendezVousForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div
                key={index}
                className={`p-2 sm:p-3 border-r border-b border-white/10 cursor-pointer transition-all duration-300 hover:glass-light hover:backdrop-blur-lg group card-hover-subtle animate-fade-in ${
                  isWeekend 
                    ? 'bg-slate-50/10' 
                    : 'bg-white/5 hover:bg-white/10'
                } ${isToday ? 'glass-heavy ring-2 ring-blue-400/50 bg-blue-50/20' : ''}`}
                onClick={() => openCreateModal(date)}
                style={{animationDelay: `${index * 0.02}s`}}
              >
                <div className="space-y-2">
                  {dayRendezVous.map((rdv, rdvIndex) => (
                    <div
                      key={rdv.id}
                      className={`text-xs px-2 sm:px-3 py-2 sm:py-2 rounded-lg text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg glass-card backdrop-blur-md border border-white/20 animate-slide-up ${getStatutColor(rdv.statut || 'planifie')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(rdv);
                      }}
                      style={{animationDelay: `${(index * 0.02) + (rdvIndex * 0.1)}s`}}
                    >
                      <div className="font-semibold">{rdv.heure}</div>
                      <div className="text-xs opacity-90 mt-1">{getTypeEtatLabel(rdv.type_etat_des_lieux || '')}</div>
                      <div className="text-xs opacity-80 truncate">{rdv.nom_contact}</div>
                    </div>
                  ))}
                  
                  {dayRendezVous.length === 0 && (
                    <div className="text-xs text-slate-500/60 opacity-0 group-hover:opacity-80 transition-all duration-300 italic text-center py-4">
                      Cliquer pour ajouter
                    </div>
                  )}
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
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    // Créer des créneaux horaires de 30 minutes de 8h à 20h
    const timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    return (
      <div className="overflow-hidden">
        {/* En-tête du jour */}
        <div className="gradient-primary border-b border-white/20 p-4 text-center">
          <div className="text-white">
            <div className="text-xs sm:text-sm uppercase tracking-wider opacity-80">
              {currentDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">
              {currentDate.getDate()}
            </div>
            <div className="text-sm opacity-90">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        
        {/* Vue planning du jour */}
        <div className="backdrop-blur-sm max-h-96 overflow-y-auto">
          <div className="divide-y divide-white/10">
            {timeSlots.map((timeSlot, index) => {
              // Trouver les RDV qui correspondent à ce créneau
              const slotRendezVous = dayRendezVous.filter(rdv => rdv.heure === timeSlot);
              
              return (
                <div
                  key={timeSlot}
                  className={`flex transition-all duration-300 hover:glass-light group animate-fade-in ${
                    slotRendezVous.length > 0 ? 'min-h-16' : 'min-h-12'
                  }`}
                  style={{animationDelay: `${index * 0.02}s`}}
                >
                  {/* Colonne heure */}
                  <div className="w-16 sm:w-20 flex-shrink-0 p-3 text-xs sm:text-sm text-slate-600 font-medium border-r border-white/10">
                    {timeSlot}
                  </div>
                  
                  {/* Colonne contenu */}
                  <div className="flex-1 p-2 sm:p-3 cursor-pointer" onClick={() => {
                    // Créer un nouveau RDV à cette heure
                    openCreateModal(currentDate, timeSlot);
                  }}>
                    {slotRendezVous.length > 0 ? (
                      <div className="space-y-2">
                        {slotRendezVous.map((rdv, rdvIndex) => (
                          <div
                            key={rdv.id}
                            className={`p-3 sm:p-4 rounded-lg text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg glass-card backdrop-blur-md border border-white/20 animate-slide-up ${getStatutColor(rdv.statut || 'planifie')}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(rdv);
                            }}
                            style={{animationDelay: `${(index * 0.02) + (rdvIndex * 0.1)}s`}}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-bold text-sm">{rdv.heure}</span>
                                  {rdv.duree && (
                                    <span className="text-xs opacity-80">({rdv.duree})</span>
                                  )}
                                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                    {getTypeEtatLabel(rdv.type_etat_des_lieux || '')}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="font-semibold">{rdv.nom_contact}</div>
                                  <div className="text-xs opacity-90">{rdv.adresse}, {rdv.ville}</div>
                                  {rdv.telephone_contact && (
                                    <div className="text-xs opacity-80">{rdv.telephone_contact}</div>
                                  )}
                                  {rdv.description && (
                                    <div className="text-xs opacity-80 mt-2 italic">{rdv.description}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500/60 opacity-0 group-hover:opacity-80 transition-all duration-300 italic py-2">
                        Cliquer pour ajouter un rendez-vous
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Résumé du jour */}
          {dayRendezVous.length > 0 && (
            <div className="p-4 border-t border-white/10 glass-light">
              <div className="text-center">
                <div className="text-sm font-semibold gradient-text">
                  {dayRendezVous.length} rendez-vous ce jour
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {dayRendezVous.filter(rdv => rdv.statut === 'planifie').length} planifiés • 
                  {dayRendezVous.filter(rdv => rdv.statut === 'realise').length} réalisés • 
                  {dayRendezVous.filter(rdv => rdv.statut === 'annule').length} annulés
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
        {/* Header Section avec glassmorphism */}
        <div className="glass-heavy p-6 sm:p-8 rounded-2xl border backdrop-blur-xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 gradient-primary rounded-xl shadow-lg animate-float">
                    <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                      Calendrier des Rendez-vous
                    </h1>
                    <p className="text-slate-600/80 text-sm mt-1">
                      Gérez vos rendez-vous d'état des lieux
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => openCreateModal(new Date())}
                className="btn-gradient micro-bounce w-full sm:w-auto shadow-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Nouveau RDV</span>
                <span className="xs:hidden">Nouveau</span>
              </Button>
            </div>
            
            {/* Navigation des vues avec design moderne */}
            <div className="flex items-center justify-center sm:justify-start">
              <div className="glass-light rounded-xl p-2 w-full sm:w-auto backdrop-blur-lg border border-white/20">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className={`${
                      viewMode === 'month' 
                        ? 'gradient-primary text-white shadow-md' 
                        : 'hover:glass-light hover:backdrop-blur-sm'
                    } transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm rounded-lg micro-bounce`}
                  >
                    Mois
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className={`${
                      viewMode === 'week' 
                        ? 'gradient-primary text-white shadow-md' 
                        : 'hover:glass-light hover:backdrop-blur-sm'
                    } transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm rounded-lg micro-bounce`}
                  >
                    Semaine
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className={`${
                      viewMode === 'day' 
                        ? 'gradient-primary text-white shadow-md' 
                        : 'hover:glass-light hover:backdrop-blur-sm'
                    } transition-all duration-300 flex-1 sm:flex-none text-xs sm:text-sm rounded-lg micro-bounce`}
                  >
                    Jour
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section avec design moderne */}
        <div className="glass-light p-4 sm:p-6 rounded-2xl border backdrop-blur-lg">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center justify-between">
              <div className="glass rounded-xl p-2 space-x-2 flex items-center backdrop-blur-md border border-white/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="hover:glass-heavy hover:shadow-md transition-all duration-300 rounded-lg micro-bounce"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="hover:glass-heavy hover:shadow-md transition-all duration-300 rounded-lg micro-bounce"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="glass border-blue-200/50 text-blue-600 hover:gradient-primary hover:text-white hover:border-transparent transition-all duration-300 text-xs sm:text-sm micro-bounce backdrop-blur-sm"
              >
                <span className="hidden sm:inline">Aujourd'hui</span>
                <span className="sm:hidden">Auj.</span>
              </Button>
            </div>
            
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold gradient-text animate-pulse-soft">
                {viewMode === 'month' 
                  ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                }
              </h2>
              <div className="w-16 h-1 gradient-primary rounded-full mx-auto sm:mx-0 mt-2 animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Calendar Grid avec glassmorphism */}
        <div className="glass-heavy rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-xl">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>

      {/* Modals avec design moderne */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-lg">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              Modifier le rendez-vous
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heure" className="text-sm font-semibold text-slate-700">Heure</Label>
                <Input
                  id="heure"
                  type="time"
                  value={editForm.heure}
                  onChange={(e) => setEditForm(prev => ({ ...prev, heure: e.target.value }))}
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-semibold text-slate-700">Adresse</Label>
              <Input
                id="adresse"
                placeholder="123 rue de la République"
                value={editForm.adresse}
                onChange={(e) => setEditForm(prev => ({ ...prev, adresse: e.target.value }))}
                required
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code_postal" className="text-sm font-semibold text-slate-700">Code postal</Label>
                <Input
                  id="code_postal"
                  placeholder="75000"
                  value={editForm.code_postal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, code_postal: e.target.value }))}
                  required
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville" className="text-sm font-semibold text-slate-700">Ville</Label>
                <Input
                  id="ville"
                  placeholder="Paris"
                  value={editForm.ville}
                  onChange={(e) => setEditForm(prev => ({ ...prev, ville: e.target.value }))}
                  required
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom_contact" className="text-sm font-semibold text-slate-700">Nom du contact</Label>
              <Input
                id="nom_contact"
                placeholder="Jean Dupont"
                value={editForm.nom_contact}
                onChange={(e) => setEditForm(prev => ({ ...prev, nom_contact: e.target.value }))}
                required
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <Button 
                size="sm" 
                asChild
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-all duration-300 micro-bounce"
              >
                <a href={selectedRendezVous ? `/new-etat-des-lieux?type=${selectedRendezVous.type_etat_des_lieux}&rdv=${selectedRendezVous.id}` : "#"} className="flex items-center justify-center gap-1">
                  <FileText className="h-3 w-3" />
                  Faire l'état des lieux
                </a>
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedRendezVous) {
                    deleteRendezVous(selectedRendezVous.id!);
                    setIsEditModalOpen(false);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 transition-all duration-300 micro-bounce"
              >
                Supprimer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                className="glass border-slate-200/50 hover:glass-heavy transition-all duration-300 micro-bounce"
              >
                Annuler
              </Button>
              <Button 
                onClick={saveEditRendezVous}
                className="btn-gradient micro-bounce"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Créer un rendez-vous
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heure" className="text-sm font-semibold text-slate-700">Heure</Label>
                <Input
                  id="heure"
                  type="time"
                  value={editForm.heure}
                  onChange={(e) => setEditForm(prev => ({ ...prev, heure: e.target.value }))}
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-semibold text-slate-700">Adresse</Label>
              <Input
                id="adresse"
                placeholder="123 rue de la République"
                value={editForm.adresse}
                onChange={(e) => setEditForm(prev => ({ ...prev, adresse: e.target.value }))}
                required
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code_postal" className="text-sm font-semibold text-slate-700">Code postal</Label>
                <Input
                  id="code_postal"
                  placeholder="75000"
                  value={editForm.code_postal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, code_postal: e.target.value }))}
                  required
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville" className="text-sm font-semibold text-slate-700">Ville</Label>
                <Input
                  id="ville"
                  placeholder="Paris"
                  value={editForm.ville}
                  onChange={(e) => setEditForm(prev => ({ ...prev, ville: e.target.value }))}
                  required
                  className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom_contact" className="text-sm font-semibold text-slate-700">Nom du contact</Label>
              <Input
                id="nom_contact"
                placeholder="Jean Dupont"
                value={editForm.nom_contact}
                onChange={(e) => setEditForm(prev => ({ ...prev, nom_contact: e.target.value }))}
                required
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="glass border-slate-200/50 hover:glass-heavy transition-all duration-300 micro-bounce"
              >
                Annuler
              </Button>
              <Button 
                onClick={createRendezVous}
                className="btn-gradient micro-bounce"
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RendezVousCalendar;