import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { useAuth } from '../auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from './top-header';

export const DashboardLayout = ({ children }) => {
  const { user, organisation } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className={`
        flex-1 
        ${isMobile ? 'p-4 pt-20' : 'p-4 md:p-6 lg:p-8'} 
        bg-gradient-to-br from-background via-background/95 to-background
        min-h-screen
        overflow-x-hidden
        transition-all duration-300
      `}>
        <Header />
        <div className="max-w-full mx-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};
