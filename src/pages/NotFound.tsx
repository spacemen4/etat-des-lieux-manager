import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Illustration animée */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <SearchX className="w-16 h-16 text-blue-600" />
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-blue-50 rounded-full -z-10 animate-pulse"></div>
        </div>

        {/* Contenu */}
        <div className="space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Page introuvable
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
              {location.pathname && (
                <span className="block text-sm text-gray-500 mt-2 font-mono bg-gray-100 px-2 py-1 rounded">
                  {location.pathname}
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              asChild
              className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Page précédente
            </Button>
          </div>

          {/* Liens utiles */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Liens utiles :</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link 
                to="/new-etat-des-lieux" 
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Nouvel état des lieux
              </Link>
              <Link 
                to="/mon-calendrier" 
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Mon calendrier
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
