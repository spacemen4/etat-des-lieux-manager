import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// ===== INTERFACES =====

export interface EtatDesLieux {
  id: string;
  date_entree?: string | null;
  date_sortie?: string | null;
  adresse_bien: string;
  statut?: string | null;
  type_etat_des_lieux: 'entree' | 'sortie';
  type_bien: 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires';
  bailleur_nom?: string | null;
  bailleur_adresse?: string | null;
  locataire_nom?: string | null;
  locataire_adresse?: string | null;
  created_at?: string;
  updated_at?: string;
}


export interface Piece {
  id: string;
  etat_des_lieux_id: string;
  nom_piece: string;
  revetements_sols_entree?: string | null;
  revetements_sols_sortie?: string | null;
  murs_menuiseries_entree?: string | null;
  murs_menuiseries_sortie?: string | null;
  plafond_entree?: string | null;
  plafond_sortie?: string | null;
  electricite_plomberie_entree?: string | null;
  electricite_plomberie_sortie?: string | null;
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
  nom_ancien_occupant?: string | null;
  electricite_n_compteur?: string | null;
  electricite_h_pleines?: string | null;
  electricite_h_creuses?: string | null;
  gaz_naturel_n_compteur?: string | null;
  gaz_naturel_releve?: string | null;
  eau_chaude_m3?: string | null;
  eau_froide_m3?: string | null;
}

export interface Cles {
  id: string;
  etat_des_lieux_id: string;
  type_cle_badge?: string | null;
  nombre?: number | null;
  commentaires?: string | null;
}

export interface PartiePrivative {
  id: string;
  etat_des_lieux_id: string;
  type_partie?: string | null;
  etat_entree?: string | null;
  etat_sortie?: string | null;
  numero?: string | null;
  commentaires?: string | null;
}

export interface AutreEquipement {
  id: string;
  etat_des_lieux_id: string;
  equipement: string;
  etat_entree?: string | null;
  etat_sortie?: string | null;
  commentaires?: string | null;
}

export interface EquipementEnergetique {
  etat_des_lieux_id: string;
  chauffage_type?: string | null;
  eau_chaude_type?: string | null;
}

export interface EquipementChauffage {
  etat_des_lieux_id: string;
  chaudiere_etat?: string | null;
  chaudiere_date_dernier_entretien?: string | null;
  ballon_eau_chaude_etat?: string | null;
}

// ===== TYPES UTILITAIRES =====

type MutationOptions<TData, TError, TVariables> = Omit<
  UseMutationOptions<TData, TError, TVariables>,
  'mutationFn'
>;

type QueryOptions<TData, TError> = Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
>;

// ===== CONSTANTES =====

const QUERY_KEYS = {
  etatDesLieux: ['etat-des-lieux'] as const,
  etatDesLieuxById: (id: string) => ['etat-des-lieux', id] as const,
  pieces: (etatId: string) => ['pieces', etatId] as const,
  releveCompteurs: (etatId: string) => ['releve-compteurs', etatId] as const,
  cles: (etatId: string) => ['cles', etatId] as const,
  partiesPrivatives: (etatId: string) => ['parties-privatives', etatId] as const,
  autresEquipements: (etatId: string) => ['autres-equipements', etatId] as const,
  equipementsEnergetiques: (etatId: string) => ['equipements-energetiques', etatId] as const,
  equipementsChauffage: (etatId: string) => ['equipements-chauffage', etatId] as const,
} as const;

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// ===== HOOKS DE REQUÊTE =====

export const useEtatDesLieux = (
  options?: QueryOptions<EtatDesLieux[], PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.etatDesLieux,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .order('date_entree', { ascending: false });
      
      if (error) throw error;
      return data as EtatDesLieux[];
    },
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const useCreatePiece = (
  options?: MutationOptions<Piece, PostgrestError, Omit<Piece, 'id'>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pieceData: {
      etat_des_lieux_id: string;
      nom_piece: string;
    }) => {
      // Utiliser Supabase au lieu de fetch vers /api/pieces
      const { data, error } = await supabase
        .from('pieces')
        .insert(pieceData)
        .select()
        .single();

      if (error) throw error;
      return data as Piece;
    },
    onSuccess: (data) => {
      if (data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.pieces(data.etat_des_lieux_id) 
        });
      }
    },
    ...options,
  });
};

