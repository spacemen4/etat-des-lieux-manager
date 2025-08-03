import { Link, useLocation } from 'react-router-dom';
import { Building, Users, UserCheck, LogOut, Home, FilePlus, Calendar } from 'lucide-react';
import { useAuth } from '../auth'; // Assurez-vous que le chemin est correct
import { Button } from '@/components/ui/button';

export const Sidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/new-etat-des-lieux', icon: FilePlus, label: 'Nouvel état des lieux' },
    { path: '/mon-calendrier', icon: Calendar, label: 'Mon calendrier' },
    { path: '/profile', icon: UserCheck, label: 'Profil' },
    { path: '/team', icon: Users, label: 'Équipe' }
  ];

  return (
    <div className="w-64 border-r h-screen p-4 flex flex-col bg-white">
      <div className="flex items-center gap-2 mb-8 p-2">
        <img src="/android-chrome-192x192.png" alt="Logo" className="w-6 h-6" />
        <h1 className="font-semibold text-lg">Mon Application</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors text-sm font-medium ${
              location.pathname.startsWith(item.path)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="mt-auto justify-start gap-3 p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        onClick={signOut}
      >
        <LogOut className="w-5 h-5" />
        Déconnexion
      </Button>
    </div>
  );
};
