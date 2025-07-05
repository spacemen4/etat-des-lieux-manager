import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Function to fetch all états des lieux
export const useEtatDesLieux = () => {
  return useQuery({
    queryKey: ['etat_des_lieux'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*, rendez_vous_id') // Assurez-vous que rendez_vous_id est sélectionné
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Function to fetch all rendez-vous
export const useRendezVous = () => {
  return useQuery({
    queryKey: ['rendez_vous'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

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
      queryClient.invalidateQueries({ queryKey: ['etat_des_lieux'] });
    },
  });
};

// Function to update an état des lieux de sortie
export const useUpdateEtatSortie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      id: string;
      date_sortie: string | null; // Allow null to clear the date
      statut: 'finalise' | 'en_cours'; // Allow reverting status
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
      queryClient.invalidateQueries({ queryKey: ['etat_des_lieux'] });
    },
  });
};

// Function to fetch rendez-vous data
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

// Pieces hooks
export const usePiecesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['pieces', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .order('nom_piece');

      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (piece: {
      etat_des_lieux_id: string;
      nom_piece: string;
    }) => {
      const { data, error } = await supabase
        .from('pieces')
        .insert(piece)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', data.etat_des_lieux_id] });
    },
  });
};

export const useUpdatePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (piece: any) => {
      const { id, ...rest } = piece;
      const { data, error } = await supabase
        .from('pieces')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', data.etat_des_lieux_id] });
    },
  });
};

// Relevé compteurs hooks
export const useReleveCompteursByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['releve_compteurs', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('releve_compteurs')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!etatId,
  });
};

export const useUpdateReleveCompteurs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (releve: any) => {
      const { data, error } = await supabase
        .from('releve_compteurs')
        .upsert(releve)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['releve_compteurs', data.etat_des_lieux_id] });
    },
  });
};

// Clés hooks
export const useClesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['cles', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cles')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateCles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cle: any) => {
      const { data, error } = await supabase
        .from('cles')
        .upsert(cle)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cles', data.etat_des_lieux_id] });
    },
  });
};

// Parties privatives hooks
export const usePartiesPrivativesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['parties_privatives', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdatePartiePrivative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partie: any) => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .upsert(partie)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parties_privatives', data.etat_des_lieux_id] });
    },
  });
};

// Autres équipements hooks
export const useAutresEquipementsByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['autres_equipements', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autres_equipements')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateAutreEquipement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipement: any) => {
      const { data, error } = await supabase
        .from('autres_equipements')
        .upsert(equipement)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autres_equipements', data.etat_des_lieux_id] });
    },
  });
};

// Équipements énergétiques hooks
export const useEquipementsEnergetiquesByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['equipements_energetiques', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements_energetiques')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};

export const useUpdateEquipementsEnergetiques = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipements: {
      etat_des_lieux_id: string;
      chauffage_type: string;
      eau_chaude_type: string;
      dpe_classe: string;
      ges_classe: string;
      date_dpe: string;
      presence_panneaux_solaires: boolean;
      type_isolation: string;
      commentaires: string;
    }) => {
      const { data, error } = await supabase
        .from('equipements_energetiques')
        .upsert(equipements)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipements_energetiques', data.etat_des_lieux_id] });
    },
  });
};

// Équipements de chauffage hooks
export const useEquipementsChauffageByEtatId = (etatId: string) => {
  return useQuery({
    queryKey: ['equipements_chauffage', etatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements_chauffage')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};

export const useUpdateEquipementsChauffage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipements: {
      etat_des_lieux_id: string;
      chaudiere_etat: string;
      chaudiere_date_dernier_entretien: string;
      ballon_eau_chaude_etat: string;
      radiateurs_nombre: number;
      radiateurs_etat: string;
      thermostat_present: boolean;
      thermostat_etat: string;
      pompe_a_chaleur_present: boolean;
      pompe_a_chaleur_etat: string;
      commentaires: string;
    }) => {
      const { data, error } = await supabase
        .from('equipements_chauffage')
        .upsert(equipements)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipements_chauffage', data.etat_des_lieux_id] });
    },
  });
};
