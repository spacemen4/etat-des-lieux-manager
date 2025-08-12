import React, { useState } from 'react';
import RendezVousCalendar from '@/components/RendezVousCalendar';
import RendezVousCalendarInterractif from '@/components/RendezVousCalendarInterractif';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Calendar, List } from 'lucide-react';

function MonCalendrierPage() {
  const { userUuid } = useUser();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  return (
    <div>
      <div className="flex items-center justify-between mb-6 p-4">
        <h1 className="text-2xl font-bold">Mon Calendrier</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Vue Calendrier</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-2"
          >
            <List className="w-4 h-4" />
            <span>Vue Liste</span>
          </Button>
        </div>
      </div>
      
      {viewMode === 'calendar' ? (
        <RendezVousCalendarInterractif userUuid={userUuid} />
      ) : (
        <RendezVousCalendar userUuid={userUuid} />
      )}
    </div>
  );
}

export default MonCalendrierPage;