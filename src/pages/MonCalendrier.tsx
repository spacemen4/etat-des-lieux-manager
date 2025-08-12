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
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg mb-8 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <LayoutGrid className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Mon Calendrier
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez vos rendez-vous d'états des lieux
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-gray-50/50 rounded-xl p-2 border border-gray-200/50">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center space-x-2 transition-all duration-200 ${
                  viewMode === 'calendar' 
                    ? 'bg-white shadow-md hover:shadow-lg border border-gray-200' 
                    : 'hover:bg-white/70'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Vue Calendrier</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-md hover:shadow-lg border border-gray-200' 
                    : 'hover:bg-white/70'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="font-medium">Vue Liste</span>
              </Button>
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