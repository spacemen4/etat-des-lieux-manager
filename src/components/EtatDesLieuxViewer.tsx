import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Building2, Calendar, FileText, Wrench, Image } from 'lucide-react';
import { useEmployes } from '@/context/EmployeContext';
import { 
  useEtatDesLieuxById, 
  usePiecesByEtatId, 
  useReleveCompteursByEtatId, 
  useClesByEtatId,
  usePartiesPrivativesByEtatId,
  useAutresEquipementsByEtatId,
  useEquipementsEnergetiquesByEtatId,
  useEquipementsChauffageByEtatId
} from '@/hooks/useEtatDesLieux';
import { useUser } from '@/context/UserContext';

interface EtatDesLieuxViewerProps {
  etatId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const EtatDesLieuxViewer: React.FC<EtatDesLieuxViewerProps> = ({ etatId, isOpen, onClose }) => {
  const { userUuid } = useUser();
  const { data: etatDesLieux } = useEtatDesLieuxById(etatId || '', userUuid);
  const { data: pieces } = usePiecesByEtatId(etatId || '');
  const { data: releveCompteurs } = useReleveCompteursByEtatId(etatId || '');
  const { data: cles } = useClesByEtatId(etatId || '');
  const { data: partiesPrivatives } = usePartiesPrivativesByEtatId(etatId || '');
  const { data: autresEquipements } = useAutresEquipementsByEtatId(etatId || '');
  const { data: equipementsEnergetiques } = useEquipementsEnergetiquesByEtatId(etatId || '');
  const { data: equipementsChauffage } = useEquipementsChauffageByEtatId(etatId || '');
  const { employes } = useEmployes();

  if (!etatDesLieux) return null;

  const getTypeBienLabel = (typeBien: string) => {
    const labels: Record<string, string> = {
      'studio': 'Studio',
      't2_t3': 'T2 - T3',
      't4_t5': 'T4 - T5',
      'inventaire_mobilier': 'Inventaire mobilier',
      'bureau': 'Bureau',
      'local_commercial': 'Local commercial',
      'garage_box': 'Garage / Box',
      'pieces_supplementaires': 'Pièces supplémentaires'
    };
    return labels[typeBien] || typeBien;
  };

  const getEmployeLabel = (employeId?: string | null) => {
    if (!employeId) return null;
    const e = employes.find(emp => emp.id === employeId);
    if (!e) return null;
    return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            État des lieux - {etatDesLieux.adresse_bien}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">Adresse:</span>
                  <span>{etatDesLieux.adresse_bien}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">Type:</span>
                  <span>{getTypeBienLabel(etatDesLieux.type_bien)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">Bailleur:</span>
                  <span>{etatDesLieux.bailleur_nom || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">Locataire:</span>
                  <span>{etatDesLieux.locataire_nom || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">Date d'entrée:</span>
                  <span>{etatDesLieux.date_entree ? new Date(etatDesLieux.date_entree).toLocaleDateString() : 'Non renseignée'}</span>
                </div>
                {etatDesLieux.date_sortie && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Date de sortie:</span>
                    <span>{new Date(etatDesLieux.date_sortie).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Badge variant={etatDesLieux.type_etat_des_lieux === 'entree' ? "default" : "secondary"}>
                  {etatDesLieux.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}
                </Badge>
                <Badge variant={!etatDesLieux.date_sortie ? "default" : "secondary"}>
                  {!etatDesLieux.date_sortie ? "En cours" : "Terminé"}
                </Badge>
                {etatDesLieux.travaux_a_faire && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Travaux à prévoir
                  </Badge>
                )}
                {getEmployeLabel(etatDesLieux.employe_id) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {getEmployeLabel(etatDesLieux.employe_id)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Relevé des compteurs */}
          {releveCompteurs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Relevé des compteurs
                  {getEmployeLabel((releveCompteurs as any).employe_id) && (
                    <Badge variant="outline" className="ml-2">
                      <User className="h-3 w-3 mr-1" /> {getEmployeLabel((releveCompteurs as any).employe_id)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Électricité H. pleines:</span> {releveCompteurs.electricite_h_pleines || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">Électricité H. creuses:</span> {releveCompteurs.electricite_h_creuses || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">Gaz naturel:</span> {releveCompteurs.gaz_naturel_releve || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">Eau chaude (m³):</span> {releveCompteurs.eau_chaude_m3 || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">Eau froide (m³):</span> {releveCompteurs.eau_froide_m3 || 'Non renseigné'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pièces */}
          {pieces && pieces.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pièces ({pieces.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pieces.map((piece) => (
                    <div key={piece.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{piece.nom_piece}</h4>
                      {getEmployeLabel((piece as any).employe_id) && (
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                          <User className="h-3 w-3" /> {getEmployeLabel((piece as any).employe_id)}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Revêtements sols:</span> {piece.revetements_sols_sortie || piece.revetements_sols_entree || 'Non renseigné'}
                        </div>
                        <div>
                          <span className="font-medium">Murs:</span> {piece.murs_menuiseries_sortie || piece.murs_menuiseries_entree || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clés */}
          {cles && cles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cles.map((cle) => (
                    <div key={cle.id} className="flex items-center gap-4">
                      <span className="font-medium">{cle.type_cle_badge}</span>
                      <span>Nombre: {cle.nombre}</span>
                      {cle.commentaires && <span className="text-slate-600">({cle.commentaires})</span>}
                      {getEmployeLabel((cle as any).employe_id) && (
                        <span className="text-xs text-slate-500">• {getEmployeLabel((cle as any).employe_id)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Équipements énergétiques */}
          {equipementsEnergetiques && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Équipements énergétiques
                  {getEmployeLabel((equipementsEnergetiques as any).employe_id) && (
                    <Badge variant="outline" className="ml-2">
                      <User className="h-3 w-3 mr-1" /> {getEmployeLabel((equipementsEnergetiques as any).employe_id)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Type de chauffage:</span> {equipementsEnergetiques.chauffage_type || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">Type d'eau chaude:</span> {equipementsEnergetiques.eau_chaude_type || 'Non renseigné'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Équipements de chauffage */}
          {equipementsChauffage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Équipements de chauffage
                  {getEmployeLabel((equipementsChauffage as any).employe_id) && (
                    <Badge variant="outline" className="ml-2">
                      <User className="h-3 w-3 mr-1" /> {getEmployeLabel((equipementsChauffage as any).employe_id)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">État de la chaudière:</span> {equipementsChauffage.chaudiere_etat || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">Dernier entretien chaudière:</span> {equipementsChauffage.chaudiere_date_dernier_entretien || 'Non renseigné'}
                  </div>
                  <div>
                    <span className="font-medium">État du ballon d'eau chaude:</span> {equipementsChauffage.ballon_eau_chaude_etat || 'Non renseigné'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {(
            (releveCompteurs && (releveCompteurs.photos?.length > 0 || releveCompteurs.photos_electricite?.length > 0 || releveCompteurs.photos_eau?.length > 0 || releveCompteurs.photos_gaz?.length > 0)) ||
            (cles && cles.some(cle => cle.photos?.length > 0)) ||
            (partiesPrivatives && partiesPrivatives.some(partie => partie.photos?.length > 0)) ||
            (autresEquipements && autresEquipements.some(equipement => equipement.photos?.length > 0))
          ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Photos des relevés de compteurs */}
                  {releveCompteurs && (releveCompteurs.photos?.length > 0 || releveCompteurs.photos_electricite?.length > 0 || releveCompteurs.photos_eau?.length > 0 || releveCompteurs.photos_gaz?.length > 0) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Relevé des compteurs</h3>
                      <div className="space-y-4">
                        {releveCompteurs.photos?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Photos générales</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {releveCompteurs.photos.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo générale ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {releveCompteurs.photos_electricite?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Photos électricité</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {releveCompteurs.photos_electricite.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo électricité ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {releveCompteurs.photos_eau?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Photos eau</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {releveCompteurs.photos_eau.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo eau ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {releveCompteurs.photos_gaz?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Photos gaz</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {releveCompteurs.photos_gaz.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo gaz ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photos des clés */}
                  {cles && cles.filter(cle => cle.photos?.length > 0).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Clés</h3>
                      <div className="space-y-4">
                        {cles.filter(cle => cle.photos?.length > 0).map((cle) => (
                          <div key={cle.id}>
                            <h4 className="font-medium mb-2">{cle.type_cle_badge}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {cle.photos.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo ${cle.type_cle_badge} ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos des parties privatives */}
                  {partiesPrivatives && partiesPrivatives.filter(partie => partie.photos?.length > 0).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Parties privatives</h3>
                      <div className="space-y-4">
                {partiesPrivatives.filter(partie => partie.photos?.length > 0).map((partie) => (
                          <div key={partie.id}>
                    <h4 className="font-medium mb-2">
                      {partie.type_partie} {partie.numero && `- ${partie.numero}`}
                      {getEmployeLabel((partie as any).employe_id) && (
                        <span className="ml-2 text-xs font-normal text-slate-500">({getEmployeLabel((partie as any).employe_id)})</span>
                      )}
                    </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {partie.photos.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo ${partie.type_partie} ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos des autres équipements */}
                  {autresEquipements && autresEquipements.filter(equipement => equipement.photos?.length > 0).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Autres équipements</h3>
                      <div className="space-y-4">
                {autresEquipements.filter(equipement => equipement.photos?.length > 0).map((equipement) => (
                          <div key={equipement.id}>
                    <h4 className="font-medium mb-2">
                      {equipement.equipement}
                      {getEmployeLabel((equipement as any).employe_id) && (
                        <span className="ml-2 text-xs font-normal text-slate-500">({getEmployeLabel((equipement as any).employe_id)})</span>
                      )}
                    </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {equipement.photos.map((photo: any, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo.url || photo.file_url} 
                                    alt={`Photo ${equipement.equipement} ${index + 1}`}
                                    className="max-w-full max-h-32 rounded-lg border"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Signatures */}
           {(etatDesLieux.signature_locataire || etatDesLieux.signature_proprietaire_agent) && (
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   Signatures
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {etatDesLieux.signature_locataire && (
                     <div>
                       <h4 className="font-medium mb-2">Signature du locataire</h4>
                       <div className="border rounded-lg p-2 bg-gray-50">
                         <img 
                           src={etatDesLieux.signature_locataire} 
                           alt="Signature du locataire"
                           className="w-full h-32 object-contain"
                         />
                       </div>
                     </div>
                   )}
                   {etatDesLieux.signature_proprietaire_agent && (
                     <div>
                       <h4 className="font-medium mb-2">Signature du propriétaire/agent</h4>
                       <div className="border rounded-lg p-2 bg-gray-50">
                         <img 
                           src={etatDesLieux.signature_proprietaire_agent} 
                           alt="Signature du propriétaire/agent"
                           className="w-full h-32 object-contain"
                         />
                       </div>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 };

export default EtatDesLieuxViewer;