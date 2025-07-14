import React from 'react';
import RendezVousCalendar from '@/components/RendezVousCalendar';
import { useUser } from '@/context/UserContext';

function MonCalendrierPage() {
  const { userUuid } = useUser();

  return (
    <div>
      <RendezVousCalendar userUuid={userUuid} />
    </div>
  );
}

export default MonCalendrierPage;