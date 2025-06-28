
export interface EtatDesLieux {
  id: string;
  date_entree: string | null;
  date_sortie: string | null; // Déjà nullable, OK
  adresse_bien: string; // Champ obligatoire pour "Type de bien"
  statut?: string | null; // Ajout du champ statut, utilisé lors de la finalisation
  bailleur_nom: string | null;
  bailleur_adresse: string | null;
  locataire_nom: string | null;
  locataire_adresse: string | null;
}

export interface ReleveCompteurs {
  id: string;
  etat_des_lieux_id: string;
  nom_ancien_occupant: string | null;
  electricite_n_compteur: string | null;
  electricite_h_pleines: string | null;
  electricite_h_creuses: string | null;
  gaz_naturel_n_compteur: string | null;
  gaz_naturel_releve: string | null;
  eau_chaude_m3: string | null;
  eau_froide_m3: string | null;
}

export interface EquipementsEnergetiques {
  id: string;
  etat_des_lieux_id: string;
  chauffage_type: string | null;
  eau_chaude_type: string | null;
}

export interface Piece {
  id: string;
  etat_des_lieux_id: string;
  nom_piece: string;
  revetements_sols_entree: string | null;
  revetements_sols_sortie: string | null;
  murs_menuiseries_entree: string | null;
  murs_menuiseries_sortie: string | null;
  plafond_entree: string | null;
  plafond_sortie: string | null;
  electricite_plomberie_entree: string | null;
  electricite_plomberie_sortie: string | null;
  placards_entree: string | null;
  placards_sortie: string | null;
  sanitaires_entree: string | null;
  sanitaires_sortie: string | null;
  menuiseries_entree: string | null;
  menuiseries_sortie: string | null;
  rangements_entree: string | null;
  rangements_sortie: string | null;
  baignoire_douche_entree: string | null;
  baignoire_douche_sortie: string | null;
  eviers_robinetterie_entree: string | null;
  eviers_robinetterie_sortie: string | null;
  chauffage_tuyauterie_entree: string | null;
  chauffage_tuyauterie_sortie: string | null;
  meubles_cuisine_entree: string | null;
  meubles_cuisine_sortie: string | null;
  hotte_entree: string | null;
  hotte_sortie: string | null;
  plaque_cuisson_entree: string | null;
  plaque_cuisson_sortie: string | null;
  commentaires: string | null;
}

export interface Cles {
  id: string;
  etat_des_lieux_id: string;
  type_cle_badge: string | null;
  nombre: number | null;
  commentaires: string | null;
}
