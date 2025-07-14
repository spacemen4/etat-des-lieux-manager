
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-slate-900">
                État des Lieux
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                Accueil
              </Link>
              <Link to="/mon-calendrier" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                Mon calendrier
              </Link>
            </nav>
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-4">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">Menu</h2>
                    
                  </div>
                  <nav className="flex flex-col space-y-4">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 hover:text-slate-900 py-2 text-base font-medium">
                      Accueil
                    </Link>
                    <Link to="/mon-calendrier" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 hover:text-slate-900 py-2 text-base font-medium">
                      Mon calendrier
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
