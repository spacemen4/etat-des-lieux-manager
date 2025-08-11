import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';

// Interfaces for our data types to ensure type safety
interface Photo {
  url?: string;
  file_url?: string;
  comment?: string;
}

interface EtatDesLieuxPrintableProps {
  etatId: string;
  onReady?: () => void;
}

// Main component for the printable report
const EtatDesLieuxPrintable: React.FC<EtatDesLieuxPrintableProps> = ({ etatId, onReady }) => {
  const { userUuid } = useUser();

  // Fetching all the necessary data using custom hooks
  const { data: etatDesLieux, isLoading: isLoadingEtat } = useEtatDesLieuxById(etatId, userUuid);
  const { data: pieces, isLoading: isLoadingPieces } = usePiecesByEtatId(etatId);
  const { data: releveCompteurs, isLoading: isLoadingCompteurs } = useReleveCompteursByEtatId(etatId);
  const { data: cles, isLoading: isLoadingCles } = useClesByEtatId(etatId);
  const { data: partiesPrivatives, isLoading: isLoadingParties } = usePartiesPrivativesByEtatId(etatId);
  const { data: autresEquipements, isLoading: isLoadingAutres } = useAutresEquipementsByEtatId(etatId);
  const { data: equipementsEnergetiques, isLoading: isLoadingEnerg } = useEquipementsEnergetiquesByEtatId(etatId);
  const { data: equipementsChauffage, isLoading: isLoadingChauff } = useEquipementsChauffageByEtatId(etatId);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // A state to track when all data has been loaded
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Combined loading state
  const isLoading = isLoadingEtat || isLoadingPieces || isLoadingCompteurs || isLoadingCles || isLoadingParties || isLoadingAutres || isLoadingEnerg || isLoadingChauff;

  // Effect to fetch organization logo
  useEffect(() => {
    if (etatDesLieux?.organisation_id) {
      const fetchLogo = async () => {
        const { data, error } = await supabase
          .from('organisations')
          .select('logo_url')
          .eq('id', etatDesLieux.organisation_id)
          .single();
        if (!error && data) {
          setLogoUrl(data.logo_url);
        }
      };
      fetchLogo();
    }
  }, [etatDesLieux?.organisation_id]);

  // Effect to call onReady when all data is loaded
  useEffect(() => {
    if (!isLoading && !allDataLoaded) {
      setAllDataLoaded(true);
      if (onReady) {
        // Timeout to ensure the DOM is fully updated with images
        setTimeout(onReady, 1000);
      }
    }
  }, [isLoading, allDataLoaded, onReady]);

  // Loading and error states
  if (isLoading || !allDataLoaded) {
    return <div>Chargement des données pour le PDF...</div>;
  }

  if (!etatDesLieux) {
    return <div>Erreur: Impossible de charger les données de l'état des lieux.</div>;
  }

  // --- STYLING ---
  const styles = {
    page: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '10px', color: '#333', padding: '30px', background: 'white' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #007bff', paddingBottom: '15px', marginBottom: '30px' },
    headerText: { textAlign: 'right' as const },
    logo: { maxHeight: '60px', maxWidth: '150px' },
    h1: { fontSize: '22px', margin: '0', color: '#007bff' },
    h2: { fontSize: '16px', margin: '5px 0 0', color: '#555' },
    h3: { fontSize: '14px', backgroundColor: '#f2f2f2', padding: '10px 15px', marginTop: '25px', marginBottom: '15px', borderRadius: '4px', borderLeft: '4px solid #007bff', color: '#333' },
    section: { marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '10px' },
    th: { padding: '8px 10px', border: '1px solid #ddd', background: '#f9f9f9', textAlign: 'left' as const, fontWeight: 'bold' as const, width: '30%' },
    td: { padding: '8px 10px', border: '1px solid #ddd' },
    twoColGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' },
    photoContainer: { border: '1px solid #eee', borderRadius: '4px', padding: '5px', textAlign: 'center' as const },
    photo: { width: '100%', height: 'auto', borderRadius: '3px' },
    photoComment: { fontSize: '9px', color: '#666', marginTop: '5px' },
    signatureBox: { border: '1px solid #ddd', borderRadius: '4px', padding: '10px', background: '#f9f9f9', textAlign: 'center' as const, marginTop: '10px' },
    signatureImg: { maxWidth: '250px', maxHeight: '100px', objectFit: 'contain' as const },
    footer: { marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ccc', textAlign: 'center' as const, fontSize: '9px', color: '#888' },
    pageBreak: { pageBreakBefore: 'always' as const, paddingTop: '30px' },
    subtle: { color: '#777', fontSize: '9px' },
    subSectionTitle: { ...'h3', backgroundColor: '#fff', borderLeft: 'none', borderBottom: '2px solid #007bff', marginTop: '15px' }
  };

  // --- HELPER COMPONENTS ---
  const InfoRow = ({ label, value1, value2, comments }: { label: string; value1: React.ReactNode; value2?: React.ReactNode; comments?: React.ReactNode }) => (
    <tr>
      <td style={styles.th}>{label}</td>
      <td style={styles.td}>{value1 || 'N/A'}</td>
      {value2 !== undefined && <td style={styles.td}>{value2 || 'N/A'}</td>}
      {comments !== undefined && <td style={styles.td}>{comments || 'N/A'}</td>}
    </tr>
  );

  const PhotoDisplay = ({ photos, title }: { photos: Photo[] | null | undefined, title: string }) => {
    if (!photos || photos.length === 0) return null;
    return (
      <div style={{...styles.section, pageBreakInside: 'avoid' as const}}>
        <h4 style={styles.subSectionTitle}>{title}</h4>
        <div style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <div key={index} style={styles.photoContainer}>
              <img src={photo.url || photo.file_url} alt={`Photo ${index + 1}`} style={styles.photo} />
              {photo.comment && <p style={styles.photoComment}>{photo.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPieceDetails = (piece: any) => {
    const details = [
      { label: 'Sols', entree: piece.revetements_sols_entree, sortie: piece.revetements_sols_sortie },
      { label: 'Murs et Plafonds', entree: piece.murs_plafonds_entree, sortie: piece.murs_plafonds_sortie },
      { label: 'Menuiseries', entree: piece.menuiseries_entree, sortie: piece.menuiseries_sortie },
      { label: 'Électricité & Plomberie', entree: piece.electricite_plomberie_entree, sortie: piece.electricite_plomberie_sortie },
      { label: 'Chauffage & Tuyauterie', entree: piece.chauffage_tuyauterie_entree, sortie: piece.chauffage_tuyauterie_sortie },
      { label: 'Sanitaires', entree: piece.sanitaires_entree, sortie: piece.sanitaires_sortie },
      { label: 'Éviers & Robinetterie', entree: piece.eviers_robinetterie_entree, sortie: piece.eviers_robinetterie_sortie },
      { label: 'Meubles de cuisine', entree: piece.meubles_cuisine_entree, sortie: piece.meubles_cuisine_sortie },
    ];
    return details.map(d => (d.entree || d.sortie) && <InfoRow key={d.label} label={d.label} value1={d.entree} value2={d.sortie} comments={piece.commentaires} />);
  };

  // --- RENDER LOGIC ---
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        {logoUrl && <img src={logoUrl} alt="Logo" style={styles.logo} />}
        <div style={styles.headerText}>
          <h1 style={styles.h1}>ÉTAT DES LIEUX</h1>
          <h2 style={styles.h2}>{etatDesLieux.type_etat_des_lieux === 'entree' ? "D'ENTRÉE" : "DE SORTIE"}</h2>
        </div>
      </header>

      <section style={styles.section}>
        <h3 style={styles.h3}>Informations Générales</h3>
        <div style={styles.twoColGrid}>
          <div>
            <table style={styles.table}>
              <tbody>
                <InfoRow label="Adresse du bien" value1={etatDesLieux.adresse_bien} />
                <InfoRow label="Type de bien" value1={etatDesLieux.type_bien} />
                <InfoRow label="Date d'entrée" value1={etatDesLieux.date_entree ? new Date(etatDesLieux.date_entree).toLocaleDateString() : ''} />
                {etatDesLieux.date_sortie && <InfoRow label="Date de sortie" value1={new Date(etatDesLieux.date_sortie).toLocaleDateString()} />}
              </tbody>
            </table>
          </div>
          <div>
            <table style={styles.table}>
              <tbody>
                <InfoRow label="Bailleur" value1={<>{etatDesLieux.bailleur_nom}<br/><span style={styles.subtle}>{etatDesLieux.bailleur_adresse}</span></>} />
                <InfoRow label="Locataire" value1={<>{etatDesLieux.locataire_nom}<br/><span style={styles.subtle}>{etatDesLieux.locataire_adresse}</span></>} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {releveCompteurs && (
        <section style={styles.section}>
          <h3 style={styles.h3}>Relevé des Compteurs</h3>
          <table style={styles.table}>
            <thead><tr><td style={styles.th}>Compteur</td><td style={styles.th}>N° / Ancien Occupant</td><td style={styles.td}>Relevé</td></tr></thead>
            <tbody>
              <InfoRow label="Électricité (H. Pleines)" value1={releveCompteurs.electricite_n_compteur} value2={releveCompteurs.electricite_h_pleines} />
              <InfoRow label="Électricité (H. Creuses)" value1={releveCompteurs.electricite_n_compteur} value2={releveCompteurs.electricite_h_creuses} />
              <InfoRow label="Gaz Naturel" value1={releveCompteurs.gaz_naturel_n_compteur} value2={releveCompteurs.gaz_naturel_releve} />
              <InfoRow label="Eau Chaude (m³)" value1="N/A" value2={releveCompteurs.eau_chaude_m3} />
              <InfoRow label="Eau Froide (m³)" value1="N/A" value2={releveCompteurs.eau_froide_m3} />
              <InfoRow label="Ancien occupant" value1={releveCompteurs.nom_ancien_occupant} />
            </tbody>
          </table>
          <PhotoDisplay photos={releveCompteurs.photos as Photo[]} title="Photos des Compteurs" />
        </section>
      )}

      {cles && cles.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.h3}>Clés et Badges</h3>
          <table style={styles.table}>
            <thead><tr><td style={styles.th}>Type</td><td style={styles.th}>Numéro</td><td style={styles.th}>Quantité</td><td style={styles.td}>Commentaires</td></tr></thead>
            <tbody>
              {cles.map(cle => (
                <tr key={cle.id}><td style={styles.td}>{cle.type_cle_badge}</td><td style={styles.td}>{cle.numero_cle || 'N/A'}</td><td style={styles.td}>{cle.nombre}</td><td style={styles.td}>{cle.commentaires || 'N/A'}</td></tr>
              ))}
            </tbody>
          </table>
           <PhotoDisplay photos={cles.flatMap(c => c.photos as Photo[] || [])} title="Photos des Clés" />
        </section>
      )}

      {pieces && pieces.length > 0 && (
        <div style={styles.pageBreak}>
          <h3 style={styles.h3}>Inspection Détaillée des Pièces</h3>
          {pieces.map(piece => (
            <section key={piece.id} style={{...styles.section, pageBreakInside: 'avoid' as const}}>
              <h4 style={styles.subSectionTitle}>{piece.nom_piece}</h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <td style={styles.th}>Élément</td>
                    <td style={styles.th}>État (Entrée)</td>
                    <td style={styles.th}>État (Sortie)</td>
                    <td style={styles.td}>Commentaires</td>
                  </tr>
                </thead>
                <tbody>{renderPieceDetails(piece)}</tbody>
              </table>
              <PhotoDisplay photos={piece.photos as Photo[]} title={`Photos ${piece.nom_piece}`} />
            </section>
          ))}
        </div>
      )}

      <div style={styles.pageBreak}>
        <div style={styles.twoColGrid}>
          {equipementsEnergetiques && (
            <section style={styles.section}>
              <h3 style={styles.h3}>Équipements Énergétiques</h3>
              <table style={styles.table}>
                <tbody>
                  <InfoRow label="Type de chauffage" value1={equipementsEnergetiques.chauffage_type} />
                  <InfoRow label="Type d'eau chaude" value1={equipementsEnergetiques.eau_chaude_type} />
                  <InfoRow label="Classe DPE" value1={equipementsEnergetiques.dpe_classe} />
                  <InfoRow label="Classe GES" value1={equipementsEnergetiques.ges_classe} />
                </tbody>
              </table>
            </section>
          )}
          {equipementsChauffage && (
            <section style={styles.section}>
              <h3 style={styles.h3}>Système de Chauffage</h3>
              <table style={styles.table}>
                <tbody>
                  <InfoRow label="Radiateurs" value1={`Nombre: ${equipementsChauffage.radiateurs_nombre}`} value2={`État: ${equipementsChauffage.radiateurs_etat}`} />
                  <InfoRow label="Chaudière" value1={`État: ${equipementsChauffage.chaudiere_etat}`} value2={`Entretien: ${equipementsChauffage.chaudiere_date_dernier_entretien ? new Date(equipementsChauffage.chaudiere_date_dernier_entretien).toLocaleDateString() : ''}`} />
                </tbody>
              </table>
            </section>
          )}
        </div>

        {partiesPrivatives && partiesPrivatives.length > 0 && (
          <section style={styles.section}>
            <h3 style={styles.h3}>Parties Privatives (Cave, Grenier, etc.)</h3>
            <table style={styles.table}>
              <thead><tr><td style={styles.th}>Partie</td><td style={styles.th}>État (Entrée)</td><td style={styles.th}>État (Sortie)</td><td style={styles.td}>Commentaires</td></tr></thead>
              <tbody>
                {partiesPrivatives.map(p => <InfoRow key={p.id} label={`${p.type_partie} ${p.numero || ''}`} value1={p.etat_entree} value2={p.etat_sortie} comments={p.commentaires} />)}
              </tbody>
            </table>
            <PhotoDisplay photos={partiesPrivatives.flatMap(p => p.photos as Photo[] || [])} title="Photos des Parties Privatives" />
          </section>
        )}
        {autresEquipements && autresEquipements.length > 0 && (
          <section style={styles.section}>
            <h3 style={styles.h3}>Autres Équipements</h3>
             <table style={styles.table}>
              <thead><tr><td style={styles.th}>Équipement</td><td style={styles.th}>État (Entrée)</td><td style={styles.th}>État (Sortie)</td><td style={styles.td}>Commentaires</td></tr></thead>
              <tbody>
                {autresEquipements.map(e => <InfoRow key={e.id} label={e.equipement} value1={e.etat_entree} value2={e.etat_sortie} comments={e.commentaires} />)}
              </tbody>
            </table>
            <PhotoDisplay photos={autresEquipements.flatMap(e => e.photos as Photo[] || [])} title="Photos des Autres Équipements" />
          </section>
        )}

        {etatDesLieux.travaux_a_faire && (
          <section style={styles.section}>
            <h3 style={styles.h3}>Travaux à prévoir</h3>
            <div style={styles.td}>
              {etatDesLieux.description_travaux || "Description non fournie."}
            </div>
          </section>
        )}
      </div>

      {(etatDesLieux.signature_locataire || etatDesLieux.signature_proprietaire_agent) && (
        <div style={{...styles.pageBreak, ...styles.section}}>
          <h3 style={styles.h3}>Signatures</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', marginTop: '30px' }}>
            {etatDesLieux.signature_locataire && (
              <div style={{ width: '45%' }}>
                <h4 style={{ textAlign: 'center' }}>Signature du locataire</h4>
                <div style={styles.signatureBox}>
                  <img src={etatDesLieux.signature_locataire} alt="Signature locataire" style={styles.signatureImg} />
                </div>
              </div>
            )}
            {etatDesLieux.signature_proprietaire_agent && (
              <div style={{ width: '45%' }}>
                <h4 style={{ textAlign: 'center' }}>Signature du propriétaire/agent</h4>
                <div style={styles.signatureBox}>
                  <img src={etatDesLieux.signature_proprietaire_agent} alt="Signature propriétaire/agent" style={styles.signatureImg} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <p>Document généré le {new Date().toLocaleDateString()} à {new Date().toLocaleTimeString()}</p>
        <p>État des lieux pour le bien situé à {etatDesLieux.adresse_bien}</p>
      </footer>
    </div>
  );
};

export default EtatDesLieuxPrintable;
