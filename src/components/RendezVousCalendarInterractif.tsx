import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
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

  const openCreateModal = (date: Date) => {
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
        <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          {daysOfWeek.map(day => (
            <div key={day} className="p-2 sm:p-4 text-center font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wide">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {days.map((dayInfo, index) => {
            const dayRendezVous = getRendezVousForDate(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
            
            return (
              <div
                key={index}
                className={`min-h-20 sm:min-h-28 p-1 sm:p-2 border-r border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50/50 group ${
                  !dayInfo.isCurrentMonth 
                    ? 'text-gray-400 bg-gray-50/50' 
                    : isWeekend 
                      ? 'bg-gray-50/30' 
                      : 'bg-white hover:shadow-sm'
                } ${isToday ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : ''}`}
                onClick={() => openCreateModal(dayInfo.date)}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    isToday 
                      ? 'bg-blue-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold' 
                      : dayInfo.isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                  }`}>
                    {dayInfo.date.getDate()}
                  </div>
                  {dayRendezVous.length > 0 && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  )}
                </div>
                
                <div className="space-y-0.5 sm:space-y-1">
                  {dayRendezVous.slice(0, window.innerWidth < 640 ? 1 : 2).map((rdv) => (
                    <div
                      key={rdv.id}
                      className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-white truncate cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm ${getStatutColor(rdv.statut || 'planifie')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(rdv);
                      }}
                      title={`${rdv.heure} - ${getTypeEtatLabel(rdv.type_etat_des_lieux || '')}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-xs">{rdv.heure}</span>
                        <span className="opacity-90 hidden sm:inline">·</span>
                        <span className="truncate text-xs hidden sm:inline">{getTypeEtatLabel(rdv.type_etat_des_lieux || '')}</span>
                      </div>
                    </div>
                  ))}
                  
                  {dayRendezVous.length > (window.innerWidth < 640 ? 1 : 2) && (
                    <div 
                      className="text-xs text-blue-600 font-medium cursor-pointer hover:text-blue-700 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      +{dayRendezVous.length - (window.innerWidth < 640 ? 1 : 2)}
                    </div>
                  )}
                  
                  {dayRendezVous.length === 0 && (
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-60 transition-opacity duration-200 italic hidden sm:block">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendrier des Rendez-vous</h1>
                </div>
              </div>
              
              <Button 
                onClick={() => openCreateModal(new Date())}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Nouveau RDV</span>
                <span className="xs:hidden">Nouveau</span>
              </Button>
            </div>
            
            {/* Navigation des vues sur mobile */}
            <div className="flex items-center justify-center sm:justify-start">
              <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 w-full sm:w-auto">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={`${viewMode === 'month' ? 'bg-white shadow-sm' : 'hover:bg-white/50'} transition-all duration-200 flex-1 sm:flex-none text-xs sm:text-sm`}
                >
                  Mois
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={`${viewMode === 'week' ? 'bg-white shadow-sm' : 'hover:bg-white/50'} transition-all duration-200 flex-1 sm:flex-none text-xs sm:text-sm`}
                >
                  Semaine
                </Button>
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className={`${viewMode === 'day' ? 'bg-white shadow-sm' : 'hover:bg-white/50'} transition-all duration-200 flex-1 sm:flex-none text-xs sm:text-sm`}
                >
                  Jour
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-50 rounded-lg p-1 space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="hover:bg-white hover:shadow-sm transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="hover:bg-white hover:shadow-sm transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Aujourd'hui</span>
                <span className="sm:hidden">Auj.</span>
              </Button>
            </div>
            
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center sm:text-left">
              {viewMode === 'month' 
                ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              }
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {renderMonthView()}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
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
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="123 rue de la République"
                value={editForm.adresse}
                onChange={(e) => setEditForm(prev => ({ ...prev, adresse: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedRendezVous) {
                    deleteRendezVous(selectedRendezVous.id!);
                    setIsEditModalOpen(false);
                  }
                }}
              >
                Supprimer
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveEditRendezVous}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un rendez-vous</DialogTitle>
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
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="123 rue de la République"
                value={editForm.adresse}
                onChange={(e) => setEditForm(prev => ({ ...prev, adresse: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createRendezVous}>
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