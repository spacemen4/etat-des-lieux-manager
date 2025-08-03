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

interface EtatDesLieuxPrintableProps {
  etatId: string;
  onReady?: () => void;
}

const EtatDesLieuxPrintable: React.FC<EtatDesLieuxPrintableProps> = ({ etatId, onReady }) => {
  const { userUuid } = useUser();
  const { data: etatDesLieux, isLoading: isLoadingEtat } = useEtatDesLieuxById(etatId, userUuid);
  const { data: pieces, isLoading: isLoadingPieces } = usePiecesByEtatId(etatId);
  const { data: releveCompteurs, isLoading: isLoadingCompteurs } = useReleveCompteursByEtatId(etatId);
  const { data: cles, isLoading: isLoadingCles } = useClesByEtatId(etatId);
  const { data: partiesPrivatives, isLoading: isLoadingParties } = usePartiesPrivativesByEtatId(etatId);
  const { data: autresEquipements, isLoading: isLoadingAutres } = useAutresEquipementsByEtatId(etatId);
  const { data: equipementsEnergetiques, isLoading: isLoadingEnerg } = useEquipementsEnergetiquesByEtatId(etatId);
  const { data: equipementsChauffage, isLoading: isLoadingChauff } = useEquipementsChauffageByEtatId(etatId);

  const [allDataLoaded, setAllDataLoaded] = useState(false);

  const isLoading = isLoadingEtat || isLoadingPieces || isLoadingCompteurs || isLoadingCles || isLoadingParties || isLoadingAutres || isLoadingEnerg || isLoadingChauff;

  useEffect(() => {
    if (!isLoading && !allDataLoaded) {
      setAllDataLoaded(true);
      if (onReady) {
        // Use a timeout to ensure the DOM is fully updated
        setTimeout(onReady, 500);
      }
    }
  }, [isLoading, allDataLoaded, onReady]);

  if (isLoading || !allDataLoaded) {
    return <div>Chargement des données pour le PDF...</div>;
  }

  if (!etatDesLieux) {
    return <div>Erreur: Impossible de charger les données de l'état des lieux.</div>;
  }

  const getTypeBienLabel = (typeBien: string) => {
    const labels: Record<string, string> = {
      'studio': 'Studio', 't2_t3': 'T2 - T3', 't4_t5': 'T4 - T5',
      'inventaire_mobilier': 'Inventaire mobilier', 'bureau': 'Bureau',
      'local_commercial': 'Local commercial', 'garage_box': 'Garage / Box',
      'pieces_supplementaires': 'Pièces supplémentaires'
    };
    return labels[typeBien] || typeBien;
  };

  const styles = {
    page: { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#333', padding: '40px', background: 'white' },
    header: { textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px' },
    h1: { fontSize: '24px', margin: '0' },
    h2: { fontSize: '18px', margin: '10px 0', color: '#666' },
    h3: { fontSize: '16px', backgroundColor: '#f0f0f0', padding: '10px', marginTop: '30px', marginBottom: '15px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { padding: '8px', border: '1px solid #ddd', background: '#f9f9f9', textAlign: 'left', fontWeight: 'bold' },
    td: { padding: '8px', border: '1px solid #ddd' },
    photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' },
    photo: { width: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '4px' },
    signatureBox: { border: '1px solid #ddd', borderRadius: '4px', padding: '10px', background: '#f9f9f9', textAlign: 'center' },
    signatureImg: { maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' },
    footer: { marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#888' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.h1}>ÉTAT DES LIEUX</h1>
        <h2 style={styles.h2}>{etatDesLieux.type_etat_des_lieux === 'entree' ? "D'ENTRÉE" : "DE SORTIE"}</h2>
      </div>

      <h3 style={styles.h3}>Informations Générales</h3>
      <table style={styles.table}>
        <tbody>
          <tr><td style={styles.th}>Adresse</td><td style={styles.td}>{etatDesLieux.adresse_bien}</td></tr>
          <tr><td style={styles.th}>Type de bien</td><td style={styles.td}>{getTypeBienLabel(etatDesLieux.type_bien)}</td></tr>
          <tr><td style={styles.th}>Bailleur</td><td style={styles.td}>{etatDesLieux.bailleur_nom || 'Non renseigné'}</td></tr>
          <tr><td style={styles.th}>Locataire</td><td style={styles.td}>{etatDesLieux.locataire_nom || 'Non renseigné'}</td></tr>
          <tr><td style={styles.th}>Date d'entrée</td><td style={styles.td}>{etatDesLieux.date_entree ? new Date(etatDesLieux.date_entree).toLocaleDateString() : 'Non renseignée'}</td></tr>
          {etatDesLieux.date_sortie && <tr><td style={styles.th}>Date de sortie</td><td style={styles.td}>{new Date(etatDesLieux.date_sortie).toLocaleDateString()}</td></tr>}
        </tbody>
      </table>

      {releveCompteurs && (
        <div>
          <h3 style={styles.h3}>Relevé des Compteurs</h3>
          <table style={styles.table}>
            <tbody>
              <tr><td style={styles.th}>Électricité H. pleines</td><td style={styles.td}>{releveCompteurs.electricite_h_pleines || 'N/A'}</td></tr>
              <tr><td style={styles.th}>Électricité H. creuses</td><td style={styles.td}>{releveCompteurs.electricite_h_creuses || 'N/A'}</td></tr>
              <tr><td style={styles.th}>Gaz naturel</td><td style={styles.td}>{releveCompteurs.gaz_naturel_releve || 'N/A'}</td></tr>
              <tr><td style={styles.th}>Eau chaude (m³)</td><td style={styles.td}>{releveCompteurs.eau_chaude_m3 || 'N/A'}</td></tr>
              <tr><td style={styles.th}>Eau froide (m³)</td><td style={styles.td}>{releveCompteurs.eau_froide_m3 || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {pieces && pieces.length > 0 && (
        <div>
          <h3 style={styles.h3}>Détail des Pièces</h3>
          {pieces.map(piece => (
            <div key={piece.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '15px', borderRadius: '4px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{piece.nom_piece}</h4>
              <table style={styles.table}>
                <tbody>
                  <tr><td style={styles.th}>Revêtements sols</td><td style={styles.td}>{piece.revetements_sols_sortie || piece.revetements_sols_entree || 'N/A'}</td></tr>
                  <tr><td style={styles.th}>Murs et menuiseries</td><td style={styles.td}>{piece.murs_menuiseries_sortie || piece.murs_menuiseries_entree || 'N/A'}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {cles && cles.length > 0 && (
        <div>
          <h3 style={styles.h3}>Clés et Badges</h3>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Type</th><th style={styles.th}>Nombre</th><th style={styles.th}>Commentaires</th></tr></thead>
            <tbody>
              {cles.map(cle => (
                <tr key={cle.id}><td style={styles.td}>{cle.type_cle_badge}</td><td style={styles.td}>{cle.nombre}</td><td style={styles.td}>{cle.commentaires || 'N/A'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Photos Section */}
      <h3 style={styles.h3}>Photos</h3>
      <div style={{ pageBreakInside: 'avoid' }}>
        {/* Photos Logement */}
        {partiesPrivatives?.map(p => p.photos && p.photos.length > 0 && (
          <div key={p.id}>
            <h4>Photos {p.type_partie} {p.numero}</h4>
            <div style={styles.photoGrid}>
              {p.photos.map((photo, index) => <img key={index} src={photo.url || photo.file_url} alt={`Photo ${p.type_partie}`} style={styles.photo} />)}
            </div>
          </div>
        ))}
        {/* Photos Compteurs */}
        {releveCompteurs?.photos && releveCompteurs.photos.length > 0 && (
          <div>
            <h4>Photos Compteurs</h4>
            <div style={styles.photoGrid}>
              {releveCompteurs.photos.map((photo, index) => <img key={index} src={photo.url || photo.file_url} alt="Photo compteur" style={styles.photo} />)}
            </div>
          </div>
        )}
      </div>

      {/* Signatures */}
      {(etatDesLieux.signature_locataire || etatDesLieux.signature_proprietaire_agent) && (
        <div style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
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

      <div style={styles.footer}>
        <p>Document généré le {new Date().toLocaleDateString()} à {new Date().toLocaleTimeString()}</p>
        <p>État des lieux {etatDesLieux.adresse_bien}</p>
      </div>
    </div>
  );
};

export default EtatDesLieuxPrintable;