export const useEtatDesLieuxById = (
  id: string,
  options?: QueryOptions<EtatDesLieux, PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.etatDesLieuxById(id),
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
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const usePiecesByEtatId = (
  etatId: string,
  options?: QueryOptions<Piece[], PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.pieces(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .order('nom_piece');
      
      if (error) throw error;
      return data as Piece[];
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const useReleveCompteursByEtatId = (
  etatId: string,
  options?: QueryOptions<ReleveCompteurs | null, PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.releveCompteurs(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('releve_compteurs')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .maybeSingle();

      if (error) throw error;
      return data as ReleveCompteurs | null;
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const useClesByEtatId = (
  etatId: string,
  options?: QueryOptions<Cles[], PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.cles(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cles')
        .select('*')
        .eq('etat_des_lieux_id', etatId);
      
      if (error) throw error;
      return data as Cles[];
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const usePartiesPrivativesByEtatId = (
  etatId: string,
  options?: QueryOptions<PartiePrivative[], PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.partiesPrivatives(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data as PartiePrivative[];
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const useAutresEquipementsByEtatId = (
  etatId: string,
  options?: QueryOptions<AutreEquipement[], PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.autresEquipements(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autres_equipements')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data as AutreEquipement[];
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const useEquipementsEnergetiquesByEtatId = (
  etatId: string,
  options?: QueryOptions<EquipementEnergetique | null, PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.equipementsEnergetiques(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements_energetiques')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .maybeSingle();

      if (error) throw error;
      return data as EquipementEnergetique | null;
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

export const useEquipementsChauffageByEtatId = (
  etatId: string,
  options?: QueryOptions<EquipementChauffage | null, PostgrestError>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.equipementsChauffage(etatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements_chauffage')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .maybeSingle();

      if (error) throw error;
      return data as EquipementChauffage | null;
    },
    enabled: !!etatId,
    staleTime: DEFAULT_STALE_TIME,
    cacheTime: DEFAULT_CACHE_TIME,
    ...options,
  });
};

// ===== HOOKS DE MUTATION =====

export const useUpdateEtatDesLieux = (
  options?: MutationOptions<EtatDesLieux, PostgrestError, Partial<EtatDesLieux> & { id: string }>
) => {
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
      return data as EtatDesLieux;
    },
    onSuccess: (data, variables) => {
      // Invalidation optimisée
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.etatDesLieux });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.etatDesLieuxById(variables.id) });
      
      // Mise à jour optimiste du cache
      queryClient.setQueryData(QUERY_KEYS.etatDesLieuxById(variables.id), data);
    },
    ...options,
  });
};

export const useCreateEtatDesLieux = (
  options?: MutationOptions<EtatDesLieux, PostgrestError, Omit<EtatDesLieux, 'id'>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEtatData: Omit<EtatDesLieux, 'id'>) => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .insert(newEtatData)
        .select()
        .single();

      if (error) throw error;
      return data as EtatDesLieux;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.etatDesLieux });
      queryClient.setQueryData(QUERY_KEYS.etatDesLieuxById(data.id), data);
    },
    ...options,
  });
};

export const useDeleteEtatDesLieux = (
  options?: MutationOptions<void, PostgrestError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('etat_des_lieux')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.etatDesLieux });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.etatDesLieuxById(id) });
    },
    ...options,
  });
};

export const useUpdatePiece = (
  options?: MutationOptions<Piece, PostgrestError, Partial<Piece>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pieceData: Partial<Piece>) => {
      const { data, error } = await supabase
        .from('pieces')
        .upsert(pieceData)
        .select()
        .single();

      if (error) throw error;
      return data as Piece;
    },
    onSuccess: (data) => {
      if (data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.pieces(data.etat_des_lieux_id) 
        });
      }
    },
    ...options,
  });
};

// Replace the existing useUpdateReleveCompteurs hook in your useEtatDesLieux.ts file with this improved version

