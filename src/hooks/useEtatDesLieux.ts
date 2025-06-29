import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Updated interfaces to match src/types/etatDesLieux.ts
export interface EtatDesLieux {
  id: string;
  date_entree?: string | null;
  date_sortie?: string | null;
  adresse_bien: string; // Required
  statut?: string | null;
  type_etat_des_lieux: 'entree' | 'sortie'; // Required - Type of inventory
  type_bien: 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires'; // Required - Type of property
  bailleur_nom?: string | null;
  bailleur_adresse?: string | null;
  locataire_nom?: string | null;
  locataire_adresse?: string | null;
}

export interface Piece {
  id: string;
  etat_des_lieux_id: string;
  nom_piece: string; // Required
  revetements_sols_entree?: string | null;
  revetements_sols_sortie?: string | null;
  murs_menuiseries_entree?: string | null;
  murs_menuiseries_sortie?: string | null;
  plafond_entree?: string | null;
  plafond_sortie?: string | null;
  electricite_plomberie_entree?: string | null;
  electricite_plomberie_sortie?: string | null;
  // Added missing optional fields from src/types/etatDesLieux.ts for consistency
  placards_entree?: string | null;
  placards_sortie?: string | null;
  sanitaires_entree?: string | null;
  sanitaires_sortie?: string | null;
  menuiseries_entree?: string | null;
  menuiseries_sortie?: string | null;
  rangements_entree?: string | null;
  rangements_sortie?: string | null;
  chauffage_tuyauterie_entree?: string | null;
  chauffage_tuyauterie_sortie?: string | null;
  meubles_cuisine_entree?: string | null;
  meubles_cuisine_sortie?: string | null;
  plaque_cuisson_entree?: string | null;
  plaque_cuisson_sortie?: string | null;
  baignoire_douche_entree?: string | null;
  baignoire_douche_sortie?: string | null;
  eviers_robinetterie_entree?: string | null;
  eviers_robinetterie_sortie?: string | null;
  hotte_entree?: string | null;
  hotte_sortie?: string | null;
  commentaires?: string | null;
}

export interface ReleveCompteurs {
  id: string;
  etat_des_lieux_id: string;
  nom_ancien_occupant?: string | null; // Added from src/types
  electricite_n_compteur?: string | null; // Added from src/types
  electricite_h_pleines?: string | null;
  electricite_h_creuses?: string | null;
  gaz_naturel_n_compteur?: string | null; // Added from src/types
  gaz_naturel_releve?: string | null;
  eau_chaude_m3?: string | null;
  eau_froide_m3?: string | null;
}

export interface Cles {
  id: string;
  etat_des_lieux_id: string;
  type_cle_badge?: string | null; // Made optional
  nombre?: number | null; // Made optional
  commentaires?: string | null;
}

export interface PartiePrivative {
  id: string;
  etat_des_lieux_id: string;
  type_partie?: string | null;
  etat_entree?: string | null; // Assuming it might exist, like other sections
  etat_sortie?: string | null;
  numero?: string | null;
  commentaires?: string | null;
}

export interface AutreEquipement {
  id: string; // Assuming primary key
  etat_des_lieux_id: string;
  equipement: string; // This seems to be the defining characteristic
  etat_entree?: string | null; // Assuming it might exist
  etat_sortie?: string | null;
  commentaires?: string | null;
}

export interface EquipementEnergetique {
  // Assuming etat_des_lieux_id is the primary key as it's 1-to-1
  etat_des_lieux_id: string;
  chauffage_type?: string | null;
  eau_chaude_type?: string | null;
  // No separate id if etat_des_lieux_id is PK
}

export interface EquipementChauffage {
  // Assuming etat_des_lieux_id is the primary key as it's 1-to-1
  etat_des_lieux_id: string;
  chaudiere_etat?: string | null;
  chaudiere_date_dernier_entretien?: string | null; // Store as string, handle date conversion in UI
  ballon_eau_chaude_etat?: string | null;
   // No separate id if etat_des_lieux_id is PK
}

export const useEtatDesLieux = () => {
  return useQuery({
    queryKey: ['etat-des-lieux'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .order('date_entree', { ascending: false });
      
      if (error) throw error;
      return data as EtatDesLieux[];
    },
  });
};

export const useUpdateAutreEquipement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (autreEquipementData: Partial<AutreEquipement>) => {
      // Ensure 'equipement' and 'etat_des_lieux_id' are present for upsert,
      // or handle if 'id' is the primary upsert key.
      // For now, assuming 'id' might be generated or handled by DB if not provided.
      // If 'equipement' + 'etat_des_lieux_id' is the composite key, upsert needs `onConflict`.
      const { data, error } = await supabase
        .from('autres_equipements')
        .upsert(autreEquipementData)
        .select()
        .single(); // Assuming we want the single upserted/updated record

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autres-equipements', data?.etat_des_lieux_id] });
    },
  });
};

export const useUpdateEquipementsEnergetiques = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipementEnergetiqueData: Partial<EquipementEnergetique>) => {
      const { data, error } = await supabase
        .from('equipements_energetiques')
        .upsert(equipementEnergetiqueData, { onConflict: 'etat_des_lieux_id' }) // Upsert on PK
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipements-energetiques', data?.etat_des_lieux_id] });
    },
  });
};

