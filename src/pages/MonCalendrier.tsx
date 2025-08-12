import { useState } from 'react';
import RendezVousCalendar from '@/components/RendezVousCalendar';
import RendezVousCalendarInterractif from '@/components/RendezVousCalendarInterractif';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Calendar, List, LayoutGrid } from 'lucide-react';

function MonCalendrierPage() {
  const { userUuid } = useUser();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <div className="container mx-auto px-4 py-6">
        {/* En-tête moderne avec design élégant */}
        <div className="glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl mb-8 p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 gradient-primary rounded-xl shadow-lg animate-float">
                <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text tracking-tight">
                  Mon Calendrier
                </h1>
                <p className="text-slate-600/80 mt-1 text-sm sm:text-base">
                  Gérez vos rendez-vous d'états des lieux
                </p>
              </div>
            </div>
            
            {/* Boutons responsive avec design moderne */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-end gap-3">
              <div className="glass-light rounded-xl p-2 backdrop-blur-lg border border-white/30">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg h-11 ${
                      viewMode === 'calendar' 
                        ? 'gradient-primary text-white shadow-lg hover:shadow-xl' 
                        : 'hover:glass-heavy hover:backdrop-blur-sm text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">Vue Calendrier</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg h-11 ${
                      viewMode === 'list' 
                        ? 'gradient-secondary text-white shadow-lg hover:shadow-xl' 
                        : 'hover:glass-heavy hover:backdrop-blur-sm text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="font-semibold">Vue Liste</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu avec transition fluide */}
        <div className="transition-all duration-300 ease-in-out">
          {viewMode === 'calendar' ? (
            <div className="animate-in fade-in-0 duration-500">
              <RendezVousCalendarInterractif userUuid={userUuid} />
            </div>
          ) : (
            <div className="animate-in fade-in-0 duration-500">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                <RendezVousCalendar userUuid={userUuid} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonCalendrierPage;