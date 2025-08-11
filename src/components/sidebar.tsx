import { Link, useLocation } from 'react-router-dom';
import { Building, Users, UserCheck, LogOut, Home, FilePlus, Calendar, ExternalLink, Menu, X } from 'lucide-react';
import { useAuth } from '../auth'; // Assurez-vous que le chemin est correct
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

export const Sidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/new-etat-des-lieux', icon: FilePlus, label: 'Nouvel état des lieux' },
    { path: '/mon-calendrier', icon: Calendar, label: 'Mon calendrier' },
    { path: '/profile', icon: UserCheck, label: 'Profil' },
    { path: '/team', icon: Users, label: 'Équipe' }
  ];

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Menu mobile hamburger
  if (isMobile) {
    return (
      <>
        {/* Bouton hamburger */}
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 md:hidden glass-light"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar mobile */}
        <div className={`fixed left-0 top-0 h-full w-80 max-w-[85vw] glass-heavy border-r z-40 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-8 p-2 mt-12">
              <img src="/android-chrome-192x192.png" alt="Logo" className="w-6 h-6" />
              <h1 className="font-semibold text-lg">Mon Application</h1>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                    (item.path === '/' && location.pathname === '/') || 
                    (item.path !== '/' && location.pathname.startsWith(item.path))
                      ? 'glass text-primary shadow-md'
                      : 'text-muted-foreground hover:glass hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-2">
              <a
                href="https://www.etatdelux.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium text-muted-foreground hover:glass hover:text-foreground"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Retour au site</span>
              </a>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 p-3 text-sm font-medium text-muted-foreground hover:glass hover:text-foreground"
                onClick={signOut}
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden md:flex w-64 lg:w-72 border-r h-screen p-4 flex-col glass-light">
      <div className="flex items-center gap-2 mb-8 p-2">
        <img src="/android-chrome-192x192.png" alt="Logo" className="w-6 h-6" />
        <h1 className="font-semibold text-lg truncate">Mon Application</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-2 lg:p-3 rounded-lg transition-all duration-200 text-sm font-medium ${
              (item.path === '/' && location.pathname === '/') || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
                ? 'glass text-primary shadow-md'
                : 'text-muted-foreground hover:glass hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="lg:inline">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <a
          href="https://www.etatdelux.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 lg:p-3 rounded-lg transition-all duration-200 text-sm font-medium text-muted-foreground hover:glass hover:text-foreground"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="lg:inline">Retour au site</span>
        </a>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 p-2 lg:p-3 text-sm font-medium text-muted-foreground hover:glass hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          <span className="lg:inline">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
};
