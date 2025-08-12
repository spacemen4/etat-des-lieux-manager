import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { useAuth } from '../auth';
import { Header } from './top-header';

export const DashboardLayout = ({ children }) => {
  const { user, organisation } = useAuth();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background/95 to-background overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};
