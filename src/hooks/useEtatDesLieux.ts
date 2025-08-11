import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';
import { useEmployes } from '@/context/EmployeContext';

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
  employe_id?: string | null;
}

// Fonction pour récupérer tous les états des lieux (simplifiée)
export const useEtatDesLieux = (userUuid: string) => {
  console.log('[HOOK] useEtatDesLieux called with userUuid:', userUuid);
  
  return useQuery({
    queryKey: ['etats-des-lieux', userUuid],
    queryFn: async () => {
      console.log('[HOOK] useEtatDesLieux queryFn executing for userUuid:', userUuid);
      if (!userUuid) {
        console.log('[HOOK] useEtatDesLieux - no userUuid, returning empty array');
        return [];
      }
      
      console.log('[HOOK] useEtatDesLieux - making database query');
      
      // Première tentative : requête normale
      let { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .eq('user_id', userUuid)
        .order('created_at', { ascending: false });

      // Si erreur de stack overflow, essayer une requête plus simple
      if (error && error.code === '54001') {
        console.log('[HOOK] useEtatDesLieux - Stack overflow detected, trying simplified query');
        
        // Essayer sans order by
        const result = await supabase
          .from('etat_des_lieux')
          .select('*')
          .eq('user_id', userUuid);
          
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('[HOOK] useEtatDesLieux - Error fetching etats des lieux:', error);
        throw error;
      }
      
      console.log('[HOOK] useEtatDesLieux - Success, data:', data);
      return data || [];
    },
    enabled: !!userUuid,
  });
};

// Fonction pour récupérer tous les rendez-vous (simplifiée)
export const useRendezVous = (userUuid: string) => {
  console.log('[HOOK] useRendezVous called with userUuid:', userUuid);
  
  return useQuery({
    queryKey: ['rendez_vous', userUuid],
    queryFn: async () => {
      console.log('[HOOK] useRendezVous queryFn executing for userUuid:', userUuid);
      if (!userUuid) {
        console.log('[HOOK] useRendezVous - no userUuid, returning empty array');
        return [];
      }
      
      console.log('[HOOK] useRendezVous - making database query');
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('*')
        .eq('user_id', userUuid)
        .order('date', { ascending: true });

      if (error) {
        console.error('[HOOK] useRendezVous - Error fetching rendez-vous:', error);
        throw error;
      }
      
      console.log('[HOOK] useRendezVous - Success, data:', data);
      return data || [];
    },
    enabled: !!userUuid,
  });
};

// Hook combiné pour les rendez-vous avec leur état des lieux associé
export const useRendezVousWithEtat = (userUuid: string) => {
  const { data: rendezVous, isLoading: isLoadingRdv, error: errorRdv } = useRendezVous(userUuid);
  const { data: etatsDesLieux, isLoading: isLoadingEtats, error: errorEtats } = useEtatDesLieux(userUuid);

  const rendezVousWithEtat = useMemo(() => {
    if (!rendezVous || !etatsDesLieux) return [];

    return rendezVous.map(rdv => ({
      ...rdv,
      etat_des_lieux: etatsDesLieux.find(etat => etat.rendez_vous_id === rdv.id)
    }));
  }, [rendezVous, etatsDesLieux]);

  return { 
    data: rendezVousWithEtat, 
    isLoading: isLoadingRdv || isLoadingEtats, 
    error: errorRdv || errorEtats 
  };
};

// Fonction pour récupérer un état des lieux par son ID
export const useEtatDesLieuxById = (id: string, userUuid: string) => {
  return useQuery({
    queryKey: ['etat_des_lieux', id],
    queryFn: async () => {
      if (!userUuid) return null;
      const { data, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .eq('id', id)
        .eq('user_id', userUuid)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!userUuid,
  });
};

// Fonction pour mettre à jour un état des lieux
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
      employe_id?: string | null;
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
      queryClient.invalidateQueries({ queryKey: ['etats-des-lieux'] });
    },
  });
};

// Fonction pour mettre à jour un état des lieux de sortie
export const useUpdateEtatSortie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      id: string;
      date_sortie?: string | null;
      statut?: 'finalise' | 'en_cours';
      travaux_a_faire?: boolean;
      description_travaux?: string | null;
      signature_locataire?: string | null;
      signature_proprietaire_agent?: string | null;
      employe_id?: string | null;
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
      queryClient.invalidateQueries({ queryKey: ['etats-des-lieux'] });
    },
  });
};