export const useUpdateReleveCompteurs = (
  options?: MutationOptions<ReleveCompteurs, PostgrestError, Partial<ReleveCompteurs>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (releveData: Partial<ReleveCompteurs>) => {
      // If we have an ID, it's an update operation
      if (releveData.id) {
        const { data, error } = await supabase
          .from('releve_compteurs')
          .update(releveData)
          .eq('id', releveData.id)
          .select()
          .single();

        if (error) throw error;
        return data as ReleveCompteurs;
      } else {
        // If no ID, it's an insert operation
        const { data, error } = await supabase
          .from('releve_compteurs')
          .insert(releveData)
          .select()
          .single();

        if (error) throw error;
        return data as ReleveCompteurs;
      }
    },
    onSuccess: (data) => {
      if (data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.releveCompteurs(data.etat_des_lieux_id) 
        });
      }
    },
    ...options,
  });
};

export const useUpdateCles = (
  options?: MutationOptions<Cles, PostgrestError, Partial<Cles>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clesData: Partial<Cles>) => {
      const { data, error } = await supabase
        .from('cles')
        .upsert(clesData)
        .select()
        .single();

      if (error) throw error;
      return data as Cles;
    },
    onSuccess: (data) => {
      if (data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.cles(data.etat_des_lieux_id) 
        });
      }
    },
    ...options,
  });
};

export const useUpdatePartiePrivative = (
  options?: MutationOptions<PartiePrivative, PostgrestError, Partial<PartiePrivative>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partieData: Partial<PartiePrivative>) => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .upsert(partieData)
        .select()
        .single();

      if (error) throw error;
      return data as PartiePrivative;
    },
    onSuccess: (data) => {
      if (data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.partiesPrivatives(data.etat_des_lieux_id) 
        });
      }
    },
    ...options,
  });
};

export const useUpdateAutreEquipement = (
  options?: MutationOptions<AutreEquipement, PostgrestError, Partial<AutreEquipement>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (autreEquipementData: Partial<AutreEquipement>) => {
      const { data, error } = await supabase
        .from('autres_equipements')
        .upsert(autreEquipementData)
        .select()
        .single();

      if (error) throw error;
      return data as AutreEquipement;
    },
    onSuccess: (data) => {
      if (data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.autresEquipements(data.etat_des_lieux_id) 
        });
      }
    },
    ...options,
  });
};

export const useUpdateEtatSortie = (
  options?: MutationOptions<EtatDesLieux, PostgrestError, { id: string; date_sortie: string; statut?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sortieData: { id: string; date_sortie: string; statut?: string }) => {
      const { id, ...updateFields } = sortieData;
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EtatDesLieux;
    },
    onSuccess: (data, variables) => {
      // Invalidation optimisée
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.etatDesLieux });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.etatDesLieuxById(variables.id) });
      
      // Mise à jour optimiste du cache
      queryClient.setQueryData(QUERY_KEYS.etatDesLieuxById(variables.id), data);
    },
    ...options,
  });
};

// In your mutation hook file (e.g., useEtatDesLieux.ts)
export const useUpdateEquipementsEnergetiques = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      console.log('=== MUTATION EQUIPEMENTS ENERGETIQUES ===');
      console.log('Données reçues:', data);
      
      // First, check if a record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('equipements_energetiques')
        .select('id')
        .eq('etat_des_lieux_id', data.etat_des_lieux_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification:', checkError);
        throw checkError;
      }

      let result;
      
      if (existingData) {
        // Update existing record
        console.log('Mise à jour de l\'enregistrement existant:', existingData.id);
        const { data: updateData, error: updateError } = await supabase
          .from('equipements_energetiques')
          .update({
            chauffage_type: data.chauffage_type,
            eau_chaude_type: data.eau_chaude_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id)
          .select()
          .single();

        if (updateError) {
          console.error('Erreur lors de la mise à jour:', updateError);
          throw updateError;
        }
        
        result = updateData;
        console.log('Mise à jour réussie:', result);
      } else {
        // Create new record
        console.log('Création d\'un nouvel enregistrement');
        const { data: insertData, error: insertError } = await supabase
          .from('equipements_energetiques')
          .insert({
            etat_des_lieux_id: data.etat_des_lieux_id,
            chauffage_type: data.chauffage_type,
            eau_chaude_type: data.eau_chaude_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erreur lors de l\'insertion:', insertError);
          throw insertError;
        }
        
        result = insertData;
        console.log('Insertion réussie:', result);
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Mutation réussie:', data);
      // Invalidate and refetch related queries
      queryClient.invalidateQueries(['equipements-energetiques']);
    },
    onError: (error) => {
      console.error('Erreur dans la mutation:', error);
    }
  });
};

export const useUpdateEquipementsChauffage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      etat_des_lieux_id: string;
      chaudiere_etat?: string | null;
      chaudiere_date_dernier_entretien?: string | null;
      ballon_eau_chaude_etat?: string | null;
    }) => {
      // Méthode 1: Vérifier si un enregistrement existe déjà
      const { data: existing, error: fetchError } = await supabase
        .from('equipements_chauffage')
        .select('id')
        .eq('etat_des_lieux_id', data.etat_des_lieux_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = "No rows found" - c'est normal si pas d'enregistrement
        throw fetchError;
      }

      if (existing) {
        // Mise à jour de l'enregistrement existant
        const { data: updated, error: updateError } = await supabase
          .from('equipements_chauffage')
          .update({
            chaudiere_etat: data.chaudiere_etat,
            chaudiere_date_dernier_entretien: data.chaudiere_date_dernier_entretien,
            ballon_eau_chaude_etat: data.ballon_eau_chaude_etat,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated;
      } else {
        // Création d'un nouvel enregistrement
        const { data: created, error: insertError } = await supabase
          .from('equipements_chauffage')
          .insert({
            etat_des_lieux_id: data.etat_des_lieux_id,
            chaudiere_etat: data.chaudiere_etat,
            chaudiere_date_dernier_entretien: data.chaudiere_date_dernier_entretien,
            ballon_eau_chaude_etat: data.ballon_eau_chaude_etat,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return created;
      }
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ 
        queryKey: ['equipements-chauffage'] 
      });
    },
  });
};

// ===== HOOKS COMPOSÉS =====

/**
 * Hook composé pour récupérer toutes les données liées à un état des lieux
 */
export const useEtatDesLieuxComplete = (etatId: string) => {
  const etatDesLieux = useEtatDesLieuxById(etatId);
  const pieces = usePiecesByEtatId(etatId);
  const releveCompteurs = useReleveCompteursByEtatId(etatId);
  const cles = useClesByEtatId(etatId);
  const partiesPrivatives = usePartiesPrivativesByEtatId(etatId);
  const autresEquipements = useAutresEquipementsByEtatId(etatId);
  const equipementsEnergetiques = useEquipementsEnergetiquesByEtatId(etatId);
  const equipementsChauffage = useEquipementsChauffageByEtatId(etatId);

  return {
    etatDesLieux,
    pieces,
    releveCompteurs,
    cles,
    partiesPrivatives,
    autresEquipements,
    equipementsEnergetiques,
    equipementsChauffage,
    isLoading: [
      etatDesLieux,
      pieces,
      releveCompteurs,
      cles,
      partiesPrivatives,
      autresEquipements,
      equipementsEnergetiques,
      equipementsChauffage,
    ].some(query => query.isLoading),
    isError: [
      etatDesLieux,
      pieces,
      releveCompteurs,
      cles,
      partiesPrivatives,
      autresEquipements,
      equipementsEnergetiques,
      equipementsChauffage,
    ].some(query => query.isError),
  };
};

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour invalider toutes les queries liées à un état des lieux
 */
export const useInvalidateEtatDesLieuxQueries = () => {
  const queryClient = useQueryClient();

  return (etatId: string) => {
    const queriesToInvalidate = [
      QUERY_KEYS.etatDesLieuxById(etatId),
      QUERY_KEYS.pieces(etatId),
      QUERY_KEYS.releveCompteurs(etatId),
      QUERY_KEYS.cles(etatId),
      QUERY_KEYS.partiesPrivatives(etatId),
      QUERY_KEYS.autresEquipements(etatId),
      QUERY_KEYS.equipementsEnergetiques(etatId),
      QUERY_KEYS.equipementsChauffage(etatId),
    ];

    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey });
    });
  };
};
