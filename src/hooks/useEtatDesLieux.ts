import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Function to fetch a single état des lieux by ID
export const useEtatDesLieuxById = (id: string) => {
  return useQuery({
    queryKey: ['etat_des_lieux', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

// Function to update an état des lieux
export const useUpdateEtatDesLieux = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      id: string;
      adresse_bien: string;
      type_etat_des_lieux: 'entree' | 'sortie';
      type_bien: 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires';
      bailleur_nom: string;
      bailleur_adresse: string;
      locataire_nom: string;
      locataire_adresse: string;
      date_entree: string;
      date_sortie: string;
      statut: string;
    }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['etat_des_lieux', data.id] });
    },
  });
};

// Function to update an état des lieux de sortie
export const useUpdateEtatSortie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      id: string;
      date_sortie: string;
      statut: 'finalise';
    }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['etat_des_lieux', data.id] });
    },
  });
};

// Add new function to fetch rendez-vous data
export const useRendezVousById = (rendezVousId: string | null) => {
  return useQuery({
    queryKey: ['rendez_vous', rendezVousId],
    queryFn: async () => {
      if (!rendezVousId) return null;
      
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .eq('id', rendezVousId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!rendezVousId,
  });
};