export const useUpdateEquipementsChauffage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipementChauffageData: Partial<EquipementChauffage>) => {
      const { data, error } = await supabase
        .from('equipements_chauffage')
        .upsert(equipementChauffageData, { onConflict: 'etat_des_lieux_id' }) // Upsert on PK
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipements-chauffage', data?.etat_des_lieux_id] });
    },
  });
};
export const useAutresEquipementsByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['autres-equipements', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autres_equipements') // Table name assumed
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data as AutreEquipement[];
    },
    enabled: !!etatId,
  });
};

export const useEquipementsEnergetiquesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['equipements-energetiques', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements_energetiques') // Table name assumed
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single(); // Assuming one record per etat_des_lieux_id

      if (error) throw error;
      return data as EquipementEnergetique;
    },
    enabled: !!etatId,
  });
};

export const useEquipementsChauffageByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['equipements-chauffage', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements_chauffage') // Table name assumed
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single(); // Assuming one record per etat_des_lieux_id

      if (error) throw error;
      return data as EquipementChauffage;
    },
    enabled: !!etatId,
  });
};

export const usePartiesPrivativesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['parties-privatives', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data as PartiePrivative[];
    },
    enabled: !!etatId,
  });
};

export const useUpdatePartiePrivative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partieData: Partial<PartiePrivative>) => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .upsert(partieData) // Assuming 'id' or a composite key is handled by upsert
        .select()
        .single(); // Assuming we want to get the updated/inserted row back

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parties-privatives', data?.etat_des_lieux_id] });
    },
  });
};

export const useEtatDesLieuxById = (id: string) => {
  return useQuery({
    queryKey: ['etat-des-lieux', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as EtatDesLieux;
    },
    enabled: !!id,
  });
};

// It's generally better to have a specific hook for updates rather than modifying useEtatDesLieuxById
// Let's create a new hook for updating general information, similar to useUpdateEtatSortie but more generic.
// Or, we can modify useUpdateEtatSortie to be more generic if it's not strictly for 'sortie' specific fields.

// For now, let's assume useUpdateEtatSortie can be generalized or we create a new one.
// The plan was to modify useEtatDesLieuxById, but that's not standard practice for react-query.
// Instead, we should ensure a proper mutation hook is used in GeneralStep.tsx.
// The existing useUpdateEtatSortie is a mutation hook. We need to check if its mutationFn is suitable.

// The current useUpdateEtatSortie is:
// mutationFn: async ({ id, date_sortie, statut }: { id: string; date_sortie?: string | null; statut?: string | null })
// This is too specific. We need a more generic update hook.

export const useUpdateEtatDesLieuxGeneral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData: Partial<EtatDesLieux> & { id: string }) => {
      const { id, ...updateFields } = updatedData;
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['etat-des-lieux'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['etat-des-lieux', variables.id] });
      }
    },
  });
};


export const usePiecesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['pieces', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .eq('etat_des_lieux_id', etatId);
      
      if (error) throw error;
      return data as Piece[];
    },
    enabled: !!etatId,
  });
};

export const useReleveCompteursByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['releve-compteurs', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('releve_compteurs')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        // Remove .single(), allow for zero or one record
        .maybeSingle(); // Use .maybeSingle() to return null if no row, or the single row if one exists.

      if (error) {
        // If .maybeSingle() throws an error for other reasons (e.g. multiple rows), it should be handled.
        console.error('Error fetching releve_compteurs:', error);
        throw error;
      }
      // data will be the record or null if not found.
      return data as ReleveCompteurs | null; // Adjust type to include null
    },
    enabled: !!etatId,
  });
};

export const useClesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['cles', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cles')
        .select('*')
        .eq('etat_des_lieux_id', etatId);
      
      if (error) throw error;
      return data as Cles[];
    },
    enabled: !!etatId,
  });
};

export const useUpdateEtatSortie = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, date_sortie, statut }: { id: string; date_sortie?: string | null; statut?: string | null }) => {
      const updateData: Partial<EtatDesLieux> = {};
      if (date_sortie !== undefined) updateData.date_sortie = date_sortie;
      if (statut !== undefined) updateData.statut = statut;

      const { data, error } = await supabase
        .from('etat_des_lieux')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => { // Added variables to access id for specific invalidation
      queryClient.invalidateQueries({ queryKey: ['etat-des-lieux'] }); // General list
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['etat-des-lieux', variables.id] }); // Specific item
      }
    },
  });
};

export const useUpdateReleveCompteurs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (releveData: Partial<ReleveCompteurs>) => {
      const { data, error } = await supabase
        .from('releve_compteurs')
        .upsert(releveData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['releve-compteurs', data?.etat_des_lieux_id] });
    },
  });
};

export const useUpdatePiece = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pieceData: Partial<Piece>) => {
      const { data, error } = await supabase
        .from('pieces')
        .upsert(pieceData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', data?.etat_des_lieux_id] });
    },
  });
};

export const useUpdateCles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clesData: Partial<Cles>) => {
      const { data, error } = await supabase
        .from('cles')
        .upsert(clesData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cles', data?.etat_des_lieux_id] });
    },
  });
};
