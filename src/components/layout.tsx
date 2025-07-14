import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar'; // Assurez-vous que le chemin est correct
import { useAuth } from '../auth'; // Assurez-vous que le chemin est correct

export const DashboardLayout = ({ children }) => {
  const { user, organisation } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        {children || <Outlet />}
      </main>
    </div>
  );
};