// Fonction pour récupérer un rendez-vous par son ID
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

// Fonctions pour les pièces
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
    enabled: !!etatId,
  });
};

export const useCreatePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (piece: {
      etat_des_lieux_id: string;
      nom_piece: string;
      employe_id?: string | null;
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

export const useDeletePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pieceId: string) => {
      const { data, error } = await supabase
        .from('pieces')
        .delete()
        .eq('id', pieceId)
        .select()
        .single();

      if (error) throw error;
      return data; // Returns the deleted piece, or at least its ID
    },
    onSuccess: (data, variables) => {
      // 'data' here is the result of the delete operation (the deleted piece)
      // 'variables' is pieceId
      // We need etat_des_lieux_id to invalidate the specific query for pieces of that etat.
      // If 'data' contains etat_des_lieux_id, we can use it.
      // Otherwise, we might need to invalidate all 'pieces' queries or have the component pass it.
      if (data && data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ queryKey: ['pieces', data.etat_des_lieux_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pieces'] });
      }
    },
  });
};

// Fonctions pour le relevé des compteurs
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
  const { selectedEmployeId } = useEmployes();

  return useMutation({
    mutationFn: async (releve: ReleveCompteurs) => {
      const payload = { ...releve, employe_id: selectedEmployeId ?? null };
      const { data, error } = await supabase
        .from('releve_compteurs')
        .upsert(payload)
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
  const { selectedEmployeId } = useEmployes();

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
        employe_id: selectedEmployeId ?? existingData.employe_id ?? null,
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
        employe_id: selectedEmployeId ?? null,
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
  const { selectedEmployeId } = useEmployes();

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
        employe_id: selectedEmployeId ?? existingData?.employe_id ?? null,
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

// Fonctions pour les clés
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
    enabled: !!etatId,
  });
};

export const useCreateCle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cle: any) => {
      const { data, error } = await supabase
        .from('cles')
        .insert(cle)
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

export const useUpdateCle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cle: any) => {
      const { id, ...rest } = cle;
      const { data, error } = await supabase
        .from('cles')
        .update(rest)
        .eq('id', id)
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

export const useDeleteCle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cleId: string) => {
      const { data, error } = await supabase
        .from('cles')
        .delete()
        .eq('id', cleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ queryKey: ['cles', data.etat_des_lieux_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['cles'] });
      }
    },
  });
};

// Fonctions pour les parties privatives
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
    enabled: !!etatId,
  });
};

export const useCreatePartiePrivative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partie: any) => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .insert(partie)
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

export const useUpdatePartiePrivative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partie: any) => {
      const { id, ...rest } = partie;
      const { data, error } = await supabase
        .from('parties_privatives')
        .update(rest)
        .eq('id', id)
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

export const useDeletePartiePrivative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partieId: string) => {
      const { data, error } = await supabase
        .from('parties_privatives')
        .delete()
        .eq('id', partieId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ queryKey: ['parties_privatives', data.etat_des_lieux_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['parties_privatives'] });
      }
    },
  });
};

// Fonctions pour les autres équipements
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
    enabled: !!etatId,
  });
};

export const useCreateAutreEquipement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipement: any) => {
      const { data, error } = await supabase
        .from('autres_equipements')
        .insert(equipement)
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

export const useUpdateAutreEquipement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipement: any) => {
      const { id, ...rest } = equipement;
      const { data, error } = await supabase
        .from('autres_equipements')
        .update(rest)
        .eq('id', id)
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

export const useDeleteAutreEquipement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipementId: string) => {
      const { data, error } = await supabase
        .from('autres_equipements')
        .delete()
        .eq('id', equipementId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.etat_des_lieux_id) {
        queryClient.invalidateQueries({ queryKey: ['autres_equipements', data.etat_des_lieux_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['autres_equipements'] });
      }
    },
  });
};

// Fonctions pour les équipements énergétiques
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
    enabled: !!etatId,
  });
};

// Fonctions pour les équipements de chauffage
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
    enabled: !!etatId,
  });
};
