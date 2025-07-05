import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Interface pour le relevé compteurs
interface ReleveCompteurs {
  id?: string;
  etat_des_lieux_id: string;
  nom_ancien_occupant?: string;
  electricite_n_compteur?: string;
  electricite_h_pleines?: string;
  electricite_h_creuses?: string;
  gaz_naturel_n_compteur?: string;
  gaz_naturel_releve?: string;
  eau_chaude_m3?: string;
  eau_froide_m3?: string;
  photos?: any[];
  photos_electricite?: any[];
  photos_eau?: any[];
  photos_gaz?: any[];
}

// Function to fetch all états des lieux
export const useEtatDesLieux = () => {
  return useQuery({
    queryKey: ['etat_des_lieux'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*, rendez_vous_id')
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
      date_sortie: string | null;
      statut: 'finalise' | 'en_cours';
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

// Relevé compteurs hooks - ADAPTÉS POUR LA NOUVELLE STRUCTURE
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
    mutationFn: async (releve: ReleveCompteurs) => {
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

// Hook pour ajouter des photos à un type spécifique
export const useAddPhotoToReleveCompteurs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      etatId, 
      photoType, 
      photoData 
    }: { 
      etatId: string; 
      photoType: 'photos' | 'photos_electricite' | 'photos_eau' | 'photos_gaz'; 
      photoData: any 
    }) => {
      console.log('🔍 Ajout photo - etatId:', etatId, 'photoType:', photoType, 'photoData:', photoData);
      
      // D'abord, récupérer les données existantes
      const { data: existingData, error: fetchError } = await supabase
        .from('releve_compteurs')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();

      console.log('📊 Données existantes:', existingData, 'Erreur fetch:', fetchError);

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erreur lors de la récupération des données:', fetchError);
        throw fetchError;
      }

      // Préparer les nouvelles photos
      const currentPhotos = existingData?.[photoType] || [];
      const updatedPhotos = [...currentPhotos, photoData];

      console.log('📸 Photos actuelles:', currentPhotos, 'Photos mises à jour:', updatedPhotos);

      // Créer ou mettre à jour l'enregistrement
      const updateData = existingData ? {
        ...existingData,
        [photoType]: updatedPhotos,
      } : {
        etat_des_lieux_id: etatId,
        [photoType]: updatedPhotos,
        // Valeurs par défaut pour les autres champs
        nom_ancien_occupant: null,
        electricite_n_compteur: null,
        electricite_h_pleines: null,
        electricite_h_creuses: null,
        gaz_naturel_n_compteur: null,
        gaz_naturel_releve: null,
        eau_chaude_m3: null,
        eau_froide_m3: null,
        photos: photoType === 'photos' ? updatedPhotos : [],
        photos_electricite: photoType === 'photos_electricite' ? updatedPhotos : [],
        photos_eau: photoType === 'photos_eau' ? updatedPhotos : [],
        photos_gaz: photoType === 'photos_gaz' ? updatedPhotos : [],
      };

      console.log('💾 Données à sauvegarder:', updateData);

      const { data, error } = await supabase
        .from('releve_compteurs')
        .upsert(updateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        throw error;
      }

      console.log('✅ Photo ajoutée avec succès:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['releve_compteurs', data.etat_des_lieux_id] });
    },
  });
};

// Hook pour supprimer une photo d'un type spécifique
export const useDeletePhotoFromReleveCompteurs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      etatId, 
      photoType, 
      photoIndex 
    }: { 
      etatId: string; 
      photoType: 'photos' | 'photos_electricite' | 'photos_eau' | 'photos_gaz'; 
      photoIndex: number 
    }) => {
      console.log('🗑️ Suppression photo - etatId:', etatId, 'photoType:', photoType, 'photoIndex:', photoIndex);
      
      // Récupérer les données existantes
      const { data: existingData, error: fetchError } = await supabase
        .from('releve_compteurs')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération des données:', fetchError);
        throw fetchError;
      }

      console.log('📊 Données existantes:', existingData);

      // Supprimer la photo à l'index spécifié
      const currentPhotos = existingData[photoType] || [];
      const updatedPhotos = currentPhotos.filter((_: any, index: number) => index !== photoIndex);

      console.log('📸 Photos actuelles:', currentPhotos, 'Photos après suppression:', updatedPhotos);

      // Mettre à jour l'enregistrement
      const updateData = {
        ...existingData,
        [photoType]: updatedPhotos,
      };

      console.log('💾 Données à sauvegarder:', updateData);

      const { data, error } = await supabase
        .from('releve_compteurs')
        .update(updateData)
        .eq('etat_des_lieux_id', etatId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        throw error;
      }

      console.log('✅ Photo supprimée avec succès:', data);
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