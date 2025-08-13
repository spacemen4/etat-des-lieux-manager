import { Tables } from './etatDesLieux';

// Type étendu pour supporter les champs de signature eIDAS
export interface EidasEtatDesLieux extends Omit<Tables<'etat_des_lieux'>, never> {
  // Champs de signature eIDAS pour le locataire
  signature_locataire_nom?: string | null;
  signature_locataire_lieu?: string | null;
  signature_locataire_lu_approuve?: boolean | null;
  signature_locataire_photo_identite?: string | null;
  signature_locataire_date?: string | null;
  
  // Champs de signature eIDAS pour le propriétaire/agent
  signature_proprietaire_agent_nom?: string | null;
  signature_proprietaire_agent_lieu?: string | null;
  signature_proprietaire_agent_lu_approuve?: boolean | null;
  signature_proprietaire_agent_photo_identite?: string | null;
  signature_proprietaire_agent_date?: string | null;
}

// Type pour les mises à jour qui incluent les champs eIDAS
export interface EidasEtatDesLieuxUpdate {
  id: string;
  date_sortie?: string;
  statut?: 'finalise' | 'en_cours';
  travaux_a_faire?: boolean;
  description_travaux?: string;
  signature_locataire?: string;
  signature_locataire_nom?: string;
  signature_locataire_lieu?: string;
  signature_locataire_lu_approuve?: boolean;
  signature_locataire_photo_identite?: string;
  signature_locataire_date?: string;
  signature_proprietaire_agent?: string;
  signature_proprietaire_agent_nom?: string;
  signature_proprietaire_agent_lieu?: string;
  signature_proprietaire_agent_lu_approuve?: boolean;
  signature_proprietaire_agent_photo_identite?: string;
  signature_proprietaire_agent_date?: string;
  employe_id?: string;
}

// Type pour les données de signature eIDAS complet
export interface EidasSignatureComplete {
  signature: string;
  nom: string;
  lieu: string;
  lu_approuve: boolean;
  photo_identite?: string;
  date: string;
}

export type EtatDesLieux = EidasEtatDesLieux;